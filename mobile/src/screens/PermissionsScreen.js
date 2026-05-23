// Sense Health — Permissions Screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { useAuth } from '../context/AuthContext';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';

export default function PermissionsScreen() {
  const { completePermissions } = useAuth();
  const [locationGranted, setLocationGranted] = useState(false);
  const [activityGranted, setActivityGranted] = useState(false);
  const [screenTimeGranted, setScreenTimeGranted] = useState(false);

  const requestLocation = async () => {
    try {
      if (!locationGranted) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          setLocationGranted(true);
        }
      } else {
        setLocationGranted(false);
      }
    } catch (e) {
      console.log('Location permission error:', e);
    }
  };

  const requestActivity = async () => {
    try {
      if (!activityGranted) {
        const { status } = await Pedometer.requestPermissionsAsync();
        // In an emulator, the hardware sensor might not exist, but we still want the toggle to work for demo purposes.
        if (status === 'granted' || status === 'undetermined' || __DEV__) { 
          setActivityGranted(true);
        }
      } else {
        setActivityGranted(false);
      }
    } catch (e) {
      console.log('Activity permission error:', e);
      // Fallback for emulator demo
      setActivityGranted(!activityGranted);
    }
  };

  const requestScreenTime = () => {
    // For iOS FamilyControls or Android UsageStats, we would request native OS permissions here.
    // For the hackathon/demo, we simulate the permission grant.
    setScreenTimeGranted(!screenTimeGranted);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.primarySoft, Colors.background]} style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="hardware-chip" size={48} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Automate Your Health</Text>
        <Text style={styles.subtitle}>
          Allow Sense Health to passively collect metrics like activity and location patterns to predict cognitive fatigue and stress levels.
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.permissionCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: Colors.accentSoft }]}>
              <Ionicons name="location" size={24} color={Colors.accent} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Location Context</Text>
              <Text style={styles.cardDesc}>Used to detect changes in environment and calculate travel stress.</Text>
            </View>
            <Switch 
              value={locationGranted} 
              onValueChange={requestLocation} 
              trackColor={{ false: Colors.border, true: Colors.accent }}
              thumbColor={Colors.surface}
            />
          </View>
        </View>

        <View style={styles.permissionCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: Colors.primarySoft }]}>
              <Ionicons name="footsteps" size={24} color={Colors.primary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Physical Activity</Text>
              <Text style={styles.cardDesc}>Automatically logs steps and movement to correlate with mood.</Text>
            </View>
            <Switch 
              value={activityGranted} 
              onValueChange={requestActivity} 
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor={Colors.surface}
            />
          </View>
        </View>

        <View style={styles.permissionCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: Colors.secondarySoft }]}>
              <Ionicons name="time" size={24} color={Colors.secondary} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>Screen Time</Text>
              <Text style={styles.cardDesc}>Inferred through app usage and device context.</Text>
            </View>
            <Switch 
              value={screenTimeGranted} 
              onValueChange={requestScreenTime}
              trackColor={{ false: Colors.border, true: Colors.secondary }}
              thumbColor={Colors.surface}
            />
          </View>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueBtn} onPress={() => completePermissions({ location: locationGranted, activity: activityGranted, screenTime: screenTimeGranted })}>
          <Text style={styles.continueBtnText}>Continue to Dashboard</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 80,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.medium
  },
  title: { ...Typography.displayMedium, color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  
  content: { padding: Spacing.xxl },
  permissionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.small
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, marginRight: Spacing.sm },
  cardTitle: { ...Typography.h3, color: Colors.text, marginBottom: 4 },
  cardDesc: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 18 },

  footer: {
    padding: Spacing.xxl,
    paddingBottom: 40,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  continueBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: Radius.md,
    gap: Spacing.sm,
    ...Shadows.medium
  },
  continueBtnText: { ...Typography.button, color: Colors.textInverse }
});
