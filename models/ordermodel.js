const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    addressId: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', required: true },
    paymentStatus: { type: String, enum: ['pending', 'success', 'failed','credited in wallet'], default: '' }, // New field
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    paymentMethod: { 
        type: String, 
        required: true, 
        enum: ['cash_on_delivery', 'online_payment','wallet'] 
    },
    onlinePaymentDetails: {
        razorpayOrderId:{type:String},
        razorpaySignature:{type:String}, 
        paymentStatus: { type: String }  
    },
    items: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            quantity: { type: Number, required: true },
            price: { type: Number, required: true },
            discount: { type: Number, required: true }
        }
    ],
    summary: {
        totalPriceBeforeDiscount: { type: Number, required: true },
        totalDiscount: { type: Number, required: true },
        discountedPrice: { type: Number, required: true },
        shippingCharge: { type: Number, required: true },
        totalAmountToBePaid: { type: Number, required: true }
    },
    status: { type: String, default: 'pending' },
    coupon: {
        code: String,
        discountAmount: Number
    },
    razorpayPaymentId :{type:String},
    createdAt: { type: Date, default: Date.now },
    orderId: { type: String, unique: true, required: true }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
