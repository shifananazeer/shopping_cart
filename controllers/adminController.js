const User = require('../models/usermodel')

let credentials = {
    password: 'shifa',
    email:'abc@gmail.com'
  }



  //render Dashboard
const getDashboard = (req,res) => { 
    res.render('admin/dashboard',{adminHeader:true})
  }

  //render admin login page 
const loginLoad = async(req,res) => {
    res.render('admin/login-log')
 }
  
 //login verifying
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

//get all users
const getAllUsers = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const search = req.query.search || '';
  
  const query = search
    ? {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }
    : {};

  const user = await User.find(query)
    .skip((page - 1) * 5)
    .limit(5)
    .exec();

  const totalCount = await User.countDocuments(query);

  res.render('admin/viewusers', {
    adminHeader: true,
    user,
    currentPage: page,
    totalPages: Math.ceil(totalCount / 5),
    search
  });
};

//Block User
const blockUser = async (req,res) => {
  const userId = req.params.id;
  try {
    await User.findByIdAndUpdate(userId, { status: false });
    res.redirect('/admin/allUsers')
  } catch (err) {
    console.error( err);
  }
}

//Unblock User
const unblockUser = async(req,res) =>  {
  const userId = req.params.id;
  try {
    await User.findByIdAndUpdate(userId, { status: true });
    res.redirect('/admin/allUsers')
  } catch (err) {
    console.error('Error unblocking user:', err);
   
  }
}

//logout admin
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