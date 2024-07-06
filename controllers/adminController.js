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
  const user = await User. find({})
  res.render('admin/viewusers',{admin:true,user})
}

const blockUser = async (req,res) => {
  const userId = req.params.id;

  try {
    // Find the user by ID and update the status to blocked
    await User.findByIdAndUpdate(userId, { status: false });

    res.redirect('/admin/allUsers')
  } catch (err) {
    console.error('Error blocking user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

const unblockUser = async(req,res) =>  {
  const userId = req.params.id;

  try {
    // Find the user by ID and update the status to active (or true)
    await User.findByIdAndUpdate(userId, { status: true });

    res.redirect('/admin/allUsers')
  } catch (err) {
    console.error('Error unblocking user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
module.exports ={
  getDashboard,
  loginLoad,
  verifyLogin,
  getAllUsers,
  blockUser,
  unblockUser,
}