import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { AuthProvider } from './src/context/AuthContext';
import { PostsProvider } from './src/context/PostsContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useAppDispatch, useAppSelector } from './src/store/hooks';
import { loadSettings } from './src/store/slices/settingsSlice';
import { notificationService } from './src/services/notificationService';
import RealtimeSyncManager from './src/components/RealtimeSyncManager';
import InAppToast from './src/components/InAppToast';

const AppInitializer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    notificationService.setup();
    dispatch(loadSettings());
    notificationService.requestPermissions();
  }, [dispatch]);

  return null;
};

const AppContent: React.FC = () => {
  const isDark = useAppSelector(state => state.settings.isDarkMode);
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
      <InAppToast />
    </>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Provider store={store}>
          <AppInitializer />
          <RealtimeSyncManager />
          <AuthProvider>
            <PostsProvider>
              <AppContent />
            </PostsProvider>
          </AuthProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
