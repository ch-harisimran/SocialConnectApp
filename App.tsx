import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { store } from './src/store';
import { AuthProvider } from './src/context/AuthContext';
import { PostsProvider } from './src/context/PostsContext';
import RootNavigator from './src/navigation/RootNavigator';
import { useAppDispatch } from './src/store/hooks';
import { loadSettings } from './src/store/slices/settingsSlice';
import { notificationService } from './src/services/notificationService';
import RealtimeSyncManager from './src/components/RealtimeSyncManager';

const AppInitializer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    notificationService.setup();
    dispatch(loadSettings());
    notificationService.requestPermissions();
  }, [dispatch]);

  return null;
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <Provider store={store}>
        <AppInitializer />
        <RealtimeSyncManager />
        <AuthProvider>
          <PostsProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <RootNavigator />
            </NavigationContainer>
          </PostsProvider>
        </AuthProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
