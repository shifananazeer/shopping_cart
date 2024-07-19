const Coupon = require ('../models/couponmodel');
const adminOrderController = require('./adminOrderController');

module.exports ={
    viewCopons : async (req,res) => {
        try {
            const coupons = await Coupon.find();
            res.render('admin/coupons', { coupons,adminHeader:true });
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
            res.redirect('/admin/coupons'); // Redirect to the coupons page after deactivation
        } catch (error) {
            console.error('Error deactivating coupon:', error);
            res.status(500).send('Server Error');
        }
    },
    
    // Activate coupon
   activateCoupon : async (req, res) => {
        try {
            const { id } = req.params;
            await Coupon.findByIdAndUpdate(id, { isActive: true });
            res.redirect('/admin/coupons'); // Redirect to the coupons page after activation
        } catch (error) {
            console.error('Error activating coupon:', error);
            res.status(500).send('Server Error');
        }
    },

    getEditCoupon : async (req, res) => {
        try {
            const { id } = req.params;
            const coupon = await Coupon.findById(id);
            res.render('admin/edit-coupon', { coupon ,adminHeader:true}); // Render the edit coupon page with the coupon data
        } catch (error) {
            console.error('Error fetching coupon:', error);
            res.status(500).send('Server Error');
        }
    },
    
    // Update coupon
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
    
            res.redirect('/admin/coupons'); // Redirect to the coupons page after update
        } catch (error) {
            console.error('Error updating coupon:', error);
            res.status(500).send('Server Error');
        }
    }
}