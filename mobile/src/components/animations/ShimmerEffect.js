// Sense Health — Shimmer Loading Effect
// Premium skeleton/shimmer loading animation
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function ShimmerEffect({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
  baseColor = 'rgba(255,255,255,0.05)',
  highlightColor = 'rgba(255,255,255,0.12)',
}) {
  const shimmerX = useSharedValue(0);

  useEffect(() => {
    shimmerX.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false,
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmerX.value,
          [0, 1],
          [-200, 300],
        ),
      },
    ],
  }));

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: baseColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: 0,
            bottom: 0,
            width: 200,
          },
          animStyle,
        ]}
      >
        <LinearGradient
          colors={['transparent', highlightColor, 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// Skeleton card preset
export function SkeletonCard({ lines = 3, style }) {
  return (
    <View style={[{ padding: 16, gap: 12 }, style]}>
      <ShimmerEffect width="40%" height={14} borderRadius={7} />
      {Array.from({ length: lines }, (_, i) => (
        <ShimmerEffect
          key={i}
          width={i === lines - 1 ? '60%' : '100%'}
          height={10}
          borderRadius={5}
        />
      ))}
    </View>
  );
}
