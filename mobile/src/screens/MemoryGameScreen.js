// Sense Health — Memory Sequence Game
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import { dataAPI } from '../api/client';

// Custom components and animations
import AnimatedEntry from '../components/animations/AnimatedEntry';
import AnimatedCounter from '../components/animations/AnimatedCounter';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

function MemoryTile({ index, isActive, isPlayerTurn, onPress }) {
  const scale = useSharedValue(1);
  const rotateY = useSharedValue(0);

  useEffect(() => {
    if (isActive) {
      scale.value = withSequence(
        withTiming(1.2, { duration: 150 }),
        withTiming(1, { duration: 150 })
      );
      rotateY.value = withSequence(
        withTiming(180, { duration: 150 }),
        withTiming(0, { duration: 150 })
      );
    }
  }, [isActive]);

  const handlePress = () => {
    if (!isPlayerTurn) return;
    
    scale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1.15, { duration: 100 }),
      withSpring(1)
    );
    rotateY.value = withSequence(
      withTiming(90, { duration: 100 }),
      withSpring(0)
    );

    onPress(index);
  };

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateY: `${rotateY.value}deg` }
    ]
  }));

  return (
    <AnimatedEntry
      preset="zoom"
      delay={index * 60}
      style={styles.tileWrapper}
    >
      <ReAnimated.View style={[{ width: '100%', height: '100%' }, animStyle]}>
        <TouchableOpacity
          style={[
            styles.tile,
            isActive ? styles.tileActive : styles.tileInactive
          ]}
          onPress={handlePress}
          activeOpacity={0.9}
        />
      </ReAnimated.View>
    </AnimatedEntry>
  );
}


const { width } = Dimensions.get('window');
const GRID_SIZE = 3;

