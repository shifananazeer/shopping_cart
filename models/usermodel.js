// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  number: { type: String, unique: true },
  password: String,
  image: String,
  otp: String,
  otpExpiresAt: Date,
  is_verified: { type: Boolean, default: false },
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  googleId: String,
  profilePhoto: String,
  referralCode: String,
    referredBy: String, 
  addresses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Address' }],
  wallet : {type:mongoose.Schema.Types.ObjectId,ref:'Wallet'}
});

module.exports = mongoose.model('User', userSchema);
