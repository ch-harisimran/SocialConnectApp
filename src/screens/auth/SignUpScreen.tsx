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
} from 'react-native';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FormInput from '../../components/auth/FormInput';
import { useAuth } from '../../context/AuthContext';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'SignUp'>;

const validationSchema = Yup.object({
  name: Yup.string()
    .trim()
    .min(2, 'Name must be at least 2 characters.')
    .max(50, 'Name must be under 50 characters.')
    .required('Full name is required.'),
  email: Yup.string()
    .trim()
    .email('Please enter a valid email address.')
    .required('Email is required.'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters.')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .matches(/[0-9]/, 'Password must contain at least one number.')
    .required('Password is required.'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match.')
    .required('Please confirm your password.'),
});

const SignUpScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { signUp } = useAuth();
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join Social Connect today</Text>
        </View>

        <View style={styles.form}>
          {serverError ? (
            <View style={styles.serverErrorBox}>
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

          <FormInput
            label="Full Name"
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
            placeholder="Re-enter your password"
            isPassword
            value={formik.values.confirmPassword}
            onChangeText={formik.handleChange('confirmPassword')}
            onBlur={formik.handleBlur('confirmPassword')}
            error={formik.errors.confirmPassword}
            touched={formik.touched.confirmPassword}
          />

          <TouchableOpacity
            style={[styles.button, formik.isSubmitting && styles.buttonDisabled]}
            onPress={() => formik.handleSubmit()}
            disabled={formik.isSubmitting}
            activeOpacity={0.8}
          >
            {formik.isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { marginBottom: 32, alignItems: 'center' },
  title: { fontSize: 30, fontWeight: '700', color: '#111827', marginBottom: 6 },
  subtitle: { fontSize: 15, color: '#6B7280' },
  form: { width: '100%' },
  serverErrorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  serverErrorText: { color: '#B91C1C', fontSize: 13, textAlign: 'center' },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: '#6B7280' },
  footerLink: { fontSize: 14, color: '#6366F1', fontWeight: '700' },
});

export default SignUpScreen;
