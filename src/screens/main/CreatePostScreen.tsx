import React, { useState, useRef } from 'react';
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
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePosts } from '../../context/PostsContext';
import { useAuth } from '../../context/AuthContext';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'CreatePost'>;

const MAX_CHARS = 500;

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { createPost } = usePosts();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const charsLeft = MAX_CHARS - content.length;
  const canPost = content.trim().length > 0 && charsLeft >= 0 && !isSubmitting;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handlePost = async () => {
    if (!canPost) return;
    setIsSubmitting(true);
    try {
      await createPost(content.trim(), imageUri);
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Failed to create post. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleDiscard = () => {
    if (content.trim().length === 0 && !imageUri) {
      navigation.goBack();
      return;
    }
    Alert.alert('Discard post?', 'Your changes will be lost.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  const initials = user?.name?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.navbar}>
        <TouchableOpacity onPress={handleDiscard} style={styles.navBtn}>
          <Text style={styles.navCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>New Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={!canPost}
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
        <View style={styles.composer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.inputArea}>
            <Text style={styles.authorName}>{user?.name ?? 'You'}</Text>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#9CA3AF"
              multiline
              autoFocus
              value={content}
              onChangeText={setContent}
              maxLength={MAX_CHARS}
            />
          </View>
        </View>

        {imageUri ? (
          <View style={styles.imagePreviewWrapper}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarBtn} onPress={showImageOptions}>
          <Text style={styles.toolbarIcon}>🖼</Text>
          <Text style={styles.toolbarLabel}>Photo</Text>
        </TouchableOpacity>

        <View style={styles.charCounter}>
          <Text style={[styles.charCountText, charsLeft < 50 && styles.charCountWarn]}>
            {charsLeft}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  navBtn: { minWidth: 60 },
  navTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  navCancel: { fontSize: 15, color: '#6B7280' },
  postBtn: {
    backgroundColor: '#6366F1',
    paddingVertical: 7,
    paddingHorizontal: 18,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  postBtnDisabled: { backgroundColor: '#C7D2FE' },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  body: { flex: 1 },
  composer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 16, fontWeight: '800', color: '#fff' },
  inputArea: { flex: 1 },
  authorName: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 6 },
  textInput: {
    fontSize: 16,
    color: '#111827',
    lineHeight: 24,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imagePreviewWrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: { width: '100%', height: 220, borderRadius: 12 },
  removeImageBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#fff',
  },
  toolbarBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 16 },
  toolbarIcon: { fontSize: 20 },
  toolbarLabel: { fontSize: 13, color: '#6B7280', fontWeight: '600' },
  charCounter: { marginLeft: 'auto' },
  charCountText: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  charCountWarn: { color: '#EF4444' },
});

export default CreatePostScreen;
