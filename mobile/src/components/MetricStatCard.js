// Sense Health — Metric Stat Card Component
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';

// Custom animations and SVG
import AnimatedEntry from './animations/AnimatedEntry';
import AnimatedCounter from './animations/AnimatedCounter';
import Svg, { Path } from 'react-native-svg';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

function MiniSparkline({ color }) {
  return (
    <View style={styles.sparklineContainer}>
      <Svg width={70} height={35} viewBox="0 0 70 35">
        <Path
          d="M0,25 C15,30 25,5 40,15 C55,25 60,8 70,5"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

function BouncingTrendIcon({ trend, trendColor, trendIcon }) {
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (trend === 'up') {
      translateY.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 600 }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        true
      );
    } else if (trend === 'down') {
      translateY.value = withRepeat(
        withSequence(
          withTiming(2, { duration: 600 }),
          withTiming(0, { duration: 600 })
        ),
        -1,
        true
      );
    }
  }, [trend]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  return (
    <ReAnimated.View style={animStyle}>
      <Ionicons name={trendIcon} size={12} color={trendColor} />
    </ReAnimated.View>
  );
}

export default function MetricStatCard({
  icon,
  label,
  value,
  unit = '',
  trend,       // 'up' | 'down' | 'stable'
  trendValue,  // e.g. '+12%'
  color = Colors.primary,
  subtitle,
  delay = 0,
  compact = false,
}) {
  const trendIcon = trend === 'up' ? 'trending-up' : trend === 'down' ? 'trending-down' : 'remove-outline';
  const trendColor = trend === 'up' ? Colors.accent : trend === 'down' ? Colors.warm : Colors.textTertiary;
  
  const isNumeric = typeof value === 'number' || (!isNaN(value) && !isNaN(parseFloat(value)));

  if (compact) {
    return (
      <AnimatedEntry
        preset="fadeUp"
        delay={delay}
        style={styles.compactCard}
      >
        <View style={[styles.compactIconWrap, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={16} color={color} />
        </View>
        <Text style={styles.compactLabel} numberOfLines={1}>{label}</Text>
        <View style={styles.compactValueRow}>
          {isNumeric ? (
            <AnimatedCounter value={parseFloat(value)} style={[styles.compactValue, { color }]} />
          ) : (
            <Text style={[styles.compactValue, { color }]}>{value}</Text>
          )}
          {unit ? <Text style={styles.compactUnit}>{unit}</Text> : null}
        </View>
      </AnimatedEntry>
    );
  }

  return (
    <AnimatedEntry
      preset="fadeUp"
      delay={delay}
      style={styles.card}
    >
      <LinearGradient
        colors={[color + '08', color + '03']}
        style={styles.cardGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <MiniSparkline color={color} />

        <View style={styles.topRow}>
          <View style={[styles.iconWrap, { backgroundColor: color + '18' }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          {trend && (
            <View style={[styles.trendBadge, { backgroundColor: trendColor + '15' }]}>
              <BouncingTrendIcon trend={trend} trendColor={trendColor} trendIcon={trendIcon} />
              {trendValue && (
                <Text style={[styles.trendText, { color: trendColor }]}>{trendValue}</Text>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.valueRow}>
          {isNumeric ? (
            <AnimatedCounter value={parseFloat(value)} style={[styles.value, { color }]} />
          ) : (
            <Text style={[styles.value, { color }]}>{value}</Text>
          )}
          {unit ? <Text style={styles.unit}>{unit}</Text> : null}
        </View>

        <Text style={styles.label}>{label}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </LinearGradient>
    </AnimatedEntry>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    ...Shadows.medium,
    position: 'relative',
  },
  cardGradient: {
    padding: Spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    zIndex: 2,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    zIndex: 2,
  },
  value: {
    ...Typography.numberMedium,
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  unit: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 2,
    color: Colors.textSecondary,
  },
  label: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: 4,
    zIndex: 2,
  },
  subtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
    zIndex: 2,
  },
  sparklineContainer: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    opacity: 0.14,
    zIndex: 1,
  },

  // Compact variant
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  compactIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactLabel: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  compactValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  compactValue: {
    ...Typography.h3,
    fontSize: 16,
    fontWeight: '700',
  },
  compactUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textTertiary,
    marginLeft: 1,
  },
});
