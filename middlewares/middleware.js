const checkSession = (req, res, next) => {
    if (req.session && req.session.email) {
       res.redirect("/");
    }
    next();
  };
  
  const isVerified = (req, res, next) => {
    const user = req.session.user;

    if (req.session && req.session.user) {
        next();
    } else {
        res.redirect('/login')
    }
};

const isLogin = (req,res,next) => {
  if (req.session && req.session.user) {
    next();
} else {
    res.status(401).json({ success: false, message: 'User not logged in' });
}
}

  const userLoggerIn = (req,res,next) => {
    if(!userLoggerIn){
      res.redirect('/login')
    }
    next()
  }


  const adminsessionHandler = (req, res, next) => {
    if (req.session.adminLogged) {
      next()
    } else {
      res.redirect('/admin/adminlogin')
    }
  }
  

  const fetchCartDetails = async (req, res, next) => {
    try {
        const cartItems = await Cart.find({ userId: req.session.user._id }).populate('productId');
        const cartSummary = calculateCartSummary(cartItems); 
        req.cart = {
            items: cartItems,
            summary: cartSummary
        };

        next();
    } catch (error) {
        console.error('Error fetching cart details:', error);
        res.status(500).send('Internal Server Error');
    }
};
 
  
  module.exports ={
    checkSession,
    adminsessionHandler,
    userLoggerIn,
    isVerified,
    fetchCartDetails,
    isLogin
  
  }