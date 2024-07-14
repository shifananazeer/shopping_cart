const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }] // Ensure it's an ObjectId array
});

module.exports = mongoose.model('Wishlist', wishlistSchema);