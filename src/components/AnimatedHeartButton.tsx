import React, { memo } from 'react';
import { Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { rf } from '../utils/responsive';

interface Props {
  liked: boolean;
  count: number;
  onPress: () => void;
  label?: string;
}

const AnimatedHeartButton: React.FC<Props> = ({ liked, count, onPress, label }) => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    if (!liked) {
      scale.value = withSequence(
        withSpring(1.5, { damping: 4, stiffness: 300 }),
        withSpring(1, { damping: 10 })
      );
    }
    onPress();
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable onPress={handlePress} style={styles.btn} hitSlop={6}>
      <Animated.View style={animStyle}>
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
