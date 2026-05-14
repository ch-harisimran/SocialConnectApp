import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

const SIZES = {
  sm: { outer: 56, inner: 44, font: 17, ring: 64 },
  md: { outer: 80, inner: 64, font: 25, ring: 92 },
  lg: { outer: 104, inner: 84, font: 32, ring: 120 },
};

const AppLogo: React.FC<Props> = ({ size = 'md', animate = false }) => {
  const s = SIZES[size];
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animate) return;
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, damping: 10, stiffness: 100, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [animate, scale, opacity]);

  const content = (
    <View style={styles.wrapper}>
      {/* Outer pulse ring */}
      <View
        style={[
          styles.ring,
          {
            width: s.ring,
            height: s.ring,
            borderRadius: s.ring / 2,
          },
        ]}
      />
      {/* Main circle */}
      <View
        style={[
          styles.outer,
          {
            width: s.outer,
            height: s.outer,
            borderRadius: s.outer / 2,
          },
        ]}
      >
        {/* Inner highlight */}
        <View
          style={[
            styles.inner,
            {
              width: s.inner,
              height: s.inner,
              borderRadius: s.inner / 2,
            },
          ]}
        />
        {/* Monogram */}
        <Text style={[styles.monogram, { fontSize: s.font }]}>SC</Text>
        {/* Decorative dot */}
        <View style={[styles.dot, { bottom: s.outer * 0.12, right: s.outer * 0.1 }]} />
      </View>
    </View>
  );

  if (!animate) return content;

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      {content}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  outer: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  inner: {
    position: 'absolute',
    backgroundColor: 'rgba(99,102,241,0.08)',
  },
  monogram: {
    fontWeight: '900',
    color: '#6366F1',
    letterSpacing: -1,
  },
  dot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#6366F1',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default AppLogo;
