// Sense Health — Premium Trends Dashboard
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { analysisAPI } from '../api/client';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import AreaChart from '../components/AreaChart';
import MetricStatCard from '../components/MetricStatCard';
import FloatingParticles from '../components/animations/FloatingParticles';
import AnimatedEntry from '../components/animations/AnimatedEntry';
import AnimatedCounter from '../components/animations/AnimatedCounter';
import ShimmerEffect from '../components/animations/ShimmerEffect';
import PulseGlow from '../components/animations/PulseGlow';
import { HealthPulseSvg, AbstractWaveSvg } from '../components/illustrations';

const { width } = Dimensions.get('window');

/* ── Helpers ────────────────────────────────────── */
const calcAvg = (arr) => {
  const valid = (arr || []).filter(v => v != null && v > 0);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
};

const calcTrend = (arr) => {
  const valid = (arr || []).filter(v => v != null && v > 0);
  if (valid.length < 2) return { dir: 'stable', pct: '0' };
  const latest = valid[valid.length - 1];
  const prev = valid[valid.length - 2];
  const pct = ((latest - prev) / prev * 100).toFixed(1);
  return { dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'stable', pct: Math.abs(pct).toString() };
};

/* ── Insight Generator ──────────────────────────── */
const generateInsights = (trends) => {
  const insights = [];
  if (!trends) return insights;

  const sleepAvg = calcAvg(trends.sleep?.hours);
  if (sleepAvg !== null) {
    if (sleepAvg < 6) insights.push({ icon: 'alert-circle', color: Colors.warm, text: 'Sleep below 6h average — this may affect cognition and mood.' });
    else if (sleepAvg >= 7.5) insights.push({ icon: 'checkmark-circle', color: Colors.accent, text: 'Great sleep consistency! Averaging ' + sleepAvg.toFixed(1) + 'h per night.' });
  }

  const stressAvg = calcAvg(trends.stress?.values);
  if (stressAvg !== null && stressAvg > 6) {
    insights.push({ icon: 'warning', color: Colors.riskModerate, text: 'Elevated stress detected. Consider mindfulness or breaks.' });
  }

  const moodAvg = calcAvg(trends.mood?.values);
  if (moodAvg !== null && moodAvg >= 7) {
    insights.push({ icon: 'happy', color: Colors.primary, text: 'Mood trending positively! Keep up your current routine.' });
  }

  const screenAvg = calcAvg(trends.screenTime?.values);
  if (screenAvg !== null && screenAvg > 5) {
    insights.push({ icon: 'phone-portrait', color: Colors.warm, text: 'High screen time (' + screenAvg.toFixed(1) + 'h avg) may impact sleep quality.' });
  }

  if (insights.length === 0) {
    insights.push({ icon: 'analytics', color: Colors.primary, text: 'Keep logging daily to unlock personalised insights.' });
  }

  return insights.slice(0, 3);
};

