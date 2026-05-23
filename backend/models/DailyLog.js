const mongoose = require('mongoose');

const dailyLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: () => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }
  },

  // Sleep metrics
  sleep: {
    hoursSlept: { type: Number, min: 0, max: 24 },
    quality: { type: Number, min: 1, max: 10 }, // 1-10 scale
    bedTime: String,  // "23:30"
    wakeTime: String  // "07:00"
  },

  // Physical activity
  activity: {
    steps: { type: Number, min: 0, default: 0 },
    exerciseMinutes: { type: Number, min: 0, default: 0 },
    exerciseType: String, // "running", "gym", "yoga", etc.
    intensity: { type: String, enum: ['low', 'moderate', 'high', 'none'], default: 'none' }
  },

  // Nutrition
  nutrition: {
    mealsCount: { type: Number, min: 0, max: 10, default: 3 },
    waterIntake: { type: Number, min: 0 }, // glasses
    junkFood: { type: Boolean, default: false },
    fruits: { type: Boolean, default: false },
    caffeine: { type: Number, min: 0, default: 0 } // cups
  },

  // Mental health
  mental: {
    mood: { type: Number, min: 1, max: 10 }, // 1 = very low, 10 = excellent
    stressLevel: { type: Number, min: 1, max: 10 },
    anxietyLevel: { type: Number, min: 1, max: 10 },
    socialInteraction: { type: String, enum: ['none', 'minimal', 'moderate', 'high'], default: 'moderate' }
  },

  // Vitals (optional — from wearable or manual)
  vitals: {
    heartRate: Number,       // bpm
    bloodPressureSys: Number, // mmHg
    bloodPressureDia: Number,
    bodyTemperature: Number,  // °F
    oxygenLevel: Number       // SpO2 %
  },

  // Screen time
  screenTime: {
    totalHours: { type: Number, min: 0 },
    socialMediaHours: { type: Number, min: 0 }
  },

  // Symptoms
  symptoms: [{
    type: String,
    enum: [
      'headache', 'fatigue', 'nausea', 'dizziness',
      'chest_pain', 'shortness_of_breath', 'muscle_pain',
      'fever', 'cough', 'sore_throat', 'none'
    ]
  }],

  notes: String

}, {
  timestamps: true
});

// Compound unique index — one log per user per day
dailyLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', dailyLogSchema);
