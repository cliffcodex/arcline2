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
    const reservedRanges = [
      '127.', '10.', '192.168.',
      '172.16.', '172.17.', '172.18.', '172.19.',
      '172.20.', '172.21.', '172.22.', '172.23.',
      '172.24.', '172.25.', '172.26.', '172.27.',
      '172.28.', '172.29.', '172.30.', '172.31.'
    ];
    const isReservedIp = reservedRanges.some(range => ip.startsWith(range));

    if (!isReservedIp) {
      try {
        const geoRes = await axios.get(`http://ip-api.com/json/${ip}`);
        if (geoRes.data.status === 'success') {
          const { city, regionName, country } = geoRes.data;
          location = `${city ?? 'Unknown city'}, ${regionName ?? 'Unknown region'}, ${country ?? 'Unknown country'}`;
        } else {
          console.warn('Geolocation failed:', geoRes.data.message || geoRes.data.status);
        }
      } catch (err) {
        console.error('Geolocation lookup failed:', err.message);
      }
    } else {
      location = 'Localhost or Private Network';
    }

    user.lastLogin = new Date();
    user.lastLoginIp = ip;

    // Ensure loginHistory is an array
    if (!Array.isArray(user.loginHistory)) {
      const original = user.loginHistory;
      user.loginHistory = [];

      if (original && typeof original === 'object') {
        for (const key in original) {
          if (Object.prototype.hasOwnProperty.call(original, key)) {
            user.loginHistory.push(original[key]);
          }
        }
      }
    }

    // --- FIX TIME HANDLING USING LUXON ---

    const now = DateTime.utc();  // Get the current UTC time

    // Get the user's time zone from the request header or fallback to 'UTC'
    const userTimezone = req.headers['x-user-timezone'] || 'UTC';

    // Get the server's time zone (e.g., the server's time zone can be 'America/Los_Angeles', 'Europe/London', etc.)
    const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Convert to User's local time
    const userTime = now.setZone(userTimezone);
    const userTimeStr = userTime.toFormat('HH:mm:ss');  // Format as "HH:mm:ss"

    // Convert to Server's local time
    const serverTime = now.setZone(serverTimezone);
    const serverTimeStr = serverTime.toFormat('HH:mm:ss');  // Format as "HH:mm:ss"
    const serverTimeWithZone = `${serverTimeStr} ${serverTimezone}`;  // e.g., "08:01:55 America/Los_Angeles"

    // Get the date formatted for the user's time zone
    const dateStr = userTime.toFormat('MMMM dd, yyyy');  // e.g., "June 11, 2025"

    // Create the login history log entry
    const logKey = `log${user.loginHistory.length + 1}`;

    const currentLog = {
      log: logKey,
      date: dateStr,
      user_time: `${userTimeStr} ${userTimezone}`,  // User's local time with time zone
      server_time: serverTimeWithZone,  // Server's time with time zone
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
        recentLogins: [currentLog]  // Only return the current login log
      }
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};