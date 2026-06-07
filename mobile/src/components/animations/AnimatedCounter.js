// Sense Health — Animated Counter
// Smooth counting-up number animation
import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

// Simple JS-driven counter (more compatible)
export default function AnimatedCounter({
  value = 0,
  duration = 1200,
  decimals = 0,
  style,
  prefix = '',
  suffix = '',
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const animValue = useSharedValue(0);

  useEffect(() => {
    const startVal = animValue.value;
    const endVal = typeof value === 'number' ? value : parseFloat(value) || 0;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * eased;

      setDisplayValue(current);
      animValue.value = current;

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    animate();
  }, [value]);

  const formatted = `${prefix}${displayValue.toFixed(decimals)}${suffix}`;

  return (
    <Text style={style}>{formatted}</Text>
  );
}