export default function MemoryGameScreen({ navigation }) {
  const [gameState, setGameState] = useState('welcome'); // 'welcome' | 'showing' | 'player' | 'finished'
  const [sequence, setSequence] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [activeButton, setActiveButton] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animations & Refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonAnims = useRef(Array(9).fill(null).map(() => new Animated.Value(1))).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const triggerButtonPressAnim = (index) => {
    Animated.sequence([
      Animated.timing(buttonAnims[index], {
        toValue: 1.15,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnims[index], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const startGame = () => {
    const firstStep = Math.floor(Math.random() * 9);
    const newSeq = [firstStep];
    setSequence(newSeq);
    setGameState('showing');
    playSequence(newSeq);
  };

  const playSequence = async (seq) => {
    setGameState('showing');
    await sleep(800);

    for (let i = 0; i < seq.length; i++) {
      const buttonIdx = seq[i];
      setActiveButton(buttonIdx);
      triggerButtonPressAnim(buttonIdx);
      try { Vibration.vibrate(50); } catch (e) {}
      await sleep(500);
      setActiveButton(null);
      await sleep(250);
    }

    setPlayerIndex(0);
    setGameState('player');
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleTilePress = (index) => {
    if (gameState !== 'player') return;

    triggerButtonPressAnim(index);
    try { Vibration.vibrate(30); } catch (e) {}

    // Check if correct
    if (index === sequence[playerIndex]) {
      // Correct tile
      if (playerIndex === sequence.length - 1) {
        // Completed the sequence! Advance to next level
        const nextStep = Math.floor(Math.random() * 9);
        const nextSeq = [...sequence, nextStep];
        setSequence(nextSeq);
        setGameState('showing');
        playSequence(nextSeq);
      } else {
        // Advance player index
        setPlayerIndex(playerIndex + 1);
      }
    } else {
      // Mistake! Game Over
      setGameState('finished');
    }
  };

  const getScore = () => {
    return sequence.length > 0 ? sequence.length - 1 : 0;
  };

  const handleSave = async () => {
    const finalScore = getScore();
    setIsSubmitting(true);
    try {
      await dataAPI.submitGameResult({
        gameId: 'memory',
        score: finalScore
      });
      navigation.goBack();
    } catch (err) {
      console.log('Error saving memory score:', err);
      setIsSubmitting(false);
    }
  };

  const getEvaluation = (score) => {
    if (score >= 8) {
      return {
        title: 'Outstanding Focus!',
        desc: 'Your spatial memory and active working concentration are elite. Your mind is operating at maximum capacity today.',
        icon: 'brain',
        color: Colors.riskLow
      };
    } else if (score >= 4) {
      return {
        title: 'Optimal Concentration',
        desc: 'Your working memory holds a healthy span. Focus is fully intact and capable of tackling deep cognitive tasks.',
        icon: 'checkmark-circle',
        color: Colors.primary
      };
    } else {
      return {
        title: 'Attention Slump',
        desc: 'Working memory span is slightly abbreviated today. This indicates mental distraction or screen fatigue. Take a break to restore your active attention.',
        icon: 'warning',
        color: Colors.warm
      };
    }
  };

  const score = getScore();
  const evaluation = getEvaluation(score);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Memory Sequence</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        {gameState === 'welcome' && (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="hardware-chip" size={48} color={Colors.accent} />
            </View>
            <Text style={styles.title}>Sequence Memory Test</Text>
            <Text style={styles.description}>
              Evaluate your visual-spatial attention and working memory capacity. This Simon-style challenge tracks selective recall under load.
            </Text>
            <View style={styles.instructionBox}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.accentDark} />
              <Text style={styles.instructionText}>
                Observe the grid flashing. Repeat the exact sequence. Each correct sequence adds a new block to remember.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: Colors.accent }]}
              onPress={startGame}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Begin Diagnostic</Text>
            </TouchableOpacity>
          </View>
        )}

        {(gameState === 'showing' || gameState === 'player') && (
          <View style={styles.gameContainer}>
            <View style={styles.gameInfoRow}>
              <View style={[styles.statusBadge, gameState === 'showing' ? styles.statusBadgeShowing : styles.statusBadgePlayer]}>
                <Text style={styles.statusBadgeText}>
                  {gameState === 'showing' ? 'WATCH SEQUENCE' : 'YOUR TURN'}
                </Text>
              </View>
              <Text style={styles.scoreText}>Level: {sequence.length}</Text>
            </View>

            {/* Grid */}
            <View style={styles.grid}>
              {Array(9).fill(null).map((_, index) => (
                <MemoryTile
                  key={index}
                  index={index}
                  isActive={activeButton === index}
                  isPlayerTurn={gameState === 'player'}
                  onPress={handleTilePress}
                />
              ))}
            </View>
          </View>
        )}

        {gameState === 'finished' && (
          <View style={styles.card}>
            <LinearGradient
              colors={[evaluation.color, evaluation.color + 'D0']}
              style={styles.finishedHeader}
            >
              <Ionicons name="medal" size={54} color="#FFFFFF" />
              <Text style={styles.finishedScoreTitle}>Diagnostic Complete</Text>
              <AnimatedCounter value={score} prefix="Level " style={styles.finishedScoreValue} />
              <Text style={styles.finishedScoreLabel}>Max Sequence Length Reached</Text>
            </LinearGradient>

            <View style={styles.cardBody}>
              <Text style={[styles.evalTitle, { color: evaluation.color }]}>
                {evaluation.title}
              </Text>
              <Text style={styles.evalDesc}>
                {evaluation.desc}
              </Text>

              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: evaluation.color }]}
                onPress={handleSave}
                disabled={isSubmitting}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? 'Syncing Results...' : 'Save & Sync Assessment'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1.5,
    borderColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.h2,
    color: Colors.text,
  },
  mainContent: {
    flex: 1,
    padding: Spacing.xl,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    ...Shadows.large,
    overflow: 'hidden',
    alignItems: 'center',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h1,
    color: Colors.text,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  instructionBox: {
    flexDirection: 'row',
    backgroundColor: Colors.accentSoft,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginHorizontal: Spacing.xl,
    gap: Spacing.xs,
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  instructionText: {
    flex: 1,
    ...Typography.caption,
    color: Colors.text,
    lineHeight: 18,
  },
  primaryButton: {
    width: '90%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxl,
    ...Shadows.small,
  },
  primaryButtonText: {
    ...Typography.h3,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  // Game Area
  gameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: width - 40,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  statusBadgeShowing: {
    backgroundColor: Colors.warm,
  },
  statusBadgePlayer: {
    backgroundColor: Colors.primary,
  },
  statusBadgeText: {
    ...Typography.caption,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  scoreText: {
    ...Typography.h2,
    color: Colors.text,
    fontWeight: 'bold',
  },
  grid: {
    width: width - 40,
    height: width - 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignContent: 'space-between',
    padding: Spacing.xs,
  },
  tileWrapper: {
    width: '31%',
    height: '31%',
  },
  tile: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.lg,
    ...Shadows.medium,
  },
  tileInactive: {
    backgroundColor: Colors.secondarySoft,
    borderWidth: 1.5,
    borderColor: 'rgba(44, 62, 80, 0.08)',
  },
  tileActive: {
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  // Finish screen
  finishedHeader: {
    width: '100%',
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishedScoreTitle: {
    ...Typography.labelSmall,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: 'bold',
    letterSpacing: 1.5,
    marginTop: Spacing.sm,
    textTransform: 'uppercase',
  },
  finishedScoreValue: {
    ...Typography.displayLarge,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginVertical: 4,
  },
  finishedScoreLabel: {
    ...Typography.caption,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  cardBody: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  evalTitle: {
    ...Typography.h2,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  evalDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xxl,
  },
});
