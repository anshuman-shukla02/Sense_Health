// Sense Health — Premium Daily Log Screen (Immersive Multi-step)
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Animated, Dimensions,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { getRealStepCount, getRealScreenTimeEstimate } from '../services/UsageTracker';
import { dataAPI } from '../api/client';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import Svg, { Path } from 'react-native-svg';
import AnimatedEntry from '../components/animations/AnimatedEntry';
import FloatingParticles from '../components/animations/FloatingParticles';
import { JournalLeafSvg, WellnessHeroSvg, ShieldCheckSvg } from '../components/illustrations';
import ReAnimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const SleepDecorationSvg = () => (
  <View style={styles.cardBackgroundSvg}>
    <Svg width={120} height={120} viewBox="0 0 24 24" fill="none">
      <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#4A90E2" opacity={0.1} />
    </Svg>
  </View>
);

const ActivityDecorationSvg = () => (
  <View style={styles.cardBackgroundSvg}>
    <Svg width={120} height={120} viewBox="0 0 24 24" fill="none">
      <Path d="M18 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM10.5 4.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM12 9V6H8v3H5v4h3v6h3v-6h3V9h-2z" fill="#40C057" opacity={0.08} />
    </Svg>
  </View>
);

const NutritionDecorationSvg = () => (
  <View style={styles.cardBackgroundSvg}>
    <Svg width={120} height={120} viewBox="0 0 24 24" fill="none">
      <Path d="M12 2L2 22h20L12 2zm0 3.8L19.2 18H4.8L12 5.8zM12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" fill="#E07A5F" opacity={0.08} />
    </Svg>
  </View>
);

const { width } = Dimensions.get('window');
const STEPS = [
  { key: 'Sleep', icon: 'moon', color: '#4A90E2', gradient: ['#4A90E2', '#357ABD'] },
  { key: 'Activity', icon: 'footsteps', color: '#40C057', gradient: ['#40C057', '#82C91E'] },
  { key: 'Nutrition', icon: 'nutrition', color: '#E07A5F', gradient: ['#E07A5F', '#F0A894'] },
  { key: 'Mental', icon: 'heart', color: '#9013FE', gradient: ['#9013FE', '#BD10E0'] },
  { key: 'Symptoms', icon: 'body', color: '#D96C6C', gradient: ['#D96C6C', '#F09090'] },
];

