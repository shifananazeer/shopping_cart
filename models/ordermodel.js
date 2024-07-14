const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            name: String,
            quantity: Number,
            price: Number,
            discount: Number
        }
    ],
    totalPriceBeforeDiscount: Number,
    totalDiscount: Number,
    discountedPrice: Number,
    shippingCharge: Number,
    totalAmountToBePaid: Number,
    address: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'],
        default: 'Pending'
    },
},{ timestamps: true }); 


const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
