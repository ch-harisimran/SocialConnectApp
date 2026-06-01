import React, { memo, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePosts } from '../../context/PostsContext';
import { useAuth } from '../../context/AuthContext';
import { Comment } from '../../services/mockPosts';
import { formatTimeAgo } from '../../utils/formatTime';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import AnimatedHeartButton from '../../components/AnimatedHeartButton';
import { useTheme } from '../../utils/theme';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'Comments'>;
type Route = RouteProp<HomeStackParamList, 'Comments'>;

const CommentItem = memo<{
  comment: Comment;
  currentUserId: string;
  onDelete: (commentId: string) => void;
  onViewProfile: (authorId: string, authorName: string) => void;
}>(({ comment, currentUserId, onDelete, onViewProfile }) => {
  const t = useTheme();
  const isOwner = comment.authorId === currentUserId;
  const initials = comment.authorName.slice(0, 2).toUpperCase();

  const confirmDelete = () =>
    Alert.alert('Delete comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete(comment.id) },
    ]);

  return (
    <View style={[styles.commentRow]}>
      <TouchableOpacity
        onPress={() => onViewProfile(comment.authorId, comment.authorName)}
        activeOpacity={0.7}
      >
        {comment.authorAvatar ? (
          <Image source={{ uri: comment.authorAvatar }} style={styles.commentAvatar} />
        ) : (
          <View style={[styles.commentAvatarCircle, { backgroundColor: t.accent }]}>
            <Text style={styles.commentAvatarText}>{initials}</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={[styles.commentBubble, { backgroundColor: t.card, borderColor: t.border }]}>
        <View style={styles.commentHeader}>
          <TouchableOpacity
            onPress={() => onViewProfile(comment.authorId, comment.authorName)}
            activeOpacity={0.7}
          >
            <Text style={[styles.commentAuthor, { color: t.text }]}>{comment.authorName}</Text>
          </TouchableOpacity>
          <Text style={[styles.commentTime, { color: t.subtext }]}>
            {formatTimeAgo(comment.createdAt)}
          </Text>
        </View>
        <Text style={[styles.commentText, { color: t.text }]}>{comment.text}</Text>
      </View>

      {isOwner && (
        <TouchableOpacity onPress={confirmDelete} style={styles.commentDeleteBtn} hitSlop={8}>
          <Text style={[styles.commentDeleteText, { color: t.subtext }]}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});
CommentItem.displayName = 'CommentItem';

const CommentsScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { postId } = route.params;
  const insets = useSafeAreaInsets();
  const t = useTheme();

  const { posts, toggleLike, addComment, deleteComment, deletePost } = usePosts();
  const { user } = useAuth();

  const post = posts.find(p => p.id === postId);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  if (!post) {
    return (
      <View style={[styles.notFound, { backgroundColor: t.bg }]}>
        <Text style={[styles.notFoundText, { color: t.subtext }]}>Post not found.</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.backLink, { color: t.accent }]}>← Go back</Text>
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

  const handleViewProfile = (authorId: string, authorName: string) => {
    navigation.navigate('UserProfile', { userId: authorId, userName: authorName });
  };

  const isOwner = post.authorId === user?.id;

  const handleEditPost = () => {
    navigation.navigate('CreatePost', { postId: post.id });
  };

  const handleDeletePost = () => {
    Alert.alert('Delete post', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deletePost(post.id);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBack} hitSlop={8}>
          <Text style={[styles.navBackText, { color: t.accent }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: t.text }]}>Comments</Text>
        <View style={styles.navBack} />
      </View>

      <FlatList
        data={post.comments}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        initialNumToRender={8}
        windowSize={10}
        contentContainerStyle={[styles.listContent, { backgroundColor: t.bg }]}
        ListHeaderComponent={
          <>
            {/* Post summary */}
            <View style={[styles.postCard, { backgroundColor: t.card, borderColor: t.border }]}>
              <TouchableOpacity
                style={styles.postHeader}
                onPress={() => handleViewProfile(post.authorId, post.authorName)}
                activeOpacity={0.7}
              >
                {post.authorAvatar ? (
                  <Image source={{ uri: post.authorAvatar }} style={styles.postAvatar} />
                ) : (
                  <View style={[styles.postAvatarCircle, { backgroundColor: t.accentLight }]}>
                    <Text style={[styles.postAvatarText, { color: t.accent }]}>{postInitials}</Text>
                  </View>
                )}
                <View style={styles.postAuthorInfo}>
                  <Text style={[styles.postAuthorName, { color: t.text }]}>{post.authorName}</Text>
                  <Text style={[styles.postTime, { color: t.subtext }]}>
                    {formatTimeAgo(post.createdAt)}
                  </Text>
                </View>
              </TouchableOpacity>

              <Text style={[styles.postContent, { color: t.text }]}>{post.content}</Text>

              {post.imageUri ? (
                <Image
                  source={{ uri: post.imageUri }}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              ) : null}

              <View style={[styles.postActions, { borderTopColor: t.border }]}>
                <AnimatedHeartButton
                  liked={liked}
                  count={post.likes.length}
                  label={post.likes.length === 1 ? 'like' : 'likes'}
                  onPress={() => toggleLike(postId)}
                />
                <Text style={[styles.commentCount, { color: t.subtext }]}>
                  💬 {post.comments.length}{' '}
                  {post.comments.length === 1 ? 'comment' : 'comments'}
                </Text>
              </View>

              {isOwner && (
                <View style={[styles.postOwnerActions, { borderTopColor: t.border }]}>
                  <TouchableOpacity
                    style={[styles.postOwnerBtn, { backgroundColor: t.inputBg }]}
                    onPress={handleEditPost}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.postOwnerBtnText, { color: t.accent }]}>✏️ Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.postOwnerBtn, { backgroundColor: t.inputBg }]}
                    onPress={handleDeletePost}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.postOwnerBtnText, { color: t.danger }]}>🗑 Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={[styles.commentsLabel, { color: t.subtext }]}>
              {post.comments.length === 0 ? 'No comments yet — be the first!' : 'Comments'}
            </Text>
          </>
        }
        renderItem={({ item }) => (
          <CommentItem
            comment={item}
            currentUserId={user?.id ?? ''}
            onDelete={handleDeleteComment}
            onViewProfile={handleViewProfile}
          />
        )}
      />

      {/* Comment input */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: t.card,
            borderTopColor: t.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        {user?.avatar ? (
          <Image source={{ uri: user.avatar }} style={styles.inputAvatar} />
        ) : (
          <View style={[styles.inputAvatarCircle, { backgroundColor: t.accent }]}>
            <Text style={styles.inputAvatarText}>
              {user?.name?.slice(0, 2).toUpperCase() ?? 'U'}
            </Text>
          </View>
        )}

        <TextInput
          ref={inputRef}
          style={[
            styles.textInput,
            {
              backgroundColor: t.inputBg,
              borderColor: t.border,
              color: t.text,
            },
          ]}
          placeholder="Write a comment…"
          placeholderTextColor={t.placeholder}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={300}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          submitBehavior="blurAndSubmit"
        />

        <TouchableOpacity
          style={[
            styles.sendBtn,
            { backgroundColor: t.accent },
            (!text.trim() || isSending) && { backgroundColor: t.accentLight },
          ]}
          onPress={handleSend}
          disabled={!text.trim() || isSending}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendBtnText}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  navTitle: { fontSize: 17, fontWeight: '700' },
  listContent: { paddingBottom: 16 },
  postCard: {
    padding: 16,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  postAvatar: { width: 42, height: 42, borderRadius: 21, marginRight: 10 },
  postAvatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  postAvatarText: { fontSize: 13, fontWeight: '700' },
  postAuthorInfo: { flex: 1 },
  postAuthorName: { fontSize: 14, fontWeight: '700' },
  postTime: { fontSize: 12, marginTop: 1 },
  postContent: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  postImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 10 },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  commentCount: { fontSize: 14, fontWeight: '500' },
  postOwnerActions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  postOwnerBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14 },
  postOwnerBtnText: { fontSize: 12, fontWeight: '700' },
  commentsLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
  },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginTop: 2 },
  commentAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  commentAvatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  commentBubble: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: '700' },
  commentTime: { fontSize: 11 },
  commentText: { fontSize: 14, lineHeight: 20 },
  commentDeleteBtn: { paddingTop: 8, paddingLeft: 4 },
  commentDeleteText: { fontSize: 13 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  inputAvatar: { width: 36, height: 36, borderRadius: 18, marginBottom: 4 },
  inputAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  inputAvatarText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 22,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontSize: 16, marginBottom: 12 },
  backLink: { fontSize: 14, fontWeight: '600' },
});

export default CommentsScreen;
