const Order = require('../models/ordermodel')
const Product = require('../models/productmodel')
const Cart = require('../models/cartmodel')
const Address = require('../models/addressmodel')


const Razorpay = require('razorpay');

const crypto = require('crypto');

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
    const { selectedAddressId, items, summary, paymentMethod } = req.body;

    if (!selectedAddressId || !paymentMethod) {
        return res.status(400).json({ success: false, message: "Address and payment method are required." });
    }

    try {
        const parsedItems = JSON.parse(items);
        const parsedSummary = JSON.parse(summary);
        const userId = req.session.user._id;
        let orderId = generateUniqueOrderId();

        // Create a new order
        let order = new Order({
            orderId: orderId,
            userId: userId,
            products: parsedItems.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
                discount: item.discount
            })),
            address: selectedAddressId,
            totalAmount: parsedSummary.totalAmountToBePaid,
            paymentMethod: paymentMethod,
            orderStatus: paymentMethod === 'razorpay' ? 'pending' : 'completed',
        });

        await order.save();

        // Update product stock
        for (let item of parsedItems) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: -item.quantity }
            });
        }

        if (paymentMethod === 'razorpay') {
            const razorpayOrder = await createRazorpayOrder(parsedSummary.totalAmountToBePaid);
            order.razorpayOrderId = razorpayOrder.id; // Assign Razorpay order ID
            await order.save();

            // Pass the order, items, and summary back to the frontend
            return res.json({
                success: true,
                razorpayKey: process.env.RAZORPAY_KEY_ID,
                order: razorpayOrder,
                items: parsedItems,
                summary: parsedSummary,
            });
        }

        // Clear the cart after the order is placed
        await Cart.deleteOne({ userId: userId });
        res.json({ success: true, message: "Order placed successfully." });

    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ success: false, message: "Failed to place order." });
    }
},


 savePaymentDetails : async (req, res) => {
    const { paymentId, orderId, signature } = req.body;

    try {
        const order = await Order.findOne({ razorpayOrderId: orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found." });
        }

        order.razorpayOrderId = paymentId;
        order.razorpaySignature = signature;
        order.orderStatus = "completed";

        await order.save();

        res.json({ success: true, message: "Payment details saved successfully." });
    } catch (error) {
        console.error('Error saving payment details:', error);
        res.status(500).json({ success: false, message: "Failed to save payment details." });
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

        const totalPriceBeforeDiscount = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const totalDiscount = items.reduce((acc, item) => acc + (item.price * item.discount / 100) * item.quantity, 0);
        const discountedPrice = totalPriceBeforeDiscount - totalDiscount;
        const gst = discountedPrice * 0.02; 
        const shippingCharge = 50; // Flat shipping charge
        const totalAmountToBePaid = discountedPrice + gst + shippingCharge;

        const summary = {
            totalPriceBeforeDiscount,
            totalDiscount,
            discountedPrice,
            gst,
            totalPriceIncludingGst: discountedPrice + gst,
            shippingCharge,
            totalAmountToBePaid
        };

        res.json({ success: true, items, summary });
    } catch (error) {
        console.error('Error retrieving cart items:', error);
        res.status(500).json({ success: false, message: "Failed to retrieve cart items." });
    }

},

createOrder: async(req,res) => {
 console.log(req.body)
},
confirmOrder : async (req, res) => {
    const { orderId, paymentId } = req.body;

    // Find the order and update payment status
    const order = await Order.findByIdAndUpdate(orderId, {
        paymentStatus: 'Paid',
    });

    res.json({ success: true, order });
},
//order cancel with stock incrimentaion and purchase count decrimentation
cancelOrder : async(req,res) => {
    const orderId = req.params.orderId;
    try {
        const order = await Order.findById(orderId);
        if (!order || order.status !== 'Pending') {
            return res.status(400).json({ error: 'Order cannot be canceled' });
        }
        for (const item of order.items) {
            await Product.findByIdAndUpdate(item.productId, {
                $inc: {
                    stock: item.quantity,
                    purchaseCount: -item.quantity 
                }
            });
        }
        const cancelledOrder = await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' }, { new: true });

        res.json({ message: 'Order cancelled successfully', cancelledOrder });
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
        res.render('user/order-history', { orders ,userHeader:true,user});
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).send('Internal Server Error');
    }
},

//orderDetails page
orderDetails :async (req,res) => {
    const { id: orderId } = req.params; 
    console.log(orderId)
    const user = req.session.user 
    try {
        const order = await Order.findById(orderId).populate('items.productId'); 
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
}
}


   




const generateUniqueOrderId = () => {
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}