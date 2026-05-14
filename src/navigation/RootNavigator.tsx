import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useAuth } from '../context/AuthContext';
import AuthNavigator from './AuthNavigator';
import MainNavigator from './MainNavigator';
import AppLogo from '../components/AppLogo';

const SplashScreen: React.FC = () => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, damping: 14, stiffness: 80, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <View style={styles.splash}>
      <View style={[styles.splashBlob, styles.blobTR]} />
      <View style={[styles.splashBlob, styles.blobBL]} />
      <Animated.View style={[styles.splashContent, { opacity, transform: [{ translateY }] }]}>
        <AppLogo size="lg" />
        <Text style={styles.splashName}>Social Connect</Text>
        <Text style={styles.splashTagline}>Connect · Share · Discover</Text>
      </Animated.View>
      <Animated.View style={[styles.splashFooter, { opacity }]}>
        <Text style={styles.splashLoading}>Loading…</Text>
      </Animated.View>
    </View>
  );
};

const RootNavigator: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <SplashScreen />;
  return user ? <MainNavigator /> : <AuthNavigator />;
};

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  splashBlob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  blobTR: { width: 220, height: 220, top: -60, right: -60 },
  blobBL: { width: 180, height: 180, bottom: -40, left: -50 },
  splashContent: { alignItems: 'center' },
  splashName: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -1,
    marginTop: 20,
  },
  splashTagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 2.5,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  splashFooter: { position: 'absolute', bottom: 52 },
  splashLoading: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.5,
  },
});

export default RootNavigator;
