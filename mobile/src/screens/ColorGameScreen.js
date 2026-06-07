// Sense Health — Color Match (Stroop Effect) Game
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
import AnimatedCounter from '../components/animations/AnimatedCounter';
import Svg, { Circle } from 'react-native-svg';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withSpring,
  withSequence,
} from 'react-native-reanimated';

const AnimatedCircle = ReAnimated.createAnimatedComponent(Circle);

function TimerRing({ timeLeft, totalTime = 30 }) {
  const strokeDashoffset = useSharedValue(0);
  const radius = 24;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const percentage = timeLeft / totalTime;
    strokeDashoffset.value = withTiming(circumference * (1 - percentage), { duration: 500 });
  }, [timeLeft]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: strokeDashoffset.value
  }));

  return (
    <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={64} height={64} viewBox="0 0 64 64" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx="32"
          cy="32"
          r={radius}
          stroke="rgba(0, 0, 0, 0.05)"
          strokeWidth="4"
          fill="none"
        />
        <AnimatedCircle
          cx="32"
          cy="32"
          r={radius}
          stroke={timeLeft <= 5 ? Colors.warm : Colors.primary}
          strokeWidth="4"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          strokeLinecap="round"
        />
      </Svg>
      <View style={{ position: 'absolute' }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.text }}>{timeLeft}</Text>
      </View>
    </View>
  );
}


const { width } = Dimensions.get('window');

const COLOR_OPTIONS = [
  { name: 'RED', value: Colors.warm },
  { name: 'BLUE', value: '#3498DB' },
  { name: 'GREEN', value: Colors.accent },
  { name: 'YELLOW', value: '#F1C40F' },
  { name: 'PURPLE', value: '#9B59B6' }
];

