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
        // Assuming you have a Cart model and it's associated with Product model
        const cartItems = await Cart.find({ userId: req.session.user._id }).populate('productId');

        // Calculate cart summary
        const cartSummary = calculateCartSummary(cartItems); // Implement this function to calculate summary

        // Attach cart details and summary to request object
        req.cart = {
            items: cartItems,
            summary: cartSummary
        };

        next();
    } catch (error) {
        console.error('Error fetching cart details:', error);
        // Handle error (redirect or show error page)
        res.status(500).send('Internal Server Error');
    }
};
 
  
  module.exports ={
    checkSession,
    adminsessionHandler,
    userLoggerIn,
    isVerified,
    fetchCartDetails,
  
  }