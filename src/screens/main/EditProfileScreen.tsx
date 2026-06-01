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
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FormInput from '../../components/auth/FormInput';
import { useAuth } from '../../context/AuthContext';
import { imageUploadService } from '../../services/imageUploadService';
import { imagePicker } from '../../utils/imagePicker';
import { ProfileStackParamList } from '../../navigation/ProfileStackNavigator';
import { useTheme } from '../../utils/theme';
import { rf } from '../../utils/responsive';

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
  const insets = useSafeAreaInsets();
  const t = useTheme();

  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [serverError, setServerError] = useState('');

  const showImageOptions = () => {
    imagePicker.showProfilePickerOptions(uri => setAvatar(uri));
  };

  const formik = useFormik({
    initialValues: { name: user?.name ?? '', bio: user?.bio ?? '' },
    validationSchema,
    onSubmit: async values => {
      if (!user) return;
      setServerError('');
      try {
        let avatarUrl = avatar;
        if (avatar && !avatar.startsWith('http')) {
          avatarUrl = await imageUploadService.uploadProfileImage(avatar, user.id);
        }

        await updateProfile({
          name: values.name.trim(),
          bio: values.bio.trim(),
          avatar: avatarUrl,
        });
        navigation.goBack();
      } catch (err: unknown) {
        setServerError(err instanceof Error ? err.message : 'Failed to save. Please try again.');
      }
    },
  });

  const initials = (user?.name ?? 'U').slice(0, 2).toUpperCase();
  const bioCharsLeft = 160 - formik.values.bio.length;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: t.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* ── Navbar with safe area ── */}
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn} hitSlop={8}>
          <Text style={[styles.navCancel, { color: t.subtext }]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: t.text }]}>Edit Profile</Text>
        <TouchableOpacity
          onPress={() => formik.handleSubmit()}
          disabled={formik.isSubmitting}
          style={styles.navBtn}
          hitSlop={8}
        >
          {formik.isSubmitting ? (
            <ActivityIndicator size="small" color={t.accent} />
          ) : (
            <Text style={[styles.navSave, { color: t.accent }]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar section ── */}
        <View style={[styles.avatarSection, { backgroundColor: t.card, borderBottomColor: t.border }]}>
          <TouchableOpacity onPress={showImageOptions} activeOpacity={0.8} style={styles.avatarTouchable}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={[styles.avatarImage, { borderColor: t.border }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: t.accent }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            <View style={[styles.cameraOverlay, { backgroundColor: t.card, borderColor: t.border }]}>
              <Text style={styles.cameraIcon}>📷</Text>
            </View>
          </TouchableOpacity>
          <Text style={[styles.changePhotoText, { color: t.accent }]}>Change Profile Photo</Text>
          <Text style={[styles.changePhotoHint, { color: t.subtext }]}>
            Preview your photo here before saving
          </Text>
        </View>

        {/* ── Form ── */}
        <View style={styles.form}>
          {serverError ? (
            <View style={[styles.errorBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Text style={styles.errorText}>⚠  {serverError}</Text>
            </View>
          ) : null}

          <FormInput
            label="Full Name"
            icon="👤"
            placeholder="Your full name"
            autoCapitalize="words"
            value={formik.values.name}
            onChangeText={formik.handleChange('name')}
            onBlur={formik.handleBlur('name')}
            error={formik.errors.name}
            touched={formik.touched.name}
          />

          {/* Bio — custom multiline field */}
          <View style={styles.bioGroup}>
            <View style={styles.bioLabelRow}>
              <Text style={[styles.bioLabel, { color: t.text }]}>Bio</Text>
              <Text style={[styles.bioCounter, { color: bioCharsLeft < 20 ? '#EF4444' : t.subtext }]}>
                {bioCharsLeft} left
              </Text>
            </View>
            <TextInput
              style={[
                styles.bioInput,
                {
                  backgroundColor: t.inputBg,
                  borderColor: formik.touched.bio && formik.errors.bio ? '#EF4444' : t.border,
                  color: t.text,
                },
              ]}
              placeholder="Tell people a little about yourself…"
              placeholderTextColor={t.placeholder}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={formik.values.bio}
              onChangeText={formik.handleChange('bio')}
              onBlur={formik.handleBlur('bio')}
              maxLength={160}
            />
            {formik.touched.bio && formik.errors.bio ? (
              <Text style={styles.bioError}>{formik.errors.bio}</Text>
            ) : null}
          </View>

          {/* Email (read-only) */}
          <View style={[styles.infoRow, { borderTopColor: t.border }]}>
            <View style={[styles.infoIconBox, { backgroundColor: t.accentLight }]}>
              <Text style={styles.infoIcon}>✉️</Text>
            </View>
            <View style={styles.infoBody}>
              <Text style={[styles.infoLabel, { color: t.subtext }]}>Email</Text>
              <Text style={[styles.infoValue, { color: t.text }]}>{user?.email ?? ''}</Text>
            </View>
            <View style={[styles.lockedBadge, { backgroundColor: t.inputBg }]}>
              <Text style={[styles.lockedText, { color: t.subtext }]}>🔒</Text>
            </View>
          </View>
        </View>

        {/* ── Save button (also at bottom so it's always reachable) ── */}
        <View style={styles.saveRow}>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: t.accent },
              formik.isSubmitting && styles.saveBtnDisabled,
            ]}
            onPress={() => formik.handleSubmit()}
            disabled={formik.isSubmitting}
            activeOpacity={0.85}
          >
            {formik.isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Navbar
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  navBtn: { minWidth: 64 },
  navTitle: { fontSize: rf(1.9), fontWeight: '800' },
  navCancel: { fontSize: rf(1.7) },
  navSave: { fontSize: rf(1.7), fontWeight: '800', textAlign: 'right' },

  scroll: { flexGrow: 1 },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 28,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  avatarTouchable: { position: 'relative' },
  avatarImage: { width: 106, height: 106, borderRadius: 53, borderWidth: 3 },
  avatarPlaceholder: {
    width: 106, height: 106, borderRadius: 53,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 34, fontWeight: '900', color: '#fff' },
  cameraOverlay: {
    position: 'absolute', bottom: 2, right: 2,
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
  },
  cameraIcon: { fontSize: 16 },
  changePhotoText: { marginTop: 12, fontSize: rf(1.7), fontWeight: '700' },
  changePhotoHint: { marginTop: 4, fontSize: rf(1.35), textAlign: 'center', paddingHorizontal: 40 },

  // Form
  form: { paddingHorizontal: 20, paddingTop: 8 },
  errorBox: {
    borderRadius: 12, padding: 12, marginBottom: 18, borderWidth: 1,
  },
  errorText: { color: '#DC2626', fontSize: rf(1.45), fontWeight: '500' },

  // Bio
  bioGroup: { marginBottom: 20 },
  bioLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 },
  bioLabel: { fontSize: rf(1.5), fontWeight: '700' },
  bioCounter: { fontSize: rf(1.3), fontWeight: '600' },
  bioInput: {
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: rf(1.6), minHeight: 110,
  },
  bioError: { color: '#EF4444', fontSize: rf(1.3), marginTop: 5 },

  // Info row
  infoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, borderTopWidth: StyleSheet.hairlineWidth,
  },
  infoIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  infoIcon: { fontSize: 17 },
  infoBody: { flex: 1 },
  infoLabel: { fontSize: rf(1.3), marginBottom: 2 },
  infoValue: { fontSize: rf(1.6), fontWeight: '600' },
  lockedBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  lockedText: { fontSize: 14 },

  // Save button
  saveRow: { paddingHorizontal: 20, paddingTop: 24 },
  saveBtn: {
    borderRadius: 14, height: 54,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: rf(1.8), fontWeight: '800', letterSpacing: 0.2 },
});

export default EditProfileScreen;
