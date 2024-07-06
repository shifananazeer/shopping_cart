const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/usermodel'); // Adjust path as per your project structure
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find user by googleId or email
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Update existing user with googleId
          user.googleId = profile.id;
          await user.save();
        } else {
          // Create new user if not found
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            is_verified: true // Adjust as per your application's logic
          });
          await user.save();
        }
      }

      return done(null, user);
    } catch (error) {
      console.error('Error in Google OAuth strategy:', error);
      return done(error, false);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id); // Serialize user.id into session
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => {
      done(null, user); // Deserialize user from id
    })
    .catch(err => {
      done(err, null);
    });
});

module.exports = passport;
