const express = require('express');
const DailyLog = require('../models/DailyLog');
const Baseline = require('../models/Baseline');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/data/log
// @desc    Submit a daily behavioral log
router.post('/log', protect, async (req, res) => {
  try {
    const { sleep, activity, nutrition, mental, vitals, screenTime, symptoms, notes, date } = req.body;

    // Use provided date or today
    const logDate = date ? new Date(date) : new Date();
    const normalizedDate = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());

    // Upsert — update if exists, create if not
    const log = await DailyLog.findOneAndUpdate(
      { user: req.user.id, date: normalizedDate },
      {
        user: req.user.id,
        date: normalizedDate,
        sleep, activity, nutrition, mental, vitals, screenTime, symptoms, notes
      },
      { new: true, upsert: true, runValidators: true }
    );

    // Check if we should compute/update baseline
    await updateBaseline(req.user.id);

    res.status(201).json({ success: true, data: log });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A log for this date already exists. Use PUT to update.'
      });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/data/logs
// @desc    Get user's daily logs (with date range filter)
router.get('/logs', protect, async (req, res) => {
  try {
    const { startDate, endDate, limit = 30 } = req.query;

    const query = { user: req.user.id };
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const logs = await DailyLog.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit));

    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/data/log/:date
// @desc    Get a specific day's log
router.get('/log/:date', protect, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const log = await DailyLog.findOne({ user: req.user.id, date: normalizedDate });

    if (!log) {
      return res.status(404).json({ success: false, message: 'No log found for this date' });
    }

    res.json({ success: true, data: log });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/data/baseline
// @desc    Get user's baseline
router.get('/baseline', protect, async (req, res) => {
  try {
    const baseline = await Baseline.findOne({ user: req.user.id });
    if (!baseline) {
      return res.status(404).json({
        success: false,
        message: 'Baseline not yet established. Keep logging daily data.'
      });
    }
    res.json({ success: true, data: baseline });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Helper: compute/update baseline from earliest logs
async function updateBaseline(userId) {
  const logs = await DailyLog.find({ user: userId }).sort({ date: 1 }).limit(14);

  if (logs.length < 3) return; // Need at least 3 data points

  const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

  const safeValues = (logs, path) => {
    return logs.map(log => {
      const parts = path.split('.');
      let val = log;
      for (const p of parts) {
        val = val?.[p];
      }
      return val;
    }).filter(v => v != null && !isNaN(v));
  };

  const baseline = {
    sleep: {
      avgHours: avg(safeValues(logs, 'sleep.hoursSlept')),
      avgQuality: avg(safeValues(logs, 'sleep.quality'))
    },
    activity: {
      avgSteps: avg(safeValues(logs, 'activity.steps')),
      avgExerciseMinutes: avg(safeValues(logs, 'activity.exerciseMinutes'))
    },
    nutrition: {
      avgMeals: avg(safeValues(logs, 'nutrition.mealsCount')),
      avgWaterIntake: avg(safeValues(logs, 'nutrition.waterIntake')),
      avgCaffeine: avg(safeValues(logs, 'nutrition.caffeine'))
    },
    mental: {
      avgMood: avg(safeValues(logs, 'mental.mood')),
      avgStress: avg(safeValues(logs, 'mental.stressLevel')),
      avgAnxiety: avg(safeValues(logs, 'mental.anxietyLevel'))
    },
    vitals: {
      avgHeartRate: avg(safeValues(logs, 'vitals.heartRate')),
      avgBloodPressureSys: avg(safeValues(logs, 'vitals.bloodPressureSys')),
      avgBloodPressureDia: avg(safeValues(logs, 'vitals.bloodPressureDia'))
    },
    screenTime: {
      avgTotalHours: avg(safeValues(logs, 'screenTime.totalHours')),
      avgSocialMediaHours: avg(safeValues(logs, 'screenTime.socialMediaHours'))
    },
    dataPointsUsed: logs.length,
    lastUpdated: new Date(),
    isReliable: logs.length >= 7
  };

  await Baseline.findOneAndUpdate(
    { user: userId },
    baseline,
    { upsert: true, new: true }
  );

  // Mark user baseline as established
  if (logs.length >= 7) {
    await User.findByIdAndUpdate(userId, { baselineEstablished: true });
  }
}

module.exports = router;
