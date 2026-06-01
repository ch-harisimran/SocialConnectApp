import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Animated,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePosts } from '../../context/PostsContext';
import { useAuth } from '../../context/AuthContext';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { clearNewActivity } from '../../store/slices/postsSlice';
import { formatTimeAgo } from '../../utils/formatTime';
import { rf, rw, rh } from '../../utils/responsive';
import { useTheme } from '../../utils/theme';
import { Post } from '../../services/mockPosts';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import AnimatedHeartButton from '../../components/AnimatedHeartButton';
import OptimizedImage from '../../components/OptimizedImage';
import { FLAT_LIST_PERF_PROPS } from '../../utils/listPerformance';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

// ─── LiveBadge ────────────────────────────────────────────────────────────────
const LiveBadge: React.FC<{ lastSyncedAt: number | null }> = ({ lastSyncedAt }) => {
  const pulse = useRef(new Animated.Value(1)).current;
  const [, tick] = useState(0);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    const interval = setInterval(() => tick(n => n + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const timeLabel = lastSyncedAt ? formatTimeAgo(new Date(lastSyncedAt).toISOString()) : null;

  return (
    <View style={liveStyles.wrap}>
      <Animated.View style={[liveStyles.dot, { opacity: pulse }]} />
      <Text style={liveStyles.text}>LIVE{timeLabel ? ` · ${timeLabel}` : ''}</Text>
    </View>
  );
};
const liveStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(34,197,94,0.13)', paddingHorizontal: 9,
    paddingVertical: 4, borderRadius: 20,
  },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#22C55E' },
  text: { fontSize: 10, fontWeight: '800', color: '#22C55E', letterSpacing: 0.6 },
});

// ─── NewActivityBanner ────────────────────────────────────────────────────────
const NewActivityBanner: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const slideY = useRef(new Animated.Value(-60)).current;
  useEffect(() => {
    Animated.spring(slideY, { toValue: 0, damping: 12, stiffness: 90, useNativeDriver: true }).start();
  }, [slideY]);
  return (
    <Animated.View style={[bannerStyles.wrap, { transform: [{ translateY: slideY }] }]}>
      <TouchableOpacity style={bannerStyles.pill} onPress={onPress} activeOpacity={0.85}>
        <Text style={bannerStyles.text}>✦  New activity — tap to refresh</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};
const bannerStyles = StyleSheet.create({
  wrap: { position: 'absolute', top: 10, left: 0, right: 0, zIndex: 20, alignItems: 'center' },
  pill: {
    backgroundColor: '#6366F1', paddingVertical: 10, paddingHorizontal: 22,
    borderRadius: 28, elevation: 8,
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45, shadowRadius: 10,
  },
  text: { color: '#fff', fontWeight: '800', fontSize: rf(1.45), letterSpacing: 0.2 },
});

// ─── StoryBubble ─────────────────────────────────────────────────────────────
const STORIES = [
  { id: 'add', label: 'Your Story', initials: '+', color: '#6366F1', isAdd: true },
  { id: '1', label: 'Alex', initials: 'AL', color: '#EC4899' },
  { id: '2', label: 'Jordan', initials: 'JO', color: '#F59E0B' },
  { id: '3', label: 'Sam', initials: 'SA', color: '#10B981' },
  { id: '4', label: 'Morgan', initials: 'MO', color: '#8B5CF6' },
  { id: '5', label: 'Riley', initials: 'RI', color: '#EF4444' },
];

const StoryBubble: React.FC<{ item: typeof STORIES[0]; theme: ReturnType<typeof useTheme> }> = ({ item, theme }) => (
  <TouchableOpacity style={storyStyles.wrap} activeOpacity={0.75}>
    <View style={[storyStyles.ring, { borderColor: item.isAdd ? 'transparent' : item.color }]}>
      <View style={[storyStyles.circle, { backgroundColor: item.isAdd ? theme.accentLight : item.color }]}>
        <Text style={[storyStyles.initials, { color: item.isAdd ? theme.accent : '#fff' }]}>
          {item.initials}
        </Text>
      </View>
    </View>
    <Text style={[storyStyles.label, { color: theme.subtext }]} numberOfLines={1}>
      {item.label}
    </Text>
  </TouchableOpacity>
);
const storyStyles = StyleSheet.create({
  wrap: { alignItems: 'center', marginRight: 14, width: 62 },
  ring: { width: 60, height: 60, borderRadius: 30, borderWidth: 2.5, padding: 2.5, marginBottom: 5 },
  circle: { flex: 1, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  initials: { fontSize: 17, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '500' },
});

// ─── PostCard ─────────────────────────────────────────────────────────────────
interface PostCardProps {
  post: Post;
  index: number;
  currentUserId: string;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onViewProfile: (authorId: string, authorName: string) => void;
}

const PostCard = memo<PostCardProps>(
  ({ post, index, currentUserId, onLike, onComment, onEdit, onDelete, onViewProfile }) => {
    const t = useTheme();
    const liked = post.likes.includes(currentUserId);
    const isOwner = post.authorId === currentUserId;
    const initials = post.authorName.slice(0, 2).toUpperCase();

    const opacity = useRef(new Animated.Value(index < 6 ? 0 : 1)).current;
    const translateY = useRef(new Animated.Value(index < 6 ? 32 : 0)).current;

    useEffect(() => {
      if (index < 6) {
        Animated.sequence([
          Animated.delay(index * 70),
          Animated.parallel([
            Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, damping: 16, stiffness: 110, useNativeDriver: true }),
          ]),
        ]).start();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const confirmDelete = () =>
      Alert.alert('Delete post', 'This cannot be undone.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(post.id) },
      ]);

    // Pick a consistent accent hue per author
    const accentColors = ['#6366F1', '#EC4899', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#06B6D4'];
    const colorIdx = post.authorId.charCodeAt(0) % accentColors.length;
    const authorColor = accentColors[colorIdx];

    return (
      <Animated.View
        style={[
          cardStyles.card,
          { backgroundColor: t.card, borderColor: t.border, shadowColor: t.shadow, opacity, transform: [{ translateY }] },
        ]}
      >
        {/* Colored top accent strip */}
        <View style={[cardStyles.topStrip, { backgroundColor: authorColor }]} />

        {/* Header */}
        <View style={cardStyles.header}>
          <TouchableOpacity
            style={cardStyles.authorRow}
            onPress={() => onViewProfile(post.authorId, post.authorName)}
            activeOpacity={0.75}
          >
            <View style={[cardStyles.avatarRing, { borderColor: authorColor }]}>
              {post.authorAvatar ? (
                <OptimizedImage
                  uri={post.authorAvatar}
                  style={cardStyles.avatarImg}
                  priority="normal"
                  recyclingKey={`avatar-${post.authorId}`}
                />
              ) : (
                <View style={[cardStyles.avatarCircle, { backgroundColor: authorColor }]}>
                  <Text style={cardStyles.avatarText}>{initials}</Text>
                </View>
              )}
            </View>
            <View style={cardStyles.authorMeta}>
              <Text style={[cardStyles.authorName, { color: t.text }]}>{post.authorName}</Text>
              <Text style={[cardStyles.postTime, { color: t.subtext }]}>{formatTimeAgo(post.createdAt)}</Text>
            </View>
          </TouchableOpacity>

          {isOwner && (
            <View style={cardStyles.ownerActions}>
              <TouchableOpacity
                style={[cardStyles.ownerBtn, { backgroundColor: t.inputBg }]}
                onPress={() => onEdit(post.id)}
                activeOpacity={0.7}
              >
                <Text style={[cardStyles.ownerBtnText, { color: t.accent }]}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[cardStyles.ownerBtn, { backgroundColor: t.inputBg }]}
                onPress={confirmDelete}
                activeOpacity={0.7}
              >
                <Text style={[cardStyles.ownerBtnText, { color: t.danger }]}>🗑 Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Content */}
        <Text style={[cardStyles.content, { color: t.text }]}>{post.content}</Text>

        {post.imageUri ? (
          <OptimizedImage
            uri={post.imageUri}
            style={cardStyles.image}
            contentFit="cover"
            priority="low"
            recyclingKey={`post-${post.id}`}
          />
        ) : null}

        {/* Actions */}
        <View style={[cardStyles.footer, { borderTopColor: t.border }]}>
          <AnimatedHeartButton liked={liked} count={post.likes.length} onPress={() => onLike(post.id)} />

          <TouchableOpacity
            style={[cardStyles.actionChip, { backgroundColor: t.inputBg }]}
            onPress={() => onComment(post.id)}
            activeOpacity={0.7}
          >
            <Text style={cardStyles.actionEmoji}>💬</Text>
            <Text style={[cardStyles.actionLabel, { color: t.subtext }]}>{post.comments.length}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[cardStyles.actionChip, { backgroundColor: t.inputBg }]}
            activeOpacity={0.7}
          >
            <Text style={cardStyles.actionEmoji}>↗</Text>
            <Text style={[cardStyles.actionLabel, { color: t.subtext }]}>Share</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  },
  (p, n) =>
    p.post === n.post && p.currentUserId === n.currentUserId &&
    p.onLike === n.onLike && p.onComment === n.onComment &&
    p.onEdit === n.onEdit && p.onDelete === n.onDelete &&
    p.onViewProfile === n.onViewProfile
);
PostCard.displayName = 'PostCard';

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 20, marginBottom: rh(1.6), borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.09, shadowRadius: 10, elevation: 4,
  },
  topStrip: { height: 3, width: '100%' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: rw(4), paddingTop: rh(1.4), paddingBottom: rh(0.8) },
  authorRow: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: rw(2.5) },
  avatarRing: { width: rw(11.5), height: rw(11.5), borderRadius: rw(5.75), borderWidth: 2, padding: 1.5 },
  avatarImg: { flex: 1, borderRadius: rw(5.25) },
  avatarCircle: { flex: 1, borderRadius: rw(5.25), alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: rf(1.55), fontWeight: '800', color: '#fff' },
  authorMeta: { flex: 1 },
  authorName: { fontSize: rf(1.65), fontWeight: '800' },
  postTime: { fontSize: rf(1.25), marginTop: 1 },
  ownerActions: { flexDirection: 'row', gap: 6 },
  ownerBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14 },
  ownerBtnText: { fontSize: rf(1.25), fontWeight: '700' },
  content: { fontSize: rf(1.6), lineHeight: 24, paddingHorizontal: rw(4), paddingBottom: rh(1.2) },
  image: { width: '100%', height: rh(26), marginBottom: rh(1.2) },
  footer: {
    flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: rw(4), paddingVertical: rh(1.1), gap: rw(2.5),
  },
  actionChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20,
  },
  actionEmoji: { fontSize: 14 },
  actionLabel: { fontSize: rf(1.4), fontWeight: '600' },
});

