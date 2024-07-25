const User = require('../models/usermodel')
const Order = require('../models/ordermodel')
let credentials = {
    password: 'shifa',
    email:'abc@gmail.com'
  }



  //render Dashboard
const getDashboard = (req,res) => { 

  res.render('admin/dashboard',{adminHeader:true})
}


const dashboardData = async (req, res) => {
  console.log('Dashboard data route hit'); // Ensure this log appears

  try {
    const { startDate, endDate, presetRange } = req.query;
    let filter = { status: 'delivered' };

    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    } else if (presetRange) {
      const now = new Date();
      let pastDate;

      switch (presetRange) {
        case '1-day':
          pastDate = new Date(now.setDate(now.getDate() - 1));
          break;
        case '1-week':
          pastDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '1-month':
          pastDate = new Date(now.setMonth(now.getMonth() - 1));
          break;
        case '1-year':
          pastDate = new Date(now.setFullYear(now.getFullYear() - 1));
          break;
        default:
          pastDate = new Date(now.setHours(0, 0, 0, 0)); // Start from the beginning of today
          break;
      }
      filter.createdAt = { $gte: pastDate };
    }

    const orders = await Order.find(filter).exec();
    console.log('Orders:', orders); // Check if orders are being fetched

    const totalSalesCount = orders.length;
    const totalOrderAmount = orders.reduce((sum, order) => {
      console.log(`Order ${order._id} - Total Amount To Be Paid: ${order.summary.totalAmountToBePaid}`);
      return sum + (Number(order.summary.totalAmountToBePaid) || 0);
    }, 0);

    const totalDiscount = orders.reduce((sum, order) => {
      console.log(`Order ${order._id} - Total Discount: ${order.summary.totalDiscount}`);
      return sum + (Number(order.summary.totalDiscount) || 0);
    }, 0);

    const totalCouponDiscount = orders.reduce((sum, order) => {
      console.log(`Order ${order._id} - Coupon Discount: ${order.coupon.discountAmount}`);
      return sum + (Number(order.coupon.discountAmount) || 0);
    }, 0);

    const totalRevenue = totalOrderAmount - totalDiscount - totalCouponDiscount;

    // Debug log for total calculations
    console.log({
      totalOrderAmount,
      totalDiscount,
      totalCouponDiscount,
      totalRevenue
    });

    const chartData = orders.reduce((acc, order) => {
      const date = new Date(order.createdAt).toISOString().slice(0, 10);
      if (!acc.labels.includes(date)) {
        acc.labels.push(date);
        acc.values.push((Number(order.summary.totalAmountToBePaid) || 0) - (Number(order.summary.totalDiscount) || 0));
      } else {
        const index = acc.labels.indexOf(date);
        acc.values[index] += (Number(order.summary.totalAmountToBePaid) || 0) - (Number(order.summary.totalDiscount) || 0);
      }
      return acc;
    }, { labels: [], values: [] });

    // Debug log for chart data
    console.log('Chart Data:', chartData);

    res.json({
      totalSalesCount,
      totalRevenue,
      chartData
    });
  } catch (err) {
    console.error('Error in dashboard data route:', err); // Improved error logging
    res.status(500).json({ message: 'Error fetching dashboard data', error: err.message });
  }
};


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
const unBlockUser = async(req,res) =>  {
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
  unBlockUser,
  logout,
  dashboardData,
}