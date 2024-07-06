const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const middleware = require('../middlewares/middleware')
const passport = require('passport');

// Define routes
router.get('/', userController.getHomePage);

router.get('/login',middleware.checkSession, userController.getLogin);

router.get('/signup', userController.getSignupPage);

router.post('/signup', userController.postSignup);

router.get('/verify-otp', userController.getVerifyOtpPage);

router.post('/verify-otp', userController.postVerifyOtp);

router.post ('/login',userController.postLogin)

router.get('/resend',userController.resendOTP)

router.get('/logout', userController.logout);

router.get ('/otp',userController.otpPage)

router.post('/generate-otp', userController.postGenerateOtp);

router.get("/auth/google", passport.authenticate("google", { scope: ['email', 'profile'] }));

router.get("/auth/google/callback", passport.authenticate("google", { failureRedirect: '/' }), userController.googleAuth);

router.get('/products',userController.getAllProducts)

router.get('/product-details/:id',userController.productdetails)

router.post('/rate' ,middleware.userLoggerIn,userController.submitRating);

router.get('/reviews',middleware.userLoggerIn, userController.fetchReviews);

module.exports = router;