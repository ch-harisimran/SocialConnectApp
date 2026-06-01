import React, { memo, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { usePosts } from '../../context/PostsContext';
import { useAuth } from '../../context/AuthContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  followUser,
  unfollowUser,
  loadProfileFollowState,
} from '../../store/slices/followsSlice';
import { startConversation } from '../../store/slices/messagesSlice';
import { mockAuth } from '../../services/mockAuth';
import { Post } from '../../services/mockPosts';
import { formatTimeAgo } from '../../utils/formatTime';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { MainTabParamList } from '../../navigation/MainNavigator';
import { useTheme } from '../../utils/theme';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'UserProfile'>;
type Route = RouteProp<HomeStackParamList, 'UserProfile'>;

interface PublicProfile {
  id: string;
  name: string;
  bio: string;
  avatar: string | null;
}

const PostTile: React.FC<{ post: Post; onPress: () => void }> = memo(({ post, onPress }) => {
  const t = useTheme();
  return (
    <TouchableOpacity
      style={[styles.postCard, { backgroundColor: t.card, borderColor: t.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.postContent, { color: t.text }]} numberOfLines={3}>
        {post.content}
      </Text>
      {post.imageUri ? (
        <Image source={{ uri: post.imageUri }} style={styles.postImage} resizeMode="cover" />
      ) : null}
      <View style={[styles.postMeta, { borderTopColor: t.border }]}>
        <Text style={[styles.postTime, { color: t.subtext }]}>{formatTimeAgo(post.createdAt)}</Text>
        <View style={styles.postStats}>
          <Text style={[styles.postStat, { color: t.accent }]}>♥ {post.likes.length}</Text>
          <Text style={[styles.postStat, { color: t.subtext }]}>💬 {post.comments.length}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});
PostTile.displayName = 'PostTile';

const UserProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { userId, userName } = route.params;
  const insets = useSafeAreaInsets();
  const t = useTheme();

  const dispatch = useAppDispatch();
  const { posts } = usePosts();
  const { user: currentUser } = useAuth();

  const profileFollowState = useAppSelector(state => state.follows.profileStates[userId]);
  const isActionLoading = useAppSelector(state => state.follows.isActionLoading);

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const isOwnProfile = currentUser?.id === userId;
  const isFollowing = profileFollowState?.isFollowing ?? false;
  const followerCount = profileFollowState?.followers ?? 0;
  const followingCount = profileFollowState?.following ?? 0;
  const userPosts = useMemo(() => posts.filter(p => p.authorId === userId), [posts, userId]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      setIsLoading(true);
      const [data] = await Promise.all([
        mockAuth.getPublicProfile(userId),
        dispatch(loadProfileFollowState(userId)),
      ]);

      if (cancelled) return;

      if (data) {
        setProfile(data);
      } else {
        const anyPost = posts.find(p => p.authorId === userId);
        if (anyPost) {
          setProfile({
            id: userId,
            name: anyPost.authorName,
            bio: '',
            avatar: anyPost.authorAvatar,
          });
        }
      }
      setIsLoading(false);
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [userId, posts, dispatch]);

  const handleFollowToggle = async () => {
    if (isActionLoading) return;
    if (isFollowing) {
      await dispatch(unfollowUser(userId));
    } else {
      await dispatch(followUser(userId));
    }
  };

  const handleMessage = async () => {
    if (isStartingChat) return;
    setIsStartingChat(true);
    try {
      const displayName = profile?.name ?? userName;
      const result = await dispatch(
        startConversation({ otherUserId: userId, otherUserName: displayName })
      );
      if (startConversation.fulfilled.match(result)) {
        const tabNav = navigation.getParent<BottomTabNavigationProp<MainTabParamList>>();
        tabNav?.navigate('Messages', {
          screen: 'Chat',
          params: {
            conversationId: result.payload.id,
            otherUserId: userId,
            otherUserName: displayName,
          },
        });
      }
    } finally {
      setIsStartingChat(false);
    }
  };

  const initials = (profile?.name ?? userName).slice(0, 2).toUpperCase();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.accent} />
      </View>
    );
  }

  return (
    <FlatList
      data={userPosts}
      keyExtractor={item => item.id}
      showsVerticalScrollIndicator={false}
      removeClippedSubviews
      maxToRenderPerBatch={8}
      initialNumToRender={6}
      windowSize={10}
      style={{ backgroundColor: t.bg }}
      contentContainerStyle={[styles.listContent, { backgroundColor: t.bg }]}
      ListHeaderComponent={
        <>
          {/* Navbar with safe area */}
          <View
            style={[
              styles.navbar,
              {
                backgroundColor: t.header,
                borderBottomColor: t.border,
                paddingTop: insets.top + 10,
              },
            ]}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.navBack}
              hitSlop={8}
            >
              <Text style={[styles.navBackText, { color: t.accent }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.navTitle, { color: t.text }]} numberOfLines={1}>
              {profile?.name ?? userName}
            </Text>
            <View style={styles.navBack} />
          </View>

          {/* Cover + avatar */}
          <View style={[styles.coverBand, { backgroundColor: t.accent }]} />
          <View style={[styles.profileSection, { backgroundColor: t.card }]}>
            <View style={styles.avatarWrapper}>
              {profile?.avatar ? (
                <Image
                  source={{ uri: profile.avatar }}
                  style={[styles.avatarImage, { borderColor: t.card }]}
                />
              ) : (
                <View
                  style={[
                    styles.avatarCircle,
                    { backgroundColor: t.accent, borderColor: t.card },
                  ]}
                >
                  <Text style={styles.avatarInitials}>{initials}</Text>
                </View>
              )}
            </View>

            <View style={styles.nameRow}>
              <View style={styles.nameBlock}>
                <Text style={[styles.name, { color: t.text }]}>{profile?.name ?? userName}</Text>
                {profile?.bio ? (
                  <Text style={[styles.bio, { color: t.subtext }]}>{profile.bio}</Text>
                ) : (
                  <Text style={[styles.bioEmpty, { color: t.placeholder }]}>No bio yet.</Text>
                )}
              </View>

              {!isOwnProfile && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.followBtn,
                      isFollowing
                        ? { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: t.accent }
                        : { backgroundColor: t.accent },
                      isActionLoading && styles.followBtnDisabled,
                    ]}
                    onPress={handleFollowToggle}
                    activeOpacity={0.8}
                    disabled={isActionLoading}
                  >
                    {isActionLoading ? (
                      <ActivityIndicator size="small" color={isFollowing ? t.accent : '#fff'} />
                    ) : (
                      <Text
                        style={[
                          styles.followBtnText,
                          { color: isFollowing ? t.accent : '#fff' },
                        ]}
                      >
                        {isFollowing ? 'Unfollow' : 'Follow'}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.messageBtn,
                      { backgroundColor: t.inputBg, borderColor: t.border },
                      isStartingChat && styles.followBtnDisabled,
                    ]}
                    onPress={handleMessage}
                    activeOpacity={0.8}
                    disabled={isStartingChat}
                  >
                    {isStartingChat ? (
                      <ActivityIndicator size="small" color={t.accent} />
                    ) : (
                      <Text style={[styles.messageBtnText, { color: t.text }]}>Message</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Stats row */}
            <View style={[styles.statsRow, { borderTopColor: t.border }]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: t.text }]}>{userPosts.length}</Text>
                <Text style={[styles.statLabel, { color: t.subtext }]}>Posts</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: t.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: t.text }]}>{followerCount}</Text>
                <Text style={[styles.statLabel, { color: t.subtext }]}>Followers</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: t.border }]} />
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: t.text }]}>{followingCount}</Text>
                <Text style={[styles.statLabel, { color: t.subtext }]}>Following</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.sectionLabel, { color: t.subtext }]}>
            {userPosts.length === 0 ? 'No posts yet' : `Posts · ${userPosts.length}`}
          </Text>
        </>
      }
      renderItem={({ item }) => (
        <PostTile
          post={item}
          onPress={() => navigation.navigate('Comments', { postId: item.id })}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: t.placeholder }]}>
            {isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted yet."}
          </Text>
        </View>
      }
      ListFooterComponent={<View style={{ height: insets.bottom + 24 }} />}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingBottom: 8 },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBack: { width: 36 },
  navBackText: { fontSize: 24 },
  navTitle: { fontSize: 17, fontWeight: '700', flex: 1, textAlign: 'center' },
  coverBand: { height: 100 },
  profileSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 10,
  },
  avatarWrapper: { marginTop: -42, marginBottom: 10 },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 4,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
  },
  avatarInitials: { fontSize: 28, fontWeight: '800', color: '#fff' },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  nameBlock: { flex: 1 },
  name: { fontSize: 19, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
  bio: { fontSize: 14, lineHeight: 20 },
  bioEmpty: { fontSize: 13, fontStyle: 'italic' },
  actionRow: { flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  followBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 22,
    marginTop: 2,
    minWidth: 96,
    alignItems: 'center',
  },
  messageBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 22,
    minWidth: 96,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  messageBtnText: { fontWeight: '700', fontSize: 13 },
  followBtnDisabled: { opacity: 0.7 },
  followBtnText: { fontWeight: '700', fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 14,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 2 },
  statDivider: { width: StyleSheet.hairlineWidth, height: 32 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  postCard: {
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  postContent: { fontSize: 14, lineHeight: 21, marginBottom: 8 },
  postImage: { width: '100%', height: 160, borderRadius: 10, marginBottom: 8 },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  postTime: { fontSize: 12 },
  postStats: { flexDirection: 'row', gap: 12 },
  postStat: { fontSize: 12, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', paddingTop: 48 },
  emptyText: { fontSize: 14, fontStyle: 'italic' },
});

export default UserProfileScreen;
