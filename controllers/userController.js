const User = require('../models/usermodel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const Product = require('../models/productmodel')


//Get Home with newly arrived products ,category ,brand
const getHomePage = async (req, res) => {
 const user = req.session.user;
 const products = await Product.find({is_deleted:false })
                                .sort({ createdAt: -1 }) 
                                .limit(4); 
res.render('user/home', { user,products});   
};


//get login page
  const getLogin = (req,res) =>{
    try {
      res.render("user/login",{ error: req.flash('error')});
    } catch (error) {
      console.log(error.message);
      res.redirect("/error");
    }
  }


//get signup page
  const getSignupPage = (req,res) => {
    res.render('user/signup',{ error: req.flash('error')})
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

  
//post signup function
const postSignup = async (req, res) => {
  const { name, email, number, password } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ email }, { number }] });

    if (existingUser) {
      req.flash('error', 'Email or phone number already exists.');
      return res.redirect('/signup');
    }

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
      isVerified: false,
    });
    await newUser.save();

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
  res.render('user/validateOtp', { email, error: req.flash('error') });
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
const logout = (req, res) => {
      req.session.destroy();
     
        res.redirect('/'); 

}
 
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
      };

//get all products in product page
  const getAllProducts = async(req,res) => {
  const user = req.session.user;
  const page = parseInt(req.query.page) || 1; 
  const limit = 8; 
  const skip = (page - 1) * limit;

    try {
        const products = await Product.find({is_deleted:false}).skip(skip).limit(limit);
        const count = await Product.countDocuments({}); 
        const totalPages = Math.ceil(count / limit);

        res.render('user/view-products', {
          user,
            products,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error( error);  
    }
      }

      //get each product details
      const productdetails = async(req,res) => {
        const productId = req.params.id;
        const user = req.session.user
        console.log(productId)
        const product = await Product.findById(productId).lean()
        const { avgRating } = product;
        console.log(product)
        res.render('user/product-details', {  product ,user,avgRating});
       }


       //rating submision
       const submitRating = async (req, res) => {
        const { productId, rating, comment } = req.body;
    
        if (!req.session.user) {
            return res.json({ notLoggedIn: true });
        }
    
        const userId = req.session.user._id;
    
        try {
            const product = await Product.findById(productId);
            if (!product) {
                return res.json({ error: 'Product not found' });
            }
    
            const existingRating = product.ratings.find(r => r.user.toString() === userId.toString());
            if (existingRating) {
                return res.json({ alreadyExist: true });
            }
    
            product.ratings.push({ user: userId, rating, comment });
    
            const totalRating = product.ratings.reduce((sum, r) => sum + r.rating, 0);
            product.avgRating = totalRating / product.ratings.length;
    
            await product.save();
    
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.json({ error: 'Internal server error' });
        }
    };
    
    
   
//fetching review 
    const fetchReviews = async (req, res) => {
      try {
          const productId = req.query.productId; 
          
          const product = await Product.findById(productId).populate('ratings.user');
          if (!product) {
              return res.json({ success: false, message: 'Product not found' });
          }
  
          const reviews = product.ratings.map(review => ({
              rating: review.rating,
              comment: review.comment,
              userId: review.user, 
             
          }));
  
          res.json({ success: true, reviews });
      } catch (error) {
          console.error( error);
          res.json({ success: false, message: 'Error fetching reviews' });
      }
  };
  
    
      
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
    getAllProducts,
    productdetails,
    submitRating,
    fetchReviews,
  }