const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, password, age, gender, height, weight } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    const user = await User.create({ name, email, password, age, gender, height, weight });
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        baselineEstablished: user.baselineEstablished
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const token = user.getSignedJwtToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        baselineEstablished: user.baselineEstablished
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client();

// @route   POST /api/auth/google
// @desc    Authenticate user with Google OAuth ID Token
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ success: false, message: 'Google ID token is required' });
    }

    // Determine audiences to verify against
    const audiences = [
      process.env.GOOGLE_WEB_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID
    ].filter(Boolean);

    // Verify token
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: audiences.length > 0 ? audiences : undefined,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Google profile does not include email' });
    }

    // Check if user already exists by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link Google Account if not linked yet
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create a new user with Google profile information
      user = await User.create({
        name: name || email.split('@')[0],
        email,
        googleId,
        baselineEstablished: false
      });
    }

    const token = user.getSignedJwtToken();

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        age: user.age,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        baselineEstablished: user.baselineEstablished
      }
    });
  } catch (err) {
    console.error('Google verification error:', err);
    res.status(401).json({ success: false, message: 'Invalid or expired Google ID Token' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json({ success: true, user });
});

// @route   PUT /api/auth/profile
// @desc    Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, age, gender, height, weight, medicalConditions } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, age, gender, height, weight, medicalConditions },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   PUT /api/auth/gemini-key
// @desc    Save user's personal Gemini API key
router.put('/gemini-key', protect, async (req, res) => {
  try {
    const { apiKey } = req.body;
    
    if (apiKey && typeof apiKey !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid API key format' });
    }

    await User.findByIdAndUpdate(req.user.id, {
      geminiApiKey: apiKey || null // Allow clearing by sending empty/null
    });

    res.json({
      success: true,
      message: apiKey ? 'Gemini API key saved successfully' : 'Gemini API key removed',
      hasKey: !!apiKey
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   GET /api/auth/gemini-key
// @desc    Check if user has a custom Gemini API key set (does not expose the key itself)
router.get('/gemini-key', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+geminiApiKey');
    const hasKey = !!(user && user.geminiApiKey);
    // Only return a masked version for UI display
    const maskedKey = hasKey
      ? user.geminiApiKey.slice(0, 6) + '••••••' + user.geminiApiKey.slice(-4)
      : null;
    res.json({ success: true, hasKey, maskedKey });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
