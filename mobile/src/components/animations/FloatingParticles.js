// Sense Health — Floating Particles
// Ambient floating dots/sparkles for header backgrounds
import React, { useEffect, useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function Particle({ x, y, size, color, delay, driftX, driftY, duration }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(driftY, { duration, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      )
    );
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(driftX, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: duration * 0.8, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.15, { duration: duration * 1.2, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      )
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animStyle,
      ]}
    />
  );
}

export default function FloatingParticles({
  count = 12,
  containerWidth = SCREEN_WIDTH,
  containerHeight = 300,
  colors = ['#52A8A2', '#85C7C3', '#4ECDC4', '#8CB369', '#9013FE', '#BD10E0'],
  minSize = 2,
  maxSize = 5,
  style,
}) {
  const particles = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * containerWidth,
      y: Math.random() * containerHeight,
      size: minSize + Math.random() * (maxSize - minSize),
      color: colors[i % colors.length],
      delay: i * 200,
      driftX: (Math.random() - 0.5) * 30,
      driftY: -(10 + Math.random() * 20),
      duration: 3000 + Math.random() * 3000,
    }));
  }, [count, containerWidth, containerHeight]);

  return (
    <View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: containerWidth,
          height: containerHeight,
          overflow: 'hidden',
        },
        style,
      ]}
      pointerEvents="none"
    >
      {particles.map((p) => (
        <Particle key={p.id} {...p} />
      ))}
    </View>
  );
}
