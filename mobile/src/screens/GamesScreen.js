// Sense Health — Vibrant Cognitive Game Hub
import React, { useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import { BrainWaveSvg } from '../components/illustrations';
import FloatingParticles from '../components/animations/FloatingParticles';
import AnimatedEntry from '../components/animations/AnimatedEntry';
import PulseGlow from '../components/animations/PulseGlow';

const { width } = Dimensions.get('window');

const GAMES = [
  {
    id: 'reaction',
    title: 'Tap Reaction',
    description: 'Measure reaction speed and detect fatigue patterns.',
    icon: 'flash',
    gradient: ['#FF6B6B', '#EE5A24'],
    screen: 'ReactionGame',
    metric: 'Speed',
    difficulty: 'Easy',
  },
  {
    id: 'memory',
    title: 'Memory Sequence',
    description: 'Measures short-term focus and attention span.',
    icon: 'hardware-chip',
    gradient: ['#9013FE', '#BD10E0'],
    screen: 'MemoryGame',
    metric: 'Memory',
    difficulty: 'Medium',
  },
  {
    id: 'color',
    title: 'Color Match',
    description: 'Detects cognitive fatigue and processing speed.',
    icon: 'color-palette',
    gradient: ['#00C9FF', '#92FE9D'],
    screen: 'ColorGame',
    metric: 'Focus',
    difficulty: 'Hard',
  },
];

function GameCard({ game, navigation, index }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, tension: 150, friction: 6, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }).start();
  };

  return (
    <AnimatedEntry preset="fadeUp" delay={index * 150}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onPress={() => navigation.navigate(game.screen)}
        >
        <LinearGradient
          colors={game.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gameCard}
        >
          {/* Decorative circle */}
          <View style={styles.gameDecorCircle} />

          <View style={styles.gameCardContent}>
            <View style={styles.gameIconContainer}>
              <View style={styles.gameIconCircle}>
                <Ionicons name={game.icon} size={28} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.gameInfo}>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gameDesc}>{game.description}</Text>

              <View style={styles.gameBadgeRow}>
                <View style={styles.gameBadge}>
                  <Ionicons name="pulse" size={10} color="#FFFFFF" />
                  <Text style={styles.gameBadgeText}>{game.metric}</Text>
                </View>
                <View style={[styles.gameBadge, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
                  <Text style={styles.gameBadgeText}>{game.difficulty}</Text>
                </View>
              </View>
            </View>

            <View style={styles.gamePlayBtn}>
              <Ionicons name="play" size={20} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
    </AnimatedEntry>
  );
}

export default function GamesScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* ── Dark Gradient Header ── */}
      <LinearGradient colors={Colors.gradientHeaderGame} style={styles.header}>
        <BrainWaveSvg width={width} height={180} style={styles.headerBrainWave} />
        <FloatingParticles count={10} containerHeight={200} />

        <AnimatedEntry preset="fadeUp" duration={600} style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Cognitive Lab</Text>
            <Text style={styles.headerSubtitle}>
              Play quick games to evaluate your cognitive fatigue, focus, and reaction speed.
            </Text>
          </View>

          {/* Brain health widget */}
          <View style={styles.brainWidget}>
            <PulseGlow size={44} color="rgba(255, 255, 255, 0.4)" ringCount={2}>
              <View style={styles.brainIconCircle}>
                <Ionicons name="fitness" size={24} color="#FFFFFF" />
              </View>
            </PulseGlow>
            <View style={{ marginLeft: Spacing.sm }}>
              <Text style={styles.brainWidgetLabel}>BRAIN HEALTH</Text>
              <Text style={styles.brainWidgetScore}>Active</Text>
            </View>
          </View>
        </AnimatedEntry>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>AVAILABLE ASSESSMENTS</Text>
        {GAMES.map((game, idx) => (
          <GameCard key={game.id} game={game} navigation={navigation} index={idx} />
        ))}

        {/* Coming soon card */}
        <View style={styles.comingSoonCard}>
          <View style={styles.comingSoonIcon}>
            <Ionicons name="hourglass-outline" size={24} color={Colors.textTertiary} />
          </View>
          <View style={styles.comingSoonInfo}>
            <Text style={styles.comingSoonTitle}>More Games Coming</Text>
            <Text style={styles.comingSoonDesc}>We're building more cognitive assessments to help track your brain health.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ── Dark Header ──
  header: {
    paddingTop: 60, paddingBottom: Spacing.xl, paddingHorizontal: Spacing.xxl,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute', top: -30, right: -20,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255, 107, 107, 0.08)',
  },
  headerDecor2: {
    position: 'absolute', bottom: -10, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(144, 19, 254, 0.06)',
  },
  headerContent: {},
  headerTitle: { ...Typography.displayMedium, color: '#FFFFFF', marginBottom: Spacing.xs },
  headerSubtitle: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.65)', lineHeight: 22 },

  brainWidget: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: Radius.lg,
    padding: Spacing.md, marginTop: Spacing.lg,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  brainIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  brainWidgetLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  brainWidgetScore: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },

  // ── Content ──
  scrollContent: { padding: Spacing.xxl, paddingBottom: 120 },
  sectionLabel: {
    ...Typography.labelSmall, color: Colors.textTertiary, letterSpacing: 1.5,
    marginBottom: Spacing.lg, fontSize: 10,
  },

  // ── Game Cards ──
  gameCard: {
    borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg,
    ...Shadows.large, overflow: 'hidden',
  },
  gameDecorCircle: {
    position: 'absolute', top: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gameCardContent: { flexDirection: 'row', alignItems: 'center' },
  gameIconContainer: { marginRight: Spacing.lg },
  gameIconCircle: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  gameInfo: { flex: 1, marginRight: Spacing.md },
  gameTitle: { ...Typography.h2, color: '#FFFFFF', marginBottom: 4, fontSize: 19 },
  gameDesc: { ...Typography.caption, color: 'rgba(255,255,255,0.75)', lineHeight: 18, marginBottom: Spacing.sm },
  gameBadgeRow: { flexDirection: 'row', gap: 6 },
  gameBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full,
  },
  gameBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  gamePlayBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Coming Soon ──
  comingSoonCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.xl, ...Shadows.small,
    borderWidth: 1, borderColor: Colors.borderLight,
    borderStyle: 'dashed',
  },
  comingSoonIcon: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center',
    marginRight: Spacing.lg,
  },
  comingSoonInfo: { flex: 1 },
  comingSoonTitle: { ...Typography.h3, color: Colors.textSecondary, marginBottom: 4 },
  comingSoonDesc: { ...Typography.caption, color: Colors.textTertiary, lineHeight: 18 },
  headerBrainWave: {
    position: 'absolute',
    bottom: -20,
    right: 0,
    opacity: 0.18,
  },
});
