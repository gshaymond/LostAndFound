const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { email, password, name, phone, location } = req.body;

    // Validation
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Please provide email, password, and name'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        error: 'User with this email already exists'
      });
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      password,
      name,
      phone,
      location
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        location: user.location
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    const dev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ error: 'Server error during registration', ...(dev ? { details: error.message, stack: error.stack } : {}) });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Please provide email and password'
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid email or password'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is deactivated'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    const dev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ error: 'Server error during login', ...(dev ? { details: error.message } : {}) });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    const dev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ error: 'Server error retrieving profile', ...(dev ? { details: error.message } : {}) });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { name, phone, location, avatar } = req.body;

    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (location) user.location = location;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        location: user.location,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: Object.values(error.errors).map(err => err.message)
      });
    }
    const dev = process.env.NODE_ENV !== 'production';
    res.status(500).json({ error: 'Server error updating profile', ...(dev ? { details: error.message } : {}) });
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile
};