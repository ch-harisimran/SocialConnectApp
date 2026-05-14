import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FormInput from '../../components/auth/FormInput';
import AppLogo from '../../components/AppLogo';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

const { width } = Dimensions.get('window');

const validationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(50, 'Name too long.')
    .required('Full name is required.'),
  email: Yup.string().trim().email('Enter a valid email.').required('Email is required.'),
  password: Yup.string()
    .min(8, 'At least 8 characters.')
    .matches(/[A-Z]/, 'Include at least one uppercase letter.')
    .matches(/[0-9]/, 'Include at least one number.')
    .required('Password is required.'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match.')
    .required('Please confirm your password.'),
});

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { signUp } = useAuth();
  const insets = useSafeAreaInsets();
  const [serverError, setServerError] = useState('');

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '', confirmPassword: '' },
    validationSchema,
    onSubmit: async values => {
      setServerError('');
      try {
        await signUp(values.name.trim(), values.email.trim(), values.password);
      } catch (err: unknown) {
        setServerError(err instanceof Error ? err.message : 'Sign up failed. Please try again.');
      }
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── Hero section ── */}
        <View style={styles.hero}>
          <View style={[styles.blob, styles.blobTR]} />
          <View style={[styles.blob, styles.blobBL]} />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <Text style={styles.backText}>← Sign In</Text>
          </TouchableOpacity>

          <AppLogo size="md" animate />
          <Text style={styles.appName}>Join Social Connect</Text>
          <Text style={styles.tagline}>Create your free account today</Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>
          {serverError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>⚠  {serverError}</Text>
            </View>
          ) : null}

          <FormInput
            label="Full Name"
            icon="👤"
            placeholder="John Doe"
            autoCapitalize="words"
            value={formik.values.name}
            onChangeText={formik.handleChange('name')}
            onBlur={formik.handleBlur('name')}
            error={formik.errors.name}
            touched={formik.touched.name}
          />

          <FormInput
            label="Email"
            icon="✉️"
            placeholder="you@example.com"
            keyboardType="email-address"
            value={formik.values.email}
            onChangeText={formik.handleChange('email')}
            onBlur={formik.handleBlur('email')}
            error={formik.errors.email}
            touched={formik.touched.email}
          />

          <FormInput
            label="Password"
            icon="🔑"
            placeholder="Min 8 chars, 1 uppercase, 1 number"
            isPassword
            value={formik.values.password}
            onChangeText={formik.handleChange('password')}
            onBlur={formik.handleBlur('password')}
            error={formik.errors.password}
            touched={formik.touched.password}
          />

          <FormInput
            label="Confirm Password"
            icon="🔒"
            placeholder="Re-enter your password"
            isPassword
            value={formik.values.confirmPassword}
            onChangeText={formik.handleChange('confirmPassword')}
            onBlur={formik.handleBlur('confirmPassword')}
            error={formik.errors.confirmPassword}
            touched={formik.touched.confirmPassword}
          />

          {/* Password hint */}
          <View style={styles.hintRow}>
            <Text style={styles.hintText}>
              {'✓ 8+ chars   ✓ Uppercase   ✓ Number'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, formik.isSubmitting && styles.buttonDisabled]}
            onPress={() => formik.handleSubmit()}
            disabled={formik.isSubmitting}
            activeOpacity={0.85}
          >
            {formik.isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?  </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#6366F1' },
  scroll: { flexGrow: 1 },

  // ── Hero ──
  hero: {
    backgroundColor: '#6366F1',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 40,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blobTR: { width: 140, height: 140, top: -30, right: -30 },
  blobBL: { width: 100, height: 100, bottom: 0, left: -20 },
  backBtn: { alignSelf: 'flex-start', marginLeft: 20, marginBottom: 16 },
  backText: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  appName: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    marginTop: 14,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 5,
  },

  // ── Card ──
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 28,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
    minWidth: width,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBoxText: { color: '#DC2626', fontSize: 13, fontWeight: '500' },
  hintRow: { marginTop: -8, marginBottom: 18 },
  hintText: { fontSize: 12, color: '#94A3B8', letterSpacing: 0.3 },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { fontSize: 14, color: '#64748B' },
  footerLink: { fontSize: 14, color: '#6366F1', fontWeight: '700' },
});

export default SignUpScreen;
