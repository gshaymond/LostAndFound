require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/lost_found_hub';

(async function() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const email = 'autotest+login@example.com';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('User already exists:', existing.email);
      process.exit(0);
    }

    const user = new User({
      email,
      password: 'TestPass123',
      name: 'Auto Test'
    });

    await user.save();
    console.log('Created user:', email, 'password: TestPass123');
    process.exit(0);
  } catch (err) {
    console.error('Error creating test user', err);
    process.exit(1);
  }
})();