const User = require('../models/usermodel')
const Order = require('../models/ordermodel')
const Product = require('../models/productmodel')
const Brand = require('../models/brandmodel')
const Category = require('../models/categorymodel')
let credentials = {
    password: 'shifa',
    email:'abc@gmail.com'
  }



  //render Dashboard---------------------------------------------------------
const getDashboard =async (req,res) => { 
  const userCount = await User.countDocuments().exec();
  res.render('admin/dashboard',{adminHeader:true,userCount})
}

//giving admin dashboard data for revenue chart --------------------------------
const dashboardData = async (req, res) => {
  console.log('Dashboard data route hit');

  try {
    const { startDate, endDate, presetRange } = req.query;
    let filter = { status: 'delivered' };
    const now = new Date();
    let labels = [];

    // Handle date range and preset range queries
    if (startDate && endDate) {
      filter.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
      labels = generateDateLabels(new Date(startDate), new Date(endDate), 'daily');
    } else if (presetRange) {
      let pastDate;

      switch (presetRange) {
        case '1-day':
          labels = generateDayLabels();
          pastDate = new Date(now.setDate(now.getDate() - 1));
          filter.createdAt = { $gte: pastDate };
          break;
        case '1-week':
          pastDate = new Date(now.setDate(now.getDate() - 7));
          labels = generateDateLabels(pastDate, new Date(), 'daily');
          filter.createdAt = { $gte: pastDate };
          break;
        case '1-month':
          pastDate = new Date(now.setMonth(now.getMonth() - 1));
          labels = generateDateLabels(pastDate, new Date(), 'weekly');
          filter.createdAt = { $gte: pastDate };
          break;
        case '1-year':
          pastDate = new Date(now.setFullYear(now.getFullYear() - 1));
          labels = generateDateLabels(pastDate, new Date(), 'monthly');
          filter.createdAt = { $gte: pastDate };
          break;
        default:
          pastDate = new Date(now.setHours(0, 0, 0, 0));
          labels = generateDateLabels(pastDate, new Date(), 'daily');
          filter.createdAt = { $gte: pastDate };
          break;
      }
    } else {
      const today = new Date();
      filter.createdAt = { $gte: new Date(today.setHours(0, 0, 0, 0)), $lte: new Date(today.setHours(23, 59, 59, 999)) };
      labels = generateDayLabels();
    }

    // console.log('Filter:', filter);

    const orders = await Order.find(filter).exec();
    console.log('Orders:', orders);

    const totalSalesCount = orders.length;
    const totalOrderAmount = orders.reduce((sum, order) => {
      return sum + (Number(order.summary.totalAmountToBePaid) || 0);
    }, 0);

    const totalDiscount = orders.reduce((sum, order) => {
      return sum + (Number(order.summary.totalDiscount) || 0);
    }, 0);

    const totalCouponDiscount = orders.reduce((sum, order) => {
      return sum + (Number(order.coupon.discountAmount) || 0);
    }, 0);

    const totalRevenue = totalOrderAmount - totalDiscount - totalCouponDiscount;
    console.log({
      totalOrderAmount,
      totalDiscount,
      totalCouponDiscount,
      totalRevenue
    });

    const chartData = labels.reduce((acc, label) => {
      const dateOrders = orders.filter(order => {
        if (presetRange === '1-year') {
          return order.createdAt.toISOString().slice(0, 7) === label;
        }
        return order.createdAt.toISOString().slice(0, 10) === label;
      });
      const periodRevenue = dateOrders.reduce((sum, order) => sum + (Number(order.summary.totalAmountToBePaid) || 0) - (Number(order.summary.totalDiscount) || 0), 0);
      acc.labels.push(label);
      acc.values.push(periodRevenue);
      return acc;
    }, { labels: [], values: [] });
    // console.log('Chart Data:', chartData);

    res.json({
      totalSalesCount,
      totalRevenue,
      chartData
    });
  } catch (err) {
    console.error('Error in dashboard data route:', err);
    res.status(500).json({ message: 'Error fetching dashboard data', error: err.message });
  }
};

// Helper function to generate day labels for today and yesterday----------------------------------------
function generateDayLabels() {
  const labels = [];
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  labels.push(today.toISOString().slice(0, 10));  
  labels.push(yesterday.toISOString().slice(0, 10));  

  return labels;
}

// Helper function to generate date labels between two dates----------------------------------------
function generateDateLabels(startDate, endDate, format) {
  const labels = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (format === 'daily') {
      labels.push(new Date(currentDate).toISOString().slice(0, 10)); 
      currentDate.setDate(currentDate.getDate() + 1);
    } else if (format === 'weekly') {
      labels.push(new Date(currentDate).toISOString().slice(0, 10)); 
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (format === 'monthly') {
      labels.push(new Date(currentDate).toISOString().slice(0, 7)); 
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
  }

  return labels;
}

  //render admin login page --------------------------------------------------------
const loginLoad = async(req,res) => {
    res.render('admin/login-log')
 }
  
 //login verifying-------------------------------------------------------------------
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

//get all users--------------------------------------------------------------------
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

//Block User----------------------------------------------------------
const blockUser = async (req,res) => {
  const userId = req.params.id;
  try {
    await User.findByIdAndUpdate(userId, { status: false });
    res.redirect('/admin/allUsers')
  } catch (err) {
    console.error( err);
  }
}

//Unblock User----------------------------------------------------------
const unBlockUser = async(req,res) =>  {
  const userId = req.params.id;
  try {
    await User.findByIdAndUpdate(userId, { status: true });
    res.redirect('/admin/allUsers')
  } catch (err) {
    console.error('Error unblocking user:', err);
   
  }
}

//getting best selling products by purchase count------------------------------------------
const bestSellingProducts = async(req,res) => {
  try {
    // Fetch top products based on purchaseCount
    const topProducts = await Product.find().sort({ purchaseCount: -1 }).limit(10); 

    const labels = topProducts.map(product => product.name);
    const values = topProducts.map(product => product.purchaseCount);

    const pieChartData = { labels, values };
    
    res.status(200).json(pieChartData);
  } catch (error) {
    console.error('Error fetching pie chart data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//getting top brands by sales count ----------------------------------------------------
const  getTopBrands = async(req,res) => {
  try {
   
    const brands = await Brand.find().sort({ salesCount: -1 })
    const data = {
      labels: brands.map(brand => brand.name),
      values: brands.map(brand => brand.salesCount)
    };

    res.json(data);
  } catch (error) {
    console.error('Error fetching top brands:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//getting topcategories by sales count -------------------------------------------------
const getTopCategories = async(req,res) => {
  try {
    const categories = await Category.find().sort({ salesCount: -1 }).limit(10);
    const data = {
      labels: categories.map(category => category.name),
      values: categories.map(category => category.salesCount)
    };

    res.json(data);
  } catch (error) {
    console.error('Error fetching top categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

//logout admin-------------------------------------------------------------------
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
  bestSellingProducts,
  getTopBrands,
  getTopCategories,
}