export default function ColorGameScreen({ navigation }) {
  const [gameState, setGameState] = useState('welcome'); // 'welcome' | 'playing' | 'finished'
  const [timeLeft, setTimeLeft] = useState(30);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Word and Color states
  const [word, setWord] = useState('');
  const [textColorName, setTextColorName] = useState('');
  const [textColorValue, setTextColorValue] = useState('');
  const [doesMatch, setDoesMatch] = useState(false);

  // Animations & Refs
  const timerRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const reanimatedCardScale = useSharedValue(1);

  const cardScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reanimatedCardScale.value }]
  }));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const triggerPop = () => {
    reanimatedCardScale.value = 0.95;
    reanimatedCardScale.value = withSpring(1, { damping: 8, stiffness: 120 });
  };

  const startGame = () => {
    setScore(0);
    setAttempts(0);
    setTimeLeft(30);
    setGameState('playing');
    generateNewChallenge();

    // Start progress animation
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 30000,
      useNativeDriver: false,
    }).start();

    // Start countdown timer
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setGameState('finished');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const generateNewChallenge = () => {
    const randomWordIdx = Math.floor(Math.random() * COLOR_OPTIONS.length);
    const randomColorIdx = Math.floor(Math.random() * COLOR_OPTIONS.length);
    const match = randomWordIdx === randomColorIdx;

    setWord(COLOR_OPTIONS[randomWordIdx].name);
    setTextColorName(COLOR_OPTIONS[randomColorIdx].name);
    setTextColorValue(COLOR_OPTIONS[randomColorIdx].value);
    setDoesMatch(match);
    triggerPop();
  };

  const handleAnswer = (answer) => {
    if (gameState !== 'playing') return;

    setAttempts((prev) => prev + 1);

    if (answer === doesMatch) {
      // Correct!
      setScore((prev) => prev + 1);
      try { Vibration.vibrate(30); } catch (e) {}
    } else {
      // Wrong!
      try { Vibration.vibrate([0, 80, 50, 80]); } catch (e) {}
    }

    generateNewChallenge();
  };

  const getAccuracy = () => {
    if (attempts === 0) return 0;
    return Math.round((score / attempts) * 100);
  };

  const handleSave = async () => {
    const accuracy = getAccuracy();
    setIsSubmitting(true);
    try {
      await dataAPI.submitGameResult({
        gameId: 'color',
        score: score,
        accuracy: accuracy
      });
      navigation.goBack();
    } catch (err) {
      console.log('Error saving color match score:', err);
      setIsSubmitting(false);
    }
  };

  const getEvaluation = (score, accuracy) => {
    if (score >= 20 && accuracy >= 85) {
      return {
        title: 'Laser Focus!',
        desc: 'Exceptional executive cognitive control. You successfully filtered out high Stroop interference with elite accuracy and speed.',
        icon: 'flashlight',
        color: Colors.riskLow
      };
    } else if (score >= 12 && accuracy >= 70) {
      return {
        title: 'Cognitive Balance',
        desc: 'Good executive conditioning. Your attention pathways are healthy and performing within the optimal human average.',
        icon: 'checkmark-circle',
        color: Colors.primary
      };
    } else {
      return {
        title: 'Executive Fatigue',
        desc: 'Selective processing speed is lagging today. Your brain is struggling to override automatic reading reflexes. Take a digital break to rest your prefrontal cortex.',
        icon: 'warning',
        color: Colors.warm
      };
    }
  };

  const accuracy = getAccuracy();
  const evaluation = getEvaluation(score, accuracy);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Color Match</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        {gameState === 'welcome' && (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="color-palette" size={48} color={Colors.warm} />
            </View>
            <Text style={styles.title}>Stroop Selective Focus</Text>
            <Text style={styles.description}>
              Evaluate executive cognitive control, reaction speeds, and selective attention filters. This clinical task measures cognitive conflict resolution under a 30-second time trial.
            </Text>
            <View style={styles.instructionBox}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.warmDark} />
              <Text style={styles.instructionText}>
                Identify if the written word <Text style={{ fontWeight: 'bold' }}>matches</Text> the physical text color. Rapidly select YES or NO.
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: Colors.warm }]}
              onPress={startGame}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Begin Time Trial</Text>
            </TouchableOpacity>
          </View>
        )}

        {gameState === 'playing' && (
          <View style={styles.gameContainer}>
            {/* Top Stats */}
            <View style={styles.statsRow}>
              <Text style={styles.statLabel}>Score: <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>{score}</Text></Text>
              <TimerRing timeLeft={timeLeft} />
              <Text style={styles.statLabel}>Accuracy: <Text style={{ color: Colors.accent, fontWeight: 'bold' }}>{accuracy}%</Text></Text>
            </View>

            {/* Challenge Card */}
            <ReAnimated.View style={[styles.challengeCard, cardScaleStyle]}>
              <Text style={styles.challengeQuestion}>Does the word match its color?</Text>
              
              <View style={styles.colorWordContainer}>
                <Text style={[styles.colorWordText, { color: textColorValue }]}>
                  {word}
                </Text>
              </View>
            </ReAnimated.View>

            {/* Choices */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.choiceButton, styles.noButton]}
                onPress={() => handleAnswer(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close-circle" size={24} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.choiceButtonText}>NO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.choiceButton, styles.yesButton]}
                onPress={() => handleAnswer(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.choiceButtonText}>YES</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {gameState === 'finished' && (
          <View style={styles.card}>
            <LinearGradient
              colors={[evaluation.color, evaluation.color + 'D0']}
              style={styles.finishedHeader}
            >
              <Ionicons name="ribbon" size={54} color="#FFFFFF" />
              <Text style={styles.finishedScoreTitle}>Diagnostic Complete</Text>
              <AnimatedCounter value={score} suffix=" Hits" style={styles.finishedScoreValue} />
              <Text style={styles.finishedScoreLabel}>Stroop score achieved with {accuracy}% accuracy</Text>
            </LinearGradient>

            <View style={styles.cardBody}>
              <Text style={[styles.evalTitle, { color: evaluation.color }]}>
                {evaluation.title}
              </Text>
              <Text style={styles.evalDesc}>
                {evaluation.desc}
              </Text>

              {/* Breakdown */}
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownPill}>
                  <Text style={styles.breakdownLabel}>TOTAL HITS</Text>
                  <AnimatedCounter value={score} style={styles.breakdownValue} />
                </View>
                <View style={styles.breakdownPill}>
                  <Text style={styles.breakdownLabel}>ACCURACY</Text>
                  <AnimatedCounter value={accuracy} suffix="%" style={styles.breakdownValue} />
                </View>
                <View style={styles.breakdownPill}>
                  <Text style={styles.breakdownLabel}>ATTEMPTS</Text>
                  <AnimatedCounter value={attempts} style={styles.breakdownValue} />
                </View>
              </View>

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
    backgroundColor: Colors.warmSoft,
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
    backgroundColor: Colors.warmSoft,
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
  // Game playing
  gameContainer: {
    alignItems: 'center',
    width: '100%',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.h3,
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '700',
  },
  timerNum: {
    ...Typography.h1,
    color: Colors.text,
    fontWeight: 'bold',
  },
  progressBarWrapper: {
    width: '100%',
    height: 8,
    backgroundColor: Colors.secondarySoft,
    borderRadius: Radius.full,
    marginBottom: Spacing.xxl,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
  },
  challengeCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xxl,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.large,
    marginBottom: Spacing.xxl,
  },
  challengeQuestion: {
    ...Typography.labelSmall,
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: Spacing.xl,
    fontWeight: 'bold',
  },
  colorWordContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorWordText: {
    fontSize: 54,
    fontWeight: '900',
    letterSpacing: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: Spacing.md,
  },
  choiceButton: {
    flex: 1,
    flexDirection: 'row',
    height: 60,
    borderRadius: Radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.medium,
  },
  noButton: {
    backgroundColor: Colors.warm,
  },
  yesButton: {
    backgroundColor: Colors.accent,
  },
  choiceButtonText: {
    ...Typography.h3,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  // Finished
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
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
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
    marginBottom: Spacing.xl,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  breakdownPill: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  breakdownLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  breakdownValue: {
    ...Typography.h2,
    color: Colors.text,
    fontWeight: 'bold',
  },
});
