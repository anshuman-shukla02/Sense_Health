// Sense Health — Home Dashboard Screen
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Animated,
  Dimensions,
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

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [riskData, setRiskData] = useState(null);
  const [todayLog, setTodayLog] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadData();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadData = async () => {
    try {
      const [summaryRes, riskRes] = await Promise.allSettled([
        analysisAPI.getSummary(),
        analysisAPI.getRisk(),
      ]);

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value.data.data);
      }
      if (riskRes.status === 'fulfilled') {
        setRiskData(riskRes.value.data.data);
      }

      const today = new Date().toISOString().split('T')[0];
      try {
        const logRes = await dataAPI.getLog(today);
        setTodayLog(logRes.data.data);
      } catch {
        setTodayLog(null);
      }
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

  // Mocked for UX demonstration based on new specs
  const healthCards = [
    { name: 'sleep', label: 'Sleep', score: 85, message: 'You slept well.' },
    { name: 'mental', label: 'Stress', score: 60, message: 'Moderate stress detected.' },
    { name: 'activity', label: 'Activity', score: 40, message: 'Move more today.' },
    { name: 'focus', label: 'Focus', score: 90, message: 'High cognitive state.' },
    { name: 'vitals', label: 'Recovery', score: 75, message: 'Good recovery.' }
  ];

  const displayCards = riskData?.categories?.length > 0 ? riskData.categories : healthCards;
  
  // AI Insights Mock based on prompt
  const insights = riskData?.recommendations?.length > 0 ? riskData.recommendations : [
    "You slept 2 hours less than usual this week.",
    "Your screen-time after midnight increased by 40%.",
    "Your reaction speed is slightly slower than average today."
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Header Section with Glassmorphism feel */}
        <LinearGradient
          colors={[Colors.primarySoft, Colors.background]}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{firstName}</Text>
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('ProfileTab')}
            >
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Daily Health Score */}
          <Animated.View
            style={[
              styles.healthScoreCard,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
            ]}
          >
            <View style={styles.scoreRow}>
              <HealthRing
                score={healthScore}
                size={80}
                strokeWidth={8}
                color={getHealthColor()}
              />
              <View style={styles.scoreTextContainer}>
                <Text style={styles.scoreTitle}>Daily Health Score</Text>
                <Text style={styles.scoreValue}>
                  {healthScore}<Text style={styles.scoreMax}>/100</Text>
                </Text>
                <Text style={[styles.scoreRisk, { color: getHealthColor() }]}>
                  {getRiskLabel()}
                </Text>
              </View>
            </View>
          </Animated.View>
        </LinearGradient>

        {/* AI Insights Section */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity
            style={styles.aiBannerContainer}
            onPress={() => navigation.navigate('AISuggestions')}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiBannerGradient}
            >
              <View style={styles.aiBannerContent}>
                <View style={styles.aiBannerTextContainer}>
                  <Text style={styles.aiBannerTitle}>Gemini AI Insights</Text>
                  <Text style={styles.aiBannerSub}>Tap to view your personalized health suggestions</Text>
                </View>
                <LottieView
                  source={require('../../assets/animations/meditation.json')}
                  autoPlay
                  loop
                  style={styles.aiBannerLottie}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsScroll}>
            <QuickAction
              icon="body-outline"
              label="Log Symptoms"
              color={Colors.primary}
              onPress={() => navigation.navigate('LogTab')}
            />
            <QuickAction
              icon="leaf-outline"
              label="Breathing"
              color={Colors.secondary}
              onPress={() => {}}
            />
            <QuickAction
              icon="game-controller-outline"
              label="Reflex Test"
              color={Colors.accent}
              onPress={() => navigation.navigate('GamesTab')}
            />
            <QuickAction
              icon="book-outline"
              label="Journal"
              color={Colors.warm}
              onPress={() => {}}
            />
            <QuickAction
              icon="medkit-outline"
              label="Emergency"
              color={Colors.riskCritical}
              onPress={() => {}}
            />
          </ScrollView>
        </Animated.View>

        {/* Health Cards */}
        <Animated.View style={[styles.section, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.sectionTitle}>Health Categories</Text>
          {displayCards.map((cat, idx) => (
            <CategoryCard key={idx} category={cat} />
          ))}
        </Animated.View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  header: {
    paddingTop: 60,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xxl,
    borderBottomLeftRadius: Radius.xl,
    borderBottomRightRadius: Radius.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
  },
  greeting: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  userName: {
    ...Typography.h1,
    color: Colors.text,
  },
  profileButton: {
    padding: 2,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.small,
  },
  avatarText: {
    ...Typography.h3,
    color: Colors.primary,
  },
  healthScoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreTextContainer: {
    marginLeft: Spacing.xl,
    flex: 1,
  },
  scoreTitle: {
    ...Typography.caption,
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  scoreValue: {
    ...Typography.numberMedium,
    color: Colors.text,
  },
  scoreMax: {
    ...Typography.h3,
    color: Colors.textTertiary,
  },
  scoreRisk: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginTop: Spacing.xs,
  },
  section: {
    paddingHorizontal: Spacing.xxl,
    marginTop: Spacing.xxl,
  },
  sectionTitle: {
    ...Typography.h2,
    color: Colors.text,
    marginBottom: Spacing.lg,
  },
  aiBannerContainer: {
    borderRadius: Radius.lg,
    ...Shadows.medium,
    overflow: 'hidden',
  },
  aiBannerGradient: {
    padding: Spacing.lg,
  },
  aiBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  aiBannerTextContainer: {
    flex: 1,
    paddingRight: Spacing.md,
  },
  aiBannerTitle: {
    ...Typography.h2,
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  aiBannerSub: {
    ...Typography.bodySmall,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  aiBannerLottie: {
    width: 60,
    height: 60,
  },
  quickActionsScroll: {
    paddingRight: Spacing.xxl,
    gap: Spacing.md,
    flexDirection: 'row',
  },
});
