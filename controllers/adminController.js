const User = require('../models/usermodel')
const Order = require('../models/ordermodel')
let credentials = {
    password: 'shifa',
    email:'abc@gmail.com'
  }



  //render Dashboard
const getDashboard =async (req,res) => { 
  const userCount = await User.countDocuments().exec();
  res.render('admin/dashboard',{adminHeader:true,userCount})
}


const dashboardData = async (req, res) => {
  console.log('Dashboard data route hit'); // Ensure this log appears

  try {
    const { startDate, endDate, presetRange } = req.query;
    let filter = { status: 'delivered' };
    const now = new Date();
    let labels = [];

    // Handle date range and preset range queries
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      labels = generateDateLabels(new Date(startDate), new Date(endDate));
    } else if (presetRange) {
      let pastDate;

      switch (presetRange) {
        case '1-day':
          pastDate = new Date(now.setDate(now.getDate() - 1));
          labels = generateDateLabels(pastDate, new Date(), 1);
          break;
        case '1-week':
          pastDate = new Date(now.setDate(now.getDate() - 7));
          labels = generateDateLabels(pastDate, new Date(), 2); // Show every 2nd day
          break;
        case '1-month':
          pastDate = new Date(now.setMonth(now.getMonth() - 1));
          labels = generateDateLabels(pastDate, new Date(), 5); // Show every 5th day
          break;
        case '1-year':
          pastDate = new Date(now.setFullYear(now.getFullYear() - 1));
          labels = generateDateLabels(pastDate, new Date(), 30); // Show every 30th day (approximately monthly)
          break;
        default:
          // Default case: Show today's data
          pastDate = new Date(now.setHours(0, 0, 0, 0)); // Start from the beginning of today
          labels = generateDateLabels(pastDate, new Date(), 1);
          break;
      }
      filter.createdAt = { $gte: pastDate };
    } else {
      // No date or range provided, default to today's data
      const today = new Date();
      filter.createdAt = { $gte: new Date(today.setHours(0, 0, 0, 0)), $lte: new Date(today.setHours(23, 59, 59, 999)) };
      labels = generateDateLabels(new Date(), new Date(), 1); // Show today's date
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
    
    const chartData = labels.reduce((acc, label) => {
      const dateOrders = orders.filter(order => order.createdAt.toISOString().slice(0, 10) === label);
      const dailyRevenue = dateOrders.reduce((sum, order) => sum + (Number(order.summary.totalAmountToBePaid) || 0) - (Number(order.summary.totalDiscount) || 0), 0);
      acc.labels.push(label);
      acc.values.push(dailyRevenue);
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

// Helper function to generate date labels between two dates
function generateDateLabels(startDate, endDate, step = 1) {
  const labels = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    labels.push(new Date(currentDate).toISOString().slice(0, 10));
    currentDate.setDate(currentDate.getDate() + step);
  }

  return labels;
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