/* ── Component ──────────────────────────────────── */
export default function AnalyticsScreen() {
  const [trends, setTrends] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(14);
  const [activeSection, setActiveSection] = useState('overview'); // 'overview' | 'detailed'
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadData();
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, [days]);

  const loadData = async () => {
    try {
      const [trendsRes, alertsRes] = await Promise.allSettled([
        analysisAPI.getTrends(days),
        analysisAPI.getAlerts(5),
      ]);
      if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value.data.data);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data.data);
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadData(); setRefreshing(false);
  }, [days]);

  const dayOptions = [7, 14, 30];

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={Colors.gradientHeaderDark}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ShimmerEffect width={100} height={12} style={{ marginBottom: 8 }} />
          <ShimmerEffect width={160} height={32} style={{ marginBottom: Spacing.xl }} />

          <View style={styles.scoreContainer}>
            <ShimmerEffect width={80} height={80} borderRadius={40} />
            <View style={[styles.scoreInfo, { justifyContent: 'center' }]}>
              <ShimmerEffect width={120} height={16} style={{ marginBottom: 8 }} />
              <ShimmerEffect width={180} height={12} style={{ marginBottom: 12 }} />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <ShimmerEffect width={50} height={20} borderRadius={10} />
                <ShimmerEffect width={50} height={20} borderRadius={10} />
              </View>
            </View>
          </View>
        </LinearGradient>
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={{ padding: Spacing.lg }}>
            <ShimmerEffect width={150} height={20} style={{ marginBottom: Spacing.md }} />
            <View style={{ flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl }}>
              <ShimmerEffect width={(width - Spacing.lg * 3) / 2} height={100} borderRadius={Radius.md} />
              <ShimmerEffect width={(width - Spacing.lg * 3) / 2} height={100} borderRadius={Radius.md} />
            </View>
            <ShimmerEffect width={200} height={20} style={{ marginBottom: Spacing.md }} />
            <ShimmerEffect width={width - Spacing.lg * 2} height={160} borderRadius={Radius.lg} />
          </View>
        </ScrollView>
      </View>
    );
  }

  // Compute summary metrics
  const sleepAvg = calcAvg(trends?.sleep?.hours) || 0;
  const moodAvg = calcAvg(trends?.mood?.values) || 0;
  const stressAvg = calcAvg(trends?.stress?.values) || 0;
  const screenAvg = calcAvg(trends?.screenTime?.values) || 0;
  const stepsAvg = calcAvg(trends?.activity?.steps) || 0;
  const waterAvg = (calcAvg(trends?.water?.values) || 0) * 0.25;

  const sleepTrend = calcTrend(trends?.sleep?.hours);
  const moodTrend = calcTrend(trends?.mood?.values);
  const stressTrend = calcTrend(trends?.stress?.values);

  // Health score (simple composite)
  const healthScore = Math.round(
    Math.min(100,
      (Math.min(sleepAvg / 8, 1) * 30) +
      (Math.min(moodAvg / 10, 1) * 25) +
      (Math.max(0, 1 - stressAvg / 10) * 20) +
      (Math.min(stepsAvg / 10000, 1) * 15) +
      (Math.max(0, 1 - screenAvg / 10) * 10)
    )
  ) || 0;

  const insights = generateInsights(trends);

  const getRiskBadge = (level) => {
    const map = {
      low: { bg: Colors.primarySoft, color: Colors.primaryDark, icon: 'shield-checkmark' },
      moderate: { bg: '#FFF8E1', color: Colors.riskModerate, icon: 'alert-circle' },
      high: { bg: Colors.warmSoft, color: Colors.warmDark, icon: 'warning' },
      critical: { bg: '#FFEBEE', color: Colors.riskCritical, icon: 'flame' },
    };
    return map[level] || map.low;
  };

  const chartConfigs = [
    {
      title: 'Sleep Duration',
      data: trends?.sleep?.hours || [],
      baseline: trends?.sleep?.baseline || 7.5,
      color: '#6C63FF',
      icon: 'moon',
      unit: 'h',
      description: 'Hours of sleep per night',
    },
    {
      title: 'Mood Levels',
      data: trends?.mood?.values || [],
      baseline: trends?.mood?.baseline || 7,
      color: Colors.primary,
      icon: 'happy',
      unit: '/10',
      description: 'Daily mood self-assessment',
    },
    {
      title: 'Stress Index',
      data: trends?.stress?.values || [],
      baseline: trends?.stress?.baseline || 4,
      color: Colors.riskModerate,
      icon: 'pulse',
      unit: '/10',
      description: 'Lower is better',
    },
    {
      title: 'Screen Time',
      data: trends?.screenTime?.values || [],
      baseline: trends?.screenTime?.baseline || 4.5,
      color: Colors.warm,
      icon: 'phone-portrait',
      unit: 'h',
      description: 'Daily screen exposure',
    },
    {
      title: 'Activity (Steps)',
      data: trends?.activity?.steps || [],
      baseline: trends?.activity?.baseline || 8000,
      color: Colors.accent,
      icon: 'footsteps',
      unit: '',
      description: 'Daily step count',
    },
    {
      title: 'Hydration',
      data: (trends?.water?.values || []).map(v => v !== null ? v * 0.25 : null),
      baseline: null,
      color: '#4FC3F7',
      icon: 'water',
      unit: 'L',
      description: 'Daily water intake',
    },
  ];

  return (
    <View style={styles.container}>
      {/* ── Premium Header ── */}
      <LinearGradient
        colors={Colors.gradientHeaderDark}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <HealthPulseSvg width={width} height={180} style={styles.headerPulse} />
        <FloatingParticles count={10} containerHeight={240} />

        <AnimatedEntry preset="fadeUp" duration={600}>
          <Text style={styles.headerLabel}>YOUR HEALTH</Text>
          <Text style={styles.headerTitle}>Analytics</Text>
 
          {/* Health Score Ring */}
          <View style={styles.scoreContainer}>
            <PulseGlow size={80} color="rgba(255, 255, 255, 0.3)" ringCount={2}>
              <View style={styles.scoreRing}>
                <LinearGradient
                  colors={healthScore >= 70 ? ['#8CB369', '#B5D19A'] : healthScore >= 40 ? ['#F4A261', '#F8C471'] : ['#E07A5F', '#F0A894']}
                  style={styles.scoreGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <AnimatedCounter value={healthScore} style={styles.scoreValue} />
                  <Text style={styles.scoreUnit}>/ 100</Text>
                </LinearGradient>
              </View>
            </PulseGlow>
            <View style={styles.scoreInfo}>
              <Text style={styles.scoreLabel}>Wellness Score</Text>
              <Text style={styles.scoreDesc}>
                {healthScore >= 70 ? 'You\'re doing great! Keep it up.' :
                 healthScore >= 40 ? 'Room for improvement. Check insights below.' :
                 'Several areas need attention.'}
              </Text>
              <View style={styles.scoreMiniStats}>
                <View style={styles.scoreMiniStat}>
                  <Ionicons name="moon" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.scoreMiniText}>{sleepAvg.toFixed(1)}h</Text>
                </View>
                <View style={styles.scoreMiniStat}>
                  <Ionicons name="happy" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.scoreMiniText}>{moodAvg.toFixed(1)}</Text>
                </View>
                <View style={styles.scoreMiniStat}>
                  <Ionicons name="pulse" size={12} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.scoreMiniText}>{stressAvg.toFixed(1)}</Text>
                </View>
              </View>
            </View>
          </View>
        </AnimatedEntry>
      </LinearGradient>
      <AbstractWaveSvg colors={['#52A8A2', Colors.background]} opacity={0.12} style={styles.waveDivider} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* ── Period Selector ── */}
        <View style={styles.selectorRow}>
          <View style={styles.daySelector}>
            {dayOptions.map(d => (
              <TouchableOpacity
                key={d}
                style={[styles.dayChip, days === d && styles.dayChipActive]}
                onPress={() => { setLoading(true); setDays(d); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dayChipText, days === d && styles.dayChipTextActive]}>
                  {d}D
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.sectionToggle}>
            {['overview', 'detailed'].map(s => (
              <TouchableOpacity
                key={s}
                style={[styles.sectionBtn, activeSection === s && styles.sectionBtnActive]}
                onPress={() => setActiveSection(s)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={s === 'overview' ? 'grid' : 'list'}
                  size={16}
                  color={activeSection === s ? Colors.textInverse : Colors.textSecondary}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Quick Insights ── */}
        {insights.length > 0 && (
          <View style={styles.insightsSection}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="bulb" size={18} color={Colors.riskModerate} /> AI Insights
            </Text>
            {insights.map((insight, i) => (
              <View key={i} style={styles.insightCard}>
                <View style={[styles.insightIcon, { backgroundColor: insight.color + '15' }]}>
                  <Ionicons name={insight.icon} size={18} color={insight.color} />
                </View>
                <Text style={styles.insightText}>{insight.text}</Text>
              </View>
            ))}
          </View>
        )}

        {activeSection === 'overview' ? (
          <>
            {/* ── Summary Grid ── */}
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.metricsGrid}>
              <MetricStatCard
                icon="moon"
                label="Sleep"
                value={sleepAvg.toFixed(1)}
                unit="h"
                trend={sleepTrend.dir}
                trendValue={sleepTrend.pct + '%'}
                color="#6C63FF"
                delay={0}
              />
              <MetricStatCard
                icon="happy"
                label="Mood"
                value={moodAvg.toFixed(1)}
                unit="/10"
                trend={moodTrend.dir}
                trendValue={moodTrend.pct + '%'}
                color={Colors.primary}
                delay={100}
              />
            </View>
            <View style={styles.metricsGrid}>
              <MetricStatCard
                icon="pulse"
                label="Stress"
                value={stressAvg.toFixed(1)}
                unit="/10"
                trend={stressTrend.dir === 'up' ? 'down' : stressTrend.dir === 'down' ? 'up' : 'stable'}
                trendValue={stressTrend.pct + '%'}
                color={Colors.riskModerate}
                subtitle="Lower is better"
                delay={200}
              />
              <MetricStatCard
                icon="footsteps"
                label="Steps"
                value={stepsAvg >= 1000 ? (stepsAvg / 1000).toFixed(1) + 'k' : stepsAvg.toFixed(0)}
                unit=""
                color={Colors.accent}
                delay={300}
              />
            </View>

            {/* Compact extras */}
            <View style={styles.compactRow}>
              <MetricStatCard icon="water" label="Water" value={waterAvg.toFixed(1)} unit="L" color="#4FC3F7" compact delay={400} />
            </View>
            <View style={styles.compactRow}>
              <MetricStatCard icon="phone-portrait" label="Screen" value={screenAvg.toFixed(1)} unit="h" color={Colors.warm} compact delay={500} />
            </View>

            {/* Featured chart — Sleep */}
            <View style={styles.featuredChartCard}>
              <View style={styles.chartCardHeader}>
                <View style={styles.chartCardIcon}>
                  <Ionicons name="moon" size={20} color="#6C63FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chartCardTitle}>Sleep Trends</Text>
                  <Text style={styles.chartCardDesc}>Hours of sleep per night</Text>
                </View>
              </View>
              <AreaChart
                data={trends?.sleep?.hours || []}
                baseline={trends?.sleep?.baseline || 7.5}
                color="#6C63FF"
                height={140}
                unit="h"
              />
            </View>

            {/* Featured chart — Mood */}
            <View style={styles.featuredChartCard}>
              <View style={styles.chartCardHeader}>
                <View style={[styles.chartCardIcon, { backgroundColor: Colors.primarySoft }]}>
                  <Ionicons name="happy" size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.chartCardTitle}>Mood vs Stress</Text>
                  <Text style={styles.chartCardDesc}>Correlation analysis</Text>
                </View>
              </View>
              <AreaChart
                data={trends?.mood?.values || []}
                baseline={trends?.mood?.baseline || 7}
                color={Colors.primary}
                height={120}
                unit="/10"
              />
              <View style={styles.divider} />
              <AreaChart
                data={trends?.stress?.values || []}
                baseline={trends?.stress?.baseline || 4}
                color={Colors.riskModerate}
                height={100}
                unit="/10"
              />
            </View>
          </>
        ) : (
          /* ── Detailed View: All Charts ── */
          <>
            <Text style={styles.sectionTitle}>All Metrics</Text>
            {chartConfigs.map((chart, i) => (
              <View key={i} style={styles.detailedChartCard}>
                <View style={styles.chartCardHeader}>
                  <View style={[styles.chartCardIcon, { backgroundColor: chart.color + '15' }]}>
                    <Ionicons name={chart.icon} size={20} color={chart.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.chartCardTitle}>{chart.title}</Text>
                    <Text style={styles.chartCardDesc}>{chart.description}</Text>
                  </View>
                </View>
                <AreaChart
                  data={chart.data}
                  baseline={chart.baseline}
                  color={chart.color}
                  height={130}
                  unit={chart.unit}
                />
              </View>
            ))}
          </>
        )}

        {/* ── Recent Alerts ── */}
        {alerts.length > 0 && (
          <View style={styles.alertsSection}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="notifications" size={18} color={Colors.secondary} /> Recent Alerts
            </Text>
            {alerts.map((alert, i) => {
              const badge = getRiskBadge(alert.riskLevel);
              return (
                <View key={i} style={styles.alertCard}>
                  <View style={styles.alertLeft}>
                    <View style={[styles.alertIconWrap, { backgroundColor: badge.bg }]}>
                      <Ionicons name={badge.icon} size={18} color={badge.color} />
                    </View>
                  </View>
                  <View style={styles.alertContent}>
                    <View style={styles.alertTopRow}>
                      <View style={[styles.alertBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.alertBadgeText, { color: badge.color }]}>
                          {alert.riskLevel?.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.alertDate}>
                        {new Date(alert.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </Text>
                    </View>
                    <Text style={styles.alertScore}>
                      Risk Score: <Text style={{ color: badge.color, fontWeight: '700' }}>{alert.overallRiskScore}/100</Text>
                    </Text>
                    {alert.recommendations?.slice(0, 2).map((r, j) => (
                      <Text key={j} style={styles.alertRec}>→ {r}</Text>
                    ))}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Empty State ── */}
        {(!trends || trends.dates?.length === 0) && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="analytics" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptyText}>
              Start logging your daily habits to unlock powerful insights and trend analysis.
            </Text>
          </View>
        )}

        <View style={{ height: Spacing.xxxl + 20 }} />
      </ScrollView>
    </View>
  );
}

/* ── Styles ─────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  loadingText: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: Spacing.md },

  /* Header */
  header: {
    paddingTop: 56,
    paddingBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerLabel: {
    ...Typography.labelSmall,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 4,
    letterSpacing: 2,
  },
  headerTitle: {
    ...Typography.displayMedium,
    color: Colors.textInverse,
    marginBottom: Spacing.xl,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  scoreRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    padding: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  scoreGradient: {
    flex: 1,
    borderRadius: 37,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    ...Typography.numberMedium,
    color: '#fff',
    fontSize: 28,
    lineHeight: 32,
  },
  scoreUnit: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
  },
  scoreInfo: {
    flex: 1,
  },
  scoreLabel: {
    ...Typography.h3,
    color: Colors.textInverse,
  },
  scoreDesc: {
    ...Typography.bodySmall,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  scoreMiniStats: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  scoreMiniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  scoreMiniText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },

  /* Content */
  scroll: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: 120,
  },

  /* Selector */
  selectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  daySelector: {
    flexDirection: 'row',
    gap: 6,
  },
  dayChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dayChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.secondary,
  },
  dayChipText: {
    ...Typography.buttonSmall,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  dayChipTextActive: {
    color: Colors.textOnPrimary,
  },
  sectionToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  sectionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  sectionBtnActive: {
    backgroundColor: Colors.secondary,
  },

  /* Section title */
  sectionTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },

  /* Insights */
  insightsSection: {
    marginBottom: Spacing.lg,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: 8,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  insightIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },

  /* Metrics Grid */
  metricsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  /* Compact row */
  compactRow: {
    marginBottom: 8,
  },

  /* Chart Cards */
  featuredChartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  detailedChartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  chartCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  chartCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF15',
  },
  chartCardTitle: {
    ...Typography.h3,
    color: Colors.text,
  },
  chartCardDesc: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  /* Alerts */
  alertsSection: {
    marginTop: Spacing.xl,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  alertLeft: {
    marginRight: Spacing.md,
  },
  alertIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  alertBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  alertBadgeText: {
    ...Typography.labelSmall,
    fontSize: 10,
    fontWeight: '800',
  },
  alertDate: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  alertScore: {
    ...Typography.bodySmall,
    color: Colors.text,
    fontWeight: '500',
    marginBottom: 6,
  },
  alertRec: {
    ...Typography.caption,
    color: Colors.textSecondary,
    marginTop: 3,
    lineHeight: 18,
  },

  /* Empty State */
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.section,
    paddingHorizontal: Spacing.xxl,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    ...Typography.body,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 24,
  },
  headerPulse: {
    position: 'absolute',
    bottom: -10,
    left: 0,
    right: 0,
    opacity: 0.15,
  },
  waveDivider: {
    marginTop: -20,
    width: width,
    height: 30,
    zIndex: 10,
  },
});
