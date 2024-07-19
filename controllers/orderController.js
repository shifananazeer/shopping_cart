const Order = require('../models/ordermodel')
const Product = require('../models/productmodel')
const Cart = require('../models/cartmodel')
const Address = require('../models/addressmodel')
const Coupon = require('../models/couponmodel')

const Razorpay = require('razorpay');

const crypto = require('crypto');

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});



const createRazorpayOrder = async (amount) => {
    const instance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const options = {
        amount: amount * 100, // Amount in paise
        currency: "INR"
    };

    const order = await instance.orders.create(options);
    return order;
};
module.exports = {
//order creation
placeOrder: async (req, res) => {
    console.log("body", req.body);
    const { addressId, paymentMethod, cartItems, summary } = req.body;

    // Validate input
    if (!addressId || !paymentMethod || !cartItems || !summary) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        // Generate unique order ID
        const uniqueOrderId = generateUniqueOrderId();

        // Create new order
        const newOrder = new Order({
            userId: req.session.user._id, // Assuming req.user is populated by authentication middleware
            addressId,
            paymentMethod,
            items: cartItems,
            summary,
            status: 'pending',
            orderId: uniqueOrderId
        });

        // Save the order
        await newOrder.save();

        // Respond with the order ID
        res.status(201).json({ message: 'Order placed successfully', orderId: newOrder.orderId });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
},
savePaymentDetails : async (req, res) => {
    try {
        const { paymentId, orderId, signature, paymentStatus } = req.body;

        // Update order with payment details
        const order = await Order.findOne({ orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        order.razorpayPaymentId = paymentId;
        order.razorpaySignature = signature;
        order.paymentStatus = paymentStatus;
        await order.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving payment details:', error);
        res.status(500).json({ success: false, message: 'Error saving payment details.' });
    }
},
getCartItems: async(req,res) => {
    const userId = req.session.user._id; // Get the user ID from session

    try {
        const cart = await Cart.findOne({ userId: userId }).populate('items.productId');

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found." });
        }

        const items = cart.items.map(item => ({
            productId: item.productId._id,
            name: item.productId.name,
            quantity: item.quantity,
            price: item.productId.price,
            discount: item.productId.discount
        }));

        const totalPriceBeforeDiscount = Math.round(items.reduce((acc, item) => acc + item.price * item.quantity, 0));
        const totalDiscount = Math.round(items.reduce((acc, item) => acc + (item.price * item.discount / 100) * item.quantity, 0));
        const discountedPrice = Math.round(totalPriceBeforeDiscount - totalDiscount);
        const gst = Math.round(discountedPrice * 0.02); 
        const shippingCharge = 50; // Flat shipping charge
        const totalAmountToBePaid = Math.round(discountedPrice + gst + shippingCharge);

        const summary = {
            totalPriceBeforeDiscount,
            totalDiscount,
            discountedPrice,
            gst,
            totalPriceIncludingGst: Math.round(discountedPrice + gst),
            shippingCharge,
            totalAmountToBePaid
        };

        res.json({ success: true, items, summary });
    } catch (error) {
        console.error('Error retrieving cart items:', error);
        res.status(500).json({ success: false, message: "Failed to retrieve cart items." });
    }
},

orderConfirmation: async (req, res) => {
    const userId = req.session.user._id; // Get user ID from session
    try {
        const orders = await Order.find({ userId: userId }).populate('products.productId').sort({ createdAt: -1 }).limit(1); // Get the latest order

        if (!orders.length) {
            return res.status(404).render('order-confirmation', { message: "No orders found." });
        }

        const order = orders[0];

        const address = await Address.findById(order.address);

        if (!address) {
            return res.status(404).render('order-confirmation', { message: "Address not found." });
        }

        res.render('user/order-confirmation', {
            orderId: order.orderId,
            products: order.products,
            totalAmount: order.totalAmount,
            paymentMethod: order.paymentMethod,
            orderStatus: order.orderStatus,
            address: address 
        });
    } catch (error) {
        console.error('Error retrieving order details:', error);
        res.status(500).render('order-confirmation', { message: "Failed to retrieve order details." });
    }
},




//order cancel with stock incrimentaion and purchase count decrimentation
cancelOrder : async(req,res) => {
    const { orderId } = req.params; // Extract orderId from params
    console.log("orderId:", orderId);
    try {
        const order = await Order.findOne({ orderId: orderId });
        if (!order || order.orderStatus !== 'Pending'&& order.orderStatus !== 'placed') {
            return res.status(400).json({ error: 'Order cannot be canceled' });
        }
        order.orderStatus = 'cancelled';
        await order.save();

        // Restore product stock
        for (let item of order.products) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: item.quantity }
            });
        }
        res.json({ success: true, message: 'Order cancelled successfully.' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
},

//order History
orderHistory : async(req,res) => {
    const userId = req.session.user._id; 
    try {
        const orders = await Order.find({ userId }).sort({ createdAt: -1 });
        const user = req.session.user
         
        const ordersWithProductDetails = await Promise.all(orders.map(async (order) => {
            const productsWithDetails = await Promise.all(order.products.map(async (item) => {
                const product = await Product.findById(item.productId._id); // Extract the _id
                return {
                    ...item,
                    product, // Include the product details
                };
            }));
            return {
                ...order.toObject(), // Convert Mongoose document to plain object
                products: productsWithDetails,
            };
        }));

        res.render('user/order-history', { orders:ordersWithProductDetails ,userHeader:true,user});
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).send('Internal Server Error');
    }
},

//orderDetails page
orderDetails :async (req,res) => {
    const { orderId } = req.params; 
    console.log(orderId)
    const user = req.session.user 
    try {
        const order = await Order.findOne({ orderId: orderId }).populate('products.productId'); 
        console.log(order);
        if (order) {
            res.render('user/order-details', { order ,userHeader:true});
        } else {
            res.render('user/order-details', { error: 'Order not found' ,userHeader:true,user});
        }
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.render('user/order-details', { error: 'Error fetching order details' });
    }
},

getCoupon : async (req,res) => {
    try {
        // Fetch active coupons
        const coupons = await Coupon.find({ isActive: true });
        res.json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}


}


   




const generateUniqueOrderId = () => {
    return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};