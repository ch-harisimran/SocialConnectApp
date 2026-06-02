import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getSupabase, isSupabaseConfigured } from '../config/supabase';
import { Post } from './mockPosts';

const PENDING_KEY = '@social_connect_pending_notifications';
const ACTIVITY_SNAPSHOT_KEY = '@social_connect_activity_snapshot';

interface PendingNotification {
  id: string;
  recipientId: string;
  title: string;
  body: string;
  type: 'like' | 'comment';
  postId: string;
  createdAt: string;
}

interface PostActivitySnapshot {
  likes: string[];
  commentIds: string[];
}

type ActivitySnapshot = Record<string, PostActivitySnapshot>;

const getPending = async (): Promise<PendingNotification[]> => {
  const raw = await AsyncStorage.getItem(PENDING_KEY);
  return raw ? JSON.parse(raw) : [];
};

const savePending = async (items: PendingNotification[]): Promise<void> => {
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(items));
};

const getSnapshot = async (): Promise<ActivitySnapshot> => {
  const raw = await AsyncStorage.getItem(ACTIVITY_SNAPSHOT_KEY);
  return raw ? JSON.parse(raw) : {};
};

const saveSnapshot = async (snapshot: ActivitySnapshot): Promise<void> => {
  await AsyncStorage.setItem(ACTIVITY_SNAPSHOT_KEY, JSON.stringify(snapshot));
};

const buildSnapshotFromPosts = (posts: Post[], authorId: string): ActivitySnapshot => {
  const snapshot: ActivitySnapshot = {};
  for (const post of posts.filter(p => p.authorId === authorId)) {
    snapshot[post.id] = {
      likes: [...post.likes],
      commentIds: post.comments.map(c => c.id),
    };
  }
  return snapshot;
};

const mergeSnapshot = (base: ActivitySnapshot, posts: Post[], authorId: string): ActivitySnapshot => {
  const next = { ...base };
  for (const post of posts.filter(p => p.authorId === authorId)) {
    next[post.id] = {
      likes: [...post.likes],
      commentIds: post.comments.map(c => c.id),
    };
  }
  return next;
};

