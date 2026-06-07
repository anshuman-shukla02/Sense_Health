// Sense Health — Guided Breathing Screen (High-Fidelity Interaction)
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import { JournalLeafSvg } from '../components/illustrations';
import FloatingParticles from '../components/animations/FloatingParticles';
import AnimatedEntry from '../components/animations/AnimatedEntry';

const { width } = Dimensions.get('window');

const PATTERNS = [
  {
    id: 'box',
    name: 'Box Breathing',
    desc: 'Deep focus & stress relief',
    steps: [
      { action: 'Inhale', duration: 4000, scale: 2.2, text: 'Breathe in slowly through your nose' },
      { action: 'Hold', duration: 4000, scale: 2.2, text: 'Suspend your breath gently' },
      { action: 'Exhale', duration: 4000, scale: 1.0, text: 'Release the air through your mouth' },
      { action: 'Hold', duration: 4000, scale: 1.0, text: 'Rest with your lungs empty' },
    ],
  },
  {
    id: 'calm',
    name: 'Calm Mind',
    desc: 'Lower anxiety & heart rate',
    steps: [
      { action: 'Inhale', duration: 4000, scale: 2.2, text: 'Breathe in calm and clarity' },
      { action: 'Hold', duration: 2000, scale: 2.2, text: 'Hold the peaceful energy' },
      { action: 'Exhale', duration: 4000, scale: 1.0, text: 'Let go of tension and stress' },
    ],
  },
  {
    id: 'energize',
    name: 'Energize',
    desc: 'Boost focus & oxygen flow',
    steps: [
      { action: 'Inhale', duration: 2000, scale: 1.8, text: 'Sharp inhale' },
      { action: 'Hold', duration: 1000, scale: 1.8, text: 'Pause' },
      { action: 'Exhale', duration: 2000, scale: 1.0, text: 'Forceful exhale' },
    ],
  },
];

