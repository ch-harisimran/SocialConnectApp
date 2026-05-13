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
import { rf, rw, rh } from '../../utils/responsive';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const validationSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email('Please enter a valid email address.')
    .required('Email is required.'),
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters.')
    .required('Password is required.'),
});

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { login } = useAuth();
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
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        <View style={styles.form}>
          {serverError ? (
            <View style={styles.serverErrorBox}>
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

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
            activeOpacity={0.8}
          >
            {formik.isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{"Don't have an account? "}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: rw(6.4),
    paddingVertical: rh(4),
  },
  header: { marginBottom: rh(4), alignItems: 'center' },
  title: { fontSize: rf(3.3), fontWeight: '700', color: '#111827', marginBottom: rh(0.7) },
  subtitle: { fontSize: rf(1.7), color: '#6B7280' },
  form: { width: '100%' },
  serverErrorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: rw(3.2),
    marginBottom: rh(2),
  },
  serverErrorText: { color: '#B91C1C', fontSize: rf(1.5), textAlign: 'center' },
  forgotLink: { alignSelf: 'flex-end', marginBottom: rh(2.5), marginTop: -rh(1) },
  forgotText: { fontSize: rf(1.5), color: '#6366F1', fontWeight: '600' },
  button: {
    backgroundColor: '#6366F1',
    borderRadius: 10,
    height: rh(6.4),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: rh(0.5),
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: rf(1.8), fontWeight: '700' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: rh(3) },
  footerText: { fontSize: rf(1.6), color: '#6B7280' },
  footerLink: { fontSize: rf(1.6), color: '#6366F1', fontWeight: '700' },
});

export default LoginScreen;
