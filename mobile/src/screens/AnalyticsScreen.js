// Sense Health — Trends Screen
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Dimensions, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { analysisAPI } from '../api/client';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import MiniChart from '../components/MiniChart';

const { width } = Dimensions.get('window');

export default function AnalyticsScreen() {
  const [trends, setTrends] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(14);

  useEffect(() => { loadData(); }, [days]);

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
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  // Adding Focus/Productivity mock data for visual demonstration
  const chartData = [
    { title: 'Sleep Trends', data: trends?.sleep?.hours || [7, 6.5, 8, 7.5, 6, 8, 7.5], baseline: 7.5, color: Colors.secondary, icon: 'moon-outline', unit: 'h' },
    { title: 'Stress Trends', data: trends?.stress?.values || [4, 5, 3, 6, 7, 5, 4], baseline: 4, color: Colors.riskModerate, icon: 'pulse-outline', unit: '/10' },
    { title: 'Mood Changes', data: trends?.mood?.values || [7, 6, 8, 7, 5, 8, 8], baseline: 7, color: Colors.primary, icon: 'happy-outline', unit: '/10' },
    { title: 'Screen-time', data: trends?.screenTime?.values || [4, 5, 3, 6, 7, 5, 4], baseline: 4.5, color: Colors.warm, icon: 'phone-portrait-outline', unit: 'h' },
    { title: 'Productivity Patterns', data: [75, 80, 60, 90, 85, 70, 80], baseline: 80, color: Colors.accent, icon: 'analytics-outline', unit: '%' },
  ];

  const getRiskBadge = (level) => {
    const map = { 
      low: { bg: Colors.primarySoft, color: Colors.primaryDark }, 
      moderate: { bg: '#FFF8E1', color: Colors.riskModerate },
      high: { bg: Colors.warmSoft, color: Colors.warmDark }, 
      critical: { bg: '#FFEBEE', color: Colors.riskCritical } 
    };
    return map[level] || map.low;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={Colors.gradientSecondary} style={styles.header}>
        <Text style={styles.headerTitle}>Trends</Text>
        <Text style={styles.headerSub}>Identify patterns in your daily habits.</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}>

        {/* Day selector */}
        <View style={styles.daySelector}>
          {dayOptions.map(d => (
            <TouchableOpacity key={d} style={[styles.dayChip, days === d && styles.dayChipActive]} onPress={() => setDays(d)}>
              <Text style={[styles.dayChipText, days === d && styles.dayChipTextActive]}>{d} Days</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Charts */}
        {chartData.map((chart, i) => (
          <View key={i} style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View style={[styles.iconContainer, { backgroundColor: chart.color + '15' }]}>
                <Ionicons name={chart.icon} size={20} color={chart.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.chartTitle}>{chart.title}</Text>
                {chart.data.length > 0 && (
                  <Text style={[styles.chartLatest, { color: chart.color }]}>
                    Latest: {chart.data.filter(v => v != null).slice(-1)[0]?.toFixed?.(1) || '—'}{chart.unit}
                  </Text>
                )}
              </View>
            </View>
            <MiniChart data={chart.data} baseline={chart.baseline} color={chart.color} />
          </View>
        ))}

        {/* Recent Alerts */}
        {alerts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Insights</Text>
            {alerts.map((alert, i) => {
              const badge = getRiskBadge(alert.riskLevel);
              return (
                <View key={i} style={styles.alertCard}>
                  <View style={styles.alertTop}>
                    <View style={[styles.alertBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.alertBadgeText, { color: badge.color }]}>{alert.riskLevel.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.alertDate}>{new Date(alert.date).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.alertScore}>Risk Score: {alert.overallRiskScore}/100</Text>
                  {alert.recommendations?.slice(0, 2).map((r, j) => (
                    <Text key={j} style={styles.alertRec}>• {r}</Text>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {(!trends || trends.dates?.length === 0) && (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No data yet. Start logging to see trends!</Text>
          </View>
        )}

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { 
    paddingTop: 60, 
    paddingBottom: Spacing.xl, 
    paddingHorizontal: Spacing.xxl, 
    borderBottomLeftRadius: Radius.xl, 
    borderBottomRightRadius: Radius.xl 
  },
  headerTitle: { ...Typography.displayMedium, color: Colors.textInverse, marginBottom: Spacing.xs },
  headerSub: { ...Typography.body, color: 'rgba(255,255,255,0.85)' },
  scroll: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl },
  daySelector: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xxl },
  dayChip: { 
    paddingHorizontal: Spacing.xl, 
    paddingVertical: Spacing.sm, 
    borderRadius: Radius.full, 
    backgroundColor: Colors.surface, 
    borderWidth: 1, 
    borderColor: Colors.border,
    ...Shadows.small,
  },
  dayChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  dayChipText: { ...Typography.buttonSmall, color: Colors.textSecondary },
  dayChipTextActive: { color: Colors.textOnPrimary },
  chartCard: { 
    backgroundColor: Colors.surface, 
    borderRadius: Radius.xl, 
    padding: Spacing.xl, 
    marginBottom: Spacing.lg, 
    ...Shadows.medium 
  },
  chartHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  iconContainer: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center'
  },
  chartTitle: { ...Typography.h3, color: Colors.text },
  chartLatest: { ...Typography.bodySmall, fontWeight: '600', marginTop: 2 },
  section: { marginTop: Spacing.xl },
  sectionTitle: { ...Typography.h2, color: Colors.text, marginBottom: Spacing.lg },
  alertCard: { backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.small },
  alertTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  alertBadge: { paddingHorizontal: Spacing.md, paddingVertical: 4, borderRadius: Radius.full },
  alertBadgeText: { ...Typography.labelSmall, fontWeight: '700' },
  alertDate: { ...Typography.caption, color: Colors.textTertiary },
  alertScore: { ...Typography.body, color: Colors.text, fontWeight: '600', marginBottom: Spacing.sm },
  alertRec: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4, lineHeight: 20 },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.section },
  emptyText: { ...Typography.body, color: Colors.textTertiary, marginTop: Spacing.md, textAlign: 'center' },
});
