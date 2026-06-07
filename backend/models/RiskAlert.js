const mongoose = require('mongoose');

const riskAlertSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  overallRiskScore: {
    type: Number, // 0-100
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'moderate', 'high', 'critical'],
    required: true
  },
  categories: [{
    name: {
      type: String,
      enum: ['sleep', 'activity', 'nutrition', 'mental', 'vitals', 'screenTime', 'cognitive']
    },
    score: Number,      // 0-100
    deviation: Number,  // % deviation from baseline
    direction: String,  // 'above' or 'below'
    message: String
  }],
  recommendations: [String],
  acknowledged: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

riskAlertSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('RiskAlert', riskAlertSchema);
