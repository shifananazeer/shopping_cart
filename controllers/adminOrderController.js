const Order = require('../models/ordermodel')
const Product = require('../models/productmodel')

module.exports = {

    //get all order list in admin side----------------------------------------------
    listOrders: async (req, res) => {
        try {
            const perPage = 10; 
            const page = parseInt(req.query.page) || 1; 
            const search = req.query.query || '';
            //search with name, orderId, amount
            const query = search ? {
                $or: [
                    { 'userId.name': new RegExp(search, 'i') },
                    { 'orderId': new RegExp(search, 'i') },
                    { 'summary.totalAmountToBePaid': parseFloat(search) || 0 } 
                ]
            } : {};
    
            const orders = await Order.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * perPage)
                .limit(perPage)
                .populate('userId');
    
            const totalOrders = await Order.countDocuments(query);
    
            const totalPages = Math.ceil(totalOrders / perPage);
    
            res.render('admin/orders', {
                orders,
                currentPage: page,
                totalPages,
                adminHeader: true,
                searchQuery: search
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.status(500).send('Internal Server Error');
        }
    },

    //changeing order status------------------------------------------------------
    changeOrderStatus: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { status } = req.body;
            const validStatuses = ['pending', 'shipped', 'delivered', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ message: 'Invalid status' });
            }
            const order = await Order.findOneAndUpdate(
                { orderId },
                { status },
                { new: true }
            );
            if (status === 'delivered') {
                order.paymentStatus = 'success';
            }
            await order.save();
    
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.redirect('/admin/orders'); 
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
    },

    //cancel order and change status to cancelled----------------------------------------------------------------
    cancelOrder: async (req, res) => {
        try {
            const { orderId } = req.params;

            const order = await Order.findOneAndUpdate(
                { orderId },
                { status: 'cancelled' },
                { new: true }
            );
    
            if (!order) {
                return res.status(404).json({ message: 'Order not found' });
            }
            res.redirect('/admin/orders'); 
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error' });
        }
}
}