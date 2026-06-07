// Sense Health — Premium Reflective Journal Screen
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { dataAPI } from '../api/client';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import { JournalLeafSvg } from '../components/illustrations';
import FloatingParticles from '../components/animations/FloatingParticles';
import AnimatedEntry from '../components/animations/AnimatedEntry';
import AnimatedCounter from '../components/animations/AnimatedCounter';

function EmojiCardItem({ item, isSelected, onPress }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isSelected) {
      Animated.sequence([
        Animated.spring(scale, { toValue: 1.25, friction: 4, tension: 120, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1.15, friction: 6, tension: 80, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.spring(scale, { toValue: 1.0, friction: 8, tension: 50, useNativeDriver: true }).start();
    }
  }, [isSelected]);

  return (
    <TouchableOpacity
      style={[styles.emojiCard, isSelected && styles.emojiCardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Animated.Text style={[styles.emojiText, { transform: [{ scale }] }]}>
        {item.emoji}
      </Animated.Text>
      <Text style={[styles.emojiLabel, isSelected && styles.emojiLabelActive]}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );
}

const { width } = Dimensions.get('window');

const MOOD_EMOJIS = [
  { val: 2, emoji: '😢', label: 'Down' },
  { val: 4, emoji: '😔', label: 'Anxious' },
  { val: 6, emoji: '😐', label: 'Neutral' },
  { val: 8, emoji: '😊', label: 'Good' },
  { val: 10, emoji: '🤩', label: 'Joyful' },
];

const WRITING_PROMPTS = [
  "What is one small win you had today?",
  "What was the most challenging part of your day, and how did you navigate it?",
  "List three things you feel grateful for right now.",
  "How does your body feel physically in this moment?",
  "What habit are you working on that you felt proud of today?",
];

export default function JournalScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [todayLog, setTodayLog] = useState(null);

  // Form State
  const [mood, setMood] = useState(8); // Default: Good
  const [stress, setStress] = useState(3);
  const [anxiety, setAnxiety] = useState(3);
  const [journalText, setJournalText] = useState('');
  const [selectedPromptIdx, setSelectedPromptIdx] = useState(null);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const successFade = useRef(new Animated.Value(0)).current;

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTodayData();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadTodayData = async () => {
    try {
      setLoading(true);
      const res = await dataAPI.getLog(todayStr);
      if (res.data && res.data.data) {
        const log = res.data.data;
        setTodayLog(log);
        
        // Prefill existing notes and emotional metrics if logged earlier
        if (log.notes) setJournalText(log.notes);
        if (log.mental) {
          if (log.mental.mood) setMood(log.mental.mood);
          if (log.mental.stressLevel) setStress(log.mental.stressLevel);
          if (log.mental.anxietyLevel) setAnxiety(log.mental.anxietyLevel);
        }
      }
    } catch (err) {
      console.log('No log found for today yet or error loading:');
    } finally {
      setLoading(false);
    }
  };

  const selectPrompt = (prompt, idx) => {
    setSelectedPromptIdx(idx);
    setJournalText(prev => {
      const separator = prev.trim().length > 0 ? '\n\n' : '';
      return `${prev}${separator}Prompt: "${prompt}"\n`;
    });
  };

  const handleSaveJournal = async () => {
    if (!journalText.trim()) {
      Alert.alert('Empty Journal', 'Please express your thoughts before saving.');
      return;
    }

    setSaving(true);
    try {
      // Build a completely non-destructive payload by merging today's existing log details
      const payload = {
        date: todayStr,
        // Carry over any existing metrics from earlier in the day
        sleep: todayLog?.sleep || undefined,
        activity: todayLog?.activity || undefined,
        nutrition: todayLog?.nutrition || undefined,
        vitals: todayLog?.vitals || undefined,
        screenTime: todayLog?.screenTime || undefined,
        symptoms: todayLog?.symptoms?.length > 0 ? todayLog.symptoms : undefined,
        
        // Override mental metrics & journal notes
        mental: {
          mood: mood,
          stressLevel: stress,
          anxietyLevel: anxiety,
          socialInteraction: todayLog?.mental?.socialInteraction || 'moderate',
        },
        notes: journalText,
      };

      await dataAPI.submitLog(payload);

      // Trigger beautiful visual success overlay
      Animated.sequence([
        Animated.timing(successFade, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.delay(1200),
        Animated.timing(successFade, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => {
        navigation.goBack();
      });

    } catch (err) {
      console.error(err);
      Alert.alert('Failed to Save', err.response?.data?.message || 'Could not record journal log.');
    } finally {
      setSaving(false);
    }
  };

  const SliderSelector = ({ label, value, setValue, min = 1, max = 10, lowLabel, highLabel }) => (
    <View style={styles.sliderContainer}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderTitle}>{label}</Text>
        <View style={styles.sliderValueBadge}>
          <Text style={styles.sliderValueText}>{value}</Text>
        </View>
      </View>
      <View style={styles.sliderLabelRow}>
        <Text style={styles.sliderLabelText}>{lowLabel}</Text>
        <Text style={styles.sliderLabelText}>{highLabel}</Text>
      </View>
      <View style={styles.sliderTrack}>
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(v => {
          const isActive = v <= value;
          const isCurrent = v === value;
          return (
            <TouchableOpacity
              key={v}
              onPress={() => setValue(v)}
              style={[
                styles.sliderDot,
                isActive && styles.sliderDotActive,
                isCurrent && styles.sliderDotCurrent
              ]}
            />
          );
        })}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <LinearGradient colors={Colors.gradientHeaderDark} style={StyleSheet.absoluteFillObject} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loaderText}>Establishing safe space...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.container}>
        <LinearGradient colors={Colors.gradientHeaderDark} style={StyleSheet.absoluteFillObject} />
        <JournalLeafSvg width={180} height={180} style={styles.leafDecor} />
        <FloatingParticles count={10} containerHeight={200} />

        {/* ── Header ── */}
        <AnimatedEntry preset="fade" style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Reflective Journal</Text>
          <TouchableOpacity
            style={styles.saveBtnTop}
            onPress={handleSaveJournal}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark-sharp" size={24} color={Colors.primary} />
            )}
          </TouchableOpacity>
        </AnimatedEntry>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            
            {/* ── Mood Selector ── */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionCardTitle}>How are you feeling right now?</Text>
              <View style={styles.emojiRow}>
                {MOOD_EMOJIS.map((item) => (
                  <EmojiCardItem
                    key={item.val}
                    item={item}
                    isSelected={mood === item.val}
                    onPress={() => setMood(item.val)}
                  />
                ))}
              </View>
            </View>

            {/* ── Mental Stress Sliders ── */}
            <View style={styles.sectionCard}>
              <SliderSelector
                label="Current Stress Level"
                value={stress}
                setValue={setStress}
                lowLabel="Calm & Relaxed"
                highLabel="Overwhelmed"
              />
              <View style={{ height: Spacing.xl }} />
              <SliderSelector
                label="Anxiety Level"
                value={anxiety}
                setValue={setAnxiety}
                lowLabel="Peaceful"
                highLabel="Highly Anxious"
              />
            </View>

            {/* ── Calming Prompts Carousel ── */}
            <View style={styles.promptsContainer}>
              <Text style={styles.promptsTitle}>Need inspiration? Tap a prompt:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptsScroll}>
                {WRITING_PROMPTS.map((prompt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.promptCard, selectedPromptIdx === idx && styles.promptCardActive]}
                    onPress={() => selectPrompt(prompt, idx)}
                  >
                    <Ionicons name="sparkles-outline" size={12} color={Colors.primary} style={{ marginBottom: 4 }} />
                    <Text style={styles.promptText} numberOfLines={3}>
                      {prompt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* ── Journal Editor Box ── */}
            <View style={styles.editorCard}>
              <View style={styles.editorHeader}>
                <Ionicons name="create-outline" size={16} color={Colors.primary} />
                <Text style={styles.editorTitle}>Write freely</Text>
              </View>
              <TextInput
                style={styles.writingPad}
                placeholder="How was your day? What is on your mind? Express your thoughts here..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                value={journalText}
                onChangeText={setJournalText}
                textAlignVertical="top"
              />
              <View style={styles.wordCounterContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <AnimatedCounter value={journalText.split(/\s+/).filter(Boolean).length} decimals={0} style={styles.counterTextVal} />
                  <Text style={styles.counterText}> words  •  {journalText.length} chars</Text>
                </View>
              </View>
            </View>

            {/* ── Save Button ── */}
            <TouchableOpacity
              style={styles.saveSubmitBtn}
              onPress={handleSaveJournal}
              disabled={saving}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Colors.gradientPrimary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveSubmitGradient}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.saveSubmitText}>Save Daily Reflection</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </Animated.View>
        </ScrollView>

        {/* ── Success Celebration Overlay ── */}
        <Animated.View style={[styles.successOverlay, { opacity: successFade }]} pointerEvents="none">
          <BlurPanel />
          <Animated.View 
            style={[
              styles.successBox, 
              { transform: [{ scale: successFade.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1] }) }] }
            ]}
          >
            <LinearGradient colors={Colors.gradientTeal} style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.successTitle}>Thoughts Recorded 🌿</Text>
            <Text style={styles.successSubtitle}>Your mental state baseline is safely updated.</Text>
          </Animated.View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

