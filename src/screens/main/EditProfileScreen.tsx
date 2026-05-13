import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FormInput from '../../components/auth/FormInput';
import { useAuth } from '../../context/AuthContext';
import { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'EditProfile'>;

const validationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(50, 'Name must be under 50 characters.')
    .required('Full name is required.'),
  bio: Yup.string().max(160, 'Bio must be under 160 characters.'),
});

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user, updateProfile } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [serverError, setServerError] = useState('');

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission required',
        'Please allow access to your photo library to upload a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow camera access to take a profile photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const showImageOptions = () => {
    Alert.alert('Profile Picture', 'Choose a source', [
      { text: 'Camera', onPress: takePhoto },
      { text: 'Photo Library', onPress: pickImage },
      { text: 'Remove Photo', style: 'destructive', onPress: () => setAvatar(null) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const formik = useFormik({
    initialValues: {
      name: user?.name ?? '',
      bio: user?.bio ?? '',
    },
    validationSchema,
    onSubmit: async values => {
      setServerError('');
      try {
        await updateProfile({
          name: values.name.trim(),
          bio: values.bio.trim(),
          avatar,
        });
        navigation.goBack();
      } catch (err: unknown) {
        setServerError(
          err instanceof Error ? err.message : 'Failed to save profile. Please try again.'
        );
      }
    },
  });

  const initials = (user?.name ?? 'U').slice(0, 2).toUpperCase();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Text style={styles.navCancel}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.navTitle}>Edit Profile</Text>
        <TouchableOpacity
          onPress={() => formik.handleSubmit()}
          disabled={formik.isSubmitting}
          style={styles.navBtn}
        >
          {formik.isSubmitting ? (
            <ActivityIndicator size="small" color="#6366F1" />
          ) : (
            <Text style={styles.navSave}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={showImageOptions} activeOpacity={0.8}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={styles.cameraOverlay}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </View>

        <View style={styles.form}>
          {serverError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>{serverError}</Text>
            </View>
          ) : null}

          <FormInput
            label="Full Name"
            placeholder="Your full name"
            autoCapitalize="words"
            value={formik.values.name}
            onChangeText={formik.handleChange('name')}
            onBlur={formik.handleBlur('name')}
            error={formik.errors.name}
            touched={formik.touched.name}
          />

          <View style={styles.bioContainer}>
            <Text style={styles.bioLabel}>Bio</Text>
            <View
              style={[
                styles.bioInputWrapper,
                formik.touched.bio && !!formik.errors.bio && styles.bioInputError,
              ]}
            >
              <FormInput
                label=""
                placeholder="Tell people a little about yourself…"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formik.values.bio}
                onChangeText={formik.handleChange('bio')}
                onBlur={formik.handleBlur('bio')}
                error={formik.errors.bio}
                touched={formik.touched.bio}
              />
            </View>
            <Text style={styles.charCount}>{formik.values.bio.length} / 160</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>{user?.email ?? ''}</Text>
          </View>
        </View>
      </ScrollView>
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
    backgroundColor: '#fff',
  },
  navBtn: { minWidth: 60 },
  navTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  navCancel: { fontSize: 15, color: '#6B7280' },
  navSave: { fontSize: 15, fontWeight: '700', color: '#6366F1', textAlign: 'right' },
  scroll: { paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#E5E7EB',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 32, fontWeight: '800', color: '#fff' },
  cameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  cameraIcon: { fontSize: 16 },
  changePhotoText: { marginTop: 10, fontSize: 14, color: '#6366F1', fontWeight: '600' },
  form: { paddingHorizontal: 20 },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorBoxText: { color: '#B91C1C', fontSize: 13 },
  bioContainer: { marginBottom: 16 },
  bioLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  bioInputWrapper: { borderRadius: 10 },
  bioInputError: { borderColor: '#EF4444' },
  charCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#374151', width: 80 },
  infoValue: { fontSize: 14, color: '#6B7280', flex: 1 },
});

export default EditProfileScreen;
