import mongoose from 'mongoose';

const loginEntrySchema = new mongoose.Schema({
  log: { type: String }, // e.g., "log1", "log2"
  date: { type: String }, // formatted readable date
  user_time: { type: String }, // e.g., "15:32:00 UTC"
  server_time: { type: String }, // e.g., "08:32:00 PST"
  ip: { type: String },
  location: { type: String },
  userAgent: { type: String }
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  usId: { type: Number, default: 1 },
  registrationLocation: { type: String },
  loginHistory: { type: [loginEntrySchema], default: [] },
  lastLogin: { type: Date },
  lastLoginIp: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
