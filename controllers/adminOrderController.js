const Order = require('../models/ordermodel')
const Product = require('../models/productmodel')

module.exports = {

    //get all order list
    listOrders: async (req, res) => {
        try {
            const orders = await Order.find().populate('userId'); 
            res.render('admin/orders', { orders ,adminHeader:true});
        } catch (error) {
            console.error('Error fetching orders:', error);
            res.send('Internal Server Error');
        }
    },
    //changeing order status
    changeOrderStatus: async (req, res) => {
        try {
            const { orderId } = req.params;
            const { status } = req.body;
            await Order.findByIdAndUpdate(orderId, { status });
            res.redirect('/admin/orders');
        } catch (error) {
            console.error('Error changing order status:', error);
            res.send('Internal Server Error');
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