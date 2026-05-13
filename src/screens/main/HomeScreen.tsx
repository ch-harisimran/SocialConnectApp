import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
} from 'react-native-reanimated';

import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePosts } from '../../context/PostsContext';
import { useAuth } from '../../context/AuthContext';
import { formatTimeAgo } from '../../utils/formatTime';
import { rf, rw, rh } from '../../utils/responsive';
import { Post } from '../../services/mockPosts';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import AnimatedHeartButton from '../../components/AnimatedHeartButton';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

// ─── LiveBadge ────────────────────────────────────────────────────────────────

const LiveBadge: React.FC<{ lastSyncedAt: number | null }> = ({ lastSyncedAt }) => {
  const pulse = useSharedValue(1);
  const [, tick] = useState(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(0.3, { duration: 900 }), withTiming(1, { duration: 900 })),
      -1
    );
  }, [pulse]);

  useEffect(() => {
    const interval = setInterval(() => tick(n => n + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  const timeLabel = lastSyncedAt ? formatTimeAgo(new Date(lastSyncedAt).toISOString()) : null;

  return (
    <View style={liveBadgeStyles.container}>
      <Animated.View style={[liveBadgeStyles.dot, dotStyle]} />
      <Text style={liveBadgeStyles.text}>LIVE{timeLabel ? ` · ${timeLabel}` : ''}</Text>
    </View>
  );
};

const liveBadgeStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#22C55E' },
  text: { fontSize: rf(1.2), fontWeight: '700', color: '#22C55E', letterSpacing: 0.4 },
});

// ─── NewActivityBanner ────────────────────────────────────────────────────────

const NewActivityBanner: React.FC<{ onPress: () => void }> = ({ onPress }) => {
  const slideY = useSharedValue(-40);

  useEffect(() => {
    slideY.value = withSpring(0, { damping: 10, stiffness: 80 });
  }, [slideY]);

  const bannerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: slideY.value }],
  }));

  return (
    <Animated.View style={[bannerStyles.wrapper, bannerAnimStyle]}>
      <TouchableOpacity style={bannerStyles.banner} onPress={onPress} activeOpacity={0.85}>
        <Text style={bannerStyles.text}>✦ New activity — tap to refresh</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const bannerStyles = StyleSheet.create({
  wrapper: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center' },
  banner: {
    marginTop: rh(1),
    backgroundColor: '#6366F1',
    paddingVertical: rh(1),
    paddingHorizontal: rw(5.3),
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  text: { color: '#fff', fontWeight: '700', fontSize: rf(1.5) },
});

// ─── PostCard ─────────────────────────────────────────────────────────────────

const PostCard: React.FC<{
  post: Post;
  index: number;
  currentUserId: string;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onDelete: (id: string) => void;
  onViewProfile: (authorId: string, authorName: string) => void;
}> = ({ post, index, currentUserId, onLike, onComment, onDelete, onViewProfile }) => {
  const liked = post.likes.includes(currentUserId);
  const isOwner = post.authorId === currentUserId;
  const initials = post.authorName.slice(0, 2).toUpperCase();

  // Staggered entrance animation (first 6 items only)
  const opacity = useSharedValue(index < 6 ? 0 : 1);
  const translateY = useSharedValue(index < 6 ? 24 : 0);

  useEffect(() => {
    if (index < 6) {
      const delay = index * 70;
      opacity.value = withDelay(delay, withTiming(1, { duration: 280 }));
      translateY.value = withDelay(delay, withSpring(0, { damping: 16 }));
    }
    // Run once on mount only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardAnimStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const confirmDelete = () => {
    Alert.alert('Delete post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(post.id) },
    ]);
  };

  return (
    <Animated.View style={[styles.card, cardAnimStyle]}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={() => onViewProfile(post.authorId, post.authorName)}
        activeOpacity={0.7}
      >
        {post.authorAvatar ? (
          <Image source={{ uri: post.authorAvatar }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        )}
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.authorName}</Text>
          <Text style={styles.postTime}>{formatTimeAgo(post.createdAt)}</Text>
        </View>
        {isOwner && (
          <TouchableOpacity
            onPress={e => {
              e.stopPropagation();
              confirmDelete();
            }}
            style={styles.deleteBtn}
            hitSlop={8}
          >
            <Text style={styles.deleteBtnText}>⋯</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Text style={styles.postContent}>{post.content}</Text>

      {post.imageUri ? (
        <Image source={{ uri: post.imageUri }} style={styles.postImage} resizeMode="cover" />
      ) : null}

      <View style={styles.cardFooter}>
        <AnimatedHeartButton
          liked={liked}
          count={post.likes.length}
          onPress={() => onLike(post.id)}
        />
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onComment(post.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.actionText}>💬 {post.comments.length}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>↗ Share</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const EmptyFeed: React.FC<{ onCreatePost: () => void }> = ({ onCreatePost }) => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📝</Text>
    <Text style={styles.emptyTitle}>No posts yet</Text>
    <Text style={styles.emptySubtitle}>Be the first to share something with the community.</Text>
    <TouchableOpacity style={styles.emptyButton} onPress={onCreatePost} activeOpacity={0.8}>
      <Text style={styles.emptyButtonText}>Create First Post</Text>
    </TouchableOpacity>
  </View>
);

// ─── HomeScreen ───────────────────────────────────────────────────────────────

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const {
    posts,
    isLoading,
    isRefreshing,
    lastSyncedAt,
    hasNewActivity,
    refreshPosts,
    clearNewActivity,
    toggleLike,
    deletePost,
  } = usePosts();

  const listRef = useRef<FlatList>(null);

  // FAB scale animation
  const fabScale = useSharedValue(1);
  const fabAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  const handleLike = useCallback((id: string) => toggleLike(id), [toggleLike]);
  const handleDelete = useCallback((id: string) => deletePost(id), [deletePost]);
  const handleComment = useCallback(
    (id: string) => navigation.navigate('Comments', { postId: id }),
    [navigation]
  );
  const handleViewProfile = useCallback(
    (authorId: string, authorName: string) =>
      navigation.navigate('UserProfile', { userId: authorId, userName: authorName }),
    [navigation]
  );
  const handleCreatePost = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability
    fabScale.value = withSequence(withSpring(0.85, { damping: 5 }), withSpring(1, { damping: 8 }));
    navigation.navigate('CreatePost');
  }, [fabScale, navigation]);

  const handleNewActivityPress = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    clearNewActivity();
  }, [clearNewActivity]);

  const initials = user?.name?.slice(0, 2).toUpperCase() ?? 'U';

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Social Connect</Text>
        <LiveBadge lastSyncedAt={lastSyncedAt} />
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.headerAvatar} />
        ) : (
          <View style={styles.headerAvatarCircle}>
            <Text style={styles.headerAvatarText}>{initials}</Text>
          </View>
        )}
      </View>

      <FlatList
        ref={listRef}
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <PostCard
            post={item}
            index={index}
            currentUserId={user?.id ?? ''}
            onLike={handleLike}
            onComment={handleComment}
            onDelete={handleDelete}
            onViewProfile={handleViewProfile}
          />
        )}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.composerBar}
            onPress={handleCreatePost}
            activeOpacity={0.7}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={styles.composerAvatar} />
            ) : (
              <View style={styles.composerAvatarCircle}>
                <Text style={styles.composerAvatarText}>{initials}</Text>
              </View>
            )}
            <Text style={styles.composerPlaceholder}>{"What's on your mind?"}</Text>
            <View style={styles.composerPhotoBtn}>
              <Text style={styles.composerPhotoIcon}>🖼</Text>
            </View>
          </TouchableOpacity>
        }
        ListEmptyComponent={<EmptyFeed onCreatePost={handleCreatePost} />}
        contentContainerStyle={styles.feed}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshPosts}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      />

      {hasNewActivity && <NewActivityBanner onPress={handleNewActivityPress} />}

      <Animated.View style={[styles.fabWrapper, fabAnimStyle]}>
        <TouchableOpacity style={styles.fab} onPress={handleCreatePost} activeOpacity={0.85}>
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: rw(4.3),
    paddingVertical: rh(1.7),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: rf(2.2), fontWeight: '800', color: '#6366F1' },
  headerAvatar: { width: rw(9.6), height: rw(9.6), borderRadius: rw(4.8) },
  headerAvatarCircle: {
    width: rw(9.6),
    height: rw(9.6),
    borderRadius: rw(4.8),
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: rf(1.5) },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: rw(3.2),
    marginTop: rh(1.5),
    marginBottom: rh(0.5),
    borderRadius: 12,
    padding: rw(3.2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: rw(2.7),
  },
  composerAvatar: { width: rw(10.1), height: rw(10.1), borderRadius: rw(5.1) },
  composerAvatarCircle: {
    width: rw(10.1),
    height: rw(10.1),
    borderRadius: rw(5.1),
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerAvatarText: { color: '#fff', fontWeight: '700', fontSize: rf(1.5) },
  composerPlaceholder: { fontSize: rf(1.6), color: '#9CA3AF', flex: 1 },
  composerPhotoBtn: { padding: 4 },
  composerPhotoIcon: { fontSize: rf(2.0) },
  feed: { paddingHorizontal: rw(3.2), paddingTop: rh(1), paddingBottom: rh(11) },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: rw(3.7),
    marginBottom: rh(1.2),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: rh(1.2) },
  avatarImage: { width: rw(11.2), height: rw(11.2), borderRadius: rw(5.6), marginRight: rw(2.7) },
  avatarCircle: {
    width: rw(11.2),
    height: rw(11.2),
    borderRadius: rw(5.6),
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: rw(2.7),
  },
  avatarText: { fontSize: rf(1.5), fontWeight: '700', color: '#6366F1' },
  authorInfo: { flex: 1 },
  authorName: { fontSize: rf(1.6), fontWeight: '700', color: '#111827' },
  postTime: { fontSize: rf(1.4), color: '#9CA3AF', marginTop: 1 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: rf(2.4), color: '#9CA3AF', lineHeight: 22 },
  postContent: { fontSize: rf(1.6), color: '#374151', lineHeight: 22, marginBottom: rh(1.2) },
  postImage: { width: '100%', height: rh(24.6), borderRadius: 10, marginBottom: rh(1.2) },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: rh(1.2),
    gap: rw(4.3),
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: rf(1.5), color: '#6B7280', fontWeight: '500' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: rh(9.9),
    paddingHorizontal: rw(8.5),
  },
  emptyIcon: { fontSize: rf(5.0), marginBottom: rh(2) },
  emptyTitle: { fontSize: rf(2.0), fontWeight: '700', color: '#111827', marginBottom: rh(1) },
  emptySubtitle: {
    fontSize: rf(1.6),
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: rh(3),
  },
  emptyButton: {
    backgroundColor: '#6366F1',
    paddingVertical: rh(1.5),
    paddingHorizontal: rw(7.5),
    borderRadius: 24,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: rf(1.7) },
  fabWrapper: {
    position: 'absolute',
    bottom: rh(3),
    right: rw(5.3),
  },
  fab: {
    width: rw(14.9),
    height: rw(14.9),
    borderRadius: rw(7.5),
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  fabIcon: { color: '#fff', fontSize: rf(3.2), lineHeight: 32, fontWeight: '300' },
});

export default HomeScreen;