export default function LogScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [slideDirection, setSlideDirection] = useState('right');
  const { grantedPermissions } = useAuth();
  
  const progress = useSharedValue(1 / STEPS.length);

  useEffect(() => {
    progress.value = withSpring((step + 1) / STEPS.length, { damping: 15, stiffness: 100 });
  }, [step]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const [activitySynced, setActivitySynced] = useState(false);
  const [screenTimeSynced, setScreenTimeSynced] = useState(false);

  const [form, setForm] = useState({
    sleep: { hoursSlept: '', quality: 7, bedTime: '', wakeTime: '' },
    activity: { steps: '', exerciseMinutes: '', exerciseType: '', intensity: 'none' },
    nutrition: { mealsCount: '3', waterIntake: '', junkFood: false, fruits: false, caffeine: '0' },
    mental: { mood: 7, stressLevel: 3, anxietyLevel: 3, socialInteraction: 'moderate' },
    screenTime: { totalHours: '', socialMediaHours: '' },
    symptoms: [],
    symptomsNotes: '',
    notes: '',
  });

  useEffect(() => {
    loadTodayData();
  }, []);

  const loadTodayData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const res = await dataAPI.getLog(today);
      if (res.data && res.data.data) {
        const log = res.data.data;
        setForm({
          sleep: {
            hoursSlept: log.sleep?.hoursSlept != null ? log.sleep.hoursSlept.toString() : '',
            quality: log.sleep?.quality || 7,
            bedTime: log.sleep?.bedTime || '',
            wakeTime: log.sleep?.wakeTime || '',
          },
          activity: {
            steps: log.activity?.steps != null ? log.activity.steps.toString() : '',
            exerciseMinutes: log.activity?.exerciseMinutes != null ? log.activity.exerciseMinutes.toString() : '',
            exerciseType: log.activity?.exerciseType || '',
            intensity: log.activity?.intensity || 'none',
          },
          nutrition: {
            mealsCount: log.nutrition?.mealsCount != null ? log.nutrition.mealsCount.toString() : '3',
            waterIntake: log.nutrition?.waterIntake != null ? (log.nutrition.waterIntake * 0.25).toString() : '',
            junkFood: log.nutrition?.junkFood || false,
            fruits: log.nutrition?.fruits || false,
            caffeine: log.nutrition?.caffeine != null ? log.nutrition.caffeine.toString() : '0',
          },
          mental: {
            mood: log.mental?.mood || 7,
            stressLevel: log.mental?.stressLevel || 3,
            anxietyLevel: log.mental?.anxietyLevel || 3,
            socialInteraction: log.mental?.socialInteraction || 'moderate',
          },
          screenTime: {
            totalHours: log.screenTime?.totalHours != null ? log.screenTime.totalHours.toString() : '',
            socialMediaHours: log.screenTime?.socialMediaHours != null ? log.screenTime.socialMediaHours.toString() : '',
          },
          symptoms: log.symptoms || [],
          symptomsNotes: log.symptomsNotes || '',
          notes: log.notes || '',
        });
        
        if (log.activity?.steps > 0) setActivitySynced(true);
        if (log.screenTime?.totalHours > 0) setScreenTimeSynced(true);
      }
    } catch (err) {
      console.log('No existing log found for today yet.');
    }
  };

  const [symptomSearch, setSymptomSearch] = useState('');

  const updateField = (section, field, value) => {
    setForm(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };

  const fetchAutomatedData = async (currentStep) => {
    if (currentStep === 1 && grantedPermissions?.activity) {
      try {
        const stepsValue = await getRealStepCount();
        updateField('activity', 'steps', stepsValue.toString());
        setActivitySynced(true);
      } catch (err) { console.log('Step sync failed', err); }
    } else if (currentStep === 4 && grantedPermissions?.screenTime) {
      try {
        const hoursValue = await getRealScreenTimeEstimate();
        updateField('screenTime', 'totalHours', hoursValue.toString());
        setScreenTimeSynced(true);
      } catch (err) { console.log('Screen time sync failed', err); }
    }
  };

  const animateStep = (next) => {
    setSlideDirection(next > step ? 'right' : 'left');
    setStep(next);
    fetchAutomatedData(next);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        sleep: {
          hoursSlept: form.sleep.hoursSlept !== '' ? parseFloat(form.sleep.hoursSlept) : undefined,
          quality: form.sleep.quality,
          bedTime: form.sleep.bedTime || undefined,
          wakeTime: form.sleep.wakeTime || undefined,
        },
        activity: {
          steps: parseInt(form.activity.steps) || 0,
          exerciseMinutes: form.activity.exerciseMinutes !== '' ? parseInt(form.activity.exerciseMinutes) : 0,
          exerciseType: form.activity.exerciseType || undefined,
          intensity: form.activity.intensity,
        },
        nutrition: {
          mealsCount: parseInt(form.nutrition.mealsCount) || 3,
          waterIntake: form.nutrition.waterIntake !== '' ? Math.round(parseFloat(form.nutrition.waterIntake) / 0.25) : 0,
          junkFood: form.nutrition.junkFood,
          fruits: form.nutrition.fruits,
          caffeine: parseInt(form.nutrition.caffeine) || 0,
        },
        mental: form.mental,
        screenTime: {
          totalHours: form.screenTime.totalHours !== '' ? parseFloat(form.screenTime.totalHours) : 0,
          socialMediaHours: form.screenTime.socialMediaHours !== '' ? parseFloat(form.screenTime.socialMediaHours) : 0,
        },
        symptoms: form.symptoms.length > 0 ? form.symptoms : ['none'],
        symptomsNotes: form.symptomsNotes || undefined,
        notes: form.notes || undefined,
      };
      await dataAPI.submitLog(payload);
      setLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigation.navigate('HomeTab');
      }, 2500);
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.response?.data?.message || 'Failed to save log');
    }
  };

  const SliderRow = ({ label, value, min, max, section, field, labels }) => (
    <View style={styles.sliderGroup}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <View style={[styles.sliderValueBadge, { backgroundColor: getSliderColor(value, min, max, field) + '20' }]}>
          <Text style={[styles.sliderValue, { color: getSliderColor(value, min, max, field) }]}>{value}</Text>
        </View>
      </View>
      {labels && (
        <View style={styles.sliderLabels}>
          <Text style={styles.sliderMinLabel}>{labels[0]}</Text>
          <Text style={styles.sliderMaxLabel}>{labels[1]}</Text>
        </View>
      )}
      <View style={styles.sliderTrack}>
        {Array.from({ length: max - min + 1 }, (_, i) => i + min).map(v => (
          <TouchableOpacity key={v} onPress={() => updateField(section, field, v)}
            style={[styles.sliderDot, v <= value && { backgroundColor: getSliderColor(value, min, max, field) }]} />
        ))}
      </View>
    </View>
  );

  const getSliderColor = (val, min, max, field) => {
    const pct = (val - min) / (max - min);
    if (field === 'stressLevel' || field === 'anxietyLevel') return pct > 0.6 ? Colors.riskCritical : pct > 0.3 ? Colors.riskModerate : Colors.primary;
    return pct > 0.6 ? Colors.primary : pct > 0.3 ? Colors.riskModerate : Colors.warm;
  };

  const symptomOptions = ['headache', 'fatigue', 'nausea', 'dizziness', 'chest_pain', 'shortness_of_breath', 'muscle_pain', 'fever', 'cough', 'sore_throat', 'brain_fog', 'eye_strain', 'back_pain'];
  const toggleSymptom = (s) => setForm(prev => ({
    ...prev, symptoms: prev.symptoms.includes(s) ? prev.symptoms.filter(x => x !== s) : [...prev.symptoms, s],
  }));

  const intensityOptions = ['none', 'low', 'moderate', 'high'];

  const currentStepConfig = STEPS[step];

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.conversationalTitle}>How did you sleep?</Text>
            <Text style={styles.conversationalSub}>Quality rest is the foundation of cognitive health.</Text>
            <View style={styles.card}>
              <SleepDecorationSvg />
              <InputField label="Hours Slept" placeholder="e.g. 7.5" value={form.sleep.hoursSlept}
                onChangeText={v => updateField('sleep', 'hoursSlept', v)} keyboardType="decimal-pad" icon="time-outline" />
              <SliderRow label="Sleep Quality" value={form.sleep.quality} min={1} max={10} section="sleep" field="quality" labels={['Poor', 'Excellent']} />
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.conversationalTitle}>Were you active today?</Text>
            <Text style={styles.conversationalSub}>Movement helps process stress hormones.</Text>
            <View style={styles.card}>
              <ActivityDecorationSvg />
              {activitySynced ? (
                <View style={styles.syncedBox}>
                  <LinearGradient colors={Colors.gradientEmerald} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.autoSyncBadge}>
                    <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                    <Text style={styles.autoSyncText}>Auto-synced from device</Text>
                  </LinearGradient>
                  <Text style={styles.syncedValue}>{form.activity.steps} Steps Today</Text>
                </View>
              ) : (
                <InputField label="Steps" placeholder="e.g. 8000" value={form.activity.steps}
                  onChangeText={v => updateField('activity', 'steps', v)} keyboardType="numeric" icon="walk-outline" />
              )}
              <InputField label="Exercise Minutes" placeholder="e.g. 30" value={form.activity.exerciseMinutes}
                onChangeText={v => updateField('activity', 'exerciseMinutes', v)} keyboardType="numeric" icon="barbell-outline" />
              <Text style={styles.chipGroupLabel}>Intensity</Text>
              <View style={styles.chipRow}>
                {intensityOptions.map(opt => (
                  <TouchableOpacity key={opt} style={[styles.chip, form.activity.intensity === opt && styles.chipActive]}
                    onPress={() => updateField('activity', 'intensity', opt)}>
                    <Text style={[styles.chipText, form.activity.intensity === opt && styles.chipTextActive]}>
                      {opt.charAt(0).toUpperCase() + opt.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        );
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.conversationalTitle}>How did you fuel up?</Text>
            <Text style={styles.conversationalSub}>Hydration and nutrition directly impact focus.</Text>
            <View style={styles.card}>
              <NutritionDecorationSvg />
              <InputField label="Water Intake (Litres)" placeholder="e.g. 2.0" value={form.nutrition.waterIntake}
                onChangeText={v => updateField('nutrition', 'waterIntake', v)} keyboardType="decimal-pad" icon="water-outline" />
              <View style={styles.helperBox}>
                <Ionicons name="information-circle" size={14} color={Colors.primary} />
                <Text style={styles.helperText}>1 standard glass = 0.25 L  •  8 glasses = 2.0 L</Text>
              </View>
              <InputField label="Caffeine (cups)" placeholder="e.g. 2" value={form.nutrition.caffeine}
                onChangeText={v => updateField('nutrition', 'caffeine', v)} keyboardType="numeric" icon="cafe-outline" />
              <View style={styles.toggleRow}>
                <ToggleChip label="🍔 Junk Food" active={form.nutrition.junkFood} onPress={() => updateField('nutrition', 'junkFood', !form.nutrition.junkFood)} />
                <ToggleChip label="🍎 Fruits/Veg" active={form.nutrition.fruits} onPress={() => updateField('nutrition', 'fruits', !form.nutrition.fruits)} />
              </View>
            </View>
          </View>
        );
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.conversationalTitle}>How is your mind?</Text>
            <Text style={styles.conversationalSub}>Take a moment to check in with yourself.</Text>
            <View style={styles.card}>
              <JournalLeafSvg width={120} height={120} style={styles.cardBackgroundSvg} />
              <SliderRow label="Overall Mood" value={form.mental.mood} min={1} max={10} section="mental" field="mood" labels={['Very Low', 'Excellent']} />
              <SliderRow label="Stress Level" value={form.mental.stressLevel} min={1} max={10} section="mental" field="stressLevel" labels={['Calm', 'Overwhelmed']} />
              <SliderRow label="Anxiety Level" value={form.mental.anxietyLevel} min={1} max={10} section="mental" field="anxietyLevel" labels={['Calm', 'High']} />
            </View>
          </View>
        );
      case 4:
        const filteredSymptoms = symptomOptions.filter(s => s.replace('_', ' ').includes(symptomSearch.toLowerCase()));
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.conversationalTitle}>Any symptoms?</Text>
            <Text style={styles.conversationalSub}>Select anything that feels off today.</Text>
            <View style={styles.card}>
              <ShieldCheckSvg width={120} height={120} style={styles.cardBackgroundSvg} />
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={18} color={Colors.textTertiary} />
                <TextInput style={styles.searchInput} placeholder="Search symptoms..."
                  value={symptomSearch} onChangeText={setSymptomSearch} placeholderTextColor={Colors.textTertiary} />
              </View>
              <View style={styles.chipRow}>
                {filteredSymptoms.map(s => (
                  <TouchableOpacity key={s} style={[styles.chip, form.symptoms.includes(s) && styles.chipActiveWarn]}
                    onPress={() => toggleSymptom(s)}>
                    <Text style={[styles.chipText, form.symptoms.includes(s) && styles.chipTextActive]}>
                      {s.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Custom Symptom Description in words */}
              <View style={{ marginTop: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.xl }}>
                <InputField 
                  label="Describe Symptoms in Words" 
                  placeholder="Describe how you feel (e.g. slight sore throat since 3 PM, dull headache behind my eyes)..." 
                  value={form.symptomsNotes}
                  onChangeText={v => setForm(prev => ({ ...prev, symptomsNotes: v }))} 
                  icon="chatbox-ellipses-outline"
                  multiline
                />
              </View>

              <View style={{ marginTop: Spacing.xl }}>
                {screenTimeSynced ? (
                  <View style={styles.syncedBox}>
                    <LinearGradient colors={Colors.gradientSecondary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.autoSyncBadge}>
                      <Ionicons name="sparkles" size={12} color="#FFFFFF" />
                      <Text style={styles.autoSyncText}>Auto-synced from device</Text>
                    </LinearGradient>
                    <Text style={styles.syncedValue}>{form.screenTime.totalHours} Hours Screen Time</Text>
                  </View>
                ) : (
                  <InputField label="Screen Time (hrs)" placeholder="e.g. 6" value={form.screenTime.totalHours}
                    onChangeText={v => updateField('screenTime', 'totalHours', v)} keyboardType="decimal-pad" icon="laptop-outline" />
                )}
              </View>
            </View>
          </View>
        );
      default: return null;
    }
  };

  if (showSuccess) {
    return (
      <View style={styles.successOverlay}>
        <FloatingParticles count={25} colors={['#FFD700', '#FF69B4', '#00FFFF', '#32CD32', '#FF4500']} containerHeight={Dimensions.get('window').height} />
        <AnimatedEntry preset="bounce" style={styles.successCard}>
          <LinearGradient colors={Colors.gradientTeal} style={styles.successGradient}>
            <Ionicons name="checkmark-circle" size={80} color="#FFFFFF" style={{ marginBottom: Spacing.md }} />
            <Text style={styles.successTitle}>Log Completed! 🌿</Text>
            <Text style={styles.successSubtitle}>Your daily health metrics are safely stored and synced.</Text>
          </LinearGradient>
        </AnimatedEntry>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* ── Gradient Header with Progress ── */}
      <LinearGradient colors={currentStepConfig.gradient} style={styles.progressHeader}>
        <View style={styles.progressHeaderTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <Ionicons name="close" size={24} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
          <View style={styles.stepIndicator}>
            <Ionicons name={currentStepConfig.icon} size={18} color="#FFFFFF" />
            <Text style={styles.stepIndicatorText}>{currentStepConfig.key}</Text>
          </View>
          <Text style={styles.stepCounter}>{step + 1}/{STEPS.length}</Text>
        </View>
        {/* Gradient progress bar */}
        <View style={styles.progressBarBg}>
          <ReAnimated.View style={[styles.progressBarFill, progressStyle]}>
            <LinearGradient colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.5)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
          </ReAnimated.View>
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <AnimatedEntry preset={slideDirection === 'right' ? 'fadeRight' : 'fadeLeft'} key={step}>
          {renderStep()}
        </AnimatedEntry>

        <View style={{ flex: 1 }} />

        {/* ── Bottom Navigation ── */}
        <View style={styles.navBottom}>
          {step > 0 ? (
            <TouchableOpacity style={styles.backBtn} onPress={() => animateStep(step - 1)}>
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </TouchableOpacity>
          ) : <View style={{ width: 48 }} />}

          {step < STEPS.length - 1 ? (
            <TouchableOpacity style={styles.nextBtnWrap} onPress={() => animateStep(step + 1)} activeOpacity={0.8}>
              <LinearGradient colors={currentStepConfig.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtn}>
                <Text style={styles.nextBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.nextBtnWrap} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
              <LinearGradient colors={Colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.nextBtn}>
                {loading ? <ActivityIndicator color="#fff" /> : (
                  <><Text style={styles.nextBtnText}>Complete Log</Text><Ionicons name="checkmark" size={18} color="#FFFFFF" /></>
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function InputField({ label, placeholder, value, onChangeText, keyboardType, icon, multiline }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, multiline && { height: 100, alignItems: 'flex-start', paddingTop: Spacing.md }]}>
        <Ionicons name={icon} size={18} color={Colors.textSecondary} style={{ marginRight: Spacing.md }} />
        <TextInput style={[styles.input, multiline && { textAlignVertical: 'top' }]} placeholder={placeholder}
          placeholderTextColor={Colors.textTertiary} value={value} onChangeText={onChangeText}
          keyboardType={keyboardType} multiline={multiline} />
      </View>
    </View>
  );
}

function ToggleChip({ label, active, onPress }) {
  return (
    <TouchableOpacity style={[styles.toggleBtn, active && styles.toggleBtnActive]} onPress={onPress}>
      <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ── Gradient Progress Header ──
  progressHeader: {
    paddingTop: 56, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.xxl,
  },
  progressHeaderTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepIndicator: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full,
  },
  stepIndicatorText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  stepCounter: { color: 'rgba(255,255,255,0.6)', fontWeight: '700', fontSize: 13 },
  progressBarBg: {
    height: 6, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },

  scrollContent: { paddingHorizontal: Spacing.xxl, paddingBottom: 80, paddingTop: Spacing.xl, flexGrow: 1 },
  stepContainer: { alignItems: 'center' },
  conversationalTitle: { ...Typography.displayMedium, color: Colors.text, textAlign: 'center', marginBottom: Spacing.xs },
  conversationalSub: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxl },

  card: {
    width: '100%', backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.xl, ...Shadows.medium, borderWidth: 1, borderColor: Colors.borderLight,
  },
  inputGroup: { marginBottom: Spacing.xl },
  inputLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm, fontSize: 11 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, height: 52,
  },
  input: { flex: 1, ...Typography.body, color: Colors.text },

  sliderGroup: { marginBottom: Spacing.xxl },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sliderLabel: { ...Typography.label, color: Colors.textSecondary, fontSize: 11 },
  sliderValueBadge: {
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full,
  },
  sliderValue: { ...Typography.numberSmall, fontSize: 18 },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sliderMinLabel: { ...Typography.caption, color: Colors.textTertiary, fontSize: 10 },
  sliderMaxLabel: { ...Typography.caption, color: Colors.textTertiary, fontSize: 10 },
  sliderTrack: { flexDirection: 'row', gap: 4 },
  sliderDot: { flex: 1, height: 10, borderRadius: 5, backgroundColor: Colors.border },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background,
    borderRadius: Radius.full, paddingHorizontal: Spacing.lg, height: 44, marginBottom: Spacing.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, marginLeft: Spacing.sm, ...Typography.bodySmall, color: Colors.text },

  chipGroupLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.md, fontSize: 11 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: Spacing.lg, paddingVertical: 9, borderRadius: Radius.full,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  chipActiveWarn: { backgroundColor: '#FFEBEE', borderColor: Colors.riskCritical },
  chipText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500', fontSize: 13 },
  chipTextActive: { color: Colors.text, fontWeight: '600' },

  toggleRow: { flexDirection: 'row', gap: Spacing.md },
  toggleBtn: {
    flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.md,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  toggleBtnActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  toggleBtnText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500' },
  toggleBtnTextActive: { color: Colors.primaryDark, fontWeight: '600' },

  helperBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primarySoft, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    marginTop: -Spacing.md, marginBottom: Spacing.lg,
  },
  helperText: { ...Typography.caption, color: Colors.primaryDark, fontSize: 11, fontWeight: '500' },

  // Bottom Nav
  navBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.lg, marginTop: Spacing.xl,
  },
  backBtn: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  nextBtnWrap: { flex: 1, marginLeft: Spacing.md, borderRadius: Radius.full, overflow: 'hidden' },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: Spacing.sm,
  },
  nextBtnText: { ...Typography.button, color: '#FFFFFF', fontSize: 16 },

  syncedBox: {
    backgroundColor: Colors.background, padding: Spacing.lg, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.borderLight, marginBottom: Spacing.xl,
  },
  syncedValue: { ...Typography.h2, color: Colors.text, marginTop: Spacing.sm },
  autoSyncBadge: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: Radius.full, alignSelf: 'flex-start', gap: 4,
  },
  autoSyncText: { ...Typography.caption, color: '#FFFFFF', fontWeight: '700', fontSize: 10 },
  
  // Custom decorations & Success overlay
  cardBackgroundSvg: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    opacity: 0.12,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 25, 41, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  successCard: {
    width: width - Spacing.xxl * 2,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  successGradient: {
    padding: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    ...Typography.h1,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: Spacing.sm,
    fontSize: 22,
  },
  successSubtitle: {
    ...Typography.body,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
});
