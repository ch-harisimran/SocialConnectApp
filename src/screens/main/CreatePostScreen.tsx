import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
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
import { imageUploadService } from '../../services/imageUploadService';
import { imagePicker } from '../../utils/imagePicker';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { useTheme } from '../../utils/theme';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'CreatePost'>;
type Route = RouteProp<HomeStackParamList, 'CreatePost'>;

const MAX_CHARS = 500;

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const editPostId = route.params?.postId;
  const isEditing = Boolean(editPostId);

  const { posts, createPost, updatePost } = usePosts();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const t = useTheme();
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoaded, setIsLoaded] = useState(!isEditing);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!editPostId) return;
    const post = posts.find(p => p.id === editPostId);
    if (post) {
      setContent(post.content);
      setImageUri(post.imageUri);
      setIsLoaded(true);
    } else if (!isLoaded) {
      Alert.alert('Post not found', 'This post may have been deleted.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [editPostId, posts, navigation, isLoaded]);

  const charsLeft = MAX_CHARS - content.length;
  const hasText = content.trim().length > 0;
  const hasImage = imageUri !== null;
  const canPost = (hasText || hasImage) && charsLeft >= 0 && !isSubmitting;

  const handleSelectImage = () => {
    imagePicker.showPickerOptions(uri => setImageUri(uri));
  };

  const handlePost = async () => {
    if (!canPost || !user) return;
    setIsSubmitting(true);
    try {
      let uploadedImageUri = imageUri;
      if (imageUri) {
        uploadedImageUri = await imageUploadService.uploadPostImage(imageUri, user.id);
      }

      if (isEditing && editPostId) {
        await updatePost(editPostId, content.trim(), uploadedImageUri);
      } else {
        await createPost(content.trim(), uploadedImageUri);
      }
      navigation.goBack();
    } catch (err) {
      Alert.alert(
        'Error',
        err instanceof Error ? err.message : `Failed to ${isEditing ? 'update' : 'create'} post.`
      );
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    const hasChanges = isEditing
      ? posts.find(p => p.id === editPostId)?.content !== content.trim() ||
        posts.find(p => p.id === editPostId)?.imageUri !== imageUri
      : hasText || hasImage;

    if (!hasChanges) {
      navigation.goBack();
      return;
    }
    Alert.alert('Discard changes?', 'Your changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  if (!isLoaded) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: t.bg }]}>
        <ActivityIndicator size="large" color={t.accent} />
      </View>
    );
  }

  const initials = user?.name?.slice(0, 2).toUpperCase() ?? 'U';
  const progressPct = Math.min(content.length / MAX_CHARS, 1);
  const progressColor =
    charsLeft < 20 ? t.danger : charsLeft < 80 ? '#F59E0B' : t.accent;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <TouchableOpacity onPress={handleDiscard} style={styles.navBtn}>
          <Text style={[styles.navCancel, { color: t.subtext }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: t.text }]}>
          {isEditing ? 'Edit Post' : 'New Post'}
        </Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={!canPost}
          style={[
            styles.postBtn,
            { backgroundColor: canPost ? t.accent : t.accentLight },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>{isEditing ? 'Save' : 'Post'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={[styles.body, { backgroundColor: t.card }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.composer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: t.accent }]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.inputArea}>
            <Text style={[styles.authorName, { color: t.text }]}>{user?.name ?? 'You'}</Text>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: t.text }]}
              placeholder="What's on your mind?"
              placeholderTextColor={t.placeholder}
              multiline
              autoFocus
              value={content}
              onChangeText={setContent}
              maxLength={MAX_CHARS}
            />
          </View>
        </View>

        <View style={styles.mediaSection}>
          <Text style={[styles.mediaSectionTitle, { color: t.subtext }]}>Photo</Text>

          {imageUri ? (
            <View style={[styles.imagePreviewWrapper, { borderColor: t.border }]}>
              <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
              <View style={styles.previewBadge}>
                <Text style={styles.previewBadgeText}>Preview</Text>
              </View>
              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={[styles.previewActionBtn, { backgroundColor: 'rgba(0,0,0,0.65)' }]}
                  onPress={handleSelectImage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.previewActionText}>Change</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.previewActionBtn, { backgroundColor: 'rgba(0,0,0,0.65)' }]}
                  onPress={() => setImageUri(null)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.previewActionText, { color: '#FCA5A5' }]}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.addImageBox, { borderColor: t.border, backgroundColor: t.inputBg }]}
              onPress={handleSelectImage}
              activeOpacity={0.75}
            >
              <Text style={styles.addImageIcon}>🖼</Text>
              <Text style={[styles.addImageTitle, { color: t.text }]}>Add a photo</Text>
              <Text style={[styles.addImageSub, { color: t.subtext }]}>
                Tap to take a photo or choose from your library
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <View
        style={[
          styles.toolbar,
          {
            backgroundColor: t.card,
            borderTopColor: t.border,
            paddingBottom: insets.bottom + 4,
          },
        ]}
      >
        <TouchableOpacity style={styles.toolbarBtn} onPress={handleSelectImage}>
          <Text style={styles.toolbarIcon}>📷</Text>
          <Text style={[styles.toolbarLabel, { color: t.accent }]}>
            {imageUri ? 'Change Photo' : 'Add Photo'}
          </Text>
        </TouchableOpacity>

        <View style={styles.charGroup}>
          <Text style={[styles.charCountText, { color: progressColor }]}>{charsLeft}</Text>
          <View style={[styles.progressBar, { backgroundColor: t.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPct * 100}%` as unknown as number,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: { minWidth: 64 },
  navTitle: { fontSize: 17, fontWeight: '700' },
  navCancel: { fontSize: 15, fontWeight: '500' },
  postBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 22,
    minWidth: 64,
    alignItems: 'center',
  },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  body: { flex: 1 },
  composer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 17, fontWeight: '800', color: '#fff' },
  inputArea: { flex: 1 },
  authorName: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  textInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  mediaSection: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  mediaSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  addImageBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  addImageIcon: { fontSize: 36, marginBottom: 10 },
  addImageTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  addImageSub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  imagePreviewWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: StyleSheet.hairlineWidth,
  },
  imagePreview: { width: '100%', height: 260 },
  previewBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  previewBadgeText: { color: '#fff', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  previewActions: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  previewActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  previewActionText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 16 },
  toolbarIcon: { fontSize: 20 },
  toolbarLabel: { fontSize: 13, fontWeight: '600' },
  charGroup: { marginLeft: 'auto', alignItems: 'flex-end', gap: 4 },
  charCountText: { fontSize: 13, fontWeight: '700' },
  progressBar: {
    width: 80,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2 },
});

export default CreatePostScreen;
