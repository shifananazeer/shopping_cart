const checkSession = (req, res, next) => {
    if (req.session && req.session.email) {
       res.redirect("/");
    }
    next();
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
  
 
  module.exports ={
    checkSession,
    adminsessionHandler
  }