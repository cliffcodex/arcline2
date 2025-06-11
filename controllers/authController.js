import User from '../models/user.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import axios from 'axios';

// Register Controller
export const register = async (req, res, location) => {
  try {
    const { name, email, password } = req.body;

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

    // Normalize IP and convert IPv6 to IPv4 loopback
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

    if (!Array.isArray(user.loginHistory)) {
      user.loginHistory = [];
    }

    const now = new Date();
    const userTimezone = req.headers['x-user-timezone'] || 'UTC';
    const serverTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const userTimeStr = now.toLocaleTimeString('en-US', { timeZone: userTimezone, hour12: false });
    const serverTimeStr = now.toLocaleTimeString('en-US', { timeZone: serverTimezone, hour12: false });
    const dateStr = now.toLocaleDateString('en-US', { timeZone: userTimezone, year: 'numeric', month: 'long', day: 'numeric' });

    // create the log key like "log1", "log2", etc.
    const logKey = `log${user.loginHistory.length + 1}`;

    user.loginHistory.push({
      log: logKey,
      date: dateStr,
      user_time: `${userTimeStr} ${userTimezone}`,
      server_time: `${serverTimeStr} ${serverTimezone}`,
      ip,
      location,
      userAgent: req.headers['user-agent']
    });

    await user.save();

    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        user_id: user.usId,
        lastLogin: user.lastLogin,
        lastLoginIp: user.lastLoginIp,
        recentLogins: user.loginHistory
      }
    });

  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
};
