import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearToast } from '../store/slices/uiSlice';

const InAppToast: React.FC = () => {
  const dispatch = useAppDispatch();
  const toast = useAppSelector(state => state.ui.toast);
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) return;

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, damping: 14, stiffness: 120, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, { toValue: -100, duration: 280, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 280, useNativeDriver: true }),
      ]).start(() => dispatch(clearToast()));
    }, 2800);

    return () => clearTimeout(timer);
  }, [toast?.id]);

  if (!toast) return null;

  const bgColor = toast.type === 'like' ? '#EF4444' : toast.type === 'comment' ? '#6366F1' : '#0F172A';

  return (
    <Animated.View
      style={[
        styles.container,
        { top: insets.top + 8, opacity, transform: [{ translateY }] },
        { backgroundColor: bgColor },
      ]}
      pointerEvents="none"
    >
      {toast.icon ? <Text style={styles.icon}>{toast.icon}</Text> : null}
      <Text style={styles.message} numberOfLines={2}>
        {toast.message}
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 10,
  },
  icon: { fontSize: 20 },
  message: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 14, lineHeight: 20 },
});

export default InAppToast;
