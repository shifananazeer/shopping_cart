const Order = require('../models/ordermodel')


module.exports = {

    //sales report for admin ----------------------------------------------------------------
    salesReport : async(req,res) => {
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
                    default:
                        pastDate = now;
                        break;
                }
                filter.createdAt = { $gte: pastDate };
            }
    
            const orders = await Order.find(filter).populate('userId').exec();
            const gstRate = 0.02;  
            const totalSalesCount = orders.length;
            const totalOrderAmount = orders.reduce((sum, order) => sum + order.summary.totalAmountToBePaid, 0);
            const totalDiscount = orders.reduce((sum, order) => sum + order.summary.totalDiscount, 0);
            const totalCouponDiscount = orders.reduce((sum, order) => sum + (order.coupon.discountAmount || 0), 0);

            const totalGst = orders.reduce((sum, order) => {
                const gst = order.summary.totalAmountToBePaid * gstRate;
                return sum + gst;
            }, 0);
            
            const totalRevenue = totalOrderAmount - totalDiscount - totalCouponDiscount - totalGst;
    
            res.render('admin/salesReport', {
                orders: orders,
                totalSalesCount,
                totalOrderAmount,
                totalDiscount,
                totalCouponDiscount,
                totalGst,
                totalRevenue,
                adminHeader:true,
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Internal Server Error');
        }
}
}