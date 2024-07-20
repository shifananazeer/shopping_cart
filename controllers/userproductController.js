const Product = require('../models/productmodel')
const Category = require('../models/categorymodel')
const Brand = require('../models/brandmodel')
const Order = require('../models/ordermodel')
const Wishlist = require('../models/wishlistmodel')


//get all products in product page
const getAllProducts = async(req,res) => {
    const user = req.session.user;
    console.log(user)
   
    const page = parseInt(req.query.page) || 1;
    const limit = 8;
    const skip = (page - 1) * limit;

    // Filter options
    const filterOptions = {
        is_deleted: false 
    };

     // Apply search filter if search query is provided
     if (req.query.searchQuery) {
        filterOptions.name = { $regex: req.query.searchQuery, $options: 'i' }; // Case-insensitive search
    }


    // Apply category filter if selected
    if (req.query.category) {
        const category = await Category.findOne({ name: req.query.category });
        if (category) {
            filterOptions.category = category._id;
        }
    }

   // Apply brand filter if selected
   if (req.query.brand) {
    const brand = await Brand.findOne({ name: req.query.brand });
    if (brand) {
        filterOptions.brand = brand._id;
    }
   }

    // Apply price sorting if selected
    let sortOptions = {};
    if (req.query.Psort === '1') {
        sortOptions = { price: 1 }; // Low to High
    } else if (req.query.Psort === '-1') {
        sortOptions = { price: -1 }; // High to Low
    }
    //apply rating sorting
    if (req.query.Rsort === '1') {
        sortOptions.avgRating = 1; // Low to High
    } else if (req.query.Rsort === '-1') {
        sortOptions.avgRating = -1; // High to Low
    }

    // Apply alphabet sorting if selected
    if (req.query.Asort === '1') {
        sortOptions = { name: 1 }; // A to Z
    } else if (req.query.Asort === '-1') {
        sortOptions = { name: -1 }; // Z to A
    }

    

   // Apply in-stock filter if selected
   if (req.query.inStockOnly === 'true') {
    filterOptions.stock = { $gt: 0 }; // Products with stock greater than 0
}
    try {
               // Retrieve the user's wishlist
               let wishlistItems = [];
               if (user) {
                   const wishlist = await Wishlist.findOne({ userId: user._id }).populate('items');
                   wishlistItems = wishlist ? wishlist.items.map(item => item._id.toString()) : [];
               }
       
         

        // Query products based on filters, sorting, and pagination
        let query = Product.find(filterOptions).skip(skip).limit(limit);
        if (sortOptions) {
            query = query.sort(sortOptions);
        }

        const products = await query.exec();
        const count = await Product.countDocuments(filterOptions);
        const totalPages = Math.ceil(count / limit);
        const categories = await Category.find({})
        const brands = await Brand.find({})
       
        res.render('user/view-products', {
            user,
            products,
            categories,
            brands,
            currentPage: page,
            totalPages,
            filter: {
                category: req.query.category,
                brand: req.query.brand,
                searchQuery: req.query.searchQuery
            },
            Psort: req.query.Psort,
            Asort: req.query.Asort,
            Rsort: req.query.Rsort,
            inStockOnly: req.query.inStockOnly,
            userHeader:true,
            wishlistItems
            
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Error fetching products');
    }
        }
  
        const productdetails = async (req, res) => {
            try {
                const productId = req.params.id;
                const user = req.session.user || {};
                console.log(productId);
        
                const product = await Product.findById(productId).lean();
                if (!product) {
                    return res.status(404).send('Product not found');
                }
        
                const { avgRating } = product;
                console.log(product);
        
                // Fetch related products (same category)
                const relatedProducts = await Product.find({
                    _id: { $ne: productId },
                    category: product.category
                }).limit(4).lean();
        
                // // Fetch user orders to check for purchased products
                // const orders = await Order.find({ userId: user._id }).populate('products.productId').lean();
        
                res.render('user/product-details', {
                    product,
                    user,
                    avgRating,
                    relatedProducts,
                    userHeader: true,
                    // orders // Pass orders to the template
                });
            } catch (error) {
                console.error('Error fetching product details:', error);
                res.status(500).send('Internal Server Error');
            }
        };
        
       
        //rating submision
        const submitRating = async (req, res) => {
            const { productId, rating, comment } = req.body;
        
            if (!req.session.user) {
                return res.json({ notLoggedIn: true });
            }
        
            const userId = req.session.user._id;
        
            try {
                const product = await Product.findById(productId);
                if (!product) {
                    return res.json({ error: 'Product not found' });
                }
        
                const existingRating = product.ratings.find(r => r.user.toString() === userId.toString());
                if (existingRating) {
                    return res.json({ alreadyExist: true });
                }
        
                product.ratings.push({ user: userId, rating, comment });
        
                const totalRating = product.ratings.reduce((sum, r) => sum + r.rating, 0);
                product.avgRating = totalRating / product.ratings.length;
        
                await product.save();
        
                res.json({ success: true });
            } catch (error) {
                console.error(error);
                res.json({ error: 'Internal server error' });
            }
        };
        
        //fetching review 
    const fetchReviews = async (req, res) => {
        try {
            const productId = req.query.productId; 
            
            const product = await Product.findById(productId).populate('ratings.user');
            if (!product) {
                return res.json({ success: false, message: 'Product not found' });
            }
    
            const reviews = product.ratings.map(review => ({
                rating: review.rating,
                comment: review.comment,
                userId: review.user, 
               
            }));
    
            res.json({ success: true, reviews });
        } catch (error) {
            console.error( error);
            res.json({ success: false, message: 'Error fetching reviews' });
        }
    };
    
        module.exports = {
            getAllProducts,
            productdetails,
            submitRating,
            fetchReviews,
        }