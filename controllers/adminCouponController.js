const Coupon = require ('../models/couponmodel');
const adminOrderController = require('./adminOrderController');

module.exports ={
    viewCopons : async (req,res) => {
        try {
            const perPage = 10; 
            const page = parseInt(req.query.page) || 1; 
            const search = req.query.query || '';

            const query = search ? {
                $or: [
                    { code: new RegExp(search, 'i') },
                    { discount: parseFloat(search) || 0 }, 
                    { minPurchaseAmount: parseFloat(search) || 0 } 
                ]
            } : {};

          const coupons = await Coupon.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * perPage)
            .limit(perPage);

            const totalCoupons = await Coupon.countDocuments(query);
            const totalPages = Math.ceil(totalCoupons / perPage);

            res.render('admin/coupons', { 
                 coupons,
            adminHeader: true,
            currentPage: page,
            totalPages,
            searchQuery: search
         });
        } catch (err) {
            res.status(500).send('Server Error');
        } 
    },
   addCouponPage : (req, res) => {
        res.render('admin/addCoupon',{adminHeader:true});
    },
    
    addCoupon : async (req, res) => {
        const { code, discount, minPurchaseAmount, expirationDate } = req.body;
        try {
            const newCoupon = new Coupon({
                code,
                discount,
                minPurchaseAmount,
                expirationDate,
            });
    
            await newCoupon.save();
            res.redirect('/admin/coupons');
        } catch (err) {
            res.status(500).send('Server Error');
        }
    },

deactivateCoupon : async (req, res) => {
        try {
            const { id } = req.params;
            await Coupon.findByIdAndUpdate(id, { isActive: false });
            res.redirect('/admin/coupons'); 
        } catch (error) {
            console.error('Error deactivating coupon:', error);
            res.status(500).send('Server Error');
        }
    },
    
   
   activateCoupon : async (req, res) => {
        try {
            const { id } = req.params;
            await Coupon.findByIdAndUpdate(id, { isActive: true });
            res.redirect('/admin/coupons'); 
        } catch (error) {
            console.error('Error activating coupon:', error);
            res.status(500).send('Server Error');
        }
    },

    getEditCoupon : async (req, res) => {
        try {
            const { id } = req.params;
            const coupon = await Coupon.findById(id);
            res.render('admin/edit-coupon', { coupon ,adminHeader:true}); 
        } catch (error) {
            console.error('Error fetching coupon:', error);
            res.status(500).send('Server Error');
        }
    },
    
   
    updateCoupon : async (req, res) => {
        try {
            const { id } = req.params;
            const { code, discount, minPurchaseAmount, expirationDate } = req.body;
    
            await Coupon.findByIdAndUpdate(id, {
                code,
                discount,
                minPurchaseAmount,
                expirationDate
            });
    
            res.redirect('/admin/coupons'); 
        } catch (error) {
            console.error('Error updating coupon:', error);
            res.status(500).send('Server Error');
        }
    }
}