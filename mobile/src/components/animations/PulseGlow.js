// Sense Health — Pulse Glow Animation
// Animated pulsing ring for health score, breathing circle, etc.
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

export default function PulseGlow({
  size = 100,
  color = '#52A8A2',
  pulseScale = 1.3,
  duration = 2000,
  ringCount = 2,
  style,
  children,
}) {
  const rings = Array.from({ length: ringCount }, (_, i) => i);

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {rings.map((_, i) => (
        <PulseRing
          key={i}
          size={size}
          color={color}
          pulseScale={pulseScale + (i * 0.15)}
          duration={duration}
          delay={i * (duration / ringCount)}
        />
      ))}
      {children}
    </View>
  );
}

function PulseRing({ size, color, pulseScale, duration, delay }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(pulseScale, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1, // infinite
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.05, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: color,
        },
        animStyle,
      ]}
    />
  );
}
