const Order = require('../models/ordermodel')
const Product = require('../models/productmodel')
const Cart = require('../models/cartmodel')
const Address = require('../models/addressmodel')
const Coupon = require('../models/couponmodel')
const Wallet = require('../models/walletmodel')
const Return = require('../models/returnmodel')
const User = require('../models/usermodel');
const Brand = require('../models/brandmodel')
const Category = require('../models/categorymodel')
const Razorpay = require('razorpay');

const crypto = require('crypto');

//razorpay instance----------------------------------------------
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


module.exports = {

//order creation in cash on delivery and wallet-----------------------------------------------
placeOrder: async (req, res) => {
    console.log("Request body:", req.body);
    const { addressId, paymentMethod, cartItems, orderSummary,coupon } = req.body;

    if (!addressId || !paymentMethod || !cartItems || !orderSummary) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    try {
        const userId = req.session.user._id;
        let totalAmount = orderSummary.totalAmountToBePaid;
        let couponDetails = null;
        let discountAmount = 0;
        if (coupon && coupon._id) {
             couponDetails = await Coupon.findById(coupon._id);
            if (couponDetails) {
             discountAmount = (couponDetails.discount / 100) * totalAmount;
                totalAmount -= discountAmount;
            } else {
                return res.status(400).json({ message: 'Invalid coupon' });
            }
        }
           // Check if payment method is COD and total amount is 1000 or more
           if (paymentMethod === 'cash_on_delivery' && totalAmount >= 1000) {
            return res.status(400).json({ message: 'Cash on Delivery is only available for purchases below 1000.' });
        }

        // Handle Wallet Payment
        if (paymentMethod === 'wallet') {
            const wallet = await Wallet.findOne({ userId });
            if (!wallet || wallet.balance < totalAmount) {
                return res.status(400).json({ message: 'Insufficient wallet balance' });
            }
            // Deduct amount from wallet
            wallet.balance -= totalAmount;
            await wallet.save();
        }
        const uniqueOrderId = generateUniqueOrderId();
        const newOrder = new Order({
            userId: req.session.user._id,
            addressId,
            paymentMethod,
            items: cartItems, 
            summary: orderSummary,
            status: 'pending',
            orderId: uniqueOrderId,
             paymentStatus: paymentMethod === 'wallet' ? 'success' : 'pending',
             coupon: {
                code: couponDetails ? couponDetails.code : null,
                discountAmount: discountAmount
            }
        });

        await newOrder.save();
        // Update stock and sales count
        for (const item of cartItems) {
            const product = await Product.findById(item.productId);
            if (product) {
                console.log(`Updating product ${item.productId} - Initial Sales Count: ${product.purchaseCount}`);
        
                // Perform the update
                product.stock -= item.quantity;
                product.purchaseCount += item.quantity;
        
                // Save the changes
                await product.save();
                console.log('Product updated and saved:', product);
        
                if (product.brand) {
                    const brand = await Brand.findById(product.brand);
                    if (brand) {
                        brand.salesCount += item.quantity;
                        await brand.save();
                        console.log('Brand updated and saved:', brand);
                    }
                }
        
                if (product.category) {
                    const category = await Category.findById(product.category);
                    if (category) {
                        category.salesCount += item.quantity;
                        await category.save();
                        console.log('Category updated and saved:', category);
                    }
                }
            } else {
                console.error(`Product not found: ${item.productId}`);
            }
        }
        await Cart.deleteMany({ userId: req.session.user._id });

        res.status(201).json({ message: 'Order placed successfully', orderId: newOrder.orderId });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
},

//get cart items for payment---------------------------------
getCartItems: async(req,res) => {
    const userId = req.session.user._id; 
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
        const shippingCharge = 50; 
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

//order confirmation page with order details-----------------------------------------------
orderConfirmation: async (req, res) => {
    const { orderId } = req.params;
    try {
        const order = await Order.findOne({ orderId: orderId })
            .populate('userId')
            .populate('items.productId'); 

        if (!order) {
            return res.status(404).render('error', { message: 'Order not found' });
        }
        const address = await Address.findById(order.addressId);

          // Standard delivery time range in days
          const minDeliveryDays = 3;
          const maxDeliveryDays = 5;
  
          // Calculate the expected delivery dates
          const calculateExpectedDeliveryDate = (daysToAdd) => {
              const date = new Date();
              let count = 0;
              while (count < daysToAdd) {
                  date.setDate(date.getDate() + 1);
                  // Skip weekends
                  if (date.getDay() !== 0 && date.getDay() !== 6) {
                      count++;
                  }
              }
              return date;
          };
  
          const minDeliveryDate = calculateExpectedDeliveryDate(minDeliveryDays);
          const maxDeliveryDate = calculateExpectedDeliveryDate(maxDeliveryDays);
  


        res.render('user/order-confirmation', {
            order: order,
            address: address,
            products: order.items,
            formatDate: (date) => new Date(date).toLocaleDateString(), 
            totalAmount: order.totalAmount,
            userHeader:true,
            expectedDeliveryStartDate: minDeliveryDate,
            expectedDeliveryEndDate: maxDeliveryDate,
        });
    } catch (error) {
        console.error('Error fetching order details:', error);
       
    }
},

//order cancel,stock manege,payed amount credit in wallet------------------------------------------
cancelOrder : async(req,res) => {
    const { orderId } = req.params; 
    console.log("orderId:", orderId);
    try {
        const order = await Order.findOne({ orderId: orderId });
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        if (order.status === 'cancelled' || order.status === 'delivered') {
            return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
        }
        order.status = 'cancelled';
        const productUpdates = order.items.map(async item => {
            const product = await Product.findById(item.productId);
            if (product) { 
                product.stock += item.quantity;
                await product.save();
            }
        });
        await Promise.all(productUpdates);
         
        if (order.paymentStatus === 'success') {
            let user = await User.findById(order.userId._id);
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            let wallet = await Wallet.findOne({ userId: user._id });
            if (!wallet) {
                wallet = new Wallet({
                    userId: user._id,
                    balance: 0,
                    transactions: []
                });
                await wallet.save();
                user.wallet = wallet._id;
                await user.save();
            }
            wallet.balance += order.summary.totalAmountToBePaid;
            wallet.transactions.push({
                amount: order.summary.totalAmountToBePaid,
                type: 'credit',
                description: 'Refund for canceled order',
                date: new Date()
            });
            await wallet.save();
            order.paymentStatus = 'credited in wallet';
        }

        await order.save();
      
        res.json({ success: true, message: 'Order has been cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling order:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
},

//order History---------------------------------------------------------------------
orderHistory : async(req,res) => {
    const userId = req.session.user._id;
    const page = parseInt(req.query.page) || 1; // Get the current page from query params, default to 1
    const limit = 10; // Number of orders per page

    try {
        const totalOrders = await Order.countDocuments({ userId }); // Total number of orders for the user
        const totalPages = Math.ceil(totalOrders / limit); // Total number of pages
        const orders = await Order.find({ userId })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit) // Skip orders for previous pages
            .limit(limit) // Limit to the number of orders per page
            .populate('items.productId'); // Populate product details

        const user = req.session.user;

        const ordersWithItemDetails = orders.map(order => {
            const itemsWithDetails = order.items.map(item => {
                const product = item.productId; 
                return {
                    ...item.toObject(),
                    productName: product.name,
                    productPrice: product.price,
                    productImage: product.images ? product.images[0] : null 
                };
            });

            return {
                ...order.toObject(), 
                items: itemsWithDetails,
            };
        });

        res.render('user/order-history', { 
            orders: ordersWithItemDetails,
             userHeader: true,
              user,
              currentPage: page,
              totalPages: totalPages
             });
    } catch (error) {
        console.error('Error fetching order history:', error);
        res.status(500).send('Internal Server Error');
    }
},

//orderDetails page------------------------------------------------------------------------
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

// Fetch active coupons-------------------------------------------------------
getCoupon : async (req,res) => {
    try {
        const coupons = await Coupon.find({ isActive: true });
        console.log("coupon",coupons)
        res.json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
},

//online payment order creation-------------------------------------------------------
createOrder : async (req, res) => {
    console.log("body",req.body)
    const { addressId, cartItems, orderSummary, coupon ,paymentMethod} = req.body;

    const amountInPaise = Math.round(orderSummary.totalAmountToBePaid * 100);
    try {
        const options = {
            amount: amountInPaise,
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };
        let totalAmount = orderSummary.totalAmountToBePaid;
        let couponDetails = null;
        let discountAmount = 0;
        if (coupon && coupon._id) {
             couponDetails = await Coupon.findById(coupon._id);
            if (couponDetails) {
             discountAmount = (couponDetails.discount / 100) * totalAmount;
                totalAmount -= discountAmount;
            } else {
                return res.status(400).json({ message: 'Invalid coupon' });
            }
        }
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
            coupon: {
                code: couponDetails ? couponDetails.code : null,
                discountAmount: discountAmount
            },
            razorpayOrderId: order.id,
            status: 'pending',
            paymentStatus: paymentMethod === 'online_payment' ? 'failed' : 'success', 
        });
        await newOrder.save();
         // Update stock and sales count
         for (const item of cartItems) {
            const product = await Product.findById(item.productId);
            if (product) {
                console.log(`Updating product ${item.productId} - Initial Sales Count: ${product.purchaseCount}`);
        
                // Perform the update
                product.stock -= item.quantity;
                product.purchaseCount += item.quantity;
        
                // Save the changes
                await product.save();
                console.log('Product updated and saved:', product);
        
                if (product.brand) {
                    const brand = await Brand.findById(product.brand);
                    if (brand) {
                        brand.salesCount += item.quantity;
                        await brand.save();
                        console.log('Brand updated and saved:', brand);
                    }
                }
        
                if (product.category) {
                    const category = await Category.findById(product.category);
                    if (category) {
                        category.salesCount += item.quantity;
                        await category.save();
                        console.log('Category updated and saved:', category);
                    }
                }
            } else {
                console.error(`Product not found: ${item.productId}`);
            }
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

//payment verification---------------------------------------------------------
verifyPayment :async (req, res) => {
    console.log("verify",req.body)
    try {
        const { payment_id, order_id, signature, paymentStatus } = req.body;
        const order = await Order.findOne({ orderId: order_id }); 
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
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

 //updationg payment status--------------------------------------------------------
updatePaymentStatus : async (req, res) => {
    const { orderId, paymentStatus } = req.body;

    console.log("update", req.body); 

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

//repayment for failed payments--------------------------------------------------
repay : async (req,res) => {
    const { orderId } = req.params;
    console.log('Repay Order ID:', orderId);

    try {
        const order = await Order.findOne({ orderId });

        if (!order) {
            console.log('Order not found');
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.paymentStatus !== 'failed') {
            console.log('Order is not eligible for repayment');
            return res.status(400).json({ success: false, message: 'Order is not eligible for repayment' });
        }
        const options = {
            amount: order.summary.totalAmountToBePaid * 100, 
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        // Create the order with Razorpay
        const razorpayOrder = await razorpay.orders.create(options);
        console.log('Razorpay Order:', razorpayOrder);

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
},

//return order-----------------------------------------------------------
       renderReturnPage : (req, res) => {
    const orderId = req.params.orderId;
    res.render('user/return-order', { orderId ,userHeader:true});
     },

     //return order post---------------------------------------------------
     handleReturnOrder : async (req, res) => {
    const orderId = req.params.orderId;
    const { reason } = req.body;

    try {
        const order = await Order.findOne({orderId});

        if (!order) {
            return res.status(404).send('Order not found');
        }
        if (order.status !== 'delivered') {
            return res.status(400).send('Only delivered orders can be returned');
        }
        const returnRequest = new Return({
            orderId: order._id,
            userId: order.userId,
            reason,
            amount: order.summary.totalAmountToBePaid 
        });

        await returnRequest.save();
        const wallet = await Wallet.findOne({ userId: order.userId });

        if (!wallet) {
           
            const newWallet = new Wallet({
                userId: order.userId,
                balance: order.summary.totalAmountToBePaid,
                transactions: [{
                    type: 'credit',
                    amount: order.summary.totalAmountToBePaid,
                    description: `Return of Order ID: ${orderId}`
                }]
            });
            await newWallet.save();
        } else {
            wallet.balance += order.summary.totalAmountToBePaid;
            wallet.transactions.push({
                type: 'credit',
                amount: order.summary.totalAmountToBePaid,
                description: `Return of Order ID: ${orderId}`
            });
            await wallet.save();
        }
        order.status = 'returned';
        order.paymentStatus = 'credited in wallet';
        await order.save();

        res.redirect('/order-history')
    } catch (error) {
        console.error('Error processing return order:', error);
        res.status(500).send('Internal Server Error');
    }
},

//invoice for deliverd orders----------------------------------------------------------
invoice :async(req,res)=> {
    const orderId = req.params.orderId;
  try {
    const order = await Order.findOne({orderId})
                             .populate('items.productId')
                             .populate('userId')
                             .populate('addressId');
                             console.log(order)
    if (order && order.status === 'delivered') {
      res.render('user/invoice', { order ,userHeader:true});
    } else {
      res.status(404).send('Order not found or not delivered');
    }
  } catch (error) {
    res.status(500).send('Error generating invoice');
  }
}

}



//generating unique order Id--------------------------------------------------
const generateUniqueOrderId = () => {
    return 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase();
};