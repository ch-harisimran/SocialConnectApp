import React, { memo, useRef } from 'react';
import { Text, StyleSheet, Pressable, Animated } from 'react-native';
import { rf } from '../utils/responsive';

interface Props {
  liked: boolean;
  count: number;
  onPress: () => void;
  label?: string;
}

const AnimatedHeartButton: React.FC<Props> = ({ liked, count, onPress, label }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    if (!liked) {
      Animated.sequence([
        Animated.spring(scale, {
          toValue: 1.5,
          damping: 4,
          stiffness: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          damping: 10,
          useNativeDriver: true,
        }),
      ]).start();
    }
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={styles.btn} hitSlop={6}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Text style={[styles.text, liked && styles.likedText]}>
          {liked ? '♥' : '♡'} {count}
          {label ? ` ${label}` : ''}
        </Text>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center' },
  text: { fontSize: rf(1.5), color: '#6B7280', fontWeight: '500' },
  likedText: { color: '#EF4444', fontWeight: '700' },
});

export default memo(AnimatedHeartButton);
