const Order = require('../models/ordermodel')
const Product = require('../models/productmodel')
const Cart = require('../models/cartmodel')
const Address = require('../models/addressmodel')
const Coupon = require('../models/couponmodel')

const Razorpay = require('razorpay');

const crypto = require('crypto');
const razorpay = new Razorpay({
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
    console.log("Request body:", req.body);
    const { addressId, paymentMethod, cartItems, orderSummary } = req.body;

    if (!addressId || !paymentMethod || !cartItems || !orderSummary) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    try {
        const uniqueOrderId = generateUniqueOrderId();

        const newOrder = new Order({
            userId: req.session.user._id,
            addressId,
            paymentMethod,
            items: cartItems, 
            summary: orderSummary,
            status: 'pending',
            orderId: uniqueOrderId,
            paymentStatus:'pending'
        });

        await newOrder.save();

        for (const item of cartItems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }

        await Cart.deleteMany({ userId: req.usersession._id });

        res.status(201).json({ message: 'Order placed successfully', orderId: newOrder.orderId });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Internal Server Error' });
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
    const { orderId } = req.params;

    try {
        // Fetch the order details
        const order = await Order.findOne({ orderId: orderId })
            .populate('userId') // Adjust according to your schema
            .populate('items.productId'); // Adjust according to your schema

        if (!order) {
            return res.status(404).render('404', { message: 'Order not found' });
        }

        // Fetch the delivery address, assuming it is referenced in the order
        const address = await Address.findById(order.addressId);

        // Render the order confirmation page
        res.render('user/order-confirmation', {
            order: order,
            address: address,
            products: order.items,
            formatDate: (date) => new Date(date).toLocaleDateString(), // Formatting function for date
            totalAmount: order.totalAmount
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).render('500', { message: 'Internal Server Error' });
    }
},




//order cancel with stock incrimentaion and purchase count decrimentation
cancelOrder : async(req,res) => {
    const { orderId } = req.params; 
    console.log("orderId:", orderId);
    try {
       
        const order = await Order.findOne({ orderId: orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        
        if (order.status === 'cancelled' || order.status === 'completed') {
            return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
        }

        
        order.status = 'cancelled';
        await order.save();

        res.json({ success: true, message: 'Order has been cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
},

//order History
orderHistory : async(req,res) => {
    const userId = req.session.user._id;
    try {
        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .populate('items.productId'); // Populate the productId field in items

        const user = req.session.user;

        const ordersWithItemDetails = orders.map(order => {
            const itemsWithDetails = order.items.map(item => {
                const product = item.productId; // product is already populated
                return {
                    ...item.toObject(),
                    productName: product.name,
                    productPrice: product.price,
                    productImage: product.images ? product.images[0] : null // Assuming `images` is an array in the product schema
                };
            });

            return {
                ...order.toObject(), // Convert Mongoose document to plain object
                items: itemsWithDetails,
            };
        });

        res.render('user/order-history', { orders: ordersWithItemDetails, userHeader: true, user });
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
        const order = await Order.findOne({ orderId: orderId }) 
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
        console.log("coupon",coupons)
        res.json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
},

createOrder : async (req, res) => {
    console.log("body",req.body)
    
    const { addressId, cartItems, orderSummary, appliedCoupon ,paymentMethod} = req.body;

    try {
        const options = {
            amount: orderSummary.totalAmountToBePaid * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        // Create order with Razorpay
        const order = await razorpay.orders.create(options);
        const uniqueOrderId = generateUniqueOrderId();

        const newOrder = new Order({
            userId: req.session.user._id,
            addressId,
            orderId: uniqueOrderId,
            items: cartItems,
            paymentMethod,
            summary: {
                totalPriceBeforeDiscount: orderSummary.totalPriceBeforeDiscount,
                totalDiscount: orderSummary.totalDiscount,
                discountedPrice: orderSummary.discountedPrice,
                shippingCharge: orderSummary.shippingCharge,
                totalAmountToBePaid: orderSummary.totalAmountToBePaid
            },
            appliedCoupon,
            razorpayOrderId: order.id,
            status: 'pending',
            paymentStatus: paymentMethod === 'online_payment' ? 'failed' : 'success', 
        });

        await newOrder.save();
        for (const item of cartItems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }

        await Cart.deleteMany({ userId: req.session.user._id });

        res.json({
            success: true,
            orderId: uniqueOrderId,
            razorpayOrderId: order.id,
            totalAmountToBePaid: orderSummary.totalAmountToBePaid,
            orderId: uniqueOrderId,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
},


verifyPayment :async (req, res) => {
    console.log("verify",req.body)
    try {
        const { payment_id, order_id, signature, paymentStatus } = req.body;

        // Find the order by orderId
        const order = await Order.findOne({ orderId: order_id }); // Ensure orderId is the correct field in your schema
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update the order with payment details
        order.razorpayPaymentId = payment_id;
        order.razorpaySignature = signature;
        order.paymentStatus = paymentStatus;
        await order.save();

        res.json({ success: true });
    } catch (error) {
        console.error('Error saving payment details:', error);
        res.status(500).json({ success: false, message: 'Error saving payment details.' });
    }
},

updatePaymentStatus : async (req, res) => {
    const { orderId, paymentStatus } = req.body;

    console.log("update", req.body); // Check the output in the server logs

    try {
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
       console.log("order",order)
        order.paymentStatus = paymentStatus;
        console.log("mid",order)
        await order.save();
        console.log("sec",order)

        res.json({ success: true, message: 'Payment status updated successfully' });
    } catch (error) {
        console.error('Error updating payment status:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
},
repay : async (req,res) => {
    const { orderId } = req.params;
    console.log('Repay Order ID:', orderId);

    try {
        // Find the order by orderId
        const order = await Order.findOne({ orderId });

        if (!order) {
            console.log('Order not found');
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Check if the order is eligible for repayment
        if (order.paymentStatus !== 'failed') {
            console.log('Order is not eligible for repayment');
            return res.status(400).json({ success: false, message: 'Order is not eligible for repayment' });
        }

        // Prepare options for creating a Razorpay order
        const options = {
            amount: order.summary.totalAmountToBePaid * 100, // Amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        // Create the order with Razorpay
        const razorpayOrder = await razorpay.orders.create(options);
        console.log('Razorpay Order:', razorpayOrder);

        // Respond with Razorpay order details
        res.json({
            success: true,
            orderId:order.orderId,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID,
            razorpayOrderId: razorpayOrder.id,
            totalAmountToBePaid: order.summary.totalAmountToBePaid
        });
    } catch (error) {
        console.error('Error initiating repayment:', error);
        res.status(500).json({ success: false, message: 'An error occurred while initiating repayment' });
    }
}


}




const generateUniqueOrderId = () => {
    return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};