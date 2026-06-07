// Sense Health — Premium Interactive AI Suggestions & Health Coach Screen
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Share,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { analysisAPI, authAPI } from '../api/client';
import Colors from '../theme/colors';
import { Typography, Spacing, Radius, Shadows } from '../theme/typography';
import { scheduleInsightReminder, cancelInsightReminder } from '../services/NotificationService';

// Custom SVG and Animations
import { BrainWaveSvg } from '../components/illustrations';
import AnimatedEntry from '../components/animations/AnimatedEntry';
import FloatingParticles from '../components/animations/FloatingParticles';
import ShimmerEffect, { SkeletonCard } from '../components/animations/ShimmerEffect';
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

function BouncingDot({ delay }) {
  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 300 }),
          withTiming(0, { duration: 300 })
        ),
        -1,
        false
      )
    );
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));
  return (
    <ReAnimated.View
      style={[
        {
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: Colors.primary,
          marginHorizontal: 2,
        },
        animStyle,
      ]}
    />
  );
}

function TypingIndicator() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 4, marginRight: 8 }}>
      <BouncingDot delay={0} />
      <BouncingDot delay={150} />
      <BouncingDot delay={300} />
    </View>
  );
}


export default function AISuggestionsScreen({ navigation }) {
  // Page Data State
  const [insights, setInsights] = useState([]);
  const [parsedInsights, setParsedInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Interaction State
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedInsight, setExpandedInsight] = useState(null);
  const [completedInsights, setCompletedInsights] = useState(new Set());
  const [customReminders, setCustomReminders] = useState(new Map()); // insightId -> notificationIds[]

  // AI Chat Coach State
  const [chatMessages, setChatMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm your AI Wellness Coach. I have analyzed your recent daily health logs and baseline stats.\n\nAsk me anything about how to optimize your sleep, reduce screen time, lower stress, or build healthier habits!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Animations
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const cardsTranslateAnim = useRef(new Animated.Value(40)).current;
  const scrollViewRef = useRef(null);

  // Quota / API Key State
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasCustomKey, setHasCustomKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState(null);
  const [savingKey, setSavingKey] = useState(false);

  useEffect(() => {
    fetchInsights();
    checkApiKey();
    // Fade-in animations
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(cardsTranslateAnim, {
        toValue: 0,
        tension: 40,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const checkApiKey = async () => {
    try {
      const res = await authAPI.getGeminiKey();
      if (res.data?.success) {
        setHasCustomKey(res.data.hasKey);
        setMaskedKey(res.data.maskedKey);
      }
    } catch (e) { /* silent */ }
  };

  const handleSaveApiKey = async () => {
    if (!apiKeyInput.trim()) return;
    setSavingKey(true);
    try {
      const res = await authAPI.saveGeminiKey(apiKeyInput.trim());
      if (res.data?.success) {
        setHasCustomKey(true);
        setMaskedKey(apiKeyInput.trim().slice(0, 6) + '••••••' + apiKeyInput.trim().slice(-4));
        setShowApiKeyModal(false);
        setApiKeyInput('');
        setQuotaExhausted(false);
        Alert.alert('Success', 'Your Gemini API key has been saved. Refreshing insights...');
        fetchInsights();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save API key');
    } finally {
      setSavingKey(false);
    }
  };

  const handleRemoveApiKey = async () => {
    Alert.alert('Remove API Key', 'This will switch back to the shared server key.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          try {
            await authAPI.saveGeminiKey(null);
            setHasCustomKey(false);
            setMaskedKey(null);
            setApiKeyInput('');
          } catch (e) { /* silent */ }
        }
      }
    ]);
  };

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await analysisAPI.getAIInsights();
      if (res.data && res.data.success) {
        const rawData = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
        setInsights(rawData);

        // Process and enrich the raw suggestions
        const enriched = rawData.map((text, idx) => parseInsight(text, idx));
        setParsedInsights(enriched);
        setQuotaExhausted(false);
      } else {
        setError('Failed to load personalized insights.');
      }
    } catch (err) {
      console.error(err);
      // Detect quota exhaustion from 429 or error code
      if (err.response?.status === 429 || err.response?.data?.code === 'QUOTA_EXHAUSTED') {
        setQuotaExhausted(true);
        setError(null); // Don't show generic error, quota banner handles it
      } else {
        setError('An error occurred while fetching your health insights.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Advanced suggestion processor mapping raw sentences to high-fidelity metrics
  const parseInsight = (text, index) => {
    const lowercase = text.toLowerCase();
    let category = 'general';
    let title = 'Wellness Strategy';
    let icon = 'sparkles-outline';
    let gradientColors = [Colors.primary, Colors.primaryLight];
    let accentColor = Colors.primary;
    let whyItMatters = "Maintaining consistent habits forms the foundation of sustainable health and high cognitive/physical performance.";
    let actionSteps = [
      "Incorporate this suggestion into your daily morning routine.",
      "Track your energy levels and observe if they stabilize throughout the day."
    ];
    let scoreImpact = "+5 Health Score";
    let relevance = "Daily Match";

    if (lowercase.includes('sleep') || lowercase.includes('night') || lowercase.includes('bed') || lowercase.includes('slumber')) {
      category = 'sleep';
      title = 'Sleep Optimization';
      icon = 'moon-outline';
      gradientColors = ['#4A90E2', '#3A7D78'];
      accentColor = '#4A90E2';
      whyItMatters = "Adequate deep sleep regulates your cardiovascular stress levels, consolidates memory, and repairs metabolic fatigue. Sub-optimal sleep directly correlates with heightened anxiety.";
      actionSteps = [
        "Avoid blue light from phone/computer screens at least 60 minutes before bed.",
        "Ensure your bedroom is dark, quiet, and cool (ideally 65-68°F / 18-20°C).",
        "Set a winding-down reminder on your phone to build routine consistency."
      ];
      scoreImpact = "+10 Health Score";
      relevance = "Critical Priority";
    } else if (lowercase.includes('stress') || lowercase.includes('mood') || lowercase.includes('mental') || lowercase.includes('meditat') || lowercase.includes('calm') || lowercase.includes('anxiety') || lowercase.includes('relax') || lowercase.includes('tension')) {
      category = 'mental';
      title = 'Stress Resilience';
      icon = 'leaf-outline';
      gradientColors = ['#9013FE', '#BD10E0'];
      accentColor = '#9013FE';
      whyItMatters = "Sustained high stress elevates your baseline cortisol. This suppresses immune system response, fragments sleep cycles, and hinders metabolic recovery.";
      actionSteps = [
        "Execute a 4-7-8 deep breathing session: inhale for 4s, hold for 7s, exhale slowly for 8s.",
        "Step away from screen stimulus for 10 minutes and perform physical neck/shoulder stretches.",
        "Log a mood entry in your daily journal to externalize circular thoughts."
      ];
      scoreImpact = "+8 Health Score";
      relevance = "High Priority";
    } else if (lowercase.includes('step') || lowercase.includes('exercis') || lowercase.includes('walk') || lowercase.includes('run') || lowercase.includes('activ') || lowercase.includes('move') || lowercase.includes('sport') || lowercase.includes('cardio')) {
      category = 'activity';
      title = 'Physical Vitality';
      icon = 'walk-outline';
      gradientColors = ['#40C057', '#82C91E'];
      accentColor = '#40C057';
      whyItMatters = "Physical movement improves systemic insulin sensitivity, releases endorphins to actively combat mental fatigue, and strengthens cardiovascular reserves.";
      actionSteps = [
        "Complete a brisk 15-minute walk outside in direct sunlight to help set circadian rhythm.",
        "Stand up and do 10 gentle bodyweight squats for every 90 minutes of continuous screen work.",
        "Try using the stairs today instead of elevators to boost daily neat movement."
      ];
      scoreImpact = "+10 Health Score";
      relevance = "Medium Priority";
    } else if (lowercase.includes('water') || lowercase.includes('diet') || lowercase.includes('food') || lowercase.includes('nutri') || lowercase.includes('drink') || lowercase.includes('junk') || lowercase.includes('eat') || lowercase.includes('hydrat') || lowercase.includes('meal')) {
      category = 'nutrition';
      title = 'Hydration & Nutrition';
      icon = 'water-outline';
      gradientColors = ['#00C9FF', '#92FE9D'];
      accentColor = '#00C9FF';
      whyItMatters = "Hydration is essential for cognitive speed, cellular toxin clearance, and preventing false hunger triggers. Micronutrient-rich meals support balanced blood glucose, preventing mood crashes.";
      actionSteps = [
        "Drink a 300ml glass of filtered water right now to immediately boost mental alertness.",
        "Replace one highly processed sugary snack today with natural nuts, berries, or fruits.",
        "Ensure your last heavy meal is consumed at least 3 hours before you prepare to sleep."
      ];
      scoreImpact = "+6 Health Score";
      relevance = "Essential Match";
    } else if (lowercase.includes('screen') || lowercase.includes('phone') || lowercase.includes('digital') || lowercase.includes('media') || lowercase.includes('comput') || lowercase.includes('device')) {
      category = 'screenTime';
      title = 'Digital Hygiene';
      icon = 'desktop-outline';
      gradientColors = ['#FF7E5F', '#FEB47B'];
      accentColor = '#FF7E5F';
      whyItMatters = "Constant notification updates trigger micro-doses of dopamine that fragments your attention span. Blue screen light also actively suppresses natural melatonin synthesis.";
      actionSteps = [
        "Enable 'Do Not Disturb' or 'Focus Mode' during key work hours to prevent passive distraction.",
        "Practice the 20-20-20 rule: every 20 minutes of screen time, focus on an object 20 feet away for 20 seconds.",
        "Keep electronic devices out of physical reach of your bed to facilitate morning clarity."
      ];
      scoreImpact = "+5 Health Score";
      relevance = "Daily Balance";
    }

    return {
      id: `insight-${index}`,
      category,
      title,
      icon,
      text,
      whyItMatters,
      actionSteps,
      gradientColors,
      accentColor,
      scoreImpact,
      relevance,
    };
  };

  // Toggle detail card
  const toggleExpandInsight = (id) => {
    setExpandedInsight(expandedInsight === id ? null : id);
  };

  // Action Handlers
  const handleIWillDoThis = (id) => {
    const updated = new Set(completedInsights);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setCompletedInsights(updated);
  };

  const handleSetReminder = async (insight) => {
    const updated = new Map(customReminders);
    if (updated.has(insight.id)) {
      // Cancel existing reminders
      const existingIds = updated.get(insight.id);
      await cancelInsightReminder(existingIds);
      updated.delete(insight.id);
    } else {
      // Schedule real notifications
      const notificationIds = await scheduleInsightReminder(
        insight.id,
        insight.category,
        insight.title,
        insight.text
      );
      updated.set(insight.id, notificationIds);
    }
    setCustomReminders(updated);
  };

  const handleShareSuggestion = async (text) => {
    try {
      await Share.share({
        message: `Check out this personalized health insight generated by Sense Health AI:\n\n"${text}"`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  // API Follow-up Chat Engine
  const sendMessageToCoach = async (questionText) => {
    if (!questionText.trim()) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: questionText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setChatLoading(true);

    // Scroll to bottom of chat
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Map message history to correct role structure for backend
      const historyPayload = chatMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        content: msg.content
      }));

      const res = await analysisAPI.askCoach(questionText, historyPayload);
      
      if (res.data && res.data.success) {
        const coachResponse = {
          id: `msg-coach-${Date.now()}`,
          role: 'assistant',
          content: res.data.answer,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setChatMessages((prev) => [...prev, coachResponse]);
      } else {
        throw new Error("Failed response");
      }
    } catch (err) {
      console.error(err);
      // Check for quota exhaustion
      const isQuota = err.response?.status === 429 || err.response?.data?.code === 'QUOTA_EXHAUSTED';
      const errorMessage = {
        id: `msg-err-${Date.now()}`,
        role: 'assistant',
        content: isQuota
          ? "⚠️ The AI quota has been exhausted. You can add your own Gemini API key in the settings panel above to continue chatting."
          : "I apologize, but I had trouble syncing with my medical models. Please check your network connection and try again.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setChatMessages((prev) => [...prev, errorMessage]);
      if (isQuota) setQuotaExhausted(true);
    } finally {
      setChatLoading(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  // Filter categories
  const filteredInsights = selectedCategory === 'all'
    ? parsedInsights
    : parsedInsights.filter(item => item.category === selectedCategory);

  // Pre-configured Coaching Questions
  const quickQuestions = [
    { text: "How can I improve sleep depth?", category: 'sleep' },
    { text: "Suggest a 5-min stress relief routine", category: 'mental' },
    { text: "Why does dehydration spike stress?", category: 'nutrition' },
    { text: "Give me ideas to reduce screen fatigue", category: 'screenTime' }
  ];

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      {/* ─── Premium Dark Header ─── */}
      <LinearGradient colors={Colors.gradientHeaderDark} style={styles.header}>
        <FloatingParticles count={8} containerHeight={220} colors={['#9013FE', '#BD10E0', '#00C9FF', '#92FE9D']} />
        <BrainWaveSvg
          width={280}
          height={150}
          style={{
            position: 'absolute',
            right: -30,
            bottom: -20,
            opacity: 0.15,
          }}
        />
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <View style={styles.backBtnCircle}>
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.title}>AI Wellness Coach</Text>
            <View style={styles.coachBadge}>
              <View style={[styles.activeDot, quotaExhausted && { backgroundColor: '#F59E0B' }]} />
              <Text style={styles.coachBadgeText}>{quotaExhausted ? 'Quota Limited' : 'Coach Active'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => setShowApiKeyModal(true)} activeOpacity={0.7}>
            <View style={[styles.backBtnCircle, hasCustomKey && { borderWidth: 1, borderColor: Colors.primaryLight }]}>
              <Ionicons name="key" size={16} color={hasCustomKey ? Colors.primaryLight : 'rgba(255,255,255,0.5)'} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchInsights} activeOpacity={0.7}>
            <View style={styles.backBtnCircle}>
              <Ionicons name="refresh" size={18} color={Colors.primaryLight} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Habit Sync Dashboard */}
        <Animated.View style={{ opacity: headerFadeAnim }}>
          <View style={styles.syncCard}>
            <View style={styles.syncRow}>
              <View style={styles.gaugeContainer}>
                <View style={styles.outerGauge}>
                  <View style={styles.innerGauge}>
                    <Text style={styles.gaugeNumber}>94%</Text>
                    <Text style={styles.gaugeLabel}>Sync</Text>
                  </View>
                </View>
              </View>
              <View style={styles.syncTexts}>
                <Text style={styles.syncCardTitle}>Habit Alignment</Text>
                <Text style={styles.syncCardSub}>
                  Your recent logs show strong alignment with your recovery baseline.
                </Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* ─── Main Scrollable Content ─── */}
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={{ gap: Spacing.md }}>
            <SkeletonCard lines={3} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={3} />
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Ionicons name="alert-circle-outline" size={54} color={Colors.riskCritical} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={fetchInsights} activeOpacity={0.8}>
              <Text style={styles.retryText}>Recalculate Suggestions</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Animated.View style={{ transform: [{ translateY: cardsTranslateAnim }] }}>

            {/* ─── Quota Exhaustion Banner ─── */}
            {quotaExhausted && (
              <AnimatedEntry preset="fadeUp">
                <View style={styles.quotaBanner}>
                  <View style={styles.quotaBannerHeader}>
                    <Ionicons name="warning" size={20} color="#92400E" />
                    <Text style={styles.quotaBannerTitle}>AI Quota Exhausted</Text>
                  </View>
                  <Text style={styles.quotaBannerText}>
                    The shared Gemini API quota has been reached. Add your own free API key to continue using the AI Wellness Coach.
                  </Text>
                  <TouchableOpacity
                    style={styles.quotaBannerBtn}
                    onPress={() => setShowApiKeyModal(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="key" size={14} color="#FFF" />
                    <Text style={styles.quotaBannerBtnText}>
                      {hasCustomKey ? 'Update API Key' : 'Add Your API Key'}
                    </Text>
                  </TouchableOpacity>
                  {hasCustomKey && (
                    <Text style={styles.quotaBannerNote}>
                      Key set: {maskedKey} — quota may still be limited on your key.
                    </Text>
                  )}
                </View>
              </AnimatedEntry>
            )}

            {/* Intro Banner */}
            <View style={styles.introBox}>
              <LottieView
                source={require('../../assets/animations/meditation.json')}
                autoPlay
                loop
                style={styles.introLottie}
              />
              <View style={styles.introTexts}>
                <Text style={styles.introTitle}>Science-Backed Blueprint</Text>
                <Text style={styles.introSub}>
                  Personalized suggestions generated from your behavioral trends and baseline deviations.
                </Text>
              </View>
            </View>

            {/* ─── Category Filter Pills ─── */}
            <View style={styles.pillContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillScroll}>
                {[
                  { id: 'all', label: 'All', icon: 'apps' },
                  { id: 'sleep', label: 'Sleep', icon: 'moon' },
                  { id: 'mental', label: 'Stress', icon: 'leaf' },
                  { id: 'activity', label: 'Activity', icon: 'walk' },
                  { id: 'nutrition', label: 'Hydration', icon: 'water' },
                  { id: 'screenTime', label: 'Digital', icon: 'desktop' },
                ].map((pill) => (
                  <TouchableOpacity
                    key={pill.id}
                    style={[
                      styles.pillBtn,
                      selectedCategory === pill.id && styles.pillBtnActive
                    ]}
                    onPress={() => setSelectedCategory(pill.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={pill.icon}
                      size={14}
                      color={selectedCategory === pill.id ? '#FFF' : Colors.textSecondary}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[
                      styles.pillText,
                      selectedCategory === pill.id && styles.pillTextActive
                    ]}>
                      {pill.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Empty filter state */}
            {filteredInsights.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="sparkles" size={48} color={Colors.border} style={{ marginBottom: 12 }} />
                <Text style={styles.emptyText}>No suggestions in this category right now.</Text>
                <Text style={styles.emptySubText}>Keep logging daily habits to generate targeted analytics.</Text>
              </View>
            )}

            {/* ─── Insight Cards ─── */}
            {filteredInsights.map((insight, index) => {
              const isExpanded = expandedInsight === insight.id;
              const isCompleted = completedInsights.has(insight.id);
              const hasReminder = customReminders.has(insight.id);

              return (
                <AnimatedEntry
                  key={insight.id}
                  preset="fadeUp"
                  delay={index * 100}
                  layout={true}
                >
                  <TouchableOpacity
                    style={[
                      styles.card,
                      isCompleted && styles.completedCard,
                    ]}
                    onPress={() => toggleExpandInsight(insight.id)}
                    activeOpacity={0.92}
                  >
                    {/* Top gradient accent strip */}
                    <LinearGradient
                      colors={insight.gradientColors}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.cardAccentStrip}
                    />

                    {/* Card Body */}
                    <View style={styles.cardBody}>
                      {/* Header row */}
                      <View style={styles.cardHeader}>
                        <LinearGradient
                          colors={insight.gradientColors}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.iconGradient}
                        >
                          <Ionicons name={insight.icon} size={20} color="#FFF" />
                        </LinearGradient>
                        <View style={styles.cardTitleBlock}>
                          <Text style={styles.cardCategoryTitle} numberOfLines={1}>{insight.title}</Text>
                          <View style={styles.badgeRow}>
                            <View style={[styles.badge, { backgroundColor: `${insight.accentColor}18` }]}>
                              <Text style={[styles.badgeText, { color: insight.accentColor }]}>{insight.relevance}</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: Colors.primarySoft }]}>
                              <Text style={[styles.badgeText, { color: Colors.primaryDark }]}>{insight.scoreImpact}</Text>
                            </View>
                          </View>
                        </View>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color={Colors.textTertiary}
                          style={styles.chevronIcon}
                        />
                      </View>

                      {/* Core suggestion text */}
                      <Text style={styles.cardCoreText}>{insight.text}</Text>

                      {/* Completed indicator */}
                      {isCompleted && (
                        <View style={styles.completedTag}>
                          <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
                          <Text style={styles.completedTagText}>Accepted</Text>
                        </View>
                      )}

                      {/* Expanded Detail Panel */}
                      {isExpanded && (
                        <View style={styles.expandedPanel}>
                          <View style={styles.divider} />
                          
                          <Text style={styles.sectionLabel}>WHY IT MATTERS</Text>
                          <Text style={styles.sectionContent}>{insight.whyItMatters}</Text>

                          <Text style={styles.sectionLabel}>YOUR ACTION PLAN</Text>
                          {insight.actionSteps.map((step, sIdx) => (
                            <View key={sIdx} style={styles.stepItem}>
                              <View style={[styles.stepBullet, { backgroundColor: insight.accentColor }]}>
                                <Text style={styles.stepNumber}>{sIdx + 1}</Text>
                              </View>
                              <Text style={styles.stepText}>{step}</Text>
                            </View>
                          ))}

                          {/* Action Buttons */}
                          <View style={styles.actionsBar}>
                            <TouchableOpacity
                              style={[
                                styles.actionBtn,
                                isCompleted && { backgroundColor: Colors.success, borderColor: Colors.success }
                              ]}
                              onPress={() => handleIWillDoThis(insight.id)}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name={isCompleted ? "checkmark-circle" : "checkmark-circle-outline"}
                                size={16}
                                color={isCompleted ? "#FFF" : Colors.primary}
                              />
                              <Text style={[styles.actionBtnText, isCompleted && { color: '#FFF' }]}>
                                {isCompleted ? "Accepted!" : "I'll do this"}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.actionBtn,
                                hasReminder && { backgroundColor: Colors.primary, borderColor: Colors.primary }
                              ]}
                              onPress={() => handleSetReminder(insight)}
                              activeOpacity={0.8}
                            >
                              <Ionicons
                                name={hasReminder ? "alarm" : "alarm-outline"}
                                size={16}
                                color={hasReminder ? "#FFF" : Colors.primary}
                              />
                              <Text style={[styles.actionBtnText, hasReminder && { color: '#FFF' }]}>
                                {hasReminder ? "Alert Set" : "Remind me"}
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.actionBtn, { paddingHorizontal: 12 }]}
                              onPress={() => handleShareSuggestion(insight.text)}
                              activeOpacity={0.8}
                            >
                              <Ionicons name="share-social-outline" size={16} color={Colors.primary} />
                            </TouchableOpacity>
                          </View>

                          {/* Log Shortcut */}
                          <TouchableOpacity
                            style={styles.logShortcut}
                            onPress={() => navigation.navigate('LogTab')}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="create-outline" size={14} color={Colors.primary} style={{ marginRight: 4 }} />
                            <Text style={styles.logShortcutText}>Log related baseline metric</Text>
                            <Ionicons name="arrow-forward" size={12} color={Colors.primary} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </AnimatedEntry>
              );
            })}

            {/* ─── AI Coach Chat Section ─── */}
            <View style={styles.chatSection}>
              {/* Chat Header */}
              <View style={styles.chatSectionHeader}>
                <LinearGradient
                  colors={Colors.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.chatHeaderIcon}
                >
                  <Ionicons name="chatbubble-ellipses" size={18} color="#FFF" />
                </LinearGradient>
                <View style={styles.chatHeaderTexts}>
                  <Text style={styles.chatCoachTitle}>Ask AI Wellness Coach</Text>
                  <Text style={styles.chatCoachSub}>Behavioral Support Assistant</Text>
                </View>
              </View>

              {/* Chat Messages Window */}
              <View style={styles.chatWindow}>
                <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
                  {chatMessages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <AnimatedEntry
                        key={msg.id}
                        preset={isUser ? 'fadeRight' : 'fadeLeft'}
                        style={[
                          styles.chatBubbleRow,
                          isUser && styles.chatBubbleRowUser
                        ]}
                      >
                        {!isUser && (
                          <View style={styles.coachAvatar}>
                            <Ionicons name="sparkles" size={12} color={Colors.primary} />
                          </View>
                        )}
                        <View style={[
                          styles.chatBubble,
                          isUser ? styles.chatBubbleUser : styles.chatBubbleCoach,
                          msg.isError && styles.chatBubbleError
                        ]}>
                          <Text style={[
                            styles.chatText,
                            isUser && styles.chatTextUser
                          ]}>
                            {msg.content}
                          </Text>
                          <Text style={[
                            styles.chatTime,
                            isUser && styles.chatTimeUser
                          ]}>
                            {msg.time}
                          </Text>
                        </View>
                      </AnimatedEntry>
                    );
                  })}

                  {chatLoading && (
                    <AnimatedEntry
                      preset="fade"
                      style={[styles.chatBubbleRow]}
                    >
                      <View style={styles.coachAvatar}>
                        <Ionicons name="sparkles" size={12} color={Colors.primary} />
                      </View>
                      <View style={[styles.chatBubble, styles.chatBubbleCoach, styles.loadingBubble]}>
                        <TypingIndicator />
                        <Text style={[styles.chatText, { fontStyle: 'italic', color: Colors.textSecondary }]}>
                          Analyzing logs...
                        </Text>
                      </View>
                    </AnimatedEntry>
                  )}
                </ScrollView>
              </View>

              {/* Quick Coaching Prompts */}
              <View style={styles.quickPromptsContainer}>
                <Text style={styles.quickPromptsLabel}>QUICK TOPICS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickPromptsScroll}>
                  {quickQuestions.map((q, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.quickPromptBubble}
                      onPress={() => sendMessageToCoach(q.text)}
                      disabled={chatLoading}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="sparkles-outline" size={11} color={Colors.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.quickPromptText}>{q.text}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Chat Input Bar */}
              <View style={styles.chatInputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Ask about your habits..."
                  placeholderTextColor={Colors.textTertiary}
                  value={chatInput}
                  onChangeText={setChatInput}
                  editable={!chatLoading}
                  onSubmitEditing={() => sendMessageToCoach(chatInput)}
                />
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    (!chatInput.trim() || chatLoading) && styles.sendBtnDisabled
                  ]}
                  onPress={() => sendMessageToCoach(chatInput)}
                  disabled={!chatInput.trim() || chatLoading}
                  activeOpacity={0.8}
                >
                  <Ionicons name="send" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom spacer */}
            <View style={{ height: 40 }} />
          </Animated.View>
        )}
      </ScrollView>

      </KeyboardAvoidingView>

      {/* ─── API Key Modal ─── */}
      <Modal
        visible={showApiKeyModal}
        animationType="fade"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setShowApiKeyModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowApiKeyModal(false)}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
            >
              <View style={styles.modalHeader}>
                <LinearGradient colors={Colors.gradientPrimary} style={styles.modalIconGradient}>
                  <Ionicons name="key" size={20} color="#FFF" />
                </LinearGradient>
                <Text style={styles.modalTitle}>Gemini API Key</Text>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setShowApiKeyModal(false)}
                >
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDesc}>
                Get a free API key from{' '}
                <Text style={{ color: Colors.primary, fontWeight: '600' }}>aistudio.google.com/apikey</Text>
                {' '}and paste it below. Your key is stored securely on the server and never shared.
              </Text>

              {hasCustomKey && maskedKey && (
                <View style={styles.currentKeyBox}>
                  <View style={styles.currentKeyRow}>
                    <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    <Text style={styles.currentKeyLabel}>Current key: </Text>
                    <Text style={styles.currentKeyValue}>{maskedKey}</Text>
                  </View>
                  <TouchableOpacity onPress={handleRemoveApiKey}>
                    <Text style={styles.removeKeyText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              )}

              <TextInput
                style={styles.apiKeyInput}
                placeholder="Paste your Gemini API key here..."
                placeholderTextColor={Colors.textTertiary}
                value={apiKeyInput}
                onChangeText={setApiKeyInput}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry={false}
              />

              <TouchableOpacity
                style={[
                  styles.saveKeyBtn,
                  (!apiKeyInput.trim() || savingKey) && styles.saveKeyBtnDisabled
                ]}
                onPress={handleSaveApiKey}
                disabled={!apiKeyInput.trim() || savingKey}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={apiKeyInput.trim() ? Colors.gradientPrimary : ['#CCC', '#BBB']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.saveKeyBtnGradient}
                >
                  {savingKey ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={16} color="#FFF" />
                      <Text style={styles.saveKeyBtnText}>
                        {hasCustomKey ? 'Update Key' : 'Save Key'}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.modalInfoBox}>
                <Ionicons name="information-circle" size={14} color={Colors.primary} />
                <Text style={styles.modalInfoText}>
                  The free tier includes 1,500 requests/day. Your key is only used for your AI coach requests.
                </Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ─── Header ───
  header: {
    paddingTop: 56,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backBtn: {
    padding: 2,
  },
  backBtnCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  coachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(82, 168, 162, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginTop: 3,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4ECDC4',
    marginRight: 4,
  },
  coachBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryLight,
    letterSpacing: 0.3,
  },
  refreshBtn: {
    padding: 2,
  },

  // ─── Sync Card ───
  syncCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gaugeContainer: {
    marginRight: Spacing.md,
  },
  outerGauge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 3,
    borderColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerGauge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gaugeNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gaugeLabel: {
    fontSize: 8,
    textTransform: 'uppercase',
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    marginTop: -1,
  },
  syncTexts: {
    flex: 1,
  },
  syncCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 3,
  },
  syncCardSub: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 17,
  },

  // ─── Scroll Content ───
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 40,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 80,
    paddingHorizontal: Spacing.xxl,
  },
  loadingText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  errorText: {
    ...Typography.body,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.full,
    ...Shadows.small,
  },
  retryText: {
    color: '#FFF',
    ...Typography.button,
    fontWeight: 'bold',
  },

  // ─── Intro ───
  introBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.small,
  },
  introLottie: {
    width: 64,
    height: 64,
  },
  introTexts: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  introTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },
  introSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },

  // ─── Filter Pills ───
  pillContainer: {
    marginBottom: Spacing.md,
  },
  pillScroll: {
    paddingVertical: 2,
    gap: 8,
    flexDirection: 'row',
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pillTextActive: {
    color: '#FFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: Spacing.xxl,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubText: {
    fontSize: 12,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // ─── Insight Cards ───
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  completedCard: {
    borderColor: Colors.success,
    borderWidth: 1.5,
  },
  cardAccentStrip: {
    height: 4,
    width: '100%',
  },
  cardBody: {
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  iconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitleBlock: {
    flex: 1,
    marginLeft: Spacing.sm,
    marginRight: Spacing.xs,
  },
  cardCategoryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 3,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  chevronIcon: {
    flexShrink: 0,
  },
  cardCoreText: {
    fontSize: 13.5,
    lineHeight: 21,
    color: Colors.text,
    fontWeight: '400',
  },
  completedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  completedTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.success,
  },

  // ─── Expanded Panel ───
  expandedPanel: {
    marginTop: Spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  stepBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
    flexShrink: 0,
  },
  stepNumber: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFF',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 19,
  },
  actionsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: Spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 5,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  logShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: Spacing.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: Colors.primarySoft,
    borderRadius: 8,
    gap: 2,
  },
  logShortcutText: {
    fontSize: 12,
    color: Colors.primaryDark,
    fontWeight: '600',
    marginRight: 2,
  },

  // ─── Chat Section ───
  chatSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    marginTop: Spacing.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.medium,
  },
  chatSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  chatHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderTexts: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  chatCoachTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  chatCoachSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },

  // ─── Chat Window ───
  chatWindow: {
    maxHeight: 360,
    padding: Spacing.md,
    backgroundColor: Colors.background,
  },
  chatBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: Spacing.md,
  },
  chatBubbleRowUser: {
    flexDirection: 'row-reverse',
  },
  coachAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chatBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  chatBubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
    marginLeft: 8,
  },
  chatBubbleCoach: {
    backgroundColor: Colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chatBubbleError: {
    backgroundColor: Colors.warmSoft,
    borderColor: Colors.warm,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatText: {
    fontSize: 13.5,
    lineHeight: 20,
    color: Colors.text,
  },
  chatTextUser: {
    color: '#FFFFFF',
  },
  chatTime: {
    fontSize: 9,
    marginTop: 5,
    alignSelf: 'flex-end',
    color: Colors.textTertiary,
  },
  chatTimeUser: {
    color: 'rgba(255, 255, 255, 0.6)',
  },

  // ─── Quick Prompts ───
  quickPromptsContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  quickPromptsLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  quickPromptsScroll: {
    gap: 8,
    flexDirection: 'row',
    paddingBottom: 4,
  },
  quickPromptBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickPromptText: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: '500',
  },

  // ─── Chat Input ───
  chatInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.divider,
    backgroundColor: Colors.surface,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 11 : 8,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 13.5,
    color: Colors.text,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    ...Shadows.small,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.textTertiary,
    opacity: 0.5,
  },

  // ─── Quota Banner ───
  quotaBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  quotaBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  quotaBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400E',
  },
  quotaBannerText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#78350F',
    marginBottom: 12,
  },
  quotaBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#D97706',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    alignSelf: 'flex-start',
  },
  quotaBannerBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  quotaBannerNote: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 10,
    fontStyle: 'italic',
  },

  // ─── API Key Modal ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    width: '100%',
    maxWidth: 360,
    ...Shadows.large,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitle: {
    ...Typography.h2,
    color: Colors.text,
    flex: 1,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  currentKeyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.accentSoft,
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  currentKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  currentKeyLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 6,
  },
  currentKeyValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  removeKeyText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.error,
    marginLeft: 8,
  },
  apiKeyInput: {
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    fontSize: 14,
    color: Colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginBottom: Spacing.md,
  },
  saveKeyBtn: {
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  saveKeyBtnDisabled: {
    opacity: 0.6,
  },
  saveKeyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  saveKeyBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
  modalInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.primarySoft,
    padding: 12,
    borderRadius: Radius.md,
  },
  modalInfoText: {
    ...Typography.caption,
    color: Colors.primaryDark,
    flex: 1,
    lineHeight: 18,
  },
});