// Custom simple fallback blur panel for premium aesthetic
function BlurPanel() {
  return (
    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(14,23,30,0.92)' }]} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E171E',
  },
  loaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    ...Typography.bodySmall,
    color: '#90A4AE',
    marginTop: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnTop: {
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
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: 60,
  },

  // Cards layout
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  sectionCardTitle: {
    ...Typography.body,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },

  // Emojis Row
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: Spacing.xs,
  },
  emojiCard: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    minWidth: 54,
  },
  emojiCardActive: {
    backgroundColor: 'rgba(82, 168, 162, 0.15)',
    borderWidth: 1,
    borderColor: '#52A8A2',
  },
  emojiText: {
    fontSize: 26,
  },
  emojiActiveScale: {
    fontSize: 32,
  },
  emojiLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: '#78909C',
    marginTop: 4,
  },
  emojiLabelActive: {
    color: '#52A8A2',
    fontWeight: '700',
  },

  // Stress sliders styling
  sliderContainer: {
    width: '100%',
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ECEFF1',
  },
  sliderValueBadge: {
    backgroundColor: 'rgba(82,168,162,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  sliderValueText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#52A8A2',
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  sliderLabelText: {
    fontSize: 9,
    color: '#78909C',
    fontWeight: '600',
  },
  sliderTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sliderDotActive: {
    backgroundColor: 'rgba(82, 168, 162, 0.5)',
  },
  sliderDotCurrent: {
    backgroundColor: '#52A8A2',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  // Prompts Carousel
  promptsContainer: {
    marginBottom: Spacing.lg,
  },
  promptsTitle: {
    fontSize: 11,
    color: '#90A4AE',
    fontWeight: '700',
    marginBottom: Spacing.sm,
    paddingLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  promptsScroll: {
    gap: Spacing.sm,
    flexDirection: 'row',
    paddingRight: Spacing.xl,
  },
  promptCard: {
    width: 140,
    height: 80,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: Spacing.md,
    justifyContent: 'flex-start',
  },
  promptCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(82,168,162,0.05)',
  },
  promptText: {
    fontSize: 10,
    color: '#B0BEC5',
    lineHeight: 14,
    fontWeight: '500',
  },

  // Writing editor pad
  editorCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: Spacing.xl,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: Spacing.md,
    marginBottom: Spacing.md,
  },
  editorTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  writingPad: {
    minHeight: 160,
    color: '#ECEFF1',
    fontSize: 14,
    lineHeight: 20,
    paddingBottom: Spacing.xl,
  },
  wordCounterContainer: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    paddingTop: Spacing.sm,
  },
  counterText: {
    fontSize: 10,
    color: '#78909C',
    fontWeight: '600',
  },

  // Save submit buttons
  saveSubmitBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadows.large,
  },
  saveSubmitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: Spacing.sm,
  },
  saveSubmitText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 15,
  },

  // Success Overlay
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  successBox: {
    backgroundColor: '#16222F',
    borderRadius: Radius.xl,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: width * 0.8,
    borderWidth: 1,
    borderColor: 'rgba(82, 168, 162, 0.25)',
    ...Shadows.large,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  successTitle: {
    ...Typography.h2,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 8,
  },
  successSubtitle: {
    ...Typography.bodySmall,
    color: '#90A4AE',
    textAlign: 'center',
  },
  leafDecor: {
    position: 'absolute',
    top: 50,
    right: -40,
    opacity: 0.08,
    transform: [{ rotate: '-45deg' }],
  },
  counterTextVal: {
    fontSize: 10,
    color: '#78909C',
    fontWeight: '700',
  },
});
