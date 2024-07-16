const Order = require('../models/ordermodel')
const Product = require('../models/productmodel')

module.exports = {

    //get all order list
    listOrders: async (req, res) => {
        try {
            const perPage = 10; // Number of orders per page
            const page = parseInt(req.query.page) || 1; // Current page number from query parameter
    
            const orders = await Order.find()
                .sort({ createdAt: -1 })
                .skip((page - 1) * perPage)
                .limit(perPage)
                .populate('userId');
    
            const totalOrders = await Order.countDocuments();
    
            const totalPages = Math.ceil(totalOrders / perPage);
    
            res.render('admin/orders', {
                orders,
                currentPage: page,
                totalPages,
                adminHeader: true
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).send('Internal Server Error');
        }
    },
    //changeing order status
    changeOrderStatus: async (req, res) => {
        const { orderId } = req.params;
        const { status } = req.body;
    
        try {
            const order = await Order.findOne({orderId: orderId});
            if (!order) {
                return res.status(404).send('Order not found');
            }
            order.orderStatus = status;
            await order.save();
        res.redirect('/admin/orders');
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).send('Internal Server Error');
    }
    },

    //cancel order
    cancelOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
            await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' });
            res.redirect('/admin/orders');
        } catch (error) {
            console.error('Error canceling order:', error);
            res.send('Internal Server Error');
        }
    }
}