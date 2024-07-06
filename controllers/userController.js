const User = require('../models/usermodel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const Product = require('../models/productmodel')



const getHomePage = async (req, res) => {
 const user = req.session.user;

 const products = await Product.find({is_deleted:false })
                                .sort({ created_at: -1 }) 
                                .limit(5); 
 console.log(products)
  console.log(user)
    res.render('user/home', { user,products}); 
  
};
  const getLogin = (req,res) =>{
    try {
      res.render("user/login",{ error: req.flash('error')});
    } catch (error) {
      console.log(error.message);
      res.redirect("/error");
    }
  }

  const getSignupPage = (req,res) => {
    res.render('user/signup',{ error: req.flash('error')})
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  const generateOTP = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

  
const postSignup = async (req, res) => {
  const { name, email, number, password } = req.body;

  try {
    // Check if user exists with the provided email or number
    const existingUser = await User.findOne({ $or: [{ email }, { number }] });
    if (existingUser) {
      req.flash('error', 'Email or phone number already exists.');
      return res.redirect('/signup');
    }

    // Generate OTP and hash password
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user in database
    const newUser = new User({
      name,
      email,
      number,
      password: hashedPassword,
      otp,
      otpExpiresAt,
      isVerified: false,
    });

    // Save the new user
    await newUser.save();

    // Set req.user with the newly created user's information
    req.user = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      // Add any other relevant user properties here
    };

    // Set session user as well
    req.session.user = req.user;

    // Send OTP email and redirect to OTP verification page
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

const getVerifyOtpPage = (req, res) => {
  const { email } = req.query;
  res.render('user/validateOtp', { email, error: req.flash('error') });
};

const postVerifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect(`/verify-otp?email=${email}`);
    }
    
    // Check if OTP matches
    if (user.otp !== otp) {
      req.flash('error', 'Invalid OTP. Please try again.');
      return res.redirect(`/verify-otp?email=${email}`);
    }
    
    // Check if OTP has expired
    if (user.otpExpiresAt < Date.now()) {
      req.flash('error', 'OTP has expired. Please request a new OTP.');
      return res.redirect(`/verify-otp?email=${email}`);
    }
    
    // Mark user as verified and clear OTP fields
    user.is_verified = true;
    user.otp = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    // Set req.user with the verified user's information
    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      // Add any other relevant user properties here
    };

    // Set session user as well
    req.session.user = req.user;

    // Redirect to home page or any desired location
    res.redirect('/');
  } catch (error) {
    console.error('Error verifying OTP:', error);
    req.flash('error', 'An error occurred during OTP verification. Please try again.');
    res.redirect(`/verify-otp?email=${email}`);
  }
};



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

      req.flash('success', 'New OTP sent successfully.');
      return res.redirect(`/verify-otp?email=${email}`);
  } catch (error) {
     
      req.flash('error', 'Failed to resend OTP. Please try again.');
      return res.redirect('/verify-otp');
  }
};
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

    // Set req.session.user with user information
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      // Add any other relevant user properties
    };

    res.redirect('/');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Something went wrong. Please try again.');
    res.redirect('/login');
  }
};

const logout = (req, res) => {
 
      req.session.destroy();
        res.redirect('/'); 
}
 

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
      
      const googleAuth = (req, res) => {
        try {
          req.session.user = req.user
          res.redirect("/");
        } catch (error) {
          console.log(error.message);
         
        }

        
      };

      const getAllProducts = async(req,res) => {
        const page = parseInt(req.query.page) || 1; 
    const limit = 10; 
    const skip = (page - 1) * limit;

    try {
        const products = await Product.find({}).skip(skip).limit(limit);
        const count = await Product.countDocuments({}); 
        const totalPages = Math.ceil(count / limit);

        res.render('user/view-products', {
            products,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error( error);
       
    }
     
      }

      const productdetails = async(req,res) => {
        const productId = req.params.id;
        const user = req.session.user
       console.log(productId)
       const product = await Product.findById(productId).lean()
       console.log(product)
       res.render('user/product-details', {  product ,user});
       }


       const submitRating = async (req, res) => {
        const { productId, rating, comment } = req.body;
        const userId = req.session.user._id;
    
        try {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }
    
            // Check if the user has already rated the product
            const existingRating = product.ratings.find(r => r.user.toString() === userId.toString());
            if (existingRating) {
                return res.status(400).json({ error: 'You have already rated this product.' });
            }
    
            // Add new rating
            product.ratings.push({ user: userId, rating, comment });
    
            // Calculate new average rating
            const totalRating = product.ratings.reduce((sum, r) => sum + r.rating, 0);
            product.avgRating = totalRating / product.ratings.length;
    
            await product.save();
    
            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Internal server error' });
        }
    };
    
    
   

    const fetchReviews = async (req, res) => {
      try {
          const productId = req.query.productId; // Assuming this is how productId is passed in the query string
          
          const product = await Product.findById(productId).populate('ratings.user');
          if (!product) {
              return res.status(404).json({ success: false, message: 'Product not found' });
          }
  
          const reviews = product.ratings.map(review => ({
              rating: review.rating,
              comment: review.comment,
              userId: review.user, // Assuming _id is the identifier for userId
             
          }));
  
          res.status(200).json({ success: true, reviews });
      } catch (error) {
          console.error('Error fetching reviews:', error);
          res.status(500).json({ success: false, message: 'Error fetching reviews' });
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