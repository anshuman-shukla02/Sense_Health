// Sense Health — Premium Auth Screen (Progressive Onboarding & Login)
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, Animated, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
// Try to load Google Sign-In (requires native build — unavailable in Expo Go)
let GoogleSignin = null;
try {
  GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
} catch (e) {
  console.log('Google Sign-In native module not available (Expo Go). Using email auth only.');
}
import { useAuth } from '../context/AuthContext';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import { WellnessHeroSvg } from '../components/illustrations';
import FloatingParticles from '../components/animations/FloatingParticles';
import AnimatedEntry from '../components/animations/AnimatedEntry';

const { width, height } = Dimensions.get('window');

export default function AuthScreen() {
  const { login, register, loginWithGoogle } = useAuth();

  const [showLanding, setShowLanding] = useState(true);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [regStep, setRegStep] = useState(0);

  useEffect(() => {
    if (GoogleSignin) {
      GoogleSignin.configure({
        webClientId: '238840495825-6i04mud3ff2son8vm785hkjh1chj017v.apps.googleusercontent.com',
      });
    }
  }, []);

  const handleGoogleLogin = async () => {
    if (!GoogleSignin) {
      Alert.alert(
        'Native Build Required',
        'Google Sign-In requires a custom development build. Please use email/password login in Expo Go.'
      );
      return;
    }
    try {
      setLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      
      if (!idToken) {
        throw new Error('Google Sign-In did not return an ID Token');
      }

      const result = await loginWithGoogle(idToken);
      setLoading(false);
      
      if (!result.success) {
        Alert.alert('Google Sign-In Failed', result.message);
      }
    } catch (error) {
      setLoading(false);
      console.log('Native Google Auth Error:', error);
      if (error.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Sign-In Interrupted', error.message || 'Could not complete Google Sign-In.');
      }
    }
  };

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  
  const [userHeight, setUserHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [status, setStatus] = useState('');
  const [goals, setGoals] = useState([]);
  const [sleepHabits, setSleepHabits] = useState(7);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const navigateToForm = (asLogin) => {
    setIsLogin(asLogin);
    setShowLanding(false);
  };

  const toggleMode = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: isLogin ? -20 : 20, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setIsLogin(!isLogin);
      setRegStep(0);
      slideAnim.setValue(isLogin ? 20 : -20);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 12 }),
      ]).start();
    });
  };

  const nextStep = () => {
    if (regStep === 0 && (!email || !password)) {
      Alert.alert('Missing Info', 'Please enter your email and password.');
      return;
    }
    if (regStep === 1 && !name) {
      Alert.alert('Missing Info', 'Please enter your name to continue.');
      return;
    }
    
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: -20, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    setRegStep(regStep + 1);
  };

  const prevStep = () => {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: 20, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
    setRegStep(regStep - 1);
  };

  const handleSubmit = async () => {
    if (isLogin && (!email || !password)) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }

    setLoading(true);
    let result;

    if (isLogin) {
      result = await login(email, password);
    } else {
      result = await register({
        name,
        email,
        password,
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
        height: userHeight ? parseFloat(userHeight) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        status, goals, sleepHabits,
      });
    }

    setLoading(false);
    if (!result.success) Alert.alert('Error', result.message);
  };

  const genderOptions = [
    { value: 'male', label: 'Male', icon: 'male' },
    { value: 'female', label: 'Female', icon: 'female' },
    { value: 'other', label: 'Other', icon: 'person' },
  ];
  const statusOptions = ['student', 'working', 'other'];
  const goalOptions = ['reduce_stress', 'improve_sleep', 'better_focus', 'track_mood'];

  const toggleGoal = (g) => {
    if (goals.includes(g)) setGoals(goals.filter(x => x !== g));
    else setGoals([...goals, g]);
  };

  if (showLanding) {
    return (
      <View style={styles.landingContainer}>
        <LinearGradient colors={Colors.gradientHeaderDark} style={styles.landingBackground}>
          <FloatingParticles count={10} containerHeight={height} />
          
          <View style={styles.landingContent}>
            <WellnessHeroSvg width={300} height={240} style={{ marginBottom: Spacing.xl }} />
            <Text style={styles.landingTitle}>Sense Health</Text>
            <Text style={styles.landingSubtitle}>Your personal AI guide to cognitive wellness, focus, and stress reduction.</Text>
          </View>

          <View style={styles.landingBottom}>
            <TouchableOpacity style={styles.landingButtonPrimary} onPress={() => navigateToForm(false)} activeOpacity={0.85}>
              <LinearGradient colors={Colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.landingBtnGradient}>
                <Text style={styles.landingButtonPrimaryText}>Get Started</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.landingGoogleButton} 
              onPress={handleGoogleLogin} 
              disabled={loading}
              activeOpacity={0.85}
            >
              <Ionicons name="logo-google" size={20} color="#FFFFFF" />
              <Text style={styles.landingGoogleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.landingButtonSecondary} onPress={() => navigateToForm(true)} activeOpacity={0.85}>
              <Text style={styles.landingButtonSecondaryText}>I already have an account</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  const renderRegistrationSteps = () => {
    switch (regStep) {
      case 0:
        return (
          <AnimatedEntry preset="fadeLeft" key="step0" style={{ width: '100%' }}>
            <Text style={styles.formSubtitle}>Let's start with the basics.</Text>
            <InputField icon="mail-outline" placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <View style={styles.inputGroup}>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                <TextInput style={[styles.input, { flex: 1 }]} placeholder="Password" placeholderTextColor={Colors.textTertiary} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>
            <SubmitButton onPress={nextStep} text="Continue" icon="arrow-forward" />
          </AnimatedEntry>
        );
      case 1:
        return (
          <AnimatedEntry preset="fadeLeft" key="step1" style={{ width: '100%' }}>
            <Text style={styles.formSubtitle}>Tell us about yourself.</Text>
            <InputField icon="person-outline" placeholder="Full Name" value={name} onChangeText={setName} autoCapitalize="words" />
            <InputField icon="calendar-outline" placeholder="Age" value={age} onChangeText={setAge} keyboardType="numeric" />
            
            <Text style={styles.label}>Gender</Text>
            <View style={styles.chipRow}>
              {genderOptions.map((opt) => (
                <TouchableOpacity key={opt.value} style={[styles.chip, gender === opt.value && styles.chipActive]} onPress={() => setGender(opt.value)}>
                  <Ionicons name={opt.icon} size={16} color={gender === opt.value ? Colors.textOnPrimary : Colors.textSecondary} />
                  <Text style={[styles.chipText, gender === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.stepNavRow}>
              <TouchableOpacity onPress={prevStep} style={styles.stepBackBtn}>
                <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <SubmitButton onPress={nextStep} text="Next" icon="arrow-forward" />
              </View>
            </View>
          </AnimatedEntry>
        );
      case 2:
        return (
          <AnimatedEntry preset="fadeLeft" key="step2" style={{ width: '100%' }}>
            <Text style={styles.formSubtitle}>Help us personalize your experience.</Text>
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <View style={{ flex: 1 }}>
                <InputField icon="body-outline" placeholder="Height (cm)" value={userHeight} onChangeText={setUserHeight} keyboardType="numeric" />
              </View>
              <View style={{ flex: 1 }}>
                <InputField icon="barbell-outline" placeholder="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" />
              </View>
            </View>
            
            <Text style={styles.label}>Current Status</Text>
            <View style={styles.chipRow}>
              {statusOptions.map((opt) => (
                <TouchableOpacity key={opt} style={[styles.chip, status === opt && styles.chipActive]} onPress={() => setStatus(opt)}>
                  <Text style={[styles.chipText, status === opt && styles.chipTextActive]}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
 
            <View style={styles.stepNavRow}>
              <TouchableOpacity onPress={prevStep} style={styles.stepBackBtn}>
                <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setUserHeight(''); setWeight(''); setStatus(''); nextStep(); }} style={styles.stepSkipBtn}>
                <Text style={styles.stepSkipBtnText}>Skip</Text>
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <SubmitButton onPress={nextStep} text="Next" icon="arrow-forward" />
              </View>
            </View>
          </AnimatedEntry>
        );
      case 3:
        return (
          <AnimatedEntry preset="fadeLeft" key="step3" style={{ width: '100%' }}>
            <Text style={styles.formSubtitle}>Almost done. What are your goals?</Text>
            <View style={styles.chipRow}>
              {goalOptions.map((opt) => (
                <TouchableOpacity key={opt} style={[styles.chip, goals.includes(opt) && styles.chipActive]} onPress={() => toggleGoal(opt)}>
                  <Text style={[styles.chipText, goals.includes(opt) && styles.chipTextActive]}>{opt.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                </TouchableOpacity>
              ))}
            </View>
 
            <View style={{ marginTop: Spacing.xl, marginBottom: Spacing.lg }}>
              <Text style={styles.label}>Average Sleep (Hours)</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ ...Typography.bodySmall, color: Colors.textSecondary }}>4h</Text>
                <Text style={{ ...Typography.h1, color: Colors.primary }}>{sleepHabits}</Text>
                <Text style={{ ...Typography.bodySmall, color: Colors.textSecondary }}>10h+</Text>
              </View>
              <View style={styles.sliderTrack}>
                {[4,5,6,7,8,9,10].map(v => (
                  <TouchableOpacity key={v} onPress={() => setSleepHabits(v)} style={[styles.sliderDot, v <= sleepHabits && { backgroundColor: Colors.primary }]} />
                ))}
              </View>
            </View>
 
            <View style={styles.stepNavRow}>
              <TouchableOpacity onPress={prevStep} style={styles.stepBackBtn}>
                <Ionicons name="arrow-back" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
              <View style={{ flex: 1, marginLeft: Spacing.md }}>
                <SubmitButton onPress={handleSubmit} text="Complete Setup" icon="checkmark" loading={loading} />
              </View>
            </View>
          </AnimatedEntry>
        );
      default: return null;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.gradientHeaderDark} style={styles.headerGradient}>
        <FloatingParticles count={8} containerHeight={140} />
        
        <TouchableOpacity style={styles.backToLandingBtn} onPress={() => setShowLanding(true)}>
          <Ionicons name="arrow-back" size={24} color={Colors.textInverse} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <View style={styles.logoCircleSmall}>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.logoCircleSmallGradient}>
              <LottieView
                source={require('../../assets/animations/meditation.json')}
                autoPlay loop
                style={{ width: 44, height: 44 }}
              />
            </LinearGradient>
          </View>
          <Text style={styles.appNameSmall}>Sense Health</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.formContainer}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {!isLogin && (
            <View style={styles.progressHeader}>
              {[0, 1, 2, 3].map(i => (
                <View key={i} style={[styles.progressDot, i <= regStep ? styles.progressDotActive : null]} />
              ))}
            </View>
          )}

          <Animated.View style={[styles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.formTitle}>
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>

            {isLogin ? (
              <AnimatedEntry preset="fade" key="loginForm" style={{ width: '100%' }}>
                <Text style={styles.formSubtitle}>Sign in to continue tracking your health</Text>
                <InputField icon="mail-outline" placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                <View style={styles.inputGroup}>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput style={[styles.input, { flex: 1 }]} placeholder="Password" placeholderTextColor={Colors.textTertiary} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>
                <SubmitButton onPress={handleSubmit} text="Sign In" icon="arrow-forward" loading={loading} />

                <View style={styles.dividerContainer}>
                  <View style={styles.horizontalDivider} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.horizontalDivider} />
                </View>

                <TouchableOpacity 
                  style={styles.googleButton} 
                  onPress={handleGoogleLogin} 
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <Ionicons name="logo-google" size={20} color={Colors.text} />
                  <Text style={styles.googleButtonText}>Sign in with Google</Text>
                </TouchableOpacity>
              </AnimatedEntry>
            ) : (
              renderRegistrationSteps()
            )}

            <TouchableOpacity style={styles.toggleButton} onPress={toggleMode}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.toggleTextBold}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function InputField({ icon, placeholder, value, onChangeText, keyboardType, autoCapitalize }) {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.inputWrapper}>
        <Ionicons name={icon} size={20} color={Colors.textSecondary} style={styles.inputIcon} />
        <TextInput style={styles.input} placeholder={placeholder} placeholderTextColor={Colors.textTertiary} value={value} onChangeText={onChangeText} keyboardType={keyboardType} autoCapitalize={autoCapitalize || 'none'} />
      </View>
    </View>
  );
}

function SubmitButton({ onPress, text, icon, loading }) {
  return (
    <TouchableOpacity style={[styles.submitButton, loading && styles.submitButtonDisabled]} onPress={onPress} disabled={loading} activeOpacity={0.85}>
      <LinearGradient colors={Colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitGradient}>
        {loading ? <ActivityIndicator color={Colors.textOnPrimary} /> : (
          <><Text style={styles.submitText}>{text}</Text><Ionicons name={icon} size={20} color={Colors.textOnPrimary} /></>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  landingContainer: { flex: 1, backgroundColor: Colors.headerDark },
  landingBackground: { flex: 1, justifyContent: 'space-between', paddingVertical: 80, paddingHorizontal: Spacing.xxl },
  decorCircle1: { position: 'absolute', top: -100, right: -50, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(82, 168, 162, 0.05)' },
  decorCircle2: { position: 'absolute', bottom: 100, left: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(144, 19, 254, 0.05)' },
  
  landingContent: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  landingLogoCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xxl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  landingLogoGradient: { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center' },
  landingTitle: { ...Typography.displayLarge, fontSize: 44, color: '#FFFFFF', textAlign: 'center', marginBottom: Spacing.md, letterSpacing: -1 },
  landingSubtitle: { ...Typography.bodyLarge, color: 'rgba(255,255,255,0.7)', textAlign: 'center', paddingHorizontal: Spacing.xl, lineHeight: 28 },
  
  landingBottom: { gap: Spacing.lg },
  landingButtonPrimary: { borderRadius: Radius.full, overflow: 'hidden', ...Shadows.large },
  landingBtnGradient: { flexDirection: 'row', paddingVertical: 18, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  landingButtonPrimaryText: { ...Typography.button, color: '#FFFFFF', fontSize: 18 },
  landingButtonSecondary: { alignItems: 'center', paddingVertical: Spacing.md },
  landingButtonSecondaryText: { ...Typography.button, color: 'rgba(255,255,255,0.7)', fontSize: 16 },

  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { paddingTop: 60, paddingBottom: 40, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden' },
  backToLandingBtn: { position: 'absolute', top: 60, left: Spacing.xl, zIndex: 10, padding: Spacing.sm },
  headerContent: { alignItems: 'center', paddingHorizontal: Spacing.xxl, flexDirection: 'row', justifyContent: 'center', gap: Spacing.md },
  logoCircleSmall: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', ...Shadows.small },
  logoCircleSmallGradient: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  appNameSmall: { ...Typography.h2, color: '#FFFFFF' },
  
  formContainer: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl, paddingBottom: 60 },
  progressHeader: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  progressDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressDotActive: { backgroundColor: Colors.primary },
  
  formCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xxl, ...Shadows.medium, borderWidth: 1, borderColor: Colors.borderLight },
  formTitle: { ...Typography.h1, color: Colors.text, marginBottom: Spacing.xs },
  formSubtitle: { ...Typography.body, color: Colors.textSecondary, marginBottom: Spacing.xxl },
  
  inputGroup: { marginBottom: Spacing.lg },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.lg, height: 56 },
  inputIcon: { marginRight: Spacing.md },
  input: { flex: 1, ...Typography.bodyLarge, color: Colors.text, height: '100%' },
  eyeButton: { padding: Spacing.sm, marginLeft: Spacing.sm },
  
  label: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.sm, fontWeight: '500' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingVertical: 12, borderRadius: Radius.full, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, gap: Spacing.xs },
  chipActive: { backgroundColor: Colors.primarySoft, borderColor: Colors.primary },
  chipText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: Colors.primaryDark, fontWeight: '600' },
  
  stepNavRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm },
  stepBackBtn: { width: 56, height: 56, borderRadius: Radius.md, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepSkipBtn: { width: 70, height: 56, borderRadius: Radius.md, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginLeft: Spacing.md },
  stepSkipBtnText: { ...Typography.buttonSmall, color: Colors.textSecondary },
  
  submitButton: { marginTop: Spacing.sm, borderRadius: Radius.md, overflow: 'hidden', ...Shadows.small },
  submitButtonDisabled: { opacity: 0.7 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 18, gap: Spacing.sm },
  submitText: { ...Typography.button, color: Colors.textOnPrimary },
  
  toggleButton: { marginTop: Spacing.xxl, alignItems: 'center' },
  toggleText: { ...Typography.body, color: Colors.textSecondary },
  toggleTextBold: { color: Colors.primary, fontWeight: '600' },
  
  sliderTrack: { flexDirection: 'row', gap: 6, marginTop: Spacing.sm },
  sliderDot: { flex: 1, height: 12, borderRadius: 6, backgroundColor: Colors.border },
  
  landingGoogleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    borderColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    paddingVertical: 18,
    borderRadius: Radius.full,
    gap: Spacing.md,
    ...Shadows.small,
  },
  landingGoogleButtonText: {
    ...Typography.button,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.lg,
  },
  horizontalDivider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.bodySmall,
    color: Colors.textTertiary,
    marginHorizontal: Spacing.md,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1.5,
    paddingVertical: 16,
    borderRadius: Radius.md,
    gap: Spacing.md,
    ...Shadows.small,
  },
  googleButtonText: {
    ...Typography.button,
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
