import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (user) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Welcome, {user.name}!</Text>
        <Text style={styles.placeholderSub}>Home feed coming soon.</Text>
      </View>
    );
  }

  return <AuthNavigator />;
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style="auto" />
          <AppContent />
        </NavigationContainer>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  placeholderText: { fontSize: 22, fontWeight: '700', color: '#111827' },
  placeholderSub: { fontSize: 14, color: '#6B7280', marginTop: 8 },
});
