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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePosts } from '../../context/PostsContext';
import { useAuth } from '../../context/AuthContext';
import { HomeStackParamList } from '../../navigation/HomeStackNavigator';
import { useTheme } from '../../utils/theme';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'CreatePost'>;

const MAX_CHARS = 500;

const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { createPost } = usePosts();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const t = useTheme();
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
      mediaTypes: ['images'] as ImagePicker.MediaType[],
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
  const progressPct = Math.min(content.length / MAX_CHARS, 1);
  const progressColor =
    charsLeft < 20 ? t.danger : charsLeft < 80 ? '#F59E0B' : t.accent;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
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
        <TouchableOpacity onPress={handleDiscard} style={styles.navBtn}>
          <Text style={[styles.navCancel, { color: t.subtext }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: t.text }]}>New Post</Text>
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
            <Text style={styles.postBtnText}>Post</Text>
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

        {imageUri ? (
          <View style={styles.imagePreviewWrapper}>
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImageBtn} onPress={() => setImageUri(null)}>
              <Text style={styles.removeImageText}>✕</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Subtle separator before toolbar area */}
        <View style={{ height: 60 }} />
      </ScrollView>

      {/* Toolbar */}
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
        <TouchableOpacity style={styles.toolbarBtn} onPress={showImageOptions}>
          <Text style={styles.toolbarIcon}>🖼</Text>
          <Text style={[styles.toolbarLabel, { color: t.accent }]}>Photo</Text>
        </TouchableOpacity>

        {/* Circular progress ring + count */}
        <View style={styles.charGroup}>
          <Text style={[styles.charCountText, { color: progressColor }]}>{charsLeft}</Text>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: t.border },
            ]}
          >
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
  imagePreviewWrapper: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: { width: '100%', height: 220, borderRadius: 14 },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: { color: '#fff', fontSize: 13, fontWeight: '700' },
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
