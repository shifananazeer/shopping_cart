const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const userproductController = require('../controllers/userproductController')
const profileController = require('../controllers/profileController')
const cartController = require('../controllers/cartController')
const orderController = require('../controllers/orderController')
const wishlistController = require('../controllers/wishlistController')
const middleware = require('../middlewares/middleware')
const passport = require('passport');
const  {profileUpload} = require('../public/javascripts/fileupload');
const brandController = require('../controllers/brandController');

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

router.get('/products',userproductController.getAllProducts)

router.get('/product-details/:id',userproductController.productdetails)

router.post('/rate' ,middleware.userLoggerIn,userproductController.submitRating);

router.get('/reviews',middleware.userLoggerIn, userproductController.fetchReviews);

router.get('/profile',middleware.isVerified,profileController.getProfile)

router.get('/edit-profile',middleware.isVerified,profileController.getEditProfile)

router.post('/update-profile',middleware.isVerified, profileUpload.single('profilePhoto'),profileController.updateProfile)

router.get("/profile/add-address",middleware.isVerified, profileController.addAddress);

router .post ('/profile/add-address',middleware.isVerified,profileController.postAddAddress)

router.get('/edit-address',middleware.isVerified,profileController.editAddress)

router.post('/update-address',middleware.isVerified,profileController.updateAddress)

router.get('/delete-address',middleware.isVerified,profileController.deleteAddress)

router.get('/profile/changePassword',middleware.isVerified,profileController.changePassword)

router.post('/profile/changePassword',middleware.isVerified,profileController.updatePassword)

router.get('/add-to-cart',cartController.addToCart)

router.get('/cart',middleware.isVerified,cartController.listCart)

router.get('/getCartSummary',middleware.isVerified,cartController.getCartSummary)

router.post('/incrementItem',middleware.isVerified, cartController.incrementItem);

router.post('/decrementItem',middleware.isVerified, cartController.decrementItem);

router.post('/deleteItem',middleware.isVerified,cartController.deleteItem)

router.get('/checkout',middleware.isVerified,cartController.checkout)

// router.post('/place-order',middleware.isVerified, orderController.placeOrder);

router.delete('/cancel-order/:orderId',middleware.isVerified,orderController.cancelOrder)

router.get('/order-history',middleware.isVerified,orderController.orderHistory)

router.get('/order-details/:orderId',middleware.isVerified,orderController.orderDetails)

router.post('/wishlist/add/:productId',wishlistController. addToWishlist);

router.delete('/wishlist/remove/:productId',wishlistController. removeFromWishlist);

router.get('/wishlist',middleware.isVerified,wishlistController.getWishlist)

router.get('/addwishlisttocart/:productId', cartController.addToCart);

router.post('/place-order', orderController.placeOrder);

router.post('/save-payment-details', orderController.savePaymentDetails);

router.get('/get-cart-items',orderController.getCartItems)

router.get('/order-confirmation', orderController.orderConfirmation);


router.get('/coupons',orderController.getCoupon )



module.exports = router;