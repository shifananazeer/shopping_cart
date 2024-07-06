const User = require('../models/usermodel')

let credentials = {
    password: 'shifa',
    email:'abc@gmail.com'
  }

const getDashboard = (req,res) => { 
    res.render('admin/dashboard',{admin:true})
  }

const loginLoad = async(req,res) => {
    res.render('admin/login-log',{admin:true})
 }
  
 const verifyLogin = (req,res) =>{
  if (!req.body.email || !req.body.password) {
    req.session.err = "Please enter email and password";
    res.redirect('/admin');
} else if (req.body.password === credentials.password && req.body.email === credentials.email) {
    req.session.adminLogged = true;
    req.session.admin = res.admin;
    res.redirect('/admin');
} else {
    req.session.err = "Invalid details";
    res.redirect('/admin');
}
}

const getAllUsers = async (req,res) => {
  const page = parseInt(req.query.page) || 1; 
  const user = await User. find({})
  .skip((page - 1) * 5)
            .limit(5)
            .exec();
  res.render('admin/viewusers',{admin:true,
    user,
    currentPage: page,
   totalPages: Math.ceil(await User.countDocuments() / 5)
  })
}

const blockUser = async (req,res) => {
  const userId = req.params.id;

  try {
    
    await User.findByIdAndUpdate(userId, { status: false });

    res.redirect('/admin/allUsers')
  } catch (err) {
    console.error( err);
    
  }
}


const unblockUser = async(req,res) =>  {
  const userId = req.params.id;

  try {
  
    await User.findByIdAndUpdate(userId, { status: true });

    res.redirect('/admin/allUsers')
  } catch (err) {
    console.error('Error unblocking user:', err);
   
  }
}

const logout = (req,res) => {
  req.session.destroy();
     
  res.redirect('/admin'); 
}
module.exports ={
  getDashboard,
  loginLoad,
  verifyLogin,
  getAllUsers,
  blockUser,
  unblockUser,
  logout,
}