// Sense Health — Premium Profile Screen
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Animated,
  Platform, KeyboardAvoidingView, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import FloatingParticles from '../components/animations/FloatingParticles';
import AnimatedEntry from '../components/animations/AnimatedEntry';
import AnimatedCounter from '../components/animations/AnimatedCounter';
import { HealthPulseSvg } from '../components/illustrations';
import ReAnimated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, Easing, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const rotation = useSharedValue(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 12, useNativeDriver: true }),
    ]).start();
    
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const [form, setForm] = useState({
    name: user?.name || '',
    age: user?.age?.toString() || '',
    gender: user?.gender?.toLowerCase() || '',
    height: user?.height?.toString() || '',
    weight: user?.weight?.toString() || '',
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await authAPI.updateProfile({
        name: form.name,
        age: form.age ? parseInt(form.age) : undefined,
        gender: form.gender || undefined,
        height: form.height ? parseFloat(form.height) : undefined,
        weight: form.weight ? parseFloat(form.weight) : undefined,
      });
      await refreshUser();
      setEditing(false);
      Alert.alert('Saved!', 'Your profile has been updated successfully.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally { setLoading(false); }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: logout },
    ]);
  };

  const firstName = user?.name?.split(' ')[0] || 'User';

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Dark Gradient Hero ── */}
        <LinearGradient colors={Colors.gradientHeaderDark} style={styles.header}>
          <HealthPulseSvg width={width} height={180} style={styles.headerPulse} />
          <FloatingParticles count={10} containerHeight={240} />

          <AnimatedEntry preset="fadeUp" duration={600}>
            {/* Top row */}
            <View style={styles.headerTopRow}>
              <Text style={styles.headerGreeting}>Profile</Text>
              <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>

            {/* Avatar + Info */}
            <View style={styles.avatarSection}>
              <View style={styles.avatarContainer}>
                <ReAnimated.View style={[styles.avatarRing, animatedRingStyle]}>
                  <LinearGradient colors={['#52A8A2', '#9013FE', '#BD10E0']} style={StyleSheet.absoluteFill} />
                </ReAnimated.View>
                <LinearGradient colors={Colors.gradientPrimary} style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
              </View>
              <Text style={styles.headerName}>{user?.name || 'Your Name'}</Text>
              <Text style={styles.headerEmail}>{user?.email || 'email@example.com'}</Text>
              <View style={styles.verifiedBadge}>
                <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
                <Text style={styles.verifiedBadgeText}>Verified Member</Text>
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              {[
                { icon: 'calendar', value: '14', label: 'Days Logged' },
                { icon: 'heart', value: user?.baselineEstablished ? 'Active' : 'Setup', label: 'Baseline' },
                { icon: 'flame', value: '7', label: 'Day Streak' },
              ].map((stat, idx) => (
                <View key={idx} style={styles.statItem}>
                  <View style={styles.statIconCircle}>
                    <Ionicons name={stat.icon} size={14} color="#FFFFFF" />
                  </View>
                  {isNaN(stat.value) ? (
                    <Text style={styles.statValue}>{stat.value}</Text>
                  ) : (
                    <AnimatedCounter value={parseInt(stat.value)} style={styles.statValue} />
                  )}
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </AnimatedEntry>
        </LinearGradient>

        {/* ── Content ── */}
        <AnimatedEntry preset="fade" style={styles.content}>

          {/* Personal Details Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <LinearGradient colors={Colors.gradientPrimary} style={styles.cardIconGradient}>
                  <Ionicons name="person" size={16} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.cardTitle}>Personal Details</Text>
              </View>
              {!editing && (
                <TouchableOpacity onPress={() => setEditing(true)} style={styles.editBtn}>
                  <Ionicons name="pencil" size={14} color={Colors.primary} />
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <ProfileRow icon="text-outline" label="Full Name" editing={editing}>
              {editing ? (
                <TextInput style={styles.input} value={form.name} onChangeText={v => setForm({ ...form, name: v })} placeholder="Name" placeholderTextColor={Colors.textTertiary} />
              ) : (
                <Text style={styles.valueText}>{form.name || 'Not set'}</Text>
              )}
            </ProfileRow>

            <ProfileRow icon="calendar-outline" label="Age" editing={editing}>
              {editing ? (
                <TextInput style={styles.input} value={form.age} onChangeText={v => setForm({ ...form, age: v })} keyboardType="numeric" placeholder="e.g. 25" placeholderTextColor={Colors.textTertiary} />
              ) : (
                <Text style={styles.valueText}>{form.age ? `${form.age} yrs` : 'Not set'}</Text>
              )}
            </ProfileRow>

            <ProfileRow icon="body-outline" label="Gender" editing={editing} noBorder={editing}>
              {editing ? (
                <View style={styles.chipContainer}>
                  {['male', 'female', 'other'].map(g => (
                    <TouchableOpacity key={g} style={[styles.genderChip, form.gender === g && styles.genderChipActive]} onPress={() => setForm({ ...form, gender: g })}>
                      <Text style={[styles.genderChipText, form.gender === g && styles.genderChipTextActive]}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <Text style={styles.valueText}>{form.gender ? form.gender.charAt(0).toUpperCase() + form.gender.slice(1) : 'Not set'}</Text>
              )}
            </ProfileRow>

            <ProfileRow icon="resize-outline" label="Height" editing={editing}>
              {editing ? (
                <View style={styles.inputWithSuffix}>
                  <TextInput style={styles.inputNumber} value={form.height} onChangeText={v => setForm({ ...form, height: v })} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textTertiary} />
                  <Text style={styles.suffixText}>cm</Text>
                </View>
              ) : (
                <Text style={styles.valueText}>{form.height ? `${form.height} cm` : 'Not set'}</Text>
              )}
            </ProfileRow>

            <ProfileRow icon="scale-outline" label="Weight" editing={editing} noBorder>
              {editing ? (
                <View style={styles.inputWithSuffix}>
                  <TextInput style={styles.inputNumber} value={form.weight} onChangeText={v => setForm({ ...form, weight: v })} keyboardType="decimal-pad" placeholder="0" placeholderTextColor={Colors.textTertiary} />
                  <Text style={styles.suffixText}>kg</Text>
                </View>
              ) : (
                <Text style={styles.valueText}>{form.weight ? `${form.weight} kg` : 'Not set'}</Text>
              )}
            </ProfileRow>

            {editing && (
              <TouchableOpacity style={styles.saveBtnWrap} onPress={handleSave}>
                <LinearGradient colors={Colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.saveBtn}>
                  {loading ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                      <Text style={styles.saveBtnText}>Save Changes</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

          {/* System Status Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <LinearGradient colors={user?.baselineEstablished ? Colors.gradientEmerald : Colors.gradientWarm} style={styles.cardIconGradient}>
                  <Ionicons name="pulse" size={16} color="#FFFFFF" />
                </LinearGradient>
                <Text style={styles.cardTitle}>System Status</Text>
              </View>
            </View>
            <View style={styles.statusBox}>
              <View style={styles.statusBoxLeft}>
                <Text style={styles.statusBoxTitle}>
                  {user?.baselineEstablished ? 'Baseline Active' : 'Calibration Mode'}
                </Text>
                <Text style={styles.statusBoxDesc}>
                  {user?.baselineEstablished
                    ? 'AI analysis is actively monitoring your health trends.'
                    : 'Logging data daily helps establish your health baseline.'}
                </Text>
              </View>
              {/* Status bar */}
              <View style={styles.statusBarBg}>
                <LinearGradient
                  colors={user?.baselineEstablished ? Colors.gradientEmerald : Colors.gradientWarm}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.statusBarFill, { width: user?.baselineEstablished ? '100%' : '40%' }]}
                />
              </View>
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={18} color={Colors.riskCritical} />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>

        </AnimatedEntry>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProfileRow({ icon, label, children, editing, noBorder }) {
  return (
    <View style={[styles.row, !noBorder && styles.rowBorder, editing && styles.rowEditing]}>
      <View style={styles.rowLabelContainer}>
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={16} color={Colors.textSecondary} />
        </View>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={[styles.rowContent, editing && styles.rowContentEditing]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingBottom: 100 },

  // ── Dark Hero Header ──
  header: {
    paddingTop: 60, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl,
    borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute', top: -40, right: -30, width: 140, height: 140,
    borderRadius: 70, backgroundColor: 'rgba(82, 168, 162, 0.08)',
  },
  headerDecor2: {
    position: 'absolute', bottom: -20, left: -20, width: 100, height: 100,
    borderRadius: 50, backgroundColor: 'rgba(140, 179, 105, 0.06)',
  },
  headerTopRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  headerGreeting: { ...Typography.h1, color: '#FFFFFF' },
  logoutIconBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarContainer: {
    width: 96, height: 96, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
  },
  avatarRing: {
    position: 'absolute', width: 96, height: 96, borderRadius: 48, overflow: 'hidden', padding: 3,
  },
  avatarCircle: {
    width: 84, height: 84, borderRadius: 42,
    alignItems: 'center', justifyContent: 'center', zIndex: 1,
  },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#FFFFFF' },
  headerName: { ...Typography.h1, color: '#FFFFFF', marginBottom: 2 },
  headerEmail: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.6)', marginBottom: Spacing.sm },
  verifiedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  verifiedBadgeText: { ...Typography.caption, fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.8)' },
 
  statsRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  statItem: { alignItems: 'center', gap: 4 },
  statIconCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '600' },
 
  // ── Content ──
  content: { paddingHorizontal: Spacing.xxl, marginTop: -16 },
 
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadows.medium,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardIconGradient: {
    width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { ...Typography.h3, color: Colors.text, fontSize: 17 },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primarySoft, paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: Radius.full,
  },
  editBtnText: { ...Typography.caption, color: Colors.primaryDark, fontWeight: '600' },
 
  saveBtnWrap: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.lg },
  saveBtn: {
    flexDirection: 'row', paddingVertical: 14, alignItems: 'center',
    justifyContent: 'center', gap: Spacing.sm,
  },
  saveBtnText: { ...Typography.button, color: '#FFFFFF' },
 
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  rowEditing: { flexDirection: 'column', alignItems: 'flex-start', gap: Spacing.xs },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, width: 110 },
  rowIcon: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500' },
  rowContent: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  rowContentEditing: { alignItems: 'flex-start', width: '100%', paddingLeft: 40 },
  valueText: { ...Typography.body, color: Colors.text, fontWeight: '600' },
 
  input: {
    ...Typography.body, color: Colors.text, backgroundColor: Colors.background,
    paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.md,
    width: '100%', borderWidth: 1, borderColor: Colors.border,
  },
  inputWithSuffix: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, width: '100%',
  },
  inputNumber: { flex: 1, ...Typography.body, color: Colors.text, paddingVertical: 10 },
  suffixText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '600', paddingLeft: Spacing.sm },
 
  chipContainer: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  genderChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  genderChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderChipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  genderChipTextActive: { color: '#FFFFFF' },
 
  // System Status
  statusBox: {
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  statusBoxLeft: { marginBottom: Spacing.md },
  statusBoxTitle: { ...Typography.body, color: Colors.text, fontWeight: '700', marginBottom: 4 },
  statusBoxDesc: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
  statusBarBg: {
    width: '100%', height: 6, borderRadius: 3,
    backgroundColor: Colors.borderLight, overflow: 'hidden',
  },
  statusBarFill: { height: '100%', borderRadius: 3 },
 
  // Logout
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: 16, borderRadius: Radius.lg,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: '#FFCDD2',
    ...Shadows.small,
  },
  logoutBtnText: { ...Typography.button, color: Colors.riskCritical, fontSize: 15 },
  headerPulse: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    opacity: 0.15,
  },
});
