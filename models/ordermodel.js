const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true, unique: true },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User ID is required'],
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product ID is required'],
        },
        quantity: {
            type: Number,
            required: [true, 'Quantity is required'],
            min: [1, 'Quantity cannot be less than 1'],
        },
        price: {
            type: Number,
            required: [true, 'Price is required'],
        },
        discount: {
            type: Number,
            default: 0,
        },
    }],
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: [true, 'Address is required'],
    },
    totalAmount: {
        type: Number,
        required: [true, 'Total amount is required'],
    },
    paymentMethod: {
        type: String,
        enum: ['cash_on_delivery', 'online_payment'],
        required: [true, 'Payment method is required'],
    },
    razorpayOrderId: {
        type: String,
        // required: true 
    },
    razorpayPaymentId: {
        type: String,
    },
    razorpaySignature: {
        type: String,
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'placed', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'success', 'failed'], // Removed extra space here
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

orderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
