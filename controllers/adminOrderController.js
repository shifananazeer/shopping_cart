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
        try {
            const { orderId } = req.params;
            const { status } = req.body;
    
            // Validate the new status
            const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }
    
            // Update the order status in the database
            const order = await Order.findOneAndUpdate(
                { orderId },
                { status },
                { new: true }
            );
    
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
    
            // Redirect to orders list page or send success response
            res.redirect('/admin/orders'); // or res.json({ message: 'Status updated successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    //cancel order
    cancelOrder: async (req, res) => {
        try {
            const { orderId } = req.params;
    
            // Cancel the order by setting its status to 'cancelled'
            const order = await Order.findOneAndUpdate(
                { orderId },
                { status: 'cancelled' },
                { new: true }
            );
    
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
    
            // Redirect to orders list page or send success response
            res.redirect('/admin/orders'); // or res.json({ message: 'Order cancelled successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
}
}