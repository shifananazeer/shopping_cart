const User = require('../models/usermodel');
const nodemailer = require('nodemailer');
const Category = require('../models/categorymodel')
const Brand = require('../models/brandmodel')
const bcrypt = require('bcrypt');
const Wallet = require('../models/walletmodel')
const Product = require('../models/productmodel')
const Wishlist = require('../models/wishlistmodel')
const crypto = require('crypto');

//Get Home with newly arrived products ,category ,brand
const getHomePage = async (req, res) => {
 const user = req.session.user;
 const popularCategories = await Category.find({ is_deleted: false })
 .sort({ saleCount: -1 })
 .limit(6);

 const products = await Product.find({is_deleted:false })
                                .sort({ createdAt: -1 }) 
                                .limit(4); 
const bestSelling = await Product.find({ 
                                  is_deleted: false
                                })
                                .sort({ purchaseCount: -1 }) 
                                .limit(8); 

// Retrieve the user's wishlist
let wishlistItems = [];
if (user) {
  const wishlist = await Wishlist.findOne({ userId: user._id }).populate('items');
  wishlistItems = wishlist ? wishlist.items.map(item => item._id.toString()) : [];
}
const brands = await Brand .find({
  is_deleted:false,

})                   
res.render('user/home', { user,products,popularCategories,brands,userHeader:true,wishlistItems, bestSelling});   
};


//get login page
  const getLogin = (req,res) =>{
    try {
      res.render("user/login",{ error: req.flash('error'),userHeader:true});
    } catch (error) {
      console.log(error.message);
      res.redirect("/error");
    }
  }


//get signup page
  const getSignupPage = (req,res) => {
    res.render('user/signup',{ error: req.flash('error'),userHeader:true})
  }


  //mail function
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

//otp generating function
  const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

const generateReferralCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

//post signup function
const postSignup = async (req, res) => {
  console.log("signup",req.body)
  const { name, email, number, password,referralCode } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { number }] });

    if (existingUser) {
      req.flash('error', 'Email or phone number already exists.');
      return res.redirect('/signup');
    }
    let referrer = null;
        if (referralCode) {
            referrer = await User.findOne({ referralCode });
            if (!referrer) {
                return res.status(400).json({ message: 'Invalid referral code' });
            }
        }
        const newReferralCode = generateReferralCode();
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      number,
      password: hashedPassword,
      otp,
      otpExpiresAt,
      is_verified: false,
      referralCode: newReferralCode,
      referredBy: referrer ? referrer._id : null
    });
    await newUser.save();
    if (referrer) {
      const wallet = await Wallet.findOne({ userId: referrer._id });
      if (wallet) {
          wallet.balance += 500; // Add 500 to referrer's wallet
          await wallet.save();
      } else {
        
          const newWallet = new Wallet({
              userId: referrer._id,
              balance: 500
          });
          await newWallet.save();
      }
  }



    req.user = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      
    };

    req.session.user = req.user;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'OTP for Signup',
      text: `Your OTP for signup: ${otp}`,
    };
    await transporter.sendMail(mailOptions);

    res.redirect(`/verify-otp?email=${email}`);
  } catch (error) {
    console.error('Signup Error:', error);
    req.flash('error', 'An error occurred during signup. Please try again.');
    res.redirect('/signup');
  }
};

//get otp verifying page
const getVerifyOtpPage = (req, res) => {
  const { email } = req.query;
  res.render('user/validateOtp', { email, error: req.flash('error') ,userHeader:true});
};


//checking otp 
const postVerifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect(`/verify-otp?email=${email}`);
    }
    
    if (user.otp !== otp) {
      req.flash('error', 'Invalid OTP. Please try again.');
      return res.redirect(`/verify-otp?email=${email}`);
    }
    
    if (user.otpExpiresAt < Date.now()) {
      req.flash('error', 'OTP has expired. Please request a new OTP.');
      return res.redirect(`/verify-otp?email=${email}`);
    }
    
    user.is_verified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      
    };

    req.session.user = req.user;

    res.redirect('/');
  } catch (error) {
    console.error( error);
    req.flash('error', 'An error occurred during OTP verification. Please try again.');
    res.redirect(`/verify-otp?email=${email}`);
  }
};


//resend Otp function
const resendOTP = async (req, res) => {
  const { email } = req.query; 
  try {
      const user = await User.findOne({ email });

      if (!user) {
          req.flash('error', 'User not found.');
          return res.redirect('/verify-otp');
      }

      const otp = generateOTP();
      const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); 

      user.otp = otp;
      user.otpExpiresAt = otpExpiresAt;
      await user.save();

      const mailOptions = {
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'New OTP for Verification',
          text: `Your new OTP for verification: ${otp}`,
      };

      await transporter.sendMail(mailOptions);

      return res.redirect(`/verify-otp?email=${email}`);
  } catch (error) {
        req.flash('error', 'Failed to resend OTP. Please try again.');
        return res.redirect('/verify-otp');
  }
};


//post login page and checking if the email and password is correct or not
const postLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    req.flash('error', 'Please enter valid email and password.');
    return res.redirect('/login');
  }
  try {
    const user = await User.findOne({ email });

    if (!user) {
      req.flash('error', 'Invalid credentials.');
      return res.redirect('/login');
    }

    if (!user.status) {
      req.flash('error', 'Your account is blocked. Please contact support.');
      return res.redirect('/login');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      req.flash('error', 'Invalid credentials.');
      return res.redirect('/login');
    }

    user.is_verified = true;
    await user.save()
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      
    };

    res.redirect('/');
  } catch (error) {
        console.error(error);
        req.flash('error', 'Something went wrong. Please try again.');
        res.redirect('/login');
  }
};

//logout user
const logout = async (req, res) => {
  try {
      const userId = req.session.user._id;
      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).send('User not found');
      }

      user.is_verified = false;
      await user.save();

      req.session.destroy((err) => {
          if (err) {
              return res.status(500).send('Error logging out');
          }
          res.redirect('/');
      });
  } catch (error) {
      console.error('Error logging out:', error);
      res.status(500).send('Internal Server Error');
  }
};
//rendering otp page 
const otpPage = (req,res) => {
        res.render('user/generateOtp')
      }
     const postGenerateOtp = async (req, res) => {
      const { email } = req.body;
        try {
        const user = await User.findOne({ email });
          if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/otp');
          }
    
          const otp = generateOTP()
          const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); 
      
          user.otp = otp;
          user.otpExpiresAt = otpExpiresAt;
          await user.save();
      
         
          const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'OTP for Password Reset',
            text: `Your OTP for password reset: ${otp}`,
          };
          await transporter.sendMail(mailOptions);
      
          res.redirect(`/verify-otp?email=${email}`);
        } catch (error) {
          console.error('Error generating OTP:', error);
          req.flash('error', 'An error occurred. Please try again.');
          res.redirect('/otp');
        }
      }


     //googlr authendication 
      const googleAuth = (req, res) => {
        try {
          req.session.user = req.user
          res.redirect("/");
        } catch (error) {
          console.log(error.message);
        } 
      }
        
      

     

      
   

    
      
  module.exports = {
    getHomePage,
    getLogin,
    getSignupPage,
    postSignup, 
    getVerifyOtpPage,
    postVerifyOtp,
    postLogin,
    resendOTP,
    logout,
    otpPage,
    postGenerateOtp,
    googleAuth,
  
    
  }