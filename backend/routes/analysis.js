const express = require('express');
const DailyLog = require('../models/DailyLog');
const Baseline = require('../models/Baseline');
const RiskAlert = require('../models/RiskAlert');
const { protect } = require('../middleware/auth');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your_gemini_api_key_here');

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

    // Save the alert
    const alert = await RiskAlert.create({
      user: req.user.id,
      ...riskResult
    });

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
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, data: alerts });
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
      water: avg(recentLogs.map(l => l.nutrition?.waterIntake))
    };

    // Overall health assessment
    let healthScore = 50;
    if (weeklyAvg.sleepHours) healthScore += (weeklyAvg.sleepHours >= 7 ? 10 : -5);
    if (weeklyAvg.mood) healthScore += ((weeklyAvg.mood - 5) * 3);
    if (weeklyAvg.stress) healthScore -= ((weeklyAvg.stress - 5) * 2);
    if (weeklyAvg.steps) healthScore += (weeklyAvg.steps >= 8000 ? 10 : -3);
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

    const prompt = `
      You are an expert health and wellness assistant. Analyze the following user data (which includes baseline and the last 3 days of logs) and provide 3-4 insightful, highly personalized, and actionable health suggestions. Do NOT use markdown. Return the response as a JSON array of strings, where each string is a separate suggestion.
      
      Baseline: ${JSON.stringify(baseline)}
      Recent Logs: ${JSON.stringify(recentLogs)}
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
    console.error('Error generating AI insights:', err);
    res.status(500).json({ success: false, message: 'Failed to generate AI insights.' });
  }
});

module.exports = router;
