import React, { useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePosts } from '../../context/PostsContext';
import { useAuth } from '../../context/AuthContext';
import { formatTimeAgo } from '../../utils/formatTime';
import { Post } from '../../services/mockPosts';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

const PostCard: React.FC<{
  post: Post;
  currentUserId: string;
  onLike: (id: string) => void;
  onComment: (id: string) => void;
  onDelete: (id: string) => void;
  onViewProfile: (authorId: string, authorName: string) => void;
}> = ({ post, currentUserId, onLike, onComment, onDelete, onViewProfile }) => {
  const liked = post.likes.includes(currentUserId);
  const isOwner = post.authorId === currentUserId;
  const initials = post.authorName.slice(0, 2).toUpperCase();

  const confirmDelete = () => {
    Alert.alert('Delete post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(post.id) },
    ]);
  };

  return (
    <View style={styles.card}>
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
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onLike(post.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.actionText, liked && styles.likedText]}>
            {liked ? '♥' : '♡'} {post.likes.length}
          </Text>
        </TouchableOpacity>
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
    </View>
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

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { posts, isLoading, isRefreshing, refreshPosts, toggleLike, deletePost } = usePosts();

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
  const handleCreatePost = useCallback(() => navigation.navigate('CreatePost'), [navigation]);

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
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.headerAvatar} />
        ) : (
          <View style={styles.headerAvatarCircle}>
            <Text style={styles.headerAvatarText}>{initials}</Text>
          </View>
        )}
      </View>

      <FlatList
        data={posts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
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

      <TouchableOpacity style={styles.fab} onPress={handleCreatePost} activeOpacity={0.85}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#6366F1' },
  headerAvatar: { width: 36, height: 36, borderRadius: 18 },
  headerAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  composerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  composerAvatar: { width: 38, height: 38, borderRadius: 19 },
  composerAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  composerPlaceholder: { fontSize: 14, color: '#9CA3AF', flex: 1 },
  composerPhotoBtn: { padding: 4 },
  composerPhotoIcon: { fontSize: 18 },
  feed: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 90 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatarImage: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
  authorInfo: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  postTime: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  deleteBtn: { padding: 4 },
  deleteBtnText: { fontSize: 22, color: '#9CA3AF', lineHeight: 22 },
  postContent: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 10 },
  postImage: { width: '100%', height: 200, borderRadius: 10, marginBottom: 10 },
  cardFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
    gap: 16,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  likedText: { color: '#EF4444', fontWeight: '700' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8 },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  emptyButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
  fabIcon: { color: '#fff', fontSize: 28, lineHeight: 32, fontWeight: '300' },
});

export default HomeScreen;
