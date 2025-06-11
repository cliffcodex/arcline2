import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema({
  log: { type: String, required: true },
  date: { type: String, required: true },
  user_time: { type: String, required: true },
  server_time: { type: String, required: true },
  ip: { type: String, required: true },
  location: { type: String, required: true },
  userAgent: { type: String, required: true }
}, { _id: false });

const socialLinksSchema = new mongoose.Schema({
  facebook: { type: String, default: '' },
  twitter: { type: String, default: '' },
  linkedin: { type: String, default: '' },
  instagram: { type: String, default: '' },
  // Add more social platforms as needed
}, { _id: false });

const preferencesSchema = new mongoose.Schema({
  theme: { type: String, default: 'light' },
  language: { type: String, default: 'en' },
  notificationsEnabled: { type: Boolean, default: true },
  // Add other preference fields as needed
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  
  phoneNumber: { type: String, default: '' },
  profilePictureUrl: { type: String, default: '' },
  bio: { type: String, default: '' },
  address: { type: String, default: '' },
  dateOfBirth: { type: Date, default: null },
  gender: { type: String, default: '' },

  socialLinks: { type: socialLinksSchema, default: () => ({}) },
  preferences: { type: preferencesSchema, default: () => ({}) },

  twoFactorEnabled: { type: Boolean, default: false },
  accountStatus: { type: String, enum: ['active', 'suspended', 'deactivated'], default: 'active' },

  registrationLocation: { type: String, default: 'Unknown' },

  lastLogin: { type: Date, default: null },
  lastLoginIp: { type: String, default: '' },

  loginHistory: { type: [loginHistorySchema], default: [] },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware to update `updatedAt` on each save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const User = mongoose.model('User', userSchema);

export default User;