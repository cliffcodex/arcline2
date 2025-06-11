import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  usId: { type: Number },
  lastLogin: { type: Date },
  lastLoginIp: { type: String },
loginHistory: {
  type: Map,
  of: new mongoose.Schema({
    date: String,
    user_time: String,
    server_time: String,
    ip: String,
    location: String,
    userAgent: String
  }, { _id: false })
}

}, { timestamps: true });

export default mongoose.model('User', userSchema);
