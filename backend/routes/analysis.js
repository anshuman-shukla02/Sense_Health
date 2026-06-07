const express = require('express');
const DailyLog = require('../models/DailyLog');
const Baseline = require('../models/Baseline');
const RiskAlert = require('../models/RiskAlert');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Default Gemini instance (server-level key)
const defaultGenAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Get Gemini model for a specific user (uses their key if set, otherwise server default)
async function getGeminiModel(userId) {
  const user = await User.findById(userId).select('+geminiApiKey');
  const apiKey = user?.geminiApiKey || process.env.GEMINI_API_KEY || '';
  const genAI = user?.geminiApiKey
    ? new GoogleGenerativeAI(apiKey)
    : defaultGenAI;
  return { model: genAI.getGenerativeModel({ model: 'gemini-2.5-flash' }), usingCustomKey: !!user?.geminiApiKey };
}

// Extract only health-relevant fields from baseline (strips _id, __v, user, timestamps)
function slimBaseline(baseline) {
  if (!baseline) return null;
  const b = baseline.toObject ? baseline.toObject() : baseline;
  return {
    sleep: b.sleep,
    activity: b.activity,
    nutrition: b.nutrition,
    mental: b.mental,
    vitals: b.vitals,
    screenTime: b.screenTime,
    cognitive: b.cognitive,
    dataPoints: b.dataPointsUsed,
    reliable: b.isReliable,
  };
}

// Extract only health-relevant fields from daily logs
function slimLog(log) {
  if (!log) return null;
  const l = log.toObject ? log.toObject() : log;
  return {
    date: l.date?.toISOString?.()?.split('T')[0] || l.date,
    sleep: l.sleep,
    activity: { steps: l.activity?.steps, exerciseMin: l.activity?.exerciseMinutes, type: l.activity?.exerciseType, intensity: l.activity?.intensity },
    nutrition: { meals: l.nutrition?.mealsCount, water: l.nutrition?.waterIntake, junkFood: l.nutrition?.junkFood, caffeine: l.nutrition?.caffeine },
    mental: l.mental,
    screenTime: l.screenTime,
    cognitive: l.cognitive ? { reactionTime: l.cognitive.reactionTime, memoryScore: l.cognitive.memoryScore, colorScore: l.cognitive.colorScore } : undefined,
    symptoms: l.symptoms?.length ? l.symptoms : undefined,
    symptomsNotes: l.symptomsNotes || undefined,
    notes: l.notes || undefined,
  };
}

// Detect quota exhaustion from Gemini errors
function isQuotaError(err) {
  const msg = (err.message || '').toLowerCase();
  const status = err.status || err.httpStatusCode || err.code;
  return status === 429 || msg.includes('quota') || msg.includes('resource_exhausted') || msg.includes('rate limit');
}

const router = express.Router();

// @route   GET /api/analysis/risk
// @desc    Calculate current risk score based on latest log vs baseline
router.get('/risk', protect, async (req, res) => {
  try {
    const baseline = await Baseline.findOne({ user: req.user.id });
    if (!baseline) {
      return res.json({
        success: true,
        data: {
          overallRiskScore: 0,
          riskLevel: 'low',
          message: 'Not enough data to assess risk. Keep logging daily.',
          categories: []
        }
      });
    }

    // Get the latest log
    const latestLog = await DailyLog.findOne({ user: req.user.id }).sort({ date: -1 });
    if (!latestLog) {
      return res.json({
        success: true,
        data: { overallRiskScore: 0, riskLevel: 'low', categories: [] }
      });
    }

    const riskResult = calculateRiskScore(latestLog, baseline);

    // Save or update today's alert (preventing repeated duplicate alerts for the same day)
    const now = new Date();
    const normalizedDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const alert = await RiskAlert.findOneAndUpdate(
      { user: req.user.id, date: normalizedDate },
      {
        user: req.user.id,
        date: normalizedDate,
        ...riskResult,
        acknowledged: false
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, data: alert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/analysis/trends
// @desc    Get trend data for charts (last N days)
router.get('/trends', protect, async (req, res) => {
  try {
    const { days = 14 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const logs = await DailyLog.find({
      user: req.user.id,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    const baseline = await Baseline.findOne({ user: req.user.id });

    const trends = {
      dates: logs.map(l => l.date.toISOString().split('T')[0]),
      sleep: {
        hours: logs.map(l => l.sleep?.hoursSlept || null),
        quality: logs.map(l => l.sleep?.quality || null),
        baseline: baseline?.sleep?.avgHours || null
      },
      mood: {
        values: logs.map(l => l.mental?.mood || null),
        baseline: baseline?.mental?.avgMood || null
      },
      stress: {
        values: logs.map(l => l.mental?.stressLevel || null),
        baseline: baseline?.mental?.avgStress || null
      },
      activity: {
        steps: logs.map(l => l.activity?.steps || null),
        exerciseMinutes: logs.map(l => l.activity?.exerciseMinutes || null),
        baseline: baseline?.activity?.avgSteps || null
      },
      water: {
        values: logs.map(l => l.nutrition?.waterIntake || null),
        baseline: baseline?.nutrition?.avgWaterIntake || null
      },
      screenTime: {
        values: logs.map(l => l.screenTime?.totalHours || null),
        baseline: baseline?.screenTime?.avgTotalHours || null
      }
    };

    res.json({ success: true, data: trends });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/analysis/alerts
// @desc    Get recent risk alerts
router.get('/alerts', protect, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const alerts = await RiskAlert.find({ user: req.user.id })
      .sort({ date: -1 });

    // Deduplicate alerts by calendar day YYYY-MM-DD
    const uniqueAlerts = [];
    const seenDates = new Set();

    for (const alert of alerts) {
      if (!alert.date) continue;
      const dateStr = new Date(alert.date).toISOString().split('T')[0];
      if (!seenDates.has(dateStr)) {
        seenDates.add(dateStr);
        uniqueAlerts.push(alert);
      }
    }

    const limitedAlerts = uniqueAlerts.slice(0, parseInt(limit));
    res.json({ success: true, data: limitedAlerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/analysis/summary
// @desc    Get a comprehensive health summary
router.get('/summary', protect, async (req, res) => {
  try {
    const baseline = await Baseline.findOne({ user: req.user.id });
    const recentLogs = await DailyLog.find({ user: req.user.id })
      .sort({ date: -1 })
      .limit(7);

    const totalLogs = await DailyLog.countDocuments({ user: req.user.id });

    if (recentLogs.length === 0) {
      return res.json({
        success: true,
        data: {
          totalLogs: 0,
          streak: 0,
          baselineEstablished: false,
          overallHealth: 'unknown'
        }
      });
    }

    // Calculate streak
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < recentLogs.length; i++) {
      const logDate = new Date(recentLogs[i].date);
      logDate.setHours(0, 0, 0, 0);
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      if (logDate.getTime() === expected.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    // Compute weekly averages
    const avg = (arr) => arr.filter(v => v != null).length
      ? arr.filter(v => v != null).reduce((a, b) => a + b, 0) / arr.filter(v => v != null).length
      : null;

    const weeklyAvg = {
      sleepHours: avg(recentLogs.map(l => l.sleep?.hoursSlept)),
      sleepQuality: avg(recentLogs.map(l => l.sleep?.quality)),
      mood: avg(recentLogs.map(l => l.mental?.mood)),
      stress: avg(recentLogs.map(l => l.mental?.stressLevel)),
      steps: avg(recentLogs.map(l => l.activity?.steps)),
      water: avg(recentLogs.map(l => l.nutrition?.waterIntake)),
      reactionTime: avg(recentLogs.map(l => l.cognitive?.reactionTime)),
      memoryScore: avg(recentLogs.map(l => l.cognitive?.memoryScore)),
      colorScore: avg(recentLogs.map(l => l.cognitive?.colorScore))
    };

    // Overall health assessment
    let healthScore = 50;
    if (weeklyAvg.sleepHours) healthScore += (weeklyAvg.sleepHours >= 7 ? 10 : -5);
    if (weeklyAvg.mood) healthScore += ((weeklyAvg.mood - 5) * 3);
    if (weeklyAvg.stress) healthScore -= ((weeklyAvg.stress - 5) * 2);
    if (weeklyAvg.steps) healthScore += (weeklyAvg.steps >= 8000 ? 10 : -3);
    if (weeklyAvg.reactionTime) healthScore += (weeklyAvg.reactionTime <= 300 ? 5 : weeklyAvg.reactionTime > 400 ? -10 : -3);
    healthScore = Math.max(0, Math.min(100, Math.round(healthScore)));

    const overallHealth = healthScore >= 80 ? 'excellent'
      : healthScore >= 60 ? 'good'
      : healthScore >= 40 ? 'fair'
      : 'needs_attention';

    res.json({
      success: true,
      data: {
        totalLogs,
        streak,
        baselineEstablished: baseline?.isReliable || false,
        healthScore,
        overallHealth,
        weeklyAvg,
        baseline: baseline || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============ Risk Calculation Engine ============

function calculateRiskScore(log, baseline) {
  const categories = [];
  let totalWeight = 0;
  let weightedScore = 0;

  // Sleep risk
  if (baseline.sleep?.avgHours && log.sleep?.hoursSlept) {
    const deviation = ((log.sleep.hoursSlept - baseline.sleep.avgHours) / baseline.sleep.avgHours) * 100;
    const sleepScore = calculateCategoryRisk(deviation, 20, 40);
    categories.push({
      name: 'sleep',
      score: sleepScore,
      deviation: Math.abs(deviation).toFixed(1),
      direction: deviation >= 0 ? 'above' : 'below',
      message: getSleepMessage(log.sleep.hoursSlept, deviation, sleepScore)
    });
    weightedScore += sleepScore * 25;
    totalWeight += 25;
  }

  // Mental health risk
  if (baseline.mental?.avgMood && log.mental?.mood) {
    const moodDev = ((log.mental.mood - baseline.mental.avgMood) / baseline.mental.avgMood) * 100;
    const stressDev = baseline.mental?.avgStress && log.mental?.stressLevel
      ? ((log.mental.stressLevel - baseline.mental.avgStress) / baseline.mental.avgStress) * 100
      : 0;

    // For mood, below baseline = bad; for stress, above baseline = bad
    const mentalScore = Math.min(100, Math.max(0,
      (calculateCategoryRisk(-moodDev, 15, 30) + calculateCategoryRisk(stressDev, 15, 30)) / 2
    ));

    categories.push({
      name: 'mental',
      score: mentalScore,
      deviation: Math.abs(moodDev).toFixed(1),
      direction: moodDev >= 0 ? 'above' : 'below',
      message: getMentalMessage(log.mental, mentalScore)
    });
    weightedScore += mentalScore * 25;
    totalWeight += 25;
  }

  // Activity risk
  if (baseline.activity?.avgSteps && log.activity?.steps != null) {
    const deviation = ((log.activity.steps - baseline.activity.avgSteps) / baseline.activity.avgSteps) * 100;
    const activityScore = calculateCategoryRisk(-deviation, 25, 50); // less activity = more risk
    categories.push({
      name: 'activity',
      score: activityScore,
      deviation: Math.abs(deviation).toFixed(1),
      direction: deviation >= 0 ? 'above' : 'below',
      message: getActivityMessage(log.activity.steps, deviation, activityScore)
    });
    weightedScore += activityScore * 20;
    totalWeight += 20;
  }

  // Nutrition risk
  if (baseline.nutrition?.avgWaterIntake && log.nutrition?.waterIntake != null) {
    const waterDev = ((log.nutrition.waterIntake - baseline.nutrition.avgWaterIntake) / baseline.nutrition.avgWaterIntake) * 100;
    const nutritionScore = calculateCategoryRisk(-waterDev, 20, 40);
    categories.push({
      name: 'nutrition',
      score: nutritionScore,
      deviation: Math.abs(waterDev).toFixed(1),
      direction: waterDev >= 0 ? 'above' : 'below',
      message: getNutritionMessage(log.nutrition, nutritionScore)
    });
    weightedScore += nutritionScore * 15;
    totalWeight += 15;
  }

  // Screen time risk
  if (baseline.screenTime?.avgTotalHours && log.screenTime?.totalHours != null) {
    const deviation = ((log.screenTime.totalHours - baseline.screenTime.avgTotalHours) / baseline.screenTime.avgTotalHours) * 100;
    const screenScore = calculateCategoryRisk(deviation, 20, 40);
    categories.push({
      name: 'screenTime',
      score: screenScore,
      deviation: Math.abs(deviation).toFixed(1),
      direction: deviation >= 0 ? 'above' : 'below',
      message: getScreenTimeMessage(log.screenTime.totalHours, deviation, screenScore)
    });
    weightedScore += screenScore * 15;
    totalWeight += 15;
  }

  // Cognitive & Reflex fatigue risk
  if (baseline.cognitive?.avgReactionTime && log.cognitive?.reactionTime) {
    const reactionDev = ((log.cognitive.reactionTime - baseline.cognitive.avgReactionTime) / baseline.cognitive.avgReactionTime) * 100;
    
    // For reaction time, today's time > baseline means slower (higher risk)
    let cognitiveScore = calculateCategoryRisk(reactionDev, 15, 30);
    
    if (baseline.cognitive?.avgMemoryScore && log.cognitive?.memoryScore) {
      const memoryDev = ((log.cognitive.memoryScore - baseline.cognitive.avgMemoryScore) / baseline.cognitive.avgMemoryScore) * 100;
      // Below baseline = higher risk (use -memoryDev)
      cognitiveScore = (cognitiveScore + calculateCategoryRisk(-memoryDev, 15, 30)) / 2;
    }

    categories.push({
      name: 'cognitive',
      score: Math.round(cognitiveScore),
      deviation: Math.abs(reactionDev).toFixed(1),
      direction: reactionDev >= 0 ? 'slower' : 'faster',
      message: getCognitiveMessage(log.cognitive, reactionDev, cognitiveScore)
    });
    weightedScore += cognitiveScore * 20;
    totalWeight += 20;
  }

  const overallRiskScore = totalWeight > 0
    ? Math.round(weightedScore / totalWeight)
    : 0;

  const riskLevel = overallRiskScore >= 75 ? 'critical'
    : overallRiskScore >= 50 ? 'high'
    : overallRiskScore >= 25 ? 'moderate'
    : 'low';

  const recommendations = generateRecommendations(categories, log);

  return { overallRiskScore, riskLevel, categories, recommendations };
}

function calculateCategoryRisk(deviationPercent, moderateThreshold, highThreshold) {
  const absDeviation = Math.abs(deviationPercent);
  if (absDeviation <= moderateThreshold * 0.5) return Math.round(absDeviation * 0.5);
  if (absDeviation <= moderateThreshold) return Math.round(15 + (absDeviation - moderateThreshold * 0.5) * 1.5);
  if (absDeviation <= highThreshold) return Math.round(40 + (absDeviation - moderateThreshold) * 2);
  return Math.min(100, Math.round(70 + (absDeviation - highThreshold)));
}

function getSleepMessage(hours, deviation, score) {
  if (score < 20) return `Sleep is within normal range (${hours}h).`;
  if (hours < 6) return `Significantly low sleep (${hours}h). This can impair cognitive function.`;
  if (hours > 10) return `Excessive sleep (${hours}h). This can indicate fatigue or depression.`;
  return `Sleep deviation of ${Math.abs(deviation).toFixed(0)}% from your baseline.`;
}

function getMentalMessage(mental, score) {
  if (score < 20) return 'Mental health markers are within normal range.';
  if (mental.mood <= 3) return 'Very low mood detected. Consider reaching out to a mental health professional.';
  if (mental.stressLevel >= 8) return 'High stress levels detected. Consider relaxation techniques.';
  return 'Some deviation in mental health metrics from your baseline.';
}

function getActivityMessage(steps, deviation, score) {
  if (score < 20) return `Activity levels are good (${steps} steps).`;
  if (steps < 2000) return `Very low activity (${steps} steps). Try to move more today.`;
  return `Activity is ${Math.abs(deviation).toFixed(0)}% ${deviation < 0 ? 'below' : 'above'} your baseline.`;
}

function getNutritionMessage(nutrition, score) {
  if (score < 20) return 'Nutrition and hydration look good.';
  if (nutrition.waterIntake < 4) return 'Low water intake. Aim for at least 8 glasses per day.';
  return 'Some deviation in nutrition patterns from your baseline.';
}

function getScreenTimeMessage(hours, deviation, score) {
  if (score < 20) return `Screen time is within normal range (${hours}h).`;
  if (hours > 10) return `Very high screen time (${hours}h). Consider taking breaks.`;
  return `Screen time is ${Math.abs(deviation).toFixed(0)}% ${deviation > 0 ? 'above' : 'below'} your baseline.`;
}

function getCognitiveMessage(cognitive, deviation, score) {
  if (score < 20) return `Reflexes and cognitive attention are within normal baseline range.`;
  if (deviation > 30) return `Reaction time is significantly slower (${cognitive.reactionTime}ms, +${deviation.toFixed(0)}%), suggesting high neural fatigue.`;
  if (cognitive.memoryScore && cognitive.memoryScore < 4) return `Cognitive focus is low (Memory Level ${cognitive.memoryScore}). Take a screen break.`;
  return `Cognitive markers deviate ${Math.abs(deviation).toFixed(0)}% from baseline.`;
}

function generateRecommendations(categories, log) {
  const recommendations = [];

  for (const cat of categories) {
    if (cat.score >= 30) {
      switch (cat.name) {
        case 'sleep':
          if (log.sleep?.hoursSlept < 6) {
            recommendations.push('Try to get 7-9 hours of sleep tonight. Avoid screens 1 hour before bed.');
          } else if (log.sleep?.hoursSlept > 10) {
            recommendations.push('Consider setting an alarm. Oversleeping can indicate underlying issues.');
          }
          recommendations.push('Maintain a consistent sleep schedule, even on weekends.');
          break;
        case 'mental':
          if (log.mental?.mood <= 4) {
            recommendations.push('Consider journaling or talking to someone you trust about how you feel.');
          }
          if (log.mental?.stressLevel >= 7) {
            recommendations.push('Try deep breathing exercises or a short meditation session.');
          }
          recommendations.push('Take a 15-minute walk — it can significantly improve your mood.');
          break;
        case 'activity':
          recommendations.push('Aim for at least 30 minutes of moderate exercise today.');
          recommendations.push('Even a short walk can help. Try taking stairs instead of elevators.');
          break;
        case 'nutrition':
          recommendations.push('Drink a glass of water right now. Stay hydrated throughout the day.');
          if (log.nutrition?.junkFood) {
            recommendations.push('Try replacing one junk food meal with a healthier alternative.');
          }
          break;
        case 'screenTime':
          recommendations.push('Follow the 20-20-20 rule: every 20 min, look at something 20 feet away for 20 seconds.');
          break;
        case 'cognitive':
          if (log.cognitive?.reactionTime && log.cognitive.reactionTime > 350) {
            recommendations.push('Slow reaction times detected. Consider taking a 15-minute power nap or stepping away from screens.');
          }
          recommendations.push('Engage in a 5-minute deep breathing or mindfulness session to restore attention and reduce cognitive fatigue.');
          break;
      }
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('Great job! Keep maintaining your healthy habits.');
  }

  return [...new Set(recommendations)].slice(0, 5);
}

// @route   GET /api/analysis/ai-insights
// @desc    Get AI-generated personalized health suggestions
router.get('/ai-insights', protect, async (req, res) => {
  try {
    const baseline = await Baseline.findOne({ user: req.user.id });
    const recentLogs = await DailyLog.find({ user: req.user.id }).sort({ date: -1 }).limit(3);
    
    if (recentLogs.length === 0) {
      return res.json({ success: true, data: "Start logging your daily habits to get personalized AI insights." });
    }

    // Slim down the data to reduce token usage by ~60-70%
    const slimB = slimBaseline(baseline);
    const slimLogs = recentLogs.map(slimLog);

    const prompt = `You are an expert health and wellness assistant. Analyze this user data and provide 3-4 insightful, personalized, actionable health suggestions. Do NOT use markdown. Return only a JSON array of strings.

Baseline: ${JSON.stringify(slimB)}
Recent Logs: ${JSON.stringify(slimLogs)}`;

    const { model } = await getGeminiModel(req.user.id);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up potential markdown formatting in response if any
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let insights = [];
    try {
      insights = JSON.parse(text);
    } catch (e) {
      // Fallback if the AI doesn't return proper JSON
      insights = text.split('\n').filter(line => line.trim().length > 0).map(line => line.replace(/^- /, ''));
    }

    res.json({ success: true, data: insights });
  } catch (err) {
    console.error('Error generating AI insights:', err.message || err);
    if (isQuotaError(err)) {
      return res.status(429).json({
        success: false,
        code: 'QUOTA_EXHAUSTED',
        message: 'Gemini API quota exhausted. Add your own API key in Settings or try again later.'
      });
    }
    res.status(500).json({ success: false, message: `Failed to generate AI insights: ${err.message || 'Unknown error'}` });
  }
});

// @route   POST /api/analysis/chat
// @desc    Ask a follow-up question to the health coach
router.post('/chat', protect, async (req, res) => {
  try {
    const { question, history } = req.body;
    
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question is required.' });
    }

    const baseline = await Baseline.findOne({ user: req.user.id });
    const recentLogs = await DailyLog.find({ user: req.user.id }).sort({ date: -1 }).limit(3);

    // Slim down the data to reduce token usage
    const slimB = slimBaseline(baseline);
    const slimLogs = recentLogs.map(slimLog);

    const contextPrompt = `You are an expert health and wellness coach. Chat with the user about their health.
Baseline: ${JSON.stringify(slimB || 'No baseline yet')}
Recent Logs: ${JSON.stringify(slimLogs.length ? slimLogs : 'No logs yet')}

Be practical, friendly, supportive, scientifically grounded. Limit to 2 short paragraphs. Suggest specific actionable steps. No HTML.`;

    const { model } = await getGeminiModel(req.user.id);
    
    let promptText = `${contextPrompt}\n\n`;
    // Only include last 6 messages of history to keep prompt small
    if (history && Array.isArray(history) && history.length > 0) {
      const recentHistory = history.slice(-6);
      promptText += "Conversation history:\n";
      recentHistory.forEach(msg => {
        const speaker = msg.role === 'user' ? 'User' : 'Coach';
        promptText += `${speaker}: ${msg.content}\n`;
      });
    }
    
    promptText += `User: ${question}\nCoach:`;

    const result = await model.generateContent(promptText);
    const response = await result.response;
    const answer = response.text().trim();

    res.json({ success: true, answer });
  } catch (err) {
    console.error('Error in AI Coach Chat:', err.message || err);
    if (isQuotaError(err)) {
      return res.status(429).json({
        success: false,
        code: 'QUOTA_EXHAUSTED',
        message: 'Gemini API quota exhausted. Add your own API key in Settings or try again later.'
      });
    }
    res.status(500).json({ success: false, message: `Failed to generate response from AI coach: ${err.message || 'Unknown error'}` });
  }
});

module.exports = router;
