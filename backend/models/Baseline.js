const mongoose = require('mongoose');

const baselineSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Baseline averages (computed from first 7 days of data)
  sleep: {
    avgHours: Number,
    avgQuality: Number
  },
  activity: {
    avgSteps: Number,
    avgExerciseMinutes: Number
  },
  nutrition: {
    avgMeals: Number,
    avgWaterIntake: Number,
    avgCaffeine: Number
  },
  mental: {
    avgMood: Number,
    avgStress: Number,
    avgAnxiety: Number
  },
  vitals: {
    avgHeartRate: Number,
    avgBloodPressureSys: Number,
    avgBloodPressureDia: Number
  },
  screenTime: {
    avgTotalHours: Number,
    avgSocialMediaHours: Number
  },

  cognitive: {
    avgReactionTime: Number,
    avgMemoryScore: Number,
    avgColorScore: Number
  },

  dataPointsUsed: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now },
  isReliable: { type: Boolean, default: false } // true when 7+ data points

}, {
  timestamps: true
});

module.exports = mongoose.model('Baseline', baselineSchema);
