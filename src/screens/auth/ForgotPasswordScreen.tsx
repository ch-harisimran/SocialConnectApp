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
import { mockAuth } from '../../services/mockAuth';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const { width } = Dimensions.get('window');

const emailSchema = Yup.object({
  email: Yup.string().trim().email('Enter a valid email.').required('Email is required.'),
});

const passwordSchema = Yup.object({
  newPassword: Yup.string()
    .min(6, 'Password must be at least 6 characters.')
    .required('New password is required.'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords do not match.')
    .required('Please confirm your password.'),
});

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'email' | 'reset' | 'done'>('email');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [serverError, setServerError] = useState('');

  const emailForm = useFormik({
    initialValues: { email: '' },
    validationSchema: emailSchema,
    onSubmit: async values => {
      setServerError('');
      try {
        await mockAuth.verifyEmailForReset(values.email.trim().toLowerCase());
        setVerifiedEmail(values.email.trim().toLowerCase());
        setStep('reset');
      } catch (err: unknown) {
        setServerError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    },
  });

  const passwordForm = useFormik({
    initialValues: { newPassword: '', confirmPassword: '' },
    validationSchema: passwordSchema,
    onSubmit: async values => {
      setServerError('');
      try {
        await mockAuth.resetPassword(verifiedEmail, values.newPassword);
        setStep('done');
      } catch (err: unknown) {
        setServerError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    },
  });

  const stepConfig = {
    email: { icon: '🔍', title: 'Find your account', subtitle: "Enter your email and we'll verify it" },
    reset: { icon: '🔐', title: 'Set new password', subtitle: verifiedEmail },
    done: { icon: '✅', title: 'All done!', subtitle: 'Your password has been updated' },
  };

  const cfg = stepConfig[step];

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
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <View style={[styles.blob, styles.blobTR]} />
          <View style={[styles.blob, styles.blobBL]} />

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            hitSlop={8}
          >
            <Text style={styles.backText}>← Back to Sign In</Text>
          </TouchableOpacity>

          <AppLogo size="md" animate />
          <Text style={styles.heroStep}>{cfg.icon}  {cfg.title}</Text>
          <Text style={styles.heroSub}>{cfg.subtitle}</Text>

          {/* Step indicators */}
          <View style={styles.stepDots}>
            {(['email', 'reset', 'done'] as const).map(s => (
              <View
                key={s}
                style={[
                  styles.dot,
                  step === s && styles.dotActive,
                  (step === 'reset' && s === 'email') || (step === 'done') ? styles.dotDone : null,
                ]}
              />
            ))}
          </View>
        </View>

        {/* ── Card ── */}
        <View style={styles.card}>
          {serverError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorBoxText}>⚠  {serverError}</Text>
            </View>
          ) : null}

          {/* Step 1 */}
          {step === 'email' && (
            <>
              <Text style={styles.cardTitle}>Forgot password?</Text>
              <Text style={styles.cardSubtitle}>
                Enter the email you signed up with to continue.
              </Text>
              <FormInput
                label="Email Address"
                icon="✉️"
                placeholder="you@example.com"
                keyboardType="email-address"
                value={emailForm.values.email}
                onChangeText={emailForm.handleChange('email')}
                onBlur={emailForm.handleBlur('email')}
                error={emailForm.errors.email}
                touched={emailForm.touched.email}
              />
              <TouchableOpacity
                style={[styles.button, emailForm.isSubmitting && styles.buttonDisabled]}
                onPress={() => emailForm.handleSubmit()}
                disabled={emailForm.isSubmitting}
                activeOpacity={0.85}
              >
                {emailForm.isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue →</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Step 2 */}
          {step === 'reset' && (
            <>
              <Text style={styles.cardTitle}>New password</Text>
              <Text style={styles.cardSubtitle}>
                Resetting for{' '}
                <Text style={styles.emailHighlight}>{verifiedEmail}</Text>
              </Text>
              <FormInput
                label="New Password"
                icon="🔑"
                placeholder="At least 6 characters"
                isPassword
                value={passwordForm.values.newPassword}
                onChangeText={passwordForm.handleChange('newPassword')}
                onBlur={passwordForm.handleBlur('newPassword')}
                error={passwordForm.errors.newPassword}
                touched={passwordForm.touched.newPassword}
              />
              <FormInput
                label="Confirm Password"
                icon="🔒"
                placeholder="Repeat your new password"
                isPassword
                value={passwordForm.values.confirmPassword}
                onChangeText={passwordForm.handleChange('confirmPassword')}
                onBlur={passwordForm.handleBlur('confirmPassword')}
                error={passwordForm.errors.confirmPassword}
                touched={passwordForm.touched.confirmPassword}
              />
              <TouchableOpacity
                style={[styles.button, passwordForm.isSubmitting && styles.buttonDisabled]}
                onPress={() => passwordForm.handleSubmit()}
                disabled={passwordForm.isSubmitting}
                activeOpacity={0.85}
              >
                {passwordForm.isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          {/* Step 3 */}
          {step === 'done' && (
            <View style={styles.doneContainer}>
              <Text style={styles.doneEmoji}>🎉</Text>
              <Text style={styles.doneTitle}>Password updated!</Text>
              <Text style={styles.doneSubtitle}>
                You can now sign in with your new password.
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={() => navigation.goBack()}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Go to Sign In</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={{ height: insets.bottom + 16 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#6366F1' },
  scroll: { flexGrow: 1 },

  hero: {
    backgroundColor: '#6366F1',
    alignItems: 'center',
    paddingTop: 16,
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
  heroStep: { fontSize: 20, fontWeight: '800', color: '#fff', marginTop: 16, letterSpacing: -0.3 },
  heroSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  stepDots: { flexDirection: 'row', gap: 8, marginTop: 20 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: { backgroundColor: '#fff', width: 22, borderRadius: 4 },
  dotDone: { backgroundColor: 'rgba(255,255,255,0.7)' },

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
  cardTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4, letterSpacing: -0.4 },
  cardSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 24, lineHeight: 20 },
  emailHighlight: { color: '#6366F1', fontWeight: '700' },
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
  doneContainer: { alignItems: 'center', paddingTop: 16 },
  doneEmoji: { fontSize: 64, marginBottom: 20 },
  doneTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 10 },
  doneSubtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
});

export default ForgotPasswordScreen;
