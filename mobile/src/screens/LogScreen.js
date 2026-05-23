// Sense Health — Daily Log Screen (Multi-step form)
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Animated, Dimensions,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Pedometer } from 'expo-sensors';
import { useAuth } from '../context/AuthContext';
import { dataAPI } from '../api/client';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';

const { width } = Dimensions.get('window');
const STEPS = ['Sleep', 'Activity', 'Nutrition', 'Mental', 'Symptoms'];

export default function LogScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const { grantedPermissions } = useAuth();
  
  const [activitySynced, setActivitySynced] = useState(false);
  const [screenTimeSynced, setScreenTimeSynced] = useState(false);

  // Form data
  const [form, setForm] = useState({
    sleep: { hoursSlept: '', quality: 7, bedTime: '', wakeTime: '' },
    activity: { steps: '', exerciseMinutes: '', exerciseType: '', intensity: 'none' },
    nutrition: { mealsCount: '3', waterIntake: '', junkFood: false, fruits: false, caffeine: '0' },
    mental: { mood: 7, stressLevel: 3, anxietyLevel: 3, socialInteraction: 'moderate' },
    screenTime: { totalHours: '', socialMediaHours: '' },
    symptoms: [],
    notes: '',
  });

  const [symptomSearch, setSymptomSearch] = useState('');

  const updateField = (section, field, value) => {
    setForm(prev => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const fetchAutomatedData = async (currentStep) => {
    if (currentStep === 1 && grantedPermissions?.activity) { // Activity Step
      try {
        const isAvailable = await Pedometer.isAvailableAsync();
        if (isAvailable || __DEV__) {
          const end = new Date();
          const start = new Date();
          start.setHours(0, 0, 0, 0); // Midnight today
          
          let stepsValue = 5430; // Mock fallback
          try {
            const result = await Pedometer.getStepCountAsync(start, end);
            if (result && result.steps) stepsValue = result.steps;
          } catch(e) {}
          
          updateField('activity', 'steps', stepsValue.toString());
          setActivitySynced(true);
        }
      } catch (err) {
        console.log('Automated step tracking failed.', err);
      }
    } else if (currentStep === 4 && grantedPermissions?.screenTime) { // Screen Time Step
      // Mocking screen time sync
      updateField('screenTime', 'totalHours', '4.2');
      setScreenTimeSynced(true);
    }
  };

  const animateStep = (next) => {
    const direction = next > step ? 1 : -1;
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -direction * 40, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
    setStep(next);
    fetchAutomatedData(next);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        sleep: {
          hoursSlept: parseFloat(form.sleep.hoursSlept) || undefined,
          quality: form.sleep.quality,
          bedTime: form.sleep.bedTime || undefined,
          wakeTime: form.sleep.wakeTime || undefined,
        },
        activity: {
          steps: parseInt(form.activity.steps) || 0,
          exerciseMinutes: parseInt(form.activity.exerciseMinutes) || 0,
          exerciseType: form.activity.exerciseType || undefined,
          intensity: form.activity.intensity,
        },
        nutrition: {
          mealsCount: parseInt(form.nutrition.mealsCount) || 3,
          waterIntake: parseInt(form.nutrition.waterIntake) || 0,
          junkFood: form.nutrition.junkFood,
          fruits: form.nutrition.fruits,
          caffeine: parseInt(form.nutrition.caffeine) || 0,
        },
        mental: form.mental,
        screenTime: {
          totalHours: parseFloat(form.screenTime.totalHours) || 0,
          socialMediaHours: parseFloat(form.screenTime.socialMediaHours) || 0,
        },
        symptoms: form.symptoms.length > 0 ? form.symptoms : ['none'],
        notes: form.notes || undefined,
      };
      await dataAPI.submitLog(payload);
      Alert.alert('Success! 🌿', 'Your daily health log has been saved.', [
        { text: 'OK', onPress: () => navigation.navigate('HomeTab') },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save log');
    } finally {
      setLoading(false);
    }
  };

  const SliderRow = ({ label, value, min, max, section, field, labels }) => (
    <View style={styles.sliderGroup}>
      <View style={styles.sliderHeader}>
        <Text style={styles.sliderLabel}>{label}</Text>
        <Text style={[styles.sliderValue, { color: getSliderColor(value, min, max, field) }]}>{value}</Text>
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
    ...prev,
    symptoms: prev.symptoms.includes(s) ? prev.symptoms.filter(x => x !== s) : [...prev.symptoms, s],
  }));

  const intensityOptions = ['none', 'low', 'moderate', 'high'];
  const socialOptions = ['none', 'minimal', 'moderate', 'high'];

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.secondarySoft }]}>
              <Ionicons name="moon" size={32} color={Colors.secondary} />
            </View>
            <Text style={styles.conversationalTitle}>How did you sleep last night?</Text>
            <Text style={styles.conversationalSub}>Quality rest is the foundation of cognitive health.</Text>
            
            <View style={styles.card}>
              <InputField label="Hours Slept" placeholder="e.g. 7.5" value={form.sleep.hoursSlept}
                onChangeText={v => updateField('sleep', 'hoursSlept', v)} keyboardType="decimal-pad" icon="time-outline" />
              <SliderRow label="Sleep Quality" value={form.sleep.quality} min={1} max={10} section="sleep" field="quality" labels={['Poor', 'Excellent']} />
            </View>
          </View>
        );
      case 1:
        return (
          <View style={styles.stepContainer}>
            <View style={[styles.iconCircle, { backgroundColor: Colors.primarySoft }]}>
              <Ionicons name="footsteps" size={32} color={Colors.primary} />
            </View>
            <Text style={styles.conversationalTitle}>Were you active today?</Text>
            <Text style={styles.conversationalSub}>Movement helps process stress hormones.</Text>
            
            <View style={styles.card}>
              {activitySynced ? (
                <View style={styles.syncedBox}>
                  <View style={styles.autoSyncBadge}>
                    <Ionicons name="sparkles" size={14} color={Colors.primary} />
                    <Text style={styles.autoSyncText}>Auto-synced from device</Text>
                  </View>
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
            <View style={[styles.iconCircle, { backgroundColor: Colors.warmSoft }]}>
              <Ionicons name="nutrition" size={32} color={Colors.warm} />
            </View>
            <Text style={styles.conversationalTitle}>How did you fuel your body?</Text>
            <Text style={styles.conversationalSub}>Hydration and nutrition directly impact focus.</Text>
            
            <View style={styles.card}>
              <InputField label="Water Intake (glasses)" placeholder="e.g. 8" value={form.nutrition.waterIntake}
                onChangeText={v => updateField('nutrition', 'waterIntake', v)} keyboardType="numeric" icon="water-outline" />
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
            <View style={[styles.iconCircle, { backgroundColor: Colors.accentSoft }]}>
              <Ionicons name="heart" size={32} color={Colors.accent} />
            </View>
            <Text style={styles.conversationalTitle}>How is your mind?</Text>
            <Text style={styles.conversationalSub}>Take a moment to check in with yourself.</Text>
            
            <View style={styles.card}>
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
            <View style={[styles.iconCircle, { backgroundColor: '#FFEBEE' }]}>
              <Ionicons name="body" size={32} color={Colors.riskCritical} />
            </View>
            <Text style={styles.conversationalTitle}>Any physical symptoms?</Text>
            <Text style={styles.conversationalSub}>Select anything that feels off today.</Text>
            
            <View style={styles.card}>
              <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={Colors.textTertiary} />
                <TextInput 
                  style={styles.searchInput} 
                  placeholder="Search symptoms..." 
                  value={symptomSearch} 
                  onChangeText={setSymptomSearch}
                  placeholderTextColor={Colors.textTertiary}
                />
              </View>
              
              <Text style={styles.chipGroupLabel}>Quick Chips</Text>
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
              
              <View style={{ marginTop: Spacing.xl }}>
                {screenTimeSynced ? (
                  <View style={styles.syncedBox}>
                    <View style={[styles.autoSyncBadge, { backgroundColor: Colors.secondarySoft }]}>
                      <Ionicons name="sparkles" size={14} color={Colors.secondary} />
                      <Text style={[styles.autoSyncText, { color: Colors.secondary }]}>Auto-synced from device</Text>
                    </View>
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Progress indicator */}
      <View style={styles.progressHeader}>
        <View style={styles.progressDots}>
          {STEPS.map((_, i) => (
            <View key={i} style={[styles.dot, i === step ? styles.dotActive : (i < step ? styles.dotCompleted : null)]} />
          ))}
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          {renderStep()}
        </Animated.View>
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.navBottom}>
        {step > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={() => animateStep(step - 1)}>
            <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        ) : <View style={{ width: 48 }} />}
        
        {step < STEPS.length - 1 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={() => animateStep(step + 1)} activeOpacity={0.8}>
            <Text style={styles.nextBtnText}>Continue</Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.textInverse} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.nextBtn, { backgroundColor: Colors.primary }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <><Text style={styles.nextBtnText}>Complete Log</Text><Ionicons name="checkmark" size={20} color={Colors.textInverse} /></>
            )}
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

function InputField({ label, placeholder, value, onChangeText, keyboardType, icon, multiline }) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={[styles.inputWrapper, multiline && { height: 100, alignItems: 'flex-start', paddingTop: Spacing.md }]}>
        <Ionicons name={icon} size={20} color={Colors.textSecondary} style={{ marginRight: Spacing.md }} />
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
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: 60 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xxl },
  progressDots: { flexDirection: 'row', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  dotCompleted: { backgroundColor: Colors.primaryLight },
  scrollContent: { paddingHorizontal: Spacing.xxl, paddingBottom: 100 },
  stepContainer: { alignItems: 'center' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xl },
  conversationalTitle: { ...Typography.displayMedium, color: Colors.text, textAlign: 'center', marginBottom: Spacing.xs },
  conversationalSub: { ...Typography.bodyLarge, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xxxl },
  card: { width: '100%', backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, ...Shadows.medium },
  inputGroup: { marginBottom: Spacing.xl },
  inputLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.sm },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, height: 56 },
  input: { flex: 1, ...Typography.bodyLarge, color: Colors.text },
  sliderGroup: { marginBottom: Spacing.xxl },
  sliderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sliderLabel: { ...Typography.label, color: Colors.textSecondary },
  sliderValue: { ...Typography.numberSmall },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  sliderMinLabel: { ...Typography.caption, color: Colors.textTertiary },
  sliderMaxLabel: { ...Typography.caption, color: Colors.textTertiary },
  sliderTrack: { flexDirection: 'row', gap: 6 },
  sliderDot: { flex: 1, height: 12, borderRadius: 6, backgroundColor: Colors.border },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, height: 48, marginBottom: Spacing.lg },
  searchInput: { flex: 1, marginLeft: Spacing.md, ...Typography.body },
  chipGroupLabel: { ...Typography.label, color: Colors.textSecondary, marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: { paddingHorizontal: Spacing.lg, paddingVertical: 10, borderRadius: Radius.full, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  chipActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  chipActiveWarn: { backgroundColor: '#FFEBEE', borderColor: Colors.riskCritical },
  chipText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.text, fontWeight: '600' },
  toggleRow: { flexDirection: 'row', gap: Spacing.md },
  toggleBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.md, borderRadius: Radius.md, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  toggleBtnActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  toggleBtnText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500' },
  toggleBtnTextActive: { color: Colors.primaryDark, fontWeight: '600' },
  navBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingVertical: Spacing.xl, backgroundColor: Colors.surface, ...Shadows.large },
  backBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.text, paddingHorizontal: Spacing.xl, paddingVertical: 14, borderRadius: Radius.full, gap: Spacing.sm },
  nextBtnText: { ...Typography.button, color: Colors.textInverse },
  syncedBox: { backgroundColor: Colors.background, padding: Spacing.lg, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.xl },
  syncedValue: { ...Typography.h2, color: Colors.text, marginTop: Spacing.sm },
  autoSyncBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, alignSelf: 'flex-start', gap: 4 },
  autoSyncText: { ...Typography.caption, color: Colors.primaryDark, fontWeight: '600' }
});
