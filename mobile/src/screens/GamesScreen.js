// Sense Health — Reflex & Cognitive Games
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';

const GAMES = [
  {
    id: 'reaction',
    title: 'Tap Reaction Test',
    description: 'Measure reaction speed and detect fatigue.',
    icon: 'flash',
    color: Colors.primary,
  },
  {
    id: 'memory',
    title: 'Memory Sequence',
    description: 'Measures attention and short-term focus.',
    icon: 'hardware-chip',
    color: Colors.accent,
  },
  {
    id: 'color',
    title: 'Color Match',
    description: 'Detects cognitive fatigue and processing speed.',
    icon: 'color-palette',
    color: Colors.warm,
  },
  {
    id: 'pattern',
    title: 'Pattern Recall',
    description: 'Tracks concentration and spatial memory.',
    icon: 'grid',
    color: Colors.secondary,
  },
];

export default function GamesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cognitive Health</Text>
        <Text style={styles.headerSubtitle}>
          Play quick games to evaluate your cognitive fatigue, focus, and reaction speed.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {GAMES.map((game) => (
          <TouchableOpacity key={game.id} style={styles.gameCard} activeOpacity={0.8}>
            <View style={[styles.iconContainer, { backgroundColor: game.color + '15' }]}>
              <Ionicons name={game.icon} size={32} color={game.color} />
            </View>
            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gameDesc}>{game.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
    ...Shadows.small,
  },
  headerTitle: {
    ...Typography.displayMedium,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  scrollContent: {
    padding: Spacing.xxl,
    paddingBottom: 100,
  },
  gameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  gameInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  gameTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: 4,
  },
  gameDesc: {
    ...Typography.caption,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
