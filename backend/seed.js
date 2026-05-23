/**
 * Seed Script — Generates 10 days of realistic demo data for a user.
 * 
 * Usage:
 *   node seed.js <email> <password>
 * 
 * Example:
 *   node seed.js demo@zephlow.com password123
 * 
 * This will:
 *   1. Register a new user (or login if they exist)
 *   2. Create 10 days of daily behavioral logs
 *   3. Trigger baseline computation and risk analysis
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const DailyLog = require('./models/DailyLog');
const Baseline = require('./models/Baseline');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zephlow';

// Helper — random number between min and max
const rand = (min, max) => Math.round((Math.random() * (max - min) + min) * 10) / 10;
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Generate realistic daily data
function generateDayData(dayOffset, isAnomalous = false) {
  const date = new Date();
  date.setDate(date.getDate() - dayOffset);
  date.setHours(0, 0, 0, 0);

  // Normal ranges
  let sleep = { hoursSlept: rand(6.5, 8.5), quality: randInt(6, 9), bedTime: '23:00', wakeTime: '07:00' };
  let activity = { steps: randInt(5000, 12000), exerciseMinutes: randInt(15, 60), exerciseType: pick(['walking', 'running', 'yoga', 'cycling', 'gym']), intensity: pick(['low', 'moderate', 'high']) };
  let nutrition = { mealsCount: randInt(2, 4), waterIntake: randInt(5, 10), junkFood: Math.random() > 0.7, fruits: Math.random() > 0.3, caffeine: randInt(0, 3) };
  let mental = { mood: randInt(5, 9), stressLevel: randInt(2, 5), anxietyLevel: randInt(1, 4), socialInteraction: pick(['minimal', 'moderate', 'high']) };
  let vitals = { heartRate: randInt(60, 85), bloodPressureSys: randInt(110, 130), bloodPressureDia: randInt(70, 85), oxygenLevel: randInt(95, 99) };
  let screenTime = { totalHours: rand(3, 8), socialMediaHours: rand(0.5, 3) };
  let symptoms = ['none'];

  // Make some days anomalous (simulate risk)
  if (isAnomalous) {
    sleep.hoursSlept = rand(3, 4.5);
    sleep.quality = randInt(2, 4);
    mental.mood = randInt(2, 4);
    mental.stressLevel = randInt(7, 10);
    mental.anxietyLevel = randInt(6, 9);
    activity.steps = randInt(500, 2000);
    nutrition.waterIntake = randInt(1, 3);
    screenTime.totalHours = rand(9, 14);
    symptoms = [pick(['headache', 'fatigue', 'dizziness']), 'fatigue'];
  }

  return { date, sleep, activity, nutrition, mental, vitals, screenTime, symptoms, notes: isAnomalous ? 'Feeling unwell today' : '' };
}

async function seed() {
  const args = process.argv.slice(2);
  const email = args[0] || 'demo@zephlow.com';
  const password = args[1] || 'password123';
  const name = args[2] || 'Demo User';

  console.log('\n🌱 Zephlow Seed Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Create or find user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, password, age: 25, gender: 'male' });
      console.log(`✅ Created user: ${email}`);
    } else {
      console.log(`ℹ️  User already exists: ${email}`);
    }

    // Remove old data for this user
    await DailyLog.deleteMany({ user: user._id });
    await Baseline.deleteMany({ user: user._id });
    console.log('🗑️  Cleared existing data');

    // Generate 10 days of data (days 1-8 normal, days 9-10 anomalous)
    const logs = [];
    for (let i = 10; i >= 1; i--) {
      const isAnomalous = i <= 2; // Last 2 days are anomalous
      const dayData = generateDayData(i, isAnomalous);
      dayData.user = user._id;
      logs.push(dayData);
    }

    await DailyLog.insertMany(logs);
    console.log(`✅ Created ${logs.length} daily logs`);

    // Compute baseline from first 7 normal days
    const normalLogs = logs.slice(0, 8);
    const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
    const vals = (logs, path) => logs.map(l => {
      const parts = path.split('.');
      let v = l;
      for (const p of parts) v = v?.[p];
      return v;
    }).filter(v => v != null && !isNaN(v));

    const baseline = await Baseline.create({
      user: user._id,
      sleep: {
        avgHours: avg(vals(normalLogs, 'sleep.hoursSlept')),
        avgQuality: avg(vals(normalLogs, 'sleep.quality'))
      },
      activity: {
        avgSteps: avg(vals(normalLogs, 'activity.steps')),
        avgExerciseMinutes: avg(vals(normalLogs, 'activity.exerciseMinutes'))
      },
      nutrition: {
        avgMeals: avg(vals(normalLogs, 'nutrition.mealsCount')),
        avgWaterIntake: avg(vals(normalLogs, 'nutrition.waterIntake')),
        avgCaffeine: avg(vals(normalLogs, 'nutrition.caffeine'))
      },
      mental: {
        avgMood: avg(vals(normalLogs, 'mental.mood')),
        avgStress: avg(vals(normalLogs, 'mental.stressLevel')),
        avgAnxiety: avg(vals(normalLogs, 'mental.anxietyLevel'))
      },
      vitals: {
        avgHeartRate: avg(vals(normalLogs, 'vitals.heartRate')),
        avgBloodPressureSys: avg(vals(normalLogs, 'vitals.bloodPressureSys')),
        avgBloodPressureDia: avg(vals(normalLogs, 'vitals.bloodPressureDia'))
      },
      screenTime: {
        avgTotalHours: avg(vals(normalLogs, 'screenTime.totalHours')),
        avgSocialMediaHours: avg(vals(normalLogs, 'screenTime.socialMediaHours'))
      },
      dataPointsUsed: normalLogs.length,
      lastUpdated: new Date(),
      isReliable: true
    });

    await User.findByIdAndUpdate(user._id, { baselineEstablished: true });
    console.log('✅ Baseline computed and saved');

    // Print summary
    console.log('\n📊 Seed Summary:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Days of data: ${logs.length}`);
    console.log(`   Baseline data points: ${baseline.dataPointsUsed}`);
    console.log(`   Avg sleep: ${baseline.sleep.avgHours.toFixed(1)}h`);
    console.log(`   Avg mood: ${baseline.mental.avgMood.toFixed(1)}/10`);
    console.log(`   Avg steps: ${Math.round(baseline.activity.avgSteps)}`);
    console.log(`   Anomalous days: 2 (most recent)`);
    console.log('\n✅ Seed complete! You can now log in and explore the dashboard.\n');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

seed();
