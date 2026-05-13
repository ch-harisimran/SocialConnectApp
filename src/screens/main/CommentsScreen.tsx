import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePosts } from '../../context/PostsContext';
import { useAuth } from '../../context/AuthContext';
import { Comment } from '../../services/mockPosts';
import { formatTimeAgo } from '../../utils/formatTime';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Comments'>;
type Route = RouteProp<HomeStackParamList, 'Comments'>;

const CommentItem: React.FC<{
  comment: Comment;
  currentUserId: string;
  onDelete: (commentId: string) => void;
}> = ({ comment, currentUserId, onDelete }) => {
  const isOwner = comment.authorId === currentUserId;
  const initials = comment.authorName.slice(0, 2).toUpperCase();

  const confirmDelete = () =>
    Alert.alert('Delete comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(comment.id) },
    ]);

  return (
    <View style={styles.commentRow}>
      {comment.authorAvatar ? (
        <Image source={{ uri: comment.authorAvatar }} style={styles.commentAvatar} />
      ) : (
        <View style={styles.commentAvatarCircle}>
          <Text style={styles.commentAvatarText}>{initials}</Text>
        </View>
      )}

      <View style={styles.commentBubble}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{comment.authorName}</Text>
          <Text style={styles.commentTime}>{formatTimeAgo(comment.createdAt)}</Text>
        </View>
        <Text style={styles.commentText}>{comment.text}</Text>
      </View>

      {isOwner && (
        <TouchableOpacity onPress={confirmDelete} style={styles.commentDeleteBtn} hitSlop={8}>
          <Text style={styles.commentDeleteText}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const CommentsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { postId } = route.params;

  const { posts, toggleLike, addComment, deleteComment } = usePosts();
  const { user } = useAuth();

  const post = posts.find(p => p.id === postId);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  if (!post) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Post not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backLink}>← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const liked = post.likes.includes(user?.id ?? '');
  const postInitials = post.authorName.slice(0, 2).toUpperCase();

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;
    setIsSending(true);
    try {
      await addComment(postId, trimmed);
      setText('');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await deleteComment(postId, commentId);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBack}>
          <Text style={styles.navBackText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Comments</Text>
        <View style={styles.navBack} />
      </View>

      <FlatList
        data={post.comments}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Post summary card */}
            <View style={styles.postCard}>
              <View style={styles.postHeader}>
                {post.authorAvatar ? (
                  <Image source={{ uri: post.authorAvatar }} style={styles.postAvatar} />
                ) : (
                  <View style={styles.postAvatarCircle}>
                    <Text style={styles.postAvatarText}>{postInitials}</Text>
                  </View>
                )}
                <View style={styles.postAuthorInfo}>
                  <Text style={styles.postAuthorName}>{post.authorName}</Text>
                  <Text style={styles.postTime}>{formatTimeAgo(post.createdAt)}</Text>
                </View>
              </View>

              <Text style={styles.postContent}>{post.content}</Text>

              {post.imageUri ? (
                <Image
                  source={{ uri: post.imageUri }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ) : null}

              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => toggleLike(postId)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.actionText, liked && styles.likedText]}>
                    {liked ? '♥' : '♡'} {post.likes.length}{' '}
                    {post.likes.length === 1 ? 'like' : 'likes'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.commentCount}>
                  💬 {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
                </Text>
              </View>
            </View>

            <Text style={styles.commentsLabel}>
              {post.comments.length === 0 ? 'No comments yet — be the first!' : 'Comments'}
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            currentUserId={user?.id ?? ''}
            onDelete={handleDeleteComment}
          />
        )}
      />

      {/* Comment input */}
      <View style={styles.inputBar}>
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.inputAvatar} />
        ) : (
          <View style={styles.inputAvatarCircle}>
            <Text style={styles.inputAvatarText}>
              {user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
            </Text>
          </View>
        )}

        <TextInput
          ref={inputRef}
          style={styles.textInput}
          placeholder="Write a comment…"
          placeholderTextColor="#9CA3AF"
          value={text}
          onChangeText={setText}
          multiline
          maxLength={300}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />

        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || isSending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || isSending}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>Send</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F3F4F6' },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navBack: { width: 36 },
  navBackText: { fontSize: 22, color: '#6366F1' },
  navTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  listContent: { paddingBottom: 16 },
  postCard: {
    backgroundColor: '#fff',
    padding: 14,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  postAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  postAvatarText: { fontSize: 13, fontWeight: '700', color: '#6366F1' },
  postAuthorInfo: { flex: 1 },
  postAuthorName: { fontSize: 14, fontWeight: '700', color: '#111827' },
  postTime: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  postContent: { fontSize: 14, color: '#374151', lineHeight: 22, marginBottom: 10 },
  postImage: { width: '100%', height: 180, borderRadius: 10, marginBottom: 10 },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionBtn: {},
  actionText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  likedText: { color: '#EF4444', fontWeight: '700' },
  commentCount: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  commentsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, marginTop: 2 },
  commentAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  commentAvatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  commentBubble: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: '#111827' },
  commentTime: { fontSize: 11, color: '#9CA3AF' },
  commentText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  commentDeleteBtn: { paddingTop: 6, paddingLeft: 4 },
  commentDeleteText: { fontSize: 12, color: '#9CA3AF' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  inputAvatar: { width: 34, height: 34, borderRadius: 17, marginBottom: 4 },
  inputAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  inputAvatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
  },
  sendBtn: {
    backgroundColor: '#6366F1',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 2,
    minWidth: 60,
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#C7D2FE' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, color: '#6B7280', marginBottom: 12 },
  backLink: { fontSize: 14, color: '#6366F1', fontWeight: '600' },
});

export default CommentsScreen;
