// Sense Health — Smooth Area Chart Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/colors';
import { Typography, Spacing } from '../theme/typography';

// Custom animations
import AnimatedEntry from './animations/AnimatedEntry';
import AnimatedCounter from './animations/AnimatedCounter';
import PulseGlow from './animations/PulseGlow';

export default function AreaChart({
  data = [],
  baseline,
  color = Colors.primary,
  height = 120,
  showDots = true,
  showLabels = true,
  labels = [],
  unit = '',
  gradientOpacity = 0.25,
}) {
  const filtered = data.map(v => (v != null ? v : 0));
  if (filtered.length === 0) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  const max = Math.max(...filtered, baseline || 0, 1) * 1.15;
  const min = Math.min(...filtered.filter(v => v > 0), baseline || Infinity) * 0.85;
  const range = max - min || 1;

  const getY = (val) => {
    if (val === 0) return 0;
    return ((val - min) / range) * 100;
  };

  const latest = filtered.filter(v => v > 0).slice(-1)[0];
  const prev = filtered.filter(v => v > 0).slice(-2, -1)[0];
  const changePercent = prev && latest ? (((latest - prev) / prev) * 100).toFixed(1) : null;
  const isPositive = changePercent > 0;

  return (
    <View style={[styles.container, { height }]}>
      {/* Stats row */}
      <View style={styles.statsRow}>
        <View>
          <View style={styles.latestValueRow}>
            {latest != null ? (
              <AnimatedCounter value={latest} decimals={1} style={[styles.latestValue, { color }]} />
            ) : (
              <Text style={[styles.latestValue, { color }]}>—</Text>
            )}
            {unit ? <Text style={styles.unitText}>{unit}</Text> : null}
          </View>
          <Text style={styles.latestLabel}>Latest</Text>
        </View>
        {changePercent !== null && (
          <View style={[styles.changeBadge, { backgroundColor: isPositive ? Colors.accentSoft : Colors.warmSoft }]}>
            <Text style={[styles.changeText, { color: isPositive ? Colors.accentDark : Colors.warmDark }]}>
              {isPositive ? '↑' : '↓'} {Math.abs(changePercent)}%
            </Text>
          </View>
        )}
        {baseline != null && (
          <View style={styles.baselineInfo}>
            <Text style={styles.baselineVal}>Avg: {baseline.toFixed(1)}{unit}</Text>
          </View>
        )}
      </View>

      {/* Chart area */}
      <View style={styles.chartArea}>
        {/* Baseline dashed line */}
        {baseline != null && (
          <View
            style={[
              styles.baselineLine,
              { bottom: `${getY(baseline)}%` },
            ]}
          >
            <View style={styles.baselineDash} />
          </View>
        )}

        {/* Bars with gradient */}
        <View style={styles.barsRow}>
          {filtered.map((val, i) => {
            const heightPct = Math.max(getY(val), 3);
            const isLast = i === filtered.length - 1;

            return (
              <AnimatedEntry
                key={i}
                preset="slideUp"
                delay={i * 60}
                style={styles.barCol}
              >
                <View style={[styles.barOuter, { height: `${heightPct}%` }]}>
                  <LinearGradient
                    colors={[
                      color,
                      color + (isLast ? '60' : '30'),
                    ]}
                    style={[
                      styles.barGradient,
                      {
                        opacity: val === 0 ? 0.15 : isLast ? 1 : 0.65,
                        borderRadius: 6,
                      },
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                  {/* Dot on top */}
                  {showDots && val > 0 && (
                    isLast ? (
                      <PulseGlow
                        size={20}
                        color={color}
                        pulseScale={2.2}
                        ringCount={2}
                        style={styles.latestPulseDot}
                      >
                        <View style={[styles.dotCircle, { backgroundColor: color }]} />
                      </PulseGlow>
                    ) : (
                      <View
                        style={[
                          styles.dot,
                          {
                            backgroundColor: 'transparent',
                            borderColor: color,
                            borderWidth: 1.5,
                            width: 6,
                            height: 6,
                          },
                        ]}
                      />
                    )
                  )}
                </View>
                {/* Label below */}
                {showLabels && labels[i] && (
                  <Text style={styles.barLabel}>{labels[i]}</Text>
                )}
              </AnimatedEntry>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // height is set dynamically
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  latestValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  latestValue: {
    ...Typography.numberSmall,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 1,
    color: Colors.textSecondary,
  },
  latestLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  changeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  baselineInfo: {
    alignItems: 'flex-end',
  },
  baselineVal: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    minHeight: 60,
  },
  baselineLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    zIndex: 10,
    flexDirection: 'row',
  },
  baselineDash: {
    flex: 1,
    height: 1,
    borderTopWidth: 1,
    borderTopColor: Colors.textTertiary + '60',
    borderStyle: 'dashed',
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  barOuter: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
  },
  barGradient: {
    position: 'absolute',
    top: 0,
    left: 2,
    right: 2,
    bottom: 0,
  },
  dot: {
    position: 'absolute',
    top: -4,
    borderRadius: 10,
  },
  latestPulseDot: {
    position: 'absolute',
    top: -10,
  },
  dotCircle: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  barLabel: {
    ...Typography.caption,
    fontSize: 9,
    color: Colors.textTertiary,
    marginTop: 4,
  },
});
