const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  number:{type:String ,unique:true},
  password: String,
  image: String,
  otp: String,
  otpExpiresAt: Date,
  is_verified: { type: Boolean, default: false },
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  googleId: String,
  profilePhoto: String,
});

module.exports = mongoose.model('User', userSchema);