export const notificationService = {
  setup(): void {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  },

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('social-connect', {
        name: 'Social Connect',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
      });
    }
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  },

  async getExpoPushToken(): Promise<string | null> {
    if (!Device.isDevice) return null;

    const granted = await this.requestPermissions();
    if (!granted) return null;

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      const tokenResult = projectId
        ? await Notifications.getExpoPushTokenAsync({ projectId })
        : await Notifications.getExpoPushTokenAsync();

      return tokenResult.data;
    } catch {
      return null;
    }
  },

  async registerPushToken(userId: string): Promise<void> {
    const token = await this.getExpoPushToken();
    if (!token) return;

    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) return;

    await supabase
      .from('profiles')
      .update({ expo_push_token: token })
      .eq('id', userId);
  },

  async scheduleLocalNotification(
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body, sound: true, data },
        trigger: null,
      });
    } catch {
      // Notifications unavailable (simulator / denied permission)
    }
  },

  async enqueueForRecipient(params: {
    recipientId: string;
    title: string;
    body: string;
    type: 'like' | 'comment';
    postId: string;
  }): Promise<void> {
    const pending = await getPending();
    pending.push({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      recipientId: params.recipientId,
      title: params.title,
      body: params.body,
      type: params.type,
      postId: params.postId,
      createdAt: new Date().toISOString(),
    });
    await savePending(pending);
  },

  async sendRemotePush(
    recipientId: string,
    title: string,
    body: string,
    data: Record<string, string>
  ): Promise<void> {
    const supabase = getSupabase();
    if (!supabase || !isSupabaseConfigured()) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('expo_push_token')
      .eq('id', recipientId)
      .maybeSingle();

    const pushToken = profile?.expo_push_token as string | undefined;
    if (!pushToken?.startsWith('ExponentPushToken')) return;

    try {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: pushToken,
          sound: 'default',
          title,
          body,
          data,
        }),
      });
    } catch {
      // Remote push is best-effort when Supabase / network is unavailable
    }
  },

  async notifyAuthor(params: {
    recipientId: string;
    title: string;
    body: string;
    type: 'like' | 'comment';
    postId: string;
    deliverLocallyIfRecipient?: string | null;
  }): Promise<void> {
    await this.enqueueForRecipient(params);
    await this.sendRemotePush(params.recipientId, params.title, params.body, {
      type: params.type,
      postId: params.postId,
    });

    if (params.deliverLocallyIfRecipient && params.deliverLocallyIfRecipient === params.recipientId) {
      await this.deliverPendingForUser(params.recipientId);
    }
  },

  async deliverPendingForUser(userId: string): Promise<void> {
    const pending = await getPending();
    const forUser = pending.filter(n => n.recipientId === userId);
    if (forUser.length === 0) return;

    for (const item of forUser) {
      await this.scheduleLocalNotification(item.title, item.body, {
        type: item.type,
        postId: item.postId,
      });
    }

    await savePending(pending.filter(n => n.recipientId !== userId));
  },

  async notifyPostLiked(params: {
    post: Post;
    likerId: string;
    likerName: string;
    currentUserId?: string | null;
  }): Promise<void> {
    if (params.post.authorId === params.likerId) return;

    await this.notifyAuthor({
      recipientId: params.post.authorId,
      title: '❤️ New Like',
      body: `${params.likerName} liked your post`,
      type: 'like',
      postId: params.post.id,
      deliverLocallyIfRecipient: params.currentUserId,
    });
  },

  async notifyPostCommented(params: {
    post: Post;
    commenterId: string;
    commenterName: string;
    commentText: string;
    currentUserId?: string | null;
  }): Promise<void> {
    if (params.post.authorId === params.commenterId) return;

    const preview =
      params.commentText.length > 60
        ? `${params.commentText.slice(0, 60)}…`
        : params.commentText;

    await this.notifyAuthor({
      recipientId: params.post.authorId,
      title: '💬 New Comment',
      body: `${params.commenterName}: "${preview}"`,
      type: 'comment',
      postId: params.post.id,
      deliverLocallyIfRecipient: params.currentUserId,
    });
  },

  async seedActivitySnapshot(authorId: string, posts: Post[]): Promise<void> {
    const snapshot = buildSnapshotFromPosts(posts, authorId);
    await saveSnapshot(snapshot);
  },

  async processAuthorActivity(
    authorId: string,
    previousPosts: Post[],
    nextPosts: Post[]
  ): Promise<void> {
    const authorPosts = nextPosts.filter(p => p.authorId === authorId);
    if (authorPosts.length === 0) return;

    const snapshot = await getSnapshot();
    const hasBaseline = Object.keys(snapshot).length > 0 || previousPosts.length > 0;
    const baseline =
      Object.keys(snapshot).length > 0
        ? snapshot
        : buildSnapshotFromPosts(previousPosts, authorId);

    if (!hasBaseline) {
      await saveSnapshot(buildSnapshotFromPosts(nextPosts, authorId));
      return;
    }

    for (const post of authorPosts) {
      const prev = baseline[post.id] ?? { likes: [], commentIds: [] };

      for (const likerId of post.likes) {
        if (likerId === authorId || prev.likes.includes(likerId)) continue;
        const likerName =
          nextPosts.find(p => p.authorId === likerId)?.authorName ??
          previousPosts.find(p => p.authorId === likerId)?.authorName ??
          'Someone';

        await this.scheduleLocalNotification(
          '❤️ New Like',
          `${likerName} liked your post`,
          { type: 'like', postId: post.id }
        );
      }

      for (const comment of post.comments) {
        if (comment.authorId === authorId || prev.commentIds.includes(comment.id)) continue;
        const preview = comment.text.length > 60 ? `${comment.text.slice(0, 60)}…` : comment.text;

        await this.scheduleLocalNotification(
          '💬 New Comment',
          `${comment.authorName}: "${preview}"`,
          { type: 'comment', postId: post.id }
        );
      }
    }

    await saveSnapshot(mergeSnapshot(baseline, nextPosts, authorId));
  },

  async clearActivitySnapshot(): Promise<void> {
    await AsyncStorage.removeItem(ACTIVITY_SNAPSHOT_KEY);
  },
};