export default function BreathingScreen({ navigation }) {
  const [selectedPattern, setSelectedPattern] = useState(PATTERNS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [secondsRemaining, setSecondsRemaining] = useState(4);

  // Animation values
  const scaleAnim = useRef(new Animated.Value(1.0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(1.0)).current;

  // Active timers and loop tracking
  const currentStepTimer = useRef(null);
  const countdownInterval = useRef(null);
  const activeStepIndex = useRef(0);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    // Start subtle glow pulse in background immediately
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    return () => {
      stopExercise();
    };
  }, []);

  const handleSelectPattern = (pattern) => {
    stopExercise();
    setSelectedPattern(pattern);
    scaleAnim.setValue(1.0);
    setStepIndex(0);
    setCyclesCompleted(0);
    setSecondsRemaining(pattern.steps[0].duration / 1000);
  };

  const startExercise = () => {
    isPlayingRef.current = true;
    setIsPlaying(true);
    activeStepIndex.current = 0;
    setStepIndex(0);
    // Don't call runBreathingCycle here — the useEffect below handles it
  };

  const stopExercise = () => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    if (currentStepTimer.current) clearTimeout(currentStepTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    scaleAnim.stopAnimation();
    // Soft reset
    Animated.spring(scaleAnim, {
      toValue: 1.0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const runBreathingCycle = (pattern, stepIdx) => {
    if (!isPlayingRef.current) return;

    activeStepIndex.current = stepIdx;
    setStepIndex(stepIdx);

    const step = pattern.steps[stepIdx];
    const duration = step.duration;
    
    // Set up countdown timer for this step
    let remaining = duration / 1000;
    setSecondsRemaining(remaining);
    
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    countdownInterval.current = setInterval(() => {
      remaining -= 1;
      if (remaining >= 0) {
        setSecondsRemaining(remaining);
      }
    }, 1000);

    // Animate scale transition
    Animated.timing(scaleAnim, {
      toValue: step.scale,
      duration: duration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    }).start();

    // Trigger step transition timer
    currentStepTimer.current = setTimeout(() => {
      const nextStepIdx = (stepIdx + 1) % pattern.steps.length;
      if (nextStepIdx === 0) {
        setCyclesCompleted(prev => prev + 1);
      }
      runBreathingCycle(pattern, nextStepIdx);
    }, duration);
  };

  // Start/stop cycle based on isPlaying state
  useEffect(() => {
    if (isPlaying) {
      if (currentStepTimer.current) clearTimeout(currentStepTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      runBreathingCycle(selectedPattern, 0);
    }
  }, [isPlaying]);

  const currentStep = selectedPattern.steps[stepIndex];
  
  // Dynamic instruction text color based on action type
  const getActionColor = () => {
    if (currentStep.action === 'Inhale') return '#66BB6A';
    if (currentStep.action === 'Hold') return '#42A5F5';
    return '#FFA726'; // Exhale
  };

  // Glow ring style
  const ringScale = scaleAnim.interpolate({
    inputRange: [1.0, 2.2],
    outputRange: [1.1, 1.4],
  });

  const borderOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.45],
  });

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.gradientHeaderDark} style={StyleSheet.absoluteFillObject} />
      
      <JournalLeafSvg width={180} height={180} style={styles.leafDecorLeft} />
      <JournalLeafSvg width={180} height={180} style={styles.leafDecorRight} />
      <FloatingParticles count={15} colors={['#52A8A2', '#85C7C3', '#4ECDC4']} containerHeight={Dimensions.get('window').height} />
      
      {/* ── Header ── */}
      <AnimatedEntry preset="fade" style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Calm Space</Text>
        <View style={{ width: 44 }} />
      </AnimatedEntry>

      {/* ── Main Content ── */}
      <View style={styles.content}>
        {/* Dynamic Instructional Banner */}
        <AnimatedEntry preset="fadeUp" delay={100} style={styles.statusPanel}>
          <Text style={[styles.actionTag, { color: getActionColor() }]}>
            {isPlaying ? currentStep.action.toUpperCase() : 'READY'}
          </Text>
          <Text style={styles.instructionText}>
            {isPlaying ? currentStep.text : 'Tap Play to begin your guided deep-breathing session.'}
          </Text>
          {isPlaying && (
            <Text style={styles.timerText}>
              {secondsRemaining}s
            </Text>
          )}
        </AnimatedEntry>

        {/* Pulsing Breathing Circle */}
        <View style={styles.circleContainer}>
          {/* Animated Glow Outer Rings */}
          <Animated.View
            style={[
              styles.glowRing,
              {
                transform: [{ scale: ringScale }],
                borderColor: getActionColor(),
                opacity: borderOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.glowRingSecondary,
              {
                transform: [{ scale: Animated.multiply(ringScale, 1.2) }],
                borderColor: getActionColor(),
                opacity: Animated.multiply(borderOpacity, 0.5),
              },
            ]}
          />

          {/* Central Core Breathing Circle */}
          <Animated.View
            style={[
              styles.breathingCore,
              {
                transform: [{ scale: scaleAnim }],
                backgroundColor: getActionColor(),
                shadowColor: getActionColor(),
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.0)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
          
          <Text style={styles.circleStatusText}>
            {isPlaying ? currentStep.action : 'Breath'}
          </Text>
        </View>

        {/* Cycles Tracker */}
        <AnimatedEntry preset="fadeUp" delay={200} style={styles.trackerRow}>
          <View style={styles.trackerCell}>
            <Text style={styles.trackerVal}>{cyclesCompleted}</Text>
            <Text style={styles.trackerLbl}>Cycles Done</Text>
          </View>
          <View style={styles.trackerDivider} />
          <View style={styles.trackerCell}>
            <Text style={styles.trackerVal}>
              {((cyclesCompleted * (selectedPattern.id === 'box' ? 16 : selectedPattern.id === 'calm' ? 10 : 5)) / 60).toFixed(1)}m
            </Text>
            <Text style={styles.trackerLbl}>Time Spent</Text>
          </View>
        </AnimatedEntry>

        {/* ── Play/Pause Control Pad ── */}
        <AnimatedEntry preset="fadeUp" delay={300} style={styles.controlPad}>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={isPlaying ? stopExercise : startExercise}
          >
            <LinearGradient
              colors={isPlaying ? ['#EF5350', '#D32F2F'] : Colors.gradientPrimary}
              style={styles.playBtnGradient}
            >
              <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </AnimatedEntry>

        {/* ── Pattern Selector Carousel ── */}
        <AnimatedEntry preset="fadeUp" delay={400} style={styles.patternSection}>
          <Text style={styles.patternSectionTitle}>Select Rhythm</Text>
          <View style={styles.patternGrid}>
            {PATTERNS.map((p) => {
              const isSelected = selectedPattern.id === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.patternCard, isSelected && styles.patternCardActive]}
                  onPress={() => handleSelectPattern(p)}
                >
                  <Text style={[styles.patternName, isSelected && styles.patternTextActive]}>
                    {p.name}
                  </Text>
                  <Text style={[styles.patternDesc, isSelected && styles.patternDescActive]}>
                    {p.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </AnimatedEntry>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E171E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    ...Typography.h2,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 40,
    paddingHorizontal: Spacing.xxl,
  },

  // HUD Instructions
  statusPanel: {
    alignItems: 'center',
    marginTop: Spacing.md,
    height: 120,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  actionTag: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  instructionText: {
    ...Typography.body,
    color: '#B0BEC5',
    textAlign: 'center',
    lineHeight: 22,
  },
  timerText: {
    ...Typography.h1,
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
  },

  // Breathing Visualizer Area
  circleContainer: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: Spacing.xxl,
  },
  glowRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  glowRingSecondary: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1.5,
    borderStyle: 'dotted',
  },
  breathingCore: {
    width: 90,
    height: 90,
    borderRadius: 45,
    ...Shadows.large,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 25,
    shadowOpacity: 0.7,
  },
  circleStatusText: {
    position: 'absolute',
    ...Typography.h3,
    color: '#FFFFFF',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },

  // Tracker metrics
  trackerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  trackerCell: {
    alignItems: 'center',
    minWidth: 80,
  },
  trackerVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  trackerLbl: {
    fontSize: 10,
    color: '#90A4AE',
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  trackerDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: Spacing.xl,
  },

  // Controls pad
  controlPad: {
    marginVertical: Spacing.md,
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    ...Shadows.large,
    overflow: 'hidden',
  },
  playBtnGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Rhythm selector carousel
  patternSection: {
    width: '100%',
    paddingHorizontal: Spacing.sm,
  },
  patternSectionTitle: {
    ...Typography.label,
    color: '#B0BEC5',
    fontSize: 11,
    marginBottom: Spacing.md,
    textAlign: 'center',
    letterSpacing: 1,
  },
  patternGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.xs,
  },
  patternCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  patternCardActive: {
    backgroundColor: 'rgba(82, 168, 162, 0.12)',
    borderColor: '#52A8A2',
  },
  patternName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#90A4AE',
    marginBottom: 4,
  },
  patternTextActive: {
    color: '#FFFFFF',
  },
  patternDesc: {
    fontSize: 9,
    color: '#78909C',
    textAlign: 'center',
    lineHeight: 12,
  },
  patternDescActive: {
    color: '#B2DFDB',
  },
  leafDecorLeft: {
    position: 'absolute',
    top: 100,
    left: -40,
    opacity: 0.08,
    transform: [{ rotate: '45deg' }],
  },
  leafDecorRight: {
    position: 'absolute',
    bottom: 80,
    right: -40,
    opacity: 0.08,
    transform: [{ rotate: '-135deg' }],
  },
});
