import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { DateTime } from 'luxon';  // <-- Added luxon import


// Register Controller
export const register = async (req, res, location) => {
  try {
    const {
      name,
      email,
      password,
      phoneNumber,
      profilePictureUrl,
      bio,
      address,
      dateOfBirth,
      gender,
      socialLinks,
      preferences,
      twoFactorEnabled,
      accountStatus
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber: phoneNumber || '',
      profilePictureUrl: profilePictureUrl || '',
      bio: bio || '',
      address: address || '',
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || '',
      socialLinks: socialLinks || {},
      preferences: preferences || {},
      twoFactorEnabled: twoFactorEnabled || false,
      accountStatus: accountStatus || 'active',
      registrationLocation: location || 'Unknown',
      createdAt: new Date()
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        name: newUser.name,
        email: newUser.email,
        user_id: newUser._id,
        registrationLocation: newUser.registrationLocation
      }
    });
  } catch (err) {
    console.error('Register Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// Login Controller
// Login Controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d'
    });

    // Normalize IP address
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    if (ip === '::1' || ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
    if (ip.includes(',')) ip = ip.split(',')[0].trim();

    let location = 'Unknown';
    // [Your geolocation lookup logic]

    user.lastLogin = new Date();
    user.lastLoginIp = ip;

    // Ensure loginHistory is an array
    if (!Array.isArray(user.loginHistory)) {
      user.loginHistory = [];
    }

    const now = DateTime.utc();  // Get UTC time first

    // Get the user's time zone from the request header
    const userTimezone = req.headers['x-user-timezone'] || 'UTC';

    // Get the server's time zone
    const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Convert the UTC time to user and server times using Luxon
    const userTime = now.setZone(userTimezone);
    const serverTime = now.setZone(serverTimezone);

    // Get the formatted times for user_time and server_time
    const userTimeStr = userTime.toLocaleString(DateTime.TIME_SIMPLE);  // User's local time
    const serverTimeStr = serverTime.toLocaleString(DateTime.TIME_SIMPLE);  // Server's local time

    const serverTimeWithZone = `${serverTimeStr} ${serverTimezone}`;

    const dateStr = userTime.toLocaleString(DateTime.DATE_MED);  // User's local date

    const logKey = `log${user.loginHistory.length + 1}`;

    // Create log entry with the correct times
    const currentLog = {
      log: logKey,
      date: dateStr,
      user_time: `${userTimeStr} ${userTimezone}`,  // User time with time zone
      server_time: serverTimeWithZone,  // Server time with time zone (e.g., "08:01:55 America/Los_Angeles")
      ip,
      location,
      userAgent: req.headers['user-agent']
    };

    user.loginHistory.push(currentLog);
    await user.save();

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        user_id: user._id,
        lastLogin: user.lastLogin,
        lastLoginIp: user.lastLoginIp,
        recentLogins: [currentLog]
      }
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};