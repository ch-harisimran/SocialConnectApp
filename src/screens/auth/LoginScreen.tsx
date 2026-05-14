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

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const { width } = Dimensions.get('window');

const validationSchema = Yup.object({
  email: Yup.string().trim().email('Enter a valid email.').required('Email is required.'),
  password: Yup.string().min(6, 'Minimum 6 characters.').required('Password is required.'),
});

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();
  const insets = useSafeAreaInsets();
  const [serverError, setServerError] = useState('');

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema,
    onSubmit: async values => {
      setServerError('');
      try {
        await login(values.email.trim(), values.password);
      } catch (err: unknown) {
        setServerError(err instanceof Error ? err.message : 'Login failed. Please try again.');
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
          {/* Decorative blobs */}
          <View style={[styles.blob, styles.blobTR]} />
          <View style={[styles.blob, styles.blobBL]} />

          <AppLogo size="lg" animate />
          <Text style={styles.appName}>Social Connect</Text>
          <Text style={styles.tagline}>Connect · Share · Discover</Text>
        </View>

        {/* ── Form card ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome back</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

          {serverError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>⚠  {serverError}</Text>
            </View>
          ) : null}

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
            placeholder="Enter your password"
            isPassword
            value={formik.values.password}
            onChangeText={formik.handleChange('password')}
            onBlur={formik.handleBlur('password')}
            error={formik.errors.password}
            touched={formik.touched.password}
          />

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, formik.isSubmitting && styles.buttonDisabled]}
            onPress={() => formik.handleSubmit()}
            disabled={formik.isSubmitting}
            activeOpacity={0.85}
          >
            {formik.isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>New here?</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            style={styles.outlineButton}
            onPress={() => navigation.navigate('SignUp')}
            activeOpacity={0.85}
          >
            <Text style={styles.outlineButtonText}>Create an account</Text>
          </TouchableOpacity>
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
    paddingTop: 48,
    paddingBottom: 52,
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blobTR: { width: 160, height: 160, top: -40, right: -40 },
  blobBL: { width: 120, height: 120, bottom: 0, left: -30 },
  appName: {
    fontSize: 30,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.8,
    marginTop: 18,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 2,
    marginTop: 6,
    textTransform: 'uppercase',
  },

  // ── Card ──
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 12,
    minWidth: width,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  cardSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 24 },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorBoxText: { color: '#DC2626', fontSize: 13, fontWeight: '500' },
  forgotLink: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -8 },
  forgotText: { fontSize: 13, color: '#6366F1', fontWeight: '700' },
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
  },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  outlineButton: {
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#6366F1',
  },
  outlineButtonText: { color: '#6366F1', fontSize: 16, fontWeight: '700' },
});

export default LoginScreen;
