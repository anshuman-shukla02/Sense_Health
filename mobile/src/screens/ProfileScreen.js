// Sense Health — Profile Screen
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, ImageBackground,
  Platform, KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  
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
        
        {/* Dynamic Header */}
        <LinearGradient colors={[Colors.primarySoft, Colors.background]} style={styles.header}>
          <View style={styles.headerTopRow}>
            <Text style={styles.headerGreeting}>Hello, {firstName}</Text>
            <TouchableOpacity style={styles.logoutIconBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.avatarContainer}>
            <LinearGradient colors={Colors.gradientPrimary} style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{user?.name || 'Your Name'}</Text>
              <Text style={styles.headerEmail}>{user?.email || 'email@example.com'}</Text>
              <View style={styles.badge}>
                <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
                <Text style={styles.badgeText}>Verified Member</Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Main Info Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="person-circle" size={24} color={Colors.primary} />
                <Text style={styles.cardTitle}>Personal Details</Text>
              </View>
              {!editing && (
                <TouchableOpacity onPress={() => setEditing(true)} style={styles.actionBtn}>
                  <Ionicons name="pencil" size={18} color={Colors.textInverse} />
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
              <TouchableOpacity style={styles.saveBtnBottom} onPress={handleSave}>
                {loading ? <ActivityIndicator size="small" color={Colors.textInverse} /> : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color={Colors.textInverse} />
                    <Text style={styles.saveBtnTextBottom}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Health Status Card */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="pulse" size={24} color={Colors.accent} />
                <Text style={styles.cardTitle}>System Status</Text>
              </View>
            </View>
            <View style={styles.statusBox}>
              <View style={[styles.statusIndicator, { backgroundColor: user?.baselineEstablished ? Colors.success : Colors.warning }]} />
              <View style={{ flex: 1 }}>
                <Text style={styles.statusBoxTitle}>
                  {user?.baselineEstablished ? 'Baseline Active' : 'Calibration Mode'}
                </Text>
                <Text style={styles.statusBoxDesc}>
                  {user?.baselineEstablished 
                    ? 'AI analysis is actively monitoring your health trends.' 
                    : 'Logging data daily helps establish your health baseline.'}
                </Text>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProfileRow({ icon, label, children, editing, noBorder }) {
  return (
    <View style={[styles.row, !noBorder && styles.rowBorder, editing && styles.rowEditing]}>
      <View style={styles.rowLabelContainer}>
        <View style={styles.rowIcon}>
          <Ionicons name={icon} size={18} color={Colors.textSecondary} />
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
  header: {
    paddingTop: 70,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: 40,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  headerGreeting: { ...Typography.displayMedium, fontSize: 32, color: Colors.text },
  logoutIconBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center', ...Shadows.small },
  avatarContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  avatarCircle: { width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', ...Shadows.medium },
  avatarText: { ...Typography.displayLarge, color: Colors.textInverse },
  headerInfo: { flex: 1 },
  headerName: { ...Typography.h1, color: Colors.text, marginBottom: 2 },
  headerEmail: { ...Typography.bodySmall, color: Colors.textSecondary, marginBottom: Spacing.sm },
  badge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full, alignSelf: 'flex-start', gap: 4, ...Shadows.small },
  badgeText: { ...Typography.caption, fontWeight: '600', color: Colors.text },
  
  content: { paddingHorizontal: Spacing.xxl, marginTop: -20 },
  card: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.xl, marginBottom: Spacing.lg, ...Shadows.medium },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg, paddingBottom: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  cardTitle: { ...Typography.h2, color: Colors.text },
  actionBtn: { backgroundColor: Colors.primary, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  
  saveBtnBottom: { flexDirection: 'row', backgroundColor: Colors.primary, paddingVertical: 14, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.lg, gap: Spacing.sm },
  saveBtnTextBottom: { ...Typography.button, color: Colors.textInverse },
  
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  rowEditing: { flexDirection: 'column', alignItems: 'flex-start', gap: Spacing.xs },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, width: 110 },
  rowIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '500' },
  rowContent: { flex: 1, alignItems: 'flex-end', justifyContent: 'center' },
  rowContentEditing: { alignItems: 'flex-start', width: '100%', paddingLeft: 40 },
  valueText: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  
  input: { ...Typography.body, color: Colors.text, backgroundColor: Colors.background, paddingHorizontal: Spacing.md, paddingVertical: 10, borderRadius: Radius.md, width: '100%', borderWidth: 1, borderColor: Colors.border },
  inputWithSuffix: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: Spacing.md, width: '100%' },
  inputNumber: { flex: 1, ...Typography.body, color: Colors.text, paddingVertical: 10 },
  suffixText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '600', paddingLeft: Spacing.sm },
  
  chipContainer: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  genderChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border },
  genderChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  genderChipText: { ...Typography.caption, color: Colors.textSecondary, fontWeight: '600' },
  genderChipTextActive: { color: Colors.textInverse },

  statusBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.background, borderRadius: Radius.lg, padding: Spacing.md, gap: Spacing.md },
  statusIndicator: { width: 12, height: 12, borderRadius: 6 },
  statusBoxTitle: { ...Typography.body, color: Colors.text, fontWeight: '600', marginBottom: 2 },
  statusBoxDesc: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },
});
