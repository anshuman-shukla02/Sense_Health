// Sense Health — Premium Category Risk Card with Gradient + Progress Ring
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';

// Custom animations and SVG
import AnimatedEntry from './animations/AnimatedEntry';
import Svg, { Path } from 'react-native-svg';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const categoryConfig = {
  sleep: {
    icon: 'moon',
    label: 'Sleep',
    gradient: ['#4A90E2', '#357ABD'],
    iconBg: 'rgba(74, 144, 226, 0.15)',
  },
  mental: {
    icon: 'heart',
    label: 'Mental Health',
    gradient: ['#9013FE', '#BD10E0'],
    iconBg: 'rgba(144, 19, 254, 0.12)',
  },
  activity: {
    icon: 'footsteps',
    label: 'Activity',
    gradient: ['#40C057', '#82C91E'],
    iconBg: 'rgba(64, 192, 87, 0.12)',
  },
  nutrition: {
    icon: 'nutrition',
    label: 'Nutrition',
    gradient: ['#E07A5F', '#F0A894'],
    iconBg: 'rgba(224, 122, 95, 0.12)',
  },
  screenTime: {
    icon: 'phone-portrait',
    label: 'Screen Time',
    gradient: ['#FF7E5F', '#FEB47B'],
    iconBg: 'rgba(255, 126, 95, 0.12)',
  },
  vitals: {
    icon: 'pulse',
    label: 'Recovery',
    gradient: ['#D96C6C', '#F09090'],
    iconBg: 'rgba(217, 108, 108, 0.12)',
  },
  focus: {
    icon: 'eye',
    label: 'Focus',
    gradient: ['#00C9FF', '#92FE9D'],
    iconBg: 'rgba(0, 201, 255, 0.12)',
  },
};

function CategoryBackgroundSvg({ categoryName }) {
  let path = "";
  let viewBox = "0 0 24 24";
  
  if (categoryName === 'sleep') {
    path = "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z";
  } else if (categoryName === 'mental') {
    path = "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
  } else if (categoryName === 'activity') {
    path = "M13.5 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM9.8 8.9L7 17.6c-.2.7.2 1.4.9 1.6.7.2 1.4-.2 1.6-.9l2.1-6.6 2.4 2.2V20c0 .8.7 1.5 1.5 1.5s1.5-.7 1.5-1.5v-7.2c0-.4-.2-.8-.5-1.1L14 9.3l.6-3C16 7.6 18 9 20 9c.8 0 1.5-.7 1.5-1.5S20.8 6 20 6c-1.6 0-3.3-1.1-4-2.7l-1.2-2.4C14.5.3 13.9 0 13.3 0c-.5 0-1 .2-1.3.6L7.2 6c-.5.5-.6 1.3-.2 1.9l2.8 1z";
  } else if (categoryName === 'nutrition') {
    path = "M12 2a5 5 0 0 0-5 5c0 3.78 4 10 5 11.5 1-1.5 5-7.72 5-11.5a5 5 0 0 0-5-5zm0 7.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z";
  } else if (categoryName === 'screenTime') {
    path = "M17 1H7c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-2-2-2zm-5 21c-.83 0-1.5-.67-1.5-1.5S11.17 19 12 19s1.5.67 1.5 1.5S12.83 22 12 22zm5-5H7V4h10v13z";
  } else if (categoryName === 'vitals') {
    path = "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-2.5l-2 4.5-3-6.5L7.5 13H5v-2h3.5l1.5-3.5 3 6.5 2-4.5H19v2h-2z";
  } else if (categoryName === 'focus') {
    path = "M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z";
  } else {
    return null;
  }

  return (
    <View style={styles.bgIconContainer}>
      <Svg width={110} height={110} viewBox={viewBox}>
        <Path d={path} fill={Colors.text} />
      </Svg>
    </View>
  );
}

export default function CategoryCard({ category, delay = 0 }) {
  const progress = useSharedValue(0);
  const pressScale = useSharedValue(1);

  const config = categoryConfig[category.name] || {
    icon: 'help',
    label: category.label || category.name,
    gradient: [Colors.textSecondary, Colors.textTertiary],
    iconBg: 'rgba(127, 140, 141, 0.12)',
  };

  useEffect(() => {
    progress.value = withDelay(
      delay + 200,
      withSpring(Math.min(category.score, 100), { damping: 15, stiffness: 90 })
    );
  }, [category.score]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const scaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.96, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1);
  };

  const getScoreColor = (score) => {
    if (score >= 80) return Colors.riskLow;
    if (score >= 60) return Colors.primary;
    if (score >= 40) return Colors.riskModerate;
    return Colors.riskCritical;
  };

  return (
    <AnimatedEntry preset="fadeUp" delay={delay} layout={true}>
      <TouchableWithoutFeedback
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <ReAnimated.View style={[styles.card, scaleStyle]}>
          <CategoryBackgroundSvg categoryName={category.name} />

          <View style={styles.cardContent}>
            {/* Left gradient icon */}
            <LinearGradient
              colors={config.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconGradient}
            >
              <Ionicons name={config.icon} size={20} color="#FFFFFF" />
            </LinearGradient>

            {/* Info */}
            <View style={styles.cardInfo}>
              <Text style={styles.cardLabel}>{config.label}</Text>
              <Text style={styles.cardMessage} numberOfLines={1}>
                {category.message}
              </Text>
            </View>

            {/* Score */}
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreText, { color: getScoreColor(category.score) }]}>
                {category.score}
              </Text>
            </View>
          </View>

          {/* Animated progress bar */}
          <View style={styles.progressBarBg}>
            <ReAnimated.View style={[styles.progressBarFill, progressStyle]}>
              <LinearGradient
                colors={config.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.create({ fill: { ...StyleSheet.absoluteFillObject } }).fill}
              />
            </ReAnimated.View>
          </View>
        </ReAnimated.View>
      </TouchableWithoutFeedback>
    </AnimatedEntry>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    position: 'relative',
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    zIndex: 2,
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    marginLeft: Spacing.md,
    marginRight: Spacing.md,
  },
  cardLabel: {
    ...Typography.h3,
    color: Colors.text,
    fontSize: 16,
  },
  cardMessage: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  scoreText: {
    ...Typography.numberSmall,
    fontSize: 24,
  },
  progressBarBg: {
    width: '100%',
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
    zIndex: 2,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bgIconContainer: {
    position: 'absolute',
    right: -25,
    bottom: -25,
    opacity: 0.045,
    zIndex: 1,
  },
});
