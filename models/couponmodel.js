const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    discount: { type: Number, required: true },
    minPurchaseAmount: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    expirationDate: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

const Coupon = mongoose.model('Coupon', couponSchema);
module.exports = Coupon;
