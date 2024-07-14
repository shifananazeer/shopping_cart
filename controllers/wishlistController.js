const Wishlist = require('../models/wishlistmodel')
const Product = require('../models/productmodel')
module.exports = {
    addToWishlist: async (req, res) => {
        const userId = req.session.user._id;
        const productId = req.params.productId;
    
        try {
            let wishlist = await Wishlist.findOne({ userId });
    
            if (!wishlist) {
                wishlist = new Wishlist({ userId, items: [productId] });
            } else {
                if (!wishlist.items.includes(productId)) {
                    wishlist.items.push(productId);
                }
            }
    
            await wishlist.save();
            res.json({ success: true, message: 'Product added to wishlist' });
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            res.status(500).json({ success: false, message: 'Error adding to wishlist' });
        }
    },

    removeFromWishlist: async (req, res) => {
        const userId = req.session.user._id;
        const productId = req.params.productId;
    
        try {
            let wishlist = await Wishlist.findOne({ userId });
    
            if (wishlist) {
                wishlist.items = wishlist.items.filter(item => item.toString() !== productId);
                await wishlist.save();
                res.json({ success: true, message: 'Product removed from wishlist' });
            } else {
                res.status(404).json({ success: false, message: 'Wishlist not found' });
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            res.status(500).json({ success: false, message: 'Error removing from wishlist' });
        }
},

getWishlist : async (req,res) => {
    const userId = req.session.user._id;

    try {
        const wishlist = await Wishlist.findOne({ userId }).populate('items');

        if (wishlist) {
            res.render('user/wishlist', {
                user: req.session.user,
                products: wishlist.items,
                userHeader: true
            });
        } else {
            res.render('user/wishlist', {
                user: req.session.user,
                products: [],
                userHeader: true
            });
        }
    } catch (error) {
        console.error('Error viewing wishlist:', error);
        res.status(500).send('Error viewing wishlist');
    }
}
}