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
import { mockAuth } from '../../services/mockAuth';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const validationSchema = Yup.object({
  email: Yup.string()
    .trim()
    .email('Please enter a valid email address.')
    .required('Email is required.'),
});

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const formik = useFormik({
    initialValues: { email: '' },
    validationSchema,
    onSubmit: async values => {
      setServerError('');
      setSuccessMessage('');
      try {
        await mockAuth.forgotPassword(values.email.trim());
        setSuccessMessage(
          `A password reset link has been sent to ${values.email.trim()}. Check your inbox.`
        );
        formik.resetForm();
      } catch (err: unknown) {
        setServerError(
          err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        );
      }
    },
  });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to Sign In</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Reset password</Text>
          <Text style={styles.subtitle}>
            {"Enter the email associated with your account and we'll send a reset link."}
          </Text>
        </View>

        <View style={styles.form}>
          {serverError ? (
            <View style={styles.serverErrorBox}>
              <Text style={styles.serverErrorText}>{serverError}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{successMessage}</Text>
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

          <TouchableOpacity
            style={[styles.button, formik.isSubmitting && styles.buttonDisabled]}
            onPress={() => formik.handleSubmit()}
            disabled={formik.isSubmitting}
            activeOpacity={0.8}
          >
            {formik.isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 60 },
  backButton: { marginBottom: 32 },
  backText: { fontSize: 14, color: '#6366F1', fontWeight: '600' },
  header: { marginBottom: 32 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827', marginBottom: 10 },
  subtitle: { fontSize: 14, color: '#6B7280', lineHeight: 22 },
  form: { width: '100%' },
  serverErrorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  serverErrorText: { color: '#B91C1C', fontSize: 13 },
  successBox: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  successText: { color: '#065F46', fontSize: 13, lineHeight: 20 },
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
});

export default ForgotPasswordScreen;
