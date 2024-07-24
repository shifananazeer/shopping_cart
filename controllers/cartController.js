const Cart = require('../models/cartmodel')
const Product = require('../models/productmodel')
const Address = require('../models/addressmodel')
const Order = require('../models/ordermodel');
const usermodel = require('../models/usermodel');
const Coupon = require ('../models/couponmodel')
const Wallet = require('../models/walletmodel')

module.exports = {
    //add products to cart
    addToCart: async (req, res) => {
        try {
            if (req.session && req.session.user) {
                // Check if productId is from URL parameters or query parameters
                const productId = req.params.productId || req.query.productId;
                const userId = req.session.user._id;
    
                const product = await Product.findById(productId);
                if (!product) {
                    return res.json({ success: false, message: 'Product not found' });
                }
    
                const maxQuantityPerPerson = 5; 
                const availableStock = product.stock;
    
                let cart = await Cart.findOne({ userId });
                if (!cart) {
                    cart = new Cart({ userId, items: [] });
                }
    
                const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
                if (itemIndex > -1) {
                    if (cart.items[itemIndex].quantity < maxQuantityPerPerson && cart.items[itemIndex].quantity < availableStock) {
                        cart.items[itemIndex].quantity += 1;
                    } else {
                        return res.json({ success: false, message: 'Reached maximum quantity or out of stock' });
                    }
                } else {
                    if (availableStock > 0) {
                        cart.items.push({ productId, quantity: 1 });
                    } else {
                        return res.json({ success: false, message: 'Out of stock' });
                    }
                }
    
                await cart.save();
                return res.json({ success: true, message: 'Product added to cart' });
            } else {
                return res.json({ success: false, message: 'User not logged in' });
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            return res.json({ success: false, message: 'Server error' });
        }
    },
    
  // list cart items in cart page
    listCart: async (req, res) => {
        try {
            if (!req.session || !req.session.user) {
                return res.render('user/cart', { items: [], noProduct: true });
            }
            const userId = req.session.user._id;
            const user = req.session.user
            const cart = await Cart.findOne({ userId })
            .populate({
                path: 'items.productId',
                populate: {
                    path: 'category', 
                    model: 'Category' 
                }
            });
            if (!cart) {
                return res.render('user/cart', { items: [] ,user,userHeader:true});
            }
            res.render('user/cart', { items: cart.items , user ,userHeader:true});
        } catch (error) {
            console.error('Error listing cart:', error);
            res.redirect('/error');
        }
    },

//quantity incriment in cart
    incrementItem: async (req, res) => {
        try {
            const { productId } = req.body;
            const userId = req.session.user._id;

            const product = await Product.findById(productId);
            if (!product) {
                return res.json({ success: false, message: 'Product not found' });
            }

            const maxQuantityPerPerson = 5; 
            const availableStock = product.stock;

            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.json({ success: false, message: 'Cart not found' });
            }

            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            if (itemIndex > -1) {
                if (cart.items[itemIndex].quantity < maxQuantityPerPerson && cart.items[itemIndex].quantity < availableStock) {
                    cart.items[itemIndex].quantity += 1;
                    await cart.save();
                    const summary = calculateCartSummary(cart.items); 
                    return res.json({ success: true, message: 'Quantity increased', summary });
                } else {
                    return res.json({ success: false, message: 'Reached maximum quantity or out of stock' });
                }
            } else {
                return res.json({ success: false, message: 'Item not found in cart' });
            }
        } catch (error) {
            console.error('Error incrementing item:', error);
            res.json({ success: false, message: 'Server error' });
        }
    },
    //decrement quantity in cart
    decrementItem: async (req, res) => {
        try {
            const { productId } = req.body;
            const userId = req.session.user._id;

            const cart = await Cart.findOne({ userId });
            if (!cart) {
                return res.json({ success: false, message: 'Cart not found' });
            }

            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            if (itemIndex > -1) {
                if (cart.items[itemIndex].quantity > 1) {
                    cart.items[itemIndex].quantity -= 1;
                    await cart.save();
                    const summary = calculateCartSummary(cart.items); 
                    return res.json({ success: true, message: 'Quantity decremented', summary });
                } else {
                    // If quantity is 1 or less, remove the item from the cart
                    cart.items.splice(itemIndex, 1);
                    await cart.save();
                    const summary = calculateCartSummary(cart.items); 
                    return res.json({ success: true, message: 'Item removed from cart', summary });
                }
            } else {
                return res.json({ success: false, message: 'Item not found in cart' });
            }
        } catch (error) {
            console.error('Error decrementing item:', error);
            res.json({ success: false, message: 'Server error' });
        }
    },

    //delete cart item
    deleteItem: async (req, res) => {
        try {
            const { productId } = req.body;
            const userId = req.session.user._id;
            const cart = await Cart.findOne({ userId });

            if (!cart) {
                return res.json({ success: false, message: 'Cart not found' });
            }

            const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
            if (itemIndex > -1) {
                cart.items.splice(itemIndex, 1);
                await cart.save();
                const summary = calculateCartSummary(cart.items); 
                return res.json({ success: true, message: 'Item deleted', summary });
            } else {
                return res.json({ success: false, message: 'Item not found in cart' });
            }
        } catch (error) {
            console.error('Error deleting item:', error);
            res.json({ success: false, message: 'Server error' });
        }
    },

    //get cart summary 
    getCartSummary: async (req, res) => {
        try {
            const cartItems = await Cart.findOne({ userId: req.session.user._id }).populate('items.productId');
            if (!cartItems) {
                return res.status(404).json({ success: false, message: 'Cart not found' });
            }

            const summary = calculateCartSummary(cartItems.items);

            return res.json({ success: true, summary });
        } catch (error) {
            console.error('Error calculating cart summary:', error);
            return res.json({ success: false, message: 'An error occurred. Please try again later.' });
        }
    },

    //checkout
    checkout :async (req,res) => {
        const userId = req.session.user._id;
        const user = req.session.user
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        
        if (!cart || cart.items.length === 0) {
            return res.render('user/checkout', { cartItems: [], summary: {} ,userHeader:true,user});
        }
    
        const cartItems = cart.items.map(item => {
            return {
                productId: item.productId._id,
                name: item.productId.name,
                quantity: item.quantity,
                price: item.productId.price,
                discount: item.productId.discount
            };
        });
        console.log(cartItems)
    
        const summary = calculateCartSummary(cart.items);
        
        const coupons = await Coupon.find({ minPurchaseAmount: { $lte: summary.totalAmountToBePaid } });
       const wallet = await Wallet.findOne({userId})
       console.log(wallet)
       let walletBalance = 'Wallet empty';
       if (wallet) {
        walletBalance = wallet.balance ? wallet.balance.toFixed(2) : 'Wallet empty';
       }
        const addresses = await Address.find({userId:userId})
        console.log(addresses)
    
        res.render('user/checkout', { cartItems, summary ,addresses,user,userHeader:true,coupons,walletBalance});
    },
    addWishlistToCart : async (req, res) => {
        try {
            if (req.session && req.session.user) {
                const productId = req.params.productId; // Use params for cleaner URL
                const userId = req.session.user._id;
    
                const product = await Product.findById(productId);
                if (!product) {
                    return res.json({ success: false, message: 'Product not found' });
                }
    
                const maxQuantityPerPerson = 5; 
                const availableStock = product.stock;
    
                let cart = await Cart.findOne({ userId });
                if (!cart) {
                    cart = new Cart({ userId, items: [] });
                }
    
                const itemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
                if (itemIndex > -1) {
                    if (cart.items[itemIndex].quantity < maxQuantityPerPerson && cart.items[itemIndex].quantity < availableStock) {
                        cart.items[itemIndex].quantity += 1;
                    } else {
                        return res.json({ success: false, message: 'Reached maximum quantity or out of stock' });
                    }
                } else {
                    if (availableStock > 0) {
                        cart.items.push({ productId, quantity: 1 });
                    } else {
                        return res.json({ success: false, message: 'Out of stock' });
                    }
                }
    
                await cart.save();
                return res.json({ success: true, message: 'Product added to cart' });
            } else {
                return res.json({ success: false, message: 'User not logged in' });
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            return res.json({ success: false, message: 'Server error' });
        }
   
},

cartCount : async (req,res)=> {
    try {
        const userId = req.session.user._id;
        const cart = await Cart.findOne({ userId });
        console.log(cart)
        const itemCount = cart ? cart.items.reduce((acc, item) => acc + item.quantity, 0) : 0;
        console.log("count",itemCount)
        res.json({ count: itemCount });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
}
}

//summary calculation function
const calculateCartSummary = (items) => {
    let totalPriceBeforeDiscount = 0;
    let totalDiscount = 0;
    let discountedPrice = 0;
    const gstRate = 0.02;
    const shippingCharge = 50;
    let totalPriceIncludingGst = 0;
    let totalAmountToBePaid = 0;

    items.forEach(item => {
        const product = item.productId;
        const quantity = item.quantity;

        const price = product.price * quantity;
        totalPriceBeforeDiscount += price;

        if (product.discount) {
            const discountAmount = (price * product.discount) / 100;
            totalDiscount += discountAmount;
        }
    });

    discountedPrice = totalPriceBeforeDiscount - totalDiscount;
    const gstAmount = Math.round(discountedPrice * gstRate);

    totalPriceIncludingGst = discountedPrice + gstAmount;
    totalAmountToBePaid = totalPriceIncludingGst + shippingCharge;

    return {
        totalPriceBeforeDiscount,
        totalDiscount,
        discountedPrice,
        gst: gstAmount,
        totalPriceIncludingGst,
        shippingCharge,
        totalAmountToBePaid
    };
};




