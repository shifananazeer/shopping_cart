const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/usermodel'); 
require('dotenv').config();

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_URL,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      
      let user = await User.findOne({ googleId: profile.id });
      
      if (!user) {
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          
          user.googleId = profile.id;
          await user.save();
        } else {
          
          user = new User({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            is_verified: true 
          });
          await user.save();
        }
      }

      return done(null, user);
    } catch (error) {
      console.error( error);
      return done(error, false);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id); 
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => {
      done(null, user); 
    })
    .catch(err => {
      done(err, null);
    });
});

module.exports = passport;
