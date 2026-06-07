// Sense Health — Premium Permissions Screen
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Pedometer } from 'expo-sensors';
import { useAuth } from '../context/AuthContext';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import { requestNotificationPermission, scheduleHydrationReminders, cancelAllReminders } from '../services/NotificationService';
import { ShieldCheckSvg } from '../components/illustrations';
import FloatingParticles from '../components/animations/FloatingParticles';
import AnimatedEntry from '../components/animations/AnimatedEntry';
import ReAnimated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

function PermissionCardItem({ perm, granted, onToggle, index }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scale, { toValue: 1.03, friction: 3, tension: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1.0, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
  }, [granted]);

  return (
    <AnimatedEntry preset="fadeUp" delay={index * 120}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <View style={[styles.permissionCard, granted && styles.permissionCardActive]}>
          <View style={styles.cardContent}>
            <LinearGradient colors={perm.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardIcon}>
              <Ionicons name={perm.icon} size={20} color="#FFFFFF" />
            </LinearGradient>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{perm.title}</Text>
              <Text style={styles.cardDesc}>{perm.desc}</Text>
            </View>
            <Switch
              value={granted}
              onValueChange={onToggle}
              trackColor={{ false: Colors.border, true: perm.gradient[0] }}
              thumbColor={Colors.surface}
            />
          </View>
        </View>
      </Animated.View>
    </AnimatedEntry>
  );
}

const PERMISSIONS = [
  {
    key: 'location',
    title: 'Location Context',
    desc: 'Detect environmental changes and calculate travel stress.',
    icon: 'location',
    gradient: ['#8CB369', '#B5D19A'],
  },
  {
    key: 'activity',
    title: 'Physical Activity',
    desc: 'Automatically log steps and correlate with mood patterns.',
    icon: 'footsteps',
    gradient: ['#52A8A2', '#85C7C3'],
  },
  {
    key: 'screenTime',
    title: 'Screen Time',
    desc: 'Infer digital exposure through app usage context.',
    icon: 'time',
    gradient: ['#3B5266', '#657E93'],
  },
  {
    key: 'notifications',
    title: 'Hydration Reminders',
    desc: 'Smart push notifications to keep you properly hydrated.',
    icon: 'notifications',
    gradient: ['#00ACC1', '#26C6DA'],
  },
];

export default function PermissionsScreen() {
  const { completePermissions } = useAuth();
  const [locationGranted, setLocationGranted] = useState(false);
  const [activityGranted, setActivityGranted] = useState(false);
  const [screenTimeGranted, setScreenTimeGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(false);
 
  const grantedCount = [locationGranted, activityGranted, screenTimeGranted, notificationsGranted].filter(Boolean).length;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(grantedCount / PERMISSIONS.length, { damping: 15, stiffness: 100 });
  }, [grantedCount]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const getGranted = (key) => {
    switch(key) {
      case 'location': return locationGranted;
      case 'activity': return activityGranted;
      case 'screenTime': return screenTimeGranted;
      case 'notifications': return notificationsGranted;
      default: return false;
    }
  };

  const togglePermission = async (key) => {
    switch(key) {
      case 'location':
        try {
          if (!locationGranted) {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') setLocationGranted(true);
          } else setLocationGranted(false);
        } catch(e) { console.log('Location error:', e); }
        break;
      case 'activity':
        try {
          if (!activityGranted) {
            const { status } = await Pedometer.requestPermissionsAsync();
            if (status === 'granted' || status === 'undetermined' || __DEV__) setActivityGranted(true);
          } else setActivityGranted(false);
        } catch(e) { console.log('Activity error:', e); setActivityGranted(!activityGranted); }
        break;
      case 'screenTime':
        setScreenTimeGranted(!screenTimeGranted);
        break;
      case 'notifications':
        try {
          if (!notificationsGranted) {
            const granted = await requestNotificationPermission();
            if (granted) {
              setNotificationsGranted(true);
              await scheduleHydrationReminders();
            }
          } else {
            setNotificationsGranted(false);
            await cancelAllReminders();
          }
        } catch(e) { console.log('Notification error:', e); }
        break;
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Dark Gradient Header ── */}
      <LinearGradient colors={Colors.gradientHeaderDark} style={styles.header}>
        <FloatingParticles count={10} containerHeight={260} />
        
        <AnimatedEntry preset="fadeUp" duration={600}>
          <ShieldCheckSvg width={100} height={100} style={{ marginBottom: Spacing.md }} />
          <Text style={styles.title}>Automate Your Health</Text>
          <Text style={styles.subtitle}>
            Allow Sense Health to passively collect metrics to predict cognitive fatigue and stress levels.
          </Text>
 
          {/* Progress */}
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{grantedCount}/{PERMISSIONS.length} enabled</Text>
            <View style={styles.progressBarBg}>
              <ReAnimated.View style={[styles.progressBarFill, progressStyle]}>
                <LinearGradient colors={Colors.gradientPrimary} style={StyleSheet.absoluteFill} />
              </ReAnimated.View>
            </View>
          </View>
        </AnimatedEntry>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {PERMISSIONS.map((perm, idx) => {
          const granted = getGranted(perm.key);
          return (
            <PermissionCardItem
              key={perm.key}
              perm={perm}
              granted={granted}
              onToggle={() => togglePermission(perm.key)}
              index={idx}
            />
          );
        })}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.continueBtnWrap}
          onPress={() => completePermissions({
            location: locationGranted, activity: activityGranted,
            screenTime: screenTimeGranted, notifications: notificationsGranted,
          })}
        >
          <LinearGradient colors={Colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.continueBtn}>
            <Text style={styles.continueBtnText}>Continue to Dashboard</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // ── Dark Header ──
  header: {
    paddingTop: 70, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl,
    alignItems: 'center', borderBottomLeftRadius: 32, borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  headerDecor1: {
    position: 'absolute', top: -30, right: -30, width: 140, height: 140,
    borderRadius: 70, backgroundColor: 'rgba(82, 168, 162, 0.08)',
  },
  iconCircle: { marginBottom: Spacing.lg },
  iconGradient: {
    width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center',
    ...Shadows.medium,
  },
  title: { ...Typography.displayMedium, color: '#FFFFFF', textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 22 },

  progressRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginTop: Spacing.lg, width: '100%',
  },
  progressText: { color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: '700', minWidth: 70 },
  progressBarBg: {
    flex: 1, height: 6, backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3, overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3, overflow: 'hidden' },

  // ── Content ──
  content: { padding: Spacing.xxl },
  permissionCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md,
    ...Shadows.small, borderWidth: 1, borderColor: Colors.borderLight,
  },
  permissionCardActive: { borderColor: Colors.primaryLight },
  cardContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  cardIcon: {
    width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1, marginRight: Spacing.sm },
  cardTitle: { ...Typography.h3, color: Colors.text, marginBottom: 3, fontSize: 15 },
  cardDesc: { ...Typography.caption, color: Colors.textSecondary, lineHeight: 17, fontSize: 12 },

  // ── Footer ──
  footer: {
    padding: Spacing.xxl, paddingBottom: 40,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  continueBtnWrap: { borderRadius: Radius.md, overflow: 'hidden', ...Shadows.medium },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: Spacing.sm,
  },
  continueBtnText: { ...Typography.button, color: '#FFFFFF' },
});