// ─── EmptyFeed ────────────────────────────────────────────────────────────────
const EmptyFeed: React.FC<{ onCreatePost: () => void; hasFollows: boolean }> = ({
  onCreatePost,
  hasFollows,
}) => {
  const t = useTheme();
  return (
    <View style={emptyStyles.wrap}>
      <View style={[emptyStyles.iconRing, { borderColor: t.border }]}>
        <Text style={emptyStyles.icon}>{hasFollows ? '✍️' : '👥'}</Text>
      </View>
      <Text style={[emptyStyles.title, { color: t.text }]}>
        {hasFollows ? 'Nothing here yet' : 'Your feed is empty'}
      </Text>
      <Text style={[emptyStyles.sub, { color: t.subtext }]}>
        {hasFollows
          ? 'Be the first to share something with the community.'
          : 'Follow other users to see their posts in your feed, or share your own.'}
      </Text>
      <TouchableOpacity
        style={[emptyStyles.btn, { backgroundColor: t.accent }]}
        onPress={onCreatePost}
        activeOpacity={0.85}
      >
        <Text style={emptyStyles.btnText}>
          {hasFollows ? '✦  Write your first post' : '✦  Create a post'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
const emptyStyles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', paddingTop: rh(8), paddingHorizontal: rw(10) },
  iconRing: {
    width: 90, height: 90, borderRadius: 45, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: rh(2.5),
  },
  icon: { fontSize: 38 },
  title: { fontSize: rf(2.2), fontWeight: '800', marginBottom: rh(1), letterSpacing: -0.3 },
  sub: { fontSize: rf(1.6), textAlign: 'center', lineHeight: 22, marginBottom: rh(3.5) },
  btn: {
    paddingVertical: rh(1.6), paddingHorizontal: rw(8), borderRadius: 28,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: rf(1.6), letterSpacing: 0.2 },
});

// ─── HomeScreen ───────────────────────────────────────────────────────────────
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const { user } = useAuth();
  const { posts, isLoading, isRefreshing, refreshPosts, toggleLike, deletePost } = usePosts();
  const dispatch = useAppDispatch();
  const lastSyncedAt = useAppSelector(s => s.posts.lastSyncedAt);
  const hasNewActivity = useAppSelector(s => s.posts.hasNewActivity);
  const postsError = useAppSelector(s => s.posts.error);
  const followingIds = useAppSelector(s => s.follows.followingIds);

  const feedPosts = useMemo(() => {
    if (!user) return posts;
    const allowedAuthors = new Set([user.id, ...followingIds]);
    return posts.filter(p => allowedAuthors.has(p.authorId));
  }, [posts, followingIds, user]);

  const hasFollows = followingIds.length > 0;

  const listRef = useRef<FlatList>(null);
  const fabScale = useRef(new Animated.Value(1)).current;
  const fabRotate = useRef(new Animated.Value(0)).current;

  const handleLike = useCallback((id: string) => toggleLike(id), [toggleLike]);
  const handleDelete = useCallback((id: string) => deletePost(id), [deletePost]);
  const handleEdit = useCallback(
    (id: string) => navigation.navigate('CreatePost', { postId: id }),
    [navigation]
  );
  const handleComment = useCallback(
    (id: string) => navigation.navigate('Comments', { postId: id }),
    [navigation]
  );
  const handleViewProfile = useCallback(
    (authorId: string, authorName: string) =>
      navigation.navigate('UserProfile', { userId: authorId, userName: authorName }),
    [navigation]
  );
  const handleGoToProfileTab = useCallback(() => {
    navigation.dispatch(CommonActions.navigate({ name: 'Profile' }));
  }, [navigation]);
  const handleOpenMessages = useCallback(() => {
    navigation.navigate('Conversations');
  }, [navigation]);
  const handleOpenSearch = useCallback(() => {
    navigation.navigate('Search');
  }, [navigation]);
  const handleCreatePost = useCallback(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(fabScale, { toValue: 0.78, damping: 4, useNativeDriver: true }),
        Animated.timing(fabRotate, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(fabScale, { toValue: 1, damping: 8, useNativeDriver: true }),
        Animated.timing(fabRotate, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]),
    ]).start();
    navigation.navigate('CreatePost');
  }, [fabScale, fabRotate, navigation]);

  const handleNewActivityPress = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    dispatch(clearNewActivity());
  }, [dispatch]);

  const initials = user?.name?.slice(0, 2).toUpperCase() ?? 'U';
  const fabSpin = fabRotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });

  const renderPost = useCallback(
    ({ item, index }: { item: Post; index: number }) => (
      <PostCard
        post={item}
        index={index}
        currentUserId={user?.id ?? ''}
        onLike={handleLike}
        onComment={handleComment}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewProfile={handleViewProfile}
      />
    ),
    [user?.id, handleLike, handleComment, handleEdit, handleDelete, handleViewProfile]
  );

  const listHeader = useMemo(
    () => (
      <>
        <View style={[styles.storiesCard, { backgroundColor: t.card, borderColor: t.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesRow}>
            {STORIES.map(s => (
              <StoryBubble key={s.id} item={s} theme={t} />
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.composer, { backgroundColor: t.card, borderColor: t.border }]}
          onPress={handleCreatePost}
          activeOpacity={0.7}
        >
          {user?.avatar ? (
            <OptimizedImage uri={user.avatar} style={[styles.composerAvatar, { borderColor: t.border }]} />
          ) : (
            <View style={[styles.composerAvatarCircle, { backgroundColor: t.accent }]}>
              <Text style={styles.composerAvatarText}>{initials}</Text>
            </View>
          )}
          <Text style={[styles.composerHint, { color: t.placeholder }]}>
            What's on your mind, {user?.name?.split(' ')[0] ?? 'there'}?
          </Text>
          <View style={styles.composerIcons}>
            <Text style={styles.composerIcon}>🖼</Text>
          </View>
        </TouchableOpacity>

        {feedPosts.length > 0 && (
          <View style={styles.feedLabel}>
            <View style={[styles.feedLabelLine, { backgroundColor: t.border }]} />
            <Text style={[styles.feedLabelText, { color: t.subtext }]}>Recent Posts</Text>
            <View style={[styles.feedLabelLine, { backgroundColor: t.border }]} />
          </View>
        )}
      </>
    ),
    [t, user, initials, feedPosts.length, handleCreatePost]
  );

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.accent} />
        <Text style={[styles.loadingLabel, { color: t.subtext }]}>Loading feed…</Text>
      </View>
    );
  }

  if (postsError && feedPosts.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: t.bg }]}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={[styles.errorText, { color: t.subtext }]}>Couldn't load posts.</Text>
        <TouchableOpacity style={[styles.retryBtn, { backgroundColor: t.accent }]} onPress={refreshPosts}>
          <Text style={styles.retryText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: t.bg }]}>
      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: t.header, borderBottomColor: t.border, paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoBox, { backgroundColor: t.accent }]}>
            <Text style={styles.logoText}>SC</Text>
          </View>
          <View>
            <Text style={[styles.headerBrand, { color: t.text }]}>Social Connect</Text>
            <LiveBadge lastSyncedAt={lastSyncedAt} />
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: t.inputBg }]}
            onPress={handleOpenSearch}
            activeOpacity={0.75}
          >
            <Text style={[styles.headerBtnIcon, { color: t.accent }]}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: t.inputBg }]}
            onPress={handleOpenMessages}
            activeOpacity={0.75}
          >
            <Text style={[styles.headerBtnIcon, { color: t.accent }]}>💬</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, { backgroundColor: t.inputBg }]}
            onPress={handleCreatePost}
            activeOpacity={0.75}
          >
            <Text style={[styles.headerBtnIcon, { color: t.accent }]}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGoToProfileTab}
            activeOpacity={0.8}
          >
            {user?.avatar ? (
              <OptimizedImage uri={user.avatar} style={[styles.headerAvatar, { borderColor: t.accent }]} priority="high" />
            ) : (
              <View style={[styles.headerAvatarCircle, { backgroundColor: t.accent }]}>
                <Text style={styles.headerAvatarText}>{initials}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={feedPosts}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        {...FLAT_LIST_PERF_PROPS}
        contentContainerStyle={[styles.feed, { paddingBottom: rh(12) }]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refreshPosts}
            colors={[t.accent]} tintColor={t.accent} />
        }
        ListHeaderComponent={listHeader}
        ListEmptyComponent={<EmptyFeed onCreatePost={handleCreatePost} hasFollows={hasFollows} />}
        renderItem={renderPost}
      />

      {hasNewActivity && <NewActivityBanner onPress={handleNewActivityPress} />}

      {/* FAB */}
      <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: t.accent }]}
          onPress={handleCreatePost}
          activeOpacity={0.85}
        >
          <Animated.Text style={[styles.fabIcon, { transform: [{ rotate: fabSpin }] }]}>+</Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingLabel: { fontSize: rf(1.5), marginTop: 12 },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: rf(1.7), marginBottom: 20 },
  retryBtn: { paddingVertical: 12, paddingHorizontal: 32, borderRadius: 24 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: rf(1.6) },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: rw(4.5), paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 6, elevation: 4,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 4, elevation: 4,
  },
  logoText: { fontSize: 12, fontWeight: '900', color: '#fff', letterSpacing: -0.5 },
  headerBrand: { fontSize: rf(2.1), fontWeight: '900', letterSpacing: -0.6, marginBottom: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerBtnIcon: { fontSize: 17 },
  headerAvatar: { width: rw(9.5), height: rw(9.5), borderRadius: rw(4.75), borderWidth: 2 },
  headerAvatarCircle: {
    width: rw(9.5), height: rw(9.5), borderRadius: rw(4.75),
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontWeight: '800', fontSize: rf(1.5) },

  // Feed
  feed: { paddingHorizontal: rw(3.5), paddingTop: 0 },

  // Stories
  storiesCard: {
    borderRadius: 18, marginTop: rh(1.5), marginBottom: rh(1.2),
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  storiesRow: { paddingHorizontal: 14, paddingVertical: 14 },

  // Composer
  composer: {
    flexDirection: 'row', alignItems: 'center', gap: rw(3),
    borderRadius: 18, paddingHorizontal: rw(4), paddingVertical: rh(1.5),
    marginBottom: rh(1.5), borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  composerAvatar: { width: rw(10), height: rw(10), borderRadius: rw(5), borderWidth: 1.5 },
  composerAvatarCircle: {
    width: rw(10), height: rw(10), borderRadius: rw(5),
    alignItems: 'center', justifyContent: 'center',
  },
  composerAvatarText: { color: '#fff', fontWeight: '800', fontSize: rf(1.5) },
  composerHint: { flex: 1, fontSize: rf(1.55) },
  composerIcons: { flexDirection: 'row', gap: 6 },
  composerIcon: { fontSize: 20 },

  // Feed label
  feedLabel: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: rh(1.2) },
  feedLabelLine: { flex: 1, height: StyleSheet.hairlineWidth },
  feedLabelText: { fontSize: rf(1.2), fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },

  // FAB
  fabWrap: { position: 'absolute', bottom: rh(3.5), right: rw(5) },
  fab: {
    width: rw(14), height: rw(14), borderRadius: rw(7),
    alignItems: 'center', justifyContent: 'center',
    elevation: 10, shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.45, shadowRadius: 12,
  },
  fabIcon: { color: '#fff', fontSize: rf(3.2), fontWeight: '300', lineHeight: 34 },
});

export default HomeScreen;
