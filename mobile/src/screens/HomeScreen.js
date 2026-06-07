// Sense Health — Premium Home Dashboard
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { useAuth } from '../context/AuthContext';
import { analysisAPI, dataAPI } from '../api/client';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import HealthRing from '../components/HealthRing';
import CategoryCard from '../components/CategoryCard';
import QuickAction from '../components/QuickAction';
import FloatingParticles from '../components/animations/FloatingParticles';
import PulseGlow from '../components/animations/PulseGlow';
import AnimatedEntry from '../components/animations/AnimatedEntry';
import ShimmerEffect from '../components/animations/ShimmerEffect';
import AbstractWaveSvg from '../components/illustrations/AbstractWaveSvg';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Calendar State
  const [logsList, setLogsList] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, riskRes, logsRes] = await Promise.allSettled([
        analysisAPI.getSummary(),
        analysisAPI.getRisk(),
        dataAPI.getLogs({ limit: 30 }),
      ]);
      if (summaryRes.status === 'fulfilled') setSummary(summaryRes.value.data.data);
      if (riskRes.status === 'fulfilled') setRiskData(riskRes.value.data.data);
      if (logsRes.status === 'fulfilled') setLogsList(logsRes.value.data.data || []);

      const today = new Date().toISOString().split('T')[0];
      try {
        const logRes = await dataAPI.getLog(today);
        setTodayLog(logRes.data.data);
      } catch { setTodayLog(null); }
    } catch (err) {
      console.log('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] || 'there';
  const healthScore = summary?.healthScore || 0;

  const getRiskLabel = () => {
    if (healthScore >= 80) return 'Optimal Health';
    if (healthScore >= 60) return 'Low Stress Risk';
    if (healthScore >= 40) return 'Moderate Stress Risk';
    if (healthScore > 0) return 'High Stress Risk';
    return 'Analyzing Data...';
  };

  const getHealthColor = () => {
    if (healthScore >= 80) return Colors.riskLow;
    if (healthScore >= 60) return Colors.primary;
    if (healthScore >= 40) return Colors.riskModerate;
    return Colors.riskCritical;
  };

  // Calendar Logic
  const getCalendarDays = () => {
    const today = new Date();
    const { year, month } = calendarMonth;
    const firstDayInstance = new Date(year, month, 1);
    let startDayIdx = firstDayInstance.getDay() - 1;
    if (startDayIdx === -1) startDayIdx = 6;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < startDayIdx; i++) {
      days.push({ dayNum: null, dateStr: null, entryType: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const matchingLog = logsList.find(log => {
        if (!log.date) return false;
        return log.date.split('T')[0] === dateStr;
      });
      let entryType = null;
      let logDetails = null;
      if (matchingLog) {
        const hasUser = matchingLog.sleep?.hoursSlept != null || matchingLog.mental?.mood != null ||
          matchingLog.nutrition?.waterIntake != null || matchingLog.symptoms?.length > 0;
        const hasApp = (matchingLog.activity?.steps > 0) || (matchingLog.screenTime?.totalHours > 0);
        if (hasUser && hasApp) entryType = 'both';
        else if (hasUser) entryType = 'user';
        else if (hasApp) entryType = 'app';
        logDetails = matchingLog;
      }
      days.push({
        dayNum: d, dateStr, entryType, logDetails,
        isToday: d === today.getDate() && month === today.getMonth() && year === today.getFullYear(),
      });
    }
    return days;
  };

  const goToPrevMonth = () => {
    setCalendarMonth(prev => {
      let m = prev.month - 1;
      let y = prev.year;
      if (m < 0) { m = 11; y -= 1; }
      return { year: y, month: m };
    });
    setSelectedDay(null);
  };

  const goToNextMonth = () => {
    const now = new Date();
    setCalendarMonth(prev => {
      let m = prev.month + 1;
      let y = prev.year;
      if (m > 11) { m = 0; y += 1; }
      // Don't go past the current month
      if (y > now.getFullYear() || (y === now.getFullYear() && m > now.getMonth())) {
        return prev;
      }
      return { year: y, month: m };
    });
    setSelectedDay(null);
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return calendarMonth.year === now.getFullYear() && calendarMonth.month === now.getMonth();
  };

  const getDayGradient = (entryType) => {
    if (entryType === 'both') return Colors.gradientTeal;
    if (entryType === 'user') return Colors.gradientAccent;
    if (entryType === 'app') return Colors.gradientSecondary;
    return null;
  };

  const renderCalendar = () => {
    const days = getCalendarDays();
    const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return (
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={goToPrevMonth} style={styles.calNavBtn}>
            <Ionicons name="chevron-back" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.calendarHeaderCenter}>
            <Text style={styles.calendarCardTitle}>Wellness Tracking</Text>
            <Text style={styles.calendarCardSub}>Consistency across manual entries & auto-sync</Text>
          </View>
          <View style={styles.calendarMonthBadge}>
            <Text style={styles.calendarMonthText} numberOfLines={1}>
              {new Date(calendarMonth.year, calendarMonth.month).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
            </Text>
          </View>
          <TouchableOpacity onPress={goToNextMonth} style={[styles.calNavBtn, isCurrentMonth() && { opacity: 0.3 }]} disabled={isCurrentMonth()}>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.weekdayRow}>
          {weekdays.map((d, idx) => (
            <Text key={idx} style={styles.weekdayText}>{d}</Text>
          ))}
        </View>

        <View style={styles.daysGrid}>
          {days.map((item, idx) => {
            if (!item.dayNum) return <View key={idx} style={styles.emptyDayCell} />;
            const gradient = getDayGradient(item.entryType);
            const isSelected = selectedDay && selectedDay.dateStr === item.dateStr;

            return (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.dayCell,
                  !gradient && styles.dayCellEmpty,
                ]}
                onPress={() => setSelectedDay(item)}
                activeOpacity={0.8}
              >
                {gradient ? (
                  <LinearGradient
                    colors={gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.dayCellGradient}
                  >
                    <Text style={[styles.dayText, { color: '#FFFFFF' }]}>{item.dayNum}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={[styles.dayText, item.isToday && styles.todayDayText]}>{item.dayNum}</Text>
                )}
                {item.isToday && !gradient && <View style={styles.todayDot} />}

                {/* Premium Today Indicator Ring Overlay */}
                {item.isToday && (
                  <View style={styles.todayOverlayRing} />
                )}

                {/* Premium Active Selection Ring Overlay */}
                {isSelected && (
                  <View style={styles.selectedDayOverlayRing} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legendRow}>
          {[
            { color: Colors.gradientAccent, label: 'Manual' },
            { color: Colors.gradientSecondary, label: 'Auto-Sync' },
            { color: Colors.gradientTeal, label: 'Full Sync' },
          ].map((item, idx) => (
            <View key={idx} style={styles.legendItem}>
              <LinearGradient colors={item.color} style={styles.legendDot} />
              <Text style={styles.legendLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* Selected day detail */}
        {selectedDay && (
          <View style={styles.summaryPanel}>
            <View style={styles.summaryPanelHeader}>
              <Text style={styles.summaryDateText}>
                {new Date(selectedDay.dateStr + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDay(null)}>
                <Ionicons name="close-circle" size={20} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
            {selectedDay.entryType ? (
              <View style={{ width: '100%' }}>
                <View style={styles.summaryMetricsRow}>
                  {selectedDay.logDetails?.sleep?.hoursSlept != null && (
                    <View style={styles.metricBubble}>
                      <Ionicons name="moon" size={12} color="#4A90E2" />
                      <Text style={styles.metricBubbleText}>{selectedDay.logDetails.sleep.hoursSlept}h Sleep</Text>
                    </View>
                  )}
                  {selectedDay.logDetails?.activity?.steps > 0 && (
                    <View style={styles.metricBubble}>
                      <Ionicons name="footsteps" size={12} color={Colors.primary} />
                      <Text style={styles.metricBubbleText}>{selectedDay.logDetails.activity.steps} Steps</Text>
                    </View>
                  )}
                  {selectedDay.logDetails?.nutrition?.waterIntake != null && (
                    <View style={styles.metricBubble}>
                      <Ionicons name="water" size={12} color="#00C9FF" />
                      <Text style={styles.metricBubbleText}>{(selectedDay.logDetails.nutrition.waterIntake * 0.25).toFixed(1)} L</Text>
                    </View>
                  )}
                  {selectedDay.logDetails?.mental?.mood != null && (
                    <View style={styles.metricBubble}>
                      <Ionicons name="heart" size={12} color="#9013FE" />
                      <Text style={styles.metricBubbleText}>Mood {selectedDay.logDetails.mental.mood}/10</Text>
                    </View>
                  )}
                </View>
                {selectedDay.logDetails?.notes ? (
                  <View style={styles.journalNoteBox}>
                    <View style={styles.journalNoteHeader}>
                      <Ionicons name="book-outline" size={13} color={Colors.primaryDark} />
                      <Text style={styles.journalNoteTitle}>Daily Reflection</Text>
                    </View>
                    <Text style={styles.journalNoteText}>
                      "{selectedDay.logDetails.notes}"
                    </Text>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.emptyDaySummary}>
                <Text style={styles.emptySummaryText}>No metrics recorded.</Text>
                {selectedDay.isToday && (
                  <TouchableOpacity style={styles.summaryLogBtn} onPress={() => navigation.navigate('LogTab')}>
                    <LinearGradient colors={Colors.gradientPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.summaryLogBtnGradient}>
                      <Text style={styles.summaryLogBtnText}>Log Now</Text>
                      <Ionicons name="add-circle" size={14} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const insights = riskData?.recommendations?.length > 0 ? riskData.recommendations : [
    "You slept 2 hours less than usual this week.",
    "Your screen-time after midnight increased by 40%.",
    "Your reaction speed is slightly slower today."
  ];

  if (loading) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <LinearGradient colors={Colors.gradientHeaderDark} style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <ShimmerEffect width={100} height={20} style={{ marginBottom: 8 }} />
                <ShimmerEffect width={150} height={32} />
              </View>
              <ShimmerEffect width={48} height={48} borderRadius={24} />
            </View>
            <View style={styles.healthScoreCard}>
              <View style={styles.scoreRow}>
                <ShimmerEffect width={90} height={90} borderRadius={45} />
                <View style={styles.scoreTextContainer}>
                  <ShimmerEffect width={120} height={12} style={{ marginBottom: 8 }} />
                  <ShimmerEffect width={80} height={40} style={{ marginBottom: 8 }} />
                  <ShimmerEffect width={140} height={24} borderRadius={12} />
                </View>
              </View>
            </View>
          </LinearGradient>
          <View style={{ padding: Spacing.xxl }}>
            <ShimmerEffect width={200} height={20} style={{ marginBottom: Spacing.md }} />
            <ShimmerEffect width={width - Spacing.xxl * 2} height={80} borderRadius={Radius.md} style={{ marginBottom: Spacing.xl }} />

            <ShimmerEffect width={120} height={20} style={{ marginBottom: Spacing.md }} />
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl }}>
              <ShimmerEffect width={80} height={80} borderRadius={Radius.md} />
              <ShimmerEffect width={80} height={80} borderRadius={Radius.md} />
              <ShimmerEffect width={80} height={80} borderRadius={Radius.md} />
            </View>

            <ShimmerEffect width={width - Spacing.xxl * 2} height={200} borderRadius={Radius.xl} />
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Dark Gradient Hero Header ── */}
        <LinearGradient colors={Colors.gradientHeaderDark} style={styles.header}>
          <FloatingParticles count={8} containerHeight={280} />

          <AnimatedEntry preset="fadeUp" duration={800}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>{getGreeting()},</Text>
                <Text style={styles.userName}>{firstName}</Text>
              </View>
              <TouchableOpacity style={styles.profileButton} onPress={() => navigation.navigate('ProfileTab')}>
                <LinearGradient colors={Colors.gradientPrimary} style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Health Score Card */}
            <TouchableOpacity activeOpacity={0.95} onPress={() => navigation.navigate('AnalyticsTab')}>
              <View style={styles.healthScoreCard}>
                <View style={styles.scoreRow}>
                  <PulseGlow size={90} color="rgba(255, 255, 255, 0.4)" ringCount={2}>
                    <HealthRing score={healthScore} size={90} strokeWidth={8} color="#FFFFFF" showLabel={true} labelText="Score" />
                  </PulseGlow>
                  <View style={styles.scoreTextContainer}>
                    <Text style={styles.scoreTitle}>DAILY HEALTH SCORE</Text>
                    <Text style={styles.scoreValue}>
                      {healthScore}<Text style={styles.scoreMax}>/100</Text>
                    </Text>
                    <View style={styles.statusPillContainer}>
                      <View style={styles.statusPill}>
                        <View style={[styles.statusDot, { backgroundColor: getHealthColor() }]} />
                        <Text style={styles.statusText}>{getRiskLabel()}</Text>
                      </View>
                    </View>
                  </View>
                </View>
                {/* Mini metric pills */}
                <View style={styles.miniMetricRow}>
                  {[
                    { icon: 'moon', val: todayLog?.sleep?.hoursSlept ? `${todayLog.sleep.hoursSlept}h` : '--', label: 'Sleep' },
                    { icon: 'footsteps', val: todayLog?.activity?.steps ? `${(todayLog.activity.steps/1000).toFixed(1)}k` : '--', label: 'Steps' },
                    { icon: 'water', val: todayLog?.nutrition?.waterIntake ? `${(todayLog.nutrition.waterIntake * 0.25).toFixed(1)}L` : '--', label: 'Water' },
                  ].map((m, i) => (
                    <View key={i} style={styles.miniMetric}>
                      <Ionicons name={m.icon} size={12} color="rgba(255,255,255,0.6)" />
                      <Text style={styles.miniMetricVal}>{m.val}</Text>
                      <Text style={styles.miniMetricLabel}>{m.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </TouchableOpacity>
          </AnimatedEntry>
        </LinearGradient>
        <AbstractWaveSvg colors={['#52A8A2', Colors.background]} opacity={0.12} style={styles.waveDivider} />

        {/* ── AI Suggestions Banner ── */}
        <AnimatedEntry preset="fadeUp" delay={150} style={styles.section}>
          <TouchableOpacity style={styles.aiBannerContainer} onPress={() => navigation.navigate('AISuggestions')} activeOpacity={0.9}>
            <LinearGradient
              colors={['#9013FE', '#BD10E0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiBannerGradient}
            >
              <View style={styles.aiBannerContent}>
                <View style={styles.aiBannerTextContainer}>
                  <View style={styles.aiBadge}>
                    <Ionicons name="sparkles" size={10} color="#FFFFFF" />
                    <Text style={styles.aiBadgeText}>AI POWERED</Text>
                  </View>
                  <Text style={styles.aiBannerTitle}>Personal Wellness Coach</Text>
                  <Text style={styles.aiBannerSub}>Tap for your personalized daily plan</Text>
                </View>
                <LottieView
                  source={require('../../assets/animations/meditation.json')}
                  autoPlay loop
                  style={styles.aiBannerLottie}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </AnimatedEntry>

        {/* ── Quick Actions ── */}
        <AnimatedEntry preset="fadeUp" delay={250} style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
            <QuickAction icon="body-outline" label="Log Health" color={Colors.primary} gradient={Colors.gradientPrimary} onPress={() => navigation.navigate('LogTab')} />
            <QuickAction icon="leaf-outline" label="Breathing" color="#40C057" gradient={Colors.gradientEmerald} onPress={() => navigation.navigate('Breathing')} />
            <QuickAction icon="game-controller-outline" label="Games" color={Colors.accent} gradient={Colors.gradientAccent} onPress={() => navigation.navigate('GamesTab')} />
            <QuickAction icon="book-outline" label="Journal" color={Colors.warm} gradient={Colors.gradientWarm} onPress={() => navigation.navigate('Journal')} />
          </ScrollView>
        </AnimatedEntry>

        {/* ── Calendar ── */}
        <AnimatedEntry preset="fadeUp" delay={350} style={styles.section}>
          {renderCalendar()}
        </AnimatedEntry>

        {/* ── Health Categories ── */}
        <AnimatedEntry preset="fadeUp" delay={450} style={styles.section}>
          <Text style={styles.sectionTitle}>Health Categories</Text>
          {riskData?.categories?.length > 0 ? (
            riskData.categories.map((cat, idx) => (
              <CategoryCard key={idx} category={cat} delay={idx * 80} />
            ))
          ) : (
            [
              { name: 'sleep', label: 'Sleep', score: 85, message: 'You slept well last night.' },
              { name: 'mental', label: 'Stress', score: 60, message: 'Moderate stress detected.' },
              { name: 'activity', label: 'Activity', score: 40, message: 'Move more today.' },
              { name: 'focus', label: 'Focus', score: 90, message: 'High cognitive state.' },
              { name: 'vitals', label: 'Recovery', score: 75, message: 'Good recovery trend.' },
            ].map((cat, idx) => (
              <CategoryCard key={idx} category={cat} delay={idx * 80} />
            ))
          )}
        </AnimatedEntry>

        <View style={{ height: Spacing.xxxl * 2 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: Spacing.xxxl },

  // ── Dark Hero Header ──
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  decorCircle1: {
    position: 'absolute', top: -40, right: -40,
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: 'rgba(82, 168, 162, 0.08)',
  },
  decorCircle2: {
    position: 'absolute', bottom: -20, left: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(140, 179, 105, 0.06)',
  },
  headerTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  greeting: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  userName: { ...Typography.h1, color: '#FFFFFF' },
  profileButton: { padding: 2 },
  avatarCircle: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { ...Typography.h3, color: '#FFFFFF', fontWeight: '700' },

  // Health score
  healthScoreCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center' },
  scoreTextContainer: { marginLeft: Spacing.xl, flex: 1 },
  scoreTitle: {
    ...Typography.labelSmall, color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: 1.5, marginBottom: 4, fontSize: 10,
  },
  scoreValue: { fontSize: 42, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  scoreMax: { fontSize: 18, color: 'rgba(255, 255, 255, 0.4)', fontWeight: 'normal' },
  statusPillContainer: { flexDirection: 'row', marginTop: Spacing.xs },
  statusPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: Spacing.md, paddingVertical: 5,
    borderRadius: Radius.full, gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...Typography.caption, color: '#FFFFFF', fontWeight: '700', fontSize: 11 },

  miniMetricRow: {
    flexDirection: 'row', justifyContent: 'space-around',
    marginTop: Spacing.lg, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  miniMetric: { alignItems: 'center', gap: 2 },
  miniMetricVal: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  miniMetricLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 10, fontWeight: '600' },

  // ── Sections ──
  section: { paddingHorizontal: Spacing.xxl, marginTop: Spacing.xl },
  sectionTitle: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.lg },

  // AI Banner
  aiBannerContainer: { borderRadius: Radius.xl, ...Shadows.large, overflow: 'hidden' },
  aiBannerGradient: { padding: Spacing.xl },
  aiBannerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiBannerTextContainer: { flex: 1, paddingRight: Spacing.md },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full, alignSelf: 'flex-start', marginBottom: Spacing.sm,
  },
  aiBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  aiBannerTitle: { ...Typography.h2, color: '#FFFFFF', marginBottom: 4 },
  aiBannerSub: { ...Typography.bodySmall, color: 'rgba(255,255,255,0.85)' },
  aiBannerLottie: { width: 64, height: 64 },

  // Quick Actions
  quickActionsScroll: { gap: Spacing.sm, flexDirection: 'row', paddingRight: Spacing.xxl },

  // ── Calendar ──
  calendarCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.xl, ...Shadows.medium,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  calendarHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  calendarHeaderCenter: {
    flex: 1, marginHorizontal: Spacing.xs,
  },
  calNavBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  calendarCardTitle: { ...Typography.h3, color: Colors.text, fontSize: 15, fontWeight: '700' },
  calendarCardSub: { ...Typography.caption, color: Colors.textSecondary, fontSize: 10, marginTop: 2 },
  calendarMonthBadge: {
    backgroundColor: Colors.primarySoft, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, flexShrink: 0, marginHorizontal: 4,
  },
  calendarMonthText: { ...Typography.caption, color: Colors.primaryDark, fontWeight: '700', fontSize: 11 },

  weekdayRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs, paddingHorizontal: 2 },
  weekdayText: {
    width: 34, textAlign: 'center', fontSize: 10, fontWeight: '700',
    color: Colors.textTertiary, textTransform: 'uppercase',
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 6 },
  emptyDayCell: { width: 34, height: 34 },
  dayCell: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  dayCellEmpty: { backgroundColor: Colors.background },
  dayCellGradient: {
    width: '100%', height: '100%', borderRadius: 17,
    justifyContent: 'center', alignItems: 'center',
  },
  todayOverlayRing: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  selectedDayOverlayRing: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: Colors.secondary, // Muted Navy for visual prominence
  },
  dayText: { fontSize: 11.5, fontWeight: '600', color: Colors.text },
  todayDayText: { fontWeight: '800', color: Colors.primary },
  todayDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: Colors.primary, position: 'absolute', bottom: 2,
  },

  legendRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginTop: Spacing.md, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },

  // Summary Panel
  summaryPanel: {
    marginTop: Spacing.md, backgroundColor: Colors.background,
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  summaryPanelHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  summaryDateText: { ...Typography.caption, fontWeight: '700', color: Colors.text },
  summaryMetricsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  metricBubble: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.borderLight, gap: 4,
  },
  metricBubbleText: { fontSize: 11, fontWeight: '600', color: Colors.text },
  emptyDaySummary: { alignItems: 'center', paddingVertical: 8 },
  emptySummaryText: { ...Typography.bodySmall, color: Colors.textSecondary, fontSize: 12, marginBottom: 8 },
  summaryLogBtn: { borderRadius: Radius.full, overflow: 'hidden' },
  summaryLogBtnGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  summaryLogBtnText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  
  // Daily Reflection Styles
  journalNoteBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  journalNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  journalNoteTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  journalNoteText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 16,
  },
  waveDivider: {
    marginTop: -20,
    width: width,
    height: 30,
    zIndex: 10,
  },
});
