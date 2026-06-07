// Sense Health — Animated Health Score Ring with Center Text + Shimmer
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop, Line } from 'react-native-svg';
import Colors from '../theme/colors';
import { Typography } from '../theme/typography';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function HealthRing({
  score = 0,
  size = 160,
  strokeWidth = 12,
  color = Colors.primary,
  showLabel = true,
  labelText = 'Health',
  gradient = false,
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Reanimated slow spin for outer dashed circle
  const rotation = useSharedValue(0);

  useEffect(() => {
    Animated.spring(animatedValue, {
      toValue: score,
      tension: 30,
      friction: 10,
      useNativeDriver: false,
    }).start();

    // Shimmer pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Slow rotation
    rotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
  }, [score]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 1],
  });

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    position: 'absolute',
  }));

  // Generate radial tick marks
  const tickCount = 24;
  const ticks = Array.from({ length: tickCount }, (_, i) => (i * 360) / tickCount);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* 1. Slow Rotating Dashed Outer Circle */}
      <ReAnimated.View style={[{ width: size, height: size }, spinStyle]}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius + 8}
            stroke="rgba(82, 168, 162, 0.25)"
            strokeWidth="1.2"
            strokeDasharray="5 7"
            fill="none"
          />
        </Svg>
      </ReAnimated.View>

      {/* 2. Main Svg Canvas with Radial Glow, Ticks and Main Progress Ring */}
      <Svg width={size} height={size}>
        <Defs>
          {gradient && (
            <SvgGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={Colors.primary} />
              <Stop offset="100%" stopColor={Colors.accent} />
            </SvgGradient>
          )}
          <SvgGradient id="glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor={Colors.primary} stopOpacity="0.2" />
            <Stop offset="60%" stopColor={Colors.accent} stopOpacity="0.08" />
            <Stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </SvgGradient>
        </Defs>

        {/* Glow center circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius + 6}
          fill="url(#glowGrad)"
        />

        {/* Background ring */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Radial Tick Marks */}
        {ticks.map((angle, i) => {
          const r1 = radius - strokeWidth / 2 - 6;
          const r2 = radius - strokeWidth / 2 - 2;
          const rad = (angle * Math.PI) / 180;
          const x1 = size / 2 + r1 * Math.cos(rad);
          const y1 = size / 2 + r1 * Math.sin(rad);
          const x2 = size / 2 + r2 * Math.cos(rad);
          const y2 = size / 2 + r2 * Math.sin(rad);
          return (
            <Line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth="1.2"
            />
          );
        })}

        {/* Animated progress ring */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={gradient ? 'url(#ringGrad)' : color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90, ${size / 2}, ${size / 2})`}
        />
      </Svg>
      {showLabel && (
        <Animated.View style={[styles.labelContainer, { opacity: shimmerOpacity }]}>
          <AnimatedScore value={animatedValue} style={styles.scoreText} size={size} />
          <Text style={[styles.scoreLabel, { fontSize: size < 100 ? 8 : 11 }]}>{labelText}</Text>
        </Animated.View>
      )}
    </View>
  );
}

// Animated number display
function AnimatedScore({ value, style, size }) {
  const [display, setDisplay] = React.useState('0');

  useEffect(() => {
    const id = value.addListener(({ value: v }) => {
      setDisplay(Math.round(v).toString());
    });
    return () => value.removeListener(id);
  }, [value]);

  return (
    <Text style={[style, { fontSize: size < 100 ? size * 0.22 : size * 0.2 }]}>
      {display}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  scoreText: {
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  scoreLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: -2,
  },
});
