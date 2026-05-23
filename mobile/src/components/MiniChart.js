// Sense Health — Mini Bar Chart Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '../theme/colors';
import { Typography, Spacing } from '../theme/typography';

export default function MiniChart({ data = [], baseline, color = Colors.primary }) {
  const filtered = data.map(v => (v != null ? v : 0));
  if (filtered.length === 0) {
    return <View style={styles.empty}><Text style={styles.emptyText}>No data</Text></View>;
  }

  const max = Math.max(...filtered, baseline || 0, 1);

  return (
    <View style={styles.container}>
      {/* Baseline line */}
      {baseline != null && (
        <View style={[styles.baselineLine, { bottom: `${(baseline / max) * 100}%` }]}>
          <Text style={styles.baselineLabel}>avg {baseline.toFixed(1)}</Text>
        </View>
      )}
      <View style={styles.barsContainer}>
        {filtered.map((val, i) => (
          <View key={i} style={styles.barWrapper}>
            <View style={[
              styles.bar,
              {
                height: `${Math.max((val / max) * 100, 2)}%`,
                backgroundColor: val === 0 ? Colors.border : color,
                opacity: val === 0 ? 0.3 : (i === filtered.length - 1 ? 1 : 0.6),
              },
            ]} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 80, position: 'relative' },
  barsContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  barWrapper: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { borderRadius: 3, minHeight: 2 },
  baselineLine: {
    position: 'absolute', left: 0, right: 0, height: 1,
    borderTopWidth: 1, borderTopColor: Colors.textTertiary, borderStyle: 'dashed',
    zIndex: 1,
  },
  baselineLabel: { ...Typography.caption, color: Colors.textTertiary, fontSize: 9, position: 'absolute', right: 0, top: -12 },
  empty: { height: 80, alignItems: 'center', justifyContent: 'center' },
  emptyText: { ...Typography.caption, color: Colors.textTertiary },
});
