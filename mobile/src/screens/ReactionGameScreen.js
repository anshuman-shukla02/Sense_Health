// Sense Health — Tap Reaction Test Game
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Vibration
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import { dataAPI } from '../api/client';

// Custom components and animations
import PulseGlow from '../components/animations/PulseGlow';
import AnimatedCounter from '../components/animations/AnimatedCounter';
import Svg, { Circle } from 'react-native-svg';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

function RotatingRing() {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 2500, easing: Easing.linear }),
      -1,
      false
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }]
  }));
  return (
    <ReAnimated.View style={[{ position: 'absolute', zIndex: -1 }, animStyle]}>
      <Svg width={180} height={180} viewBox="0 0 100 100">
        <Circle
          cx="50"
          cy="50"
          r="44"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="3"
          strokeDasharray="12 8"
          fill="none"
        />
      </Svg>
    </ReAnimated.View>
  );
}


const { width } = Dimensions.get('window');

export default function ReactionGameScreen({ navigation }) {
  const [gameState, setGameState] = useState('welcome'); // 'welcome' | 'waiting' | 'ready' | 'result' | 'finished'
  const [trials, setTrials] = useState([]);
  const [currentTrial, setCurrentTrial] = useState(1);
  const [lastTime, setLastTime] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timers and Refs
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(0);

  // Animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const triggerPop = () => {
    scaleAnim.setValue(0.9);
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const startTest = () => {
    setTrials([]);
    setCurrentTrial(1);
    setGameState('waiting');
    setupNextTrial();
  };

  const setupNextTrial = () => {
    setGameState('waiting');
    // Set a random delay between 2 and 5 seconds
    const randomDelay = Math.random() * 3000 + 2000;
    timeoutRef.current = setTimeout(() => {
      triggerReadyState();
    }, randomDelay);
  };

  const triggerReadyState = () => {
    setGameState('ready');
    startTimeRef.current = Date.now();
    triggerPop();
    // Vibrate to provide haptic feedback
    try { Vibration.vibrate(80); } catch (e) {}
  };

  const handleTap = () => {
    if (gameState === 'waiting') {
      // Tap too early!
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setLastTime(-1); // Indicator for early tap
      setGameState('result');
    } else if (gameState === 'ready') {
      // Valid tap
      const elapsed = Date.now() - startTimeRef.current;
      setLastTime(elapsed);
      const newTrials = [...trials, elapsed];
      setTrials(newTrials);
      setGameState('result');
    }
  };

  const nextStep = () => {
    if (lastTime === -1) {
      // Restart current trial
      setGameState('waiting');
      setupNextTrial();
      return;
    }

    if (currentTrial < 3) {
      setCurrentTrial(currentTrial + 1);
      setupNextTrial();
    } else {
      setGameState('finished');
    }
  };

  const getAverage = () => {
    if (trials.length === 0) return 0;
    const sum = trials.reduce((a, b) => a + b, 0);
    return Math.round(sum / trials.length);
  };

  const handleSave = async () => {
    const avg = getAverage();
    setIsSubmitting(true);
    try {
      await dataAPI.submitGameResult({
        gameId: 'reaction',
        score: avg
      });
      navigation.goBack();
    } catch (err) {
      console.log('Error saving reaction score:', err);
      setIsSubmitting(false);
    }
  };

  const getEvaluation = (avg) => {
    if (avg < 260) {
      return {
        title: 'Elite Reflexes!',
        desc: 'Your neural reaction speed is outstanding. Your brain is fully charged and exhibiting zero signs of cognitive fatigue.',
        icon: 'trophy',
        color: Colors.riskLow
      };
    } else if (avg < 330) {
      return {
        title: 'Optimal Condition',
        desc: 'Your reaction speed is within the healthy human average. You are well-rested and prepared for high-focus tasks.',
        icon: 'checkmark-circle',
        color: Colors.primary
      };
    } else {
      return {
        title: 'Fatigue Detected',
        desc: 'Your reflex response is slightly sluggish. This is a common physiological signature of cognitive fatigue or sleep deprivation. Consider taking a power break.',
        icon: 'warning',
        color: Colors.warm
      };
    }
  };

  const avgScore = getAverage();
  const evaluation = getEvaluation(avgScore);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Reaction Test</Text>
        <View style={{ width: 40 }} />
      </View>

      <Animated.View style={[styles.mainContent, { opacity: fadeAnim }]}>
        {gameState === 'welcome' && (
          <View style={styles.card}>
            <View style={styles.iconCircle}>
              <Ionicons name="flash" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.title}>Reflex Speed Diagnostic</Text>
            <Text style={styles.description}>
              Measure your sensory processing and neural speed. This clinical test evaluates neuromuscular fatigue based on rapid auditory-visual triggers.
            </Text>
            <View style={styles.instructionBox}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.primaryDark} />
              <Text style={styles.instructionText}>
                Tap the center screen the instant it turns <Text style={{ fontWeight: 'bold', color: Colors.primaryDark }}>GREEN</Text>. We will run 3 quick trials.
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={startTest} activeOpacity={0.8}>
              <Text style={styles.primaryButtonText}>Begin Evaluation</Text>
            </TouchableOpacity>
          </View>
        )}

        {(gameState === 'waiting' || gameState === 'ready') && (
          <TouchableOpacity
            style={[
              styles.gameArea,
              gameState === 'ready' ? styles.gameAreaReady : styles.gameAreaWaiting
            ]}
            onPress={handleTap}
            activeOpacity={1}
          >
            {gameState === 'waiting' && <RotatingRing />}
            <Animated.View style={{ transform: [{ scale: scaleAnim }], alignItems: 'center', justifyContent: 'center' }}>
              {gameState === 'ready' ? (
                <PulseGlow size={160} color="#FFFFFF" pulseScale={1.35}>
                  <Ionicons
                    name="happy-outline"
                    size={84}
                    color="#FFFFFF"
                    style={{ marginBottom: 0 }}
                  />
                </PulseGlow>
              ) : (
                <Ionicons
                  name="ellipse-outline"
                  size={84}
                  color="#FFFFFF"
                  style={styles.gameIcon}
                />
              )}
              <Text style={[styles.gameAreaText, gameState === 'ready' && { marginTop: 15 }]}>
                {gameState === 'ready' ? 'TAP NOW!' : 'WAIT FOR GREEN...'}
              </Text>
              <Text style={styles.trialIndicator}>Trial {currentTrial} of 3</Text>
            </Animated.View>
          </TouchableOpacity>
        )}

        {gameState === 'result' && (
          <View style={styles.card}>
            <View style={[styles.trialResultHeader, lastTime === -1 ? styles.earlyHeader : styles.successHeader]}>
              <Ionicons
                name={lastTime === -1 ? "alert-circle" : "speedometer"}
                size={48}
                color="#FFFFFF"
              />
            </View>
            
            <View style={styles.cardBody}>
              {lastTime === -1 ? (
                <>
                  <Text style={styles.resultTitle}>Too Early!</Text>
                  <Text style={styles.resultDesc}>
                    You clicked before the screen turned green. Take a deep breath, wait for the visual trigger, and try again.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.resultTitle}>Reflex Registered</Text>
                  <View style={styles.speedBadge}>
                    <Text style={styles.speedText}>{lastTime} ms</Text>
                  </View>
                  <Text style={styles.resultDesc}>
                    Excellent. Your reflex speed was recorded successfully for Trial {currentTrial}. Let's advance.
                  </Text>
                </>
              )}

              <TouchableOpacity style={styles.primaryButton} onPress={nextStep} activeOpacity={0.8}>
                <Text style={styles.primaryButtonText}>
                  {lastTime === -1 ? 'Retry Trial' : currentTrial < 3 ? 'Proceed to Next Trial' : 'Finish Evaluation'}
                </Text>
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
              <Ionicons name={evaluation.icon} size={54} color="#FFFFFF" />
              <Text style={styles.finishedScoreTitle}>Diagnostic Complete</Text>
              <AnimatedCounter value={avgScore} suffix=" ms" style={styles.finishedScoreValue} />
              <Text style={styles.finishedScoreLabel}>Average Reaction Time</Text>
            </LinearGradient>

            <View style={styles.cardBody}>
              <Text style={[styles.evalTitle, { color: evaluation.color }]}>
                {evaluation.title}
              </Text>
              <Text style={styles.evalDesc}>
                {evaluation.desc}
              </Text>

              {/* Show trial details */}
              <View style={styles.trialsRow}>
                {trials.map((t, idx) => (
                  <View key={idx} style={styles.trialPill}>
                    <Text style={styles.trialPillNum}>Trial {idx + 1}</Text>
                    <AnimatedCounter value={t} suffix=" ms" style={styles.trialPillVal} />
                  </View>
                ))}
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
    backgroundColor: Colors.primarySoft,
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
    backgroundColor: Colors.primarySoft,
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
  // Game Area Wait/Ready
  gameArea: {
    flex: 1,
    borderRadius: Radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
  },
  gameAreaWaiting: {
    backgroundColor: Colors.secondary,
  },
  gameAreaReady: {
    backgroundColor: Colors.primary,
  },
  gameIcon: {
    marginBottom: Spacing.md,
  },
  gameAreaText: {
    ...Typography.displayMedium,
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  trialIndicator: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.75)',
    fontWeight: 'bold',
  },
  // Trial results
  trialResultHeader: {
    width: '100%',
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earlyHeader: {
    backgroundColor: Colors.warm,
  },
  successHeader: {
    backgroundColor: Colors.primary,
  },
  cardBody: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
  },
  resultTitle: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  speedBadge: {
    backgroundColor: Colors.primarySoft,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  speedText: {
    ...Typography.h1,
    color: Colors.primaryDark,
    fontWeight: 'bold',
  },
  resultDesc: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  // Finished Screen
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
  trialsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xxl,
    gap: Spacing.sm,
  },
  trialPill: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    padding: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trialPillNum: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  trialPillVal: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: 'bold',
  },
});
