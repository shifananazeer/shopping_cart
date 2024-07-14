const Order = require('../models/ordermodel')
const Product = require('../models/productmodel')
const Cart = require('../models/cartmodel')
const Address = require('../models/addressmodel')

module.exports = {
//order creation
    placeOrder : async(req,res) => {
        try {
            console.log("body",req.body)
            const {items, summary, selectedAddressId, paymentMethod } = req.body;
            const itemsArray = JSON.parse(items);
            const summaryObject = JSON.parse(summary);
            const newOrder = new Order({
                userId: req.session.user._id, 
                items: itemsArray,
                totalPrice: items.quantity * items.price,
                totalPriceBeforeDiscount: summaryObject.totalPriceBeforeDiscount,
                totalDiscount: summaryObject.totalDiscount,
                discountedPrice: summaryObject.discountedPrice,
                shippingCharge: summaryObject.shippingCharge,
                totalAmountToBePaid: summaryObject.totalAmountToBePaid,
                address: selectedAddressId,
                paymentMethod: paymentMethod,
                status: 'Pending' 
            });
            await newOrder.save();
              // Update product stock levels
              for (const item of itemsArray) {
                await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity } });
            }

            const userId = req.session.user._id;
            await Cart.findOneAndDelete({ userId });
            const selectedAddress = await Address.findById(req.body.selectedAddressId);
            const user = req.session.user
            
            res.render('user/order-confirmation',{newOrder,selectedAddress,summaryObject,userHeader:true,user});
        } catch (error) {
            console.error('Error placing order:', error);
            res.status(500).send('Internal Server Error');
        }
    },
//order cancel
cancelOrder : async(req,res) => {
    const orderId = req.params.orderId;
    try {
        const cancelledOrder = await Order.findByIdAndUpdate(orderId, { status: 'Cancelled' }, { new: true });
        if (!cancelledOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json({ message: 'Order cancelled successfully', cancelledOrder });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.json({ error: 'Internal Server Error' });
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


   
