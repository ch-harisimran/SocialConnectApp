import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity, StyleSheet, TextInputProps } from 'react-native';

interface FormInputProps extends TextInputProps {
  label: string;
  error?: string;
  touched?: boolean;
  isPassword?: boolean;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  error,
  touched,
  isPassword = false,
  ...inputProps
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const hasError = touched && !!error;

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrapper, hasError && styles.inputError]}>
        <TextInput
          style={styles.input}
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          {...inputProps}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(prev => !prev)} style={styles.eyeButton}>
            <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {hasError && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 15,
    color: '#111827',
  },
  eyeButton: {
    paddingLeft: 10,
    paddingVertical: 4,
  },
  eyeText: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '600',
  },
  errorText: {
    marginTop: 5,
    fontSize: 12,
    color: '#EF4444',
  },
});

export default FormInput;
