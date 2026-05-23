// Sense Health — Category Risk Card
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';

const categoryConfig = {
  sleep: {
    icon: 'moon-outline',
    label: 'Sleep',
    color: Colors.accent,
    bgColor: Colors.accentSoft,
  },
  mental: {
    icon: 'heart-outline',
    label: 'Mental Health',
    color: Colors.secondary,
    bgColor: Colors.secondarySoft,
  },
  activity: {
    icon: 'footsteps-outline',
    label: 'Activity',
    color: Colors.primary,
    bgColor: Colors.primarySoft,
  },
  nutrition: {
    icon: 'nutrition-outline',
    label: 'Nutrition',
    color: Colors.warm,
    bgColor: Colors.warmSoft,
  },
  screenTime: {
    icon: 'phone-portrait-outline',
    label: 'Screen Time',
    color: Colors.riskModerate,
    bgColor: '#FFF8E1',
  },
  vitals: {
    icon: 'pulse-outline',
    label: 'Vitals',
    color: Colors.riskCritical,
    bgColor: '#FFEBEE',
  },
};

export default function CategoryCard({ category }) {
  const config = categoryConfig[category.name] || {
    icon: 'help-outline',
    label: category.name,
    color: Colors.textSecondary,
    bgColor: Colors.background,
  };

  const getRiskColor = (score) => {
    if (score < 25) return Colors.riskLow;
    if (score < 50) return Colors.riskModerate;
    if (score < 75) return Colors.riskHigh;
    return Colors.riskCritical;
  };

  const riskColor = getRiskColor(category.score);

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={[styles.iconContainer, { backgroundColor: config.bgColor }]}>
          <Ionicons name={config.icon} size={22} color={config.color} />
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardLabel}>{config.label}</Text>
          <Text style={styles.cardMessage} numberOfLines={2}>
            {category.message}
          </Text>
        </View>
      </View>
      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreText, { color: riskColor }]}>
          {category.score}
        </Text>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(category.score, 100)}%`,
                backgroundColor: riskColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
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
  },
  cardMessage: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: 'flex-end',
    minWidth: 50,
  },
  scoreText: {
    ...Typography.numberSmall,
    marginBottom: 4,
  },
  progressBarBg: {
    width: 50,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
});
