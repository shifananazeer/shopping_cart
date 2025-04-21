const Brand = require('../models/brandmodel');
const Product = require('../models/productmodel')
const fs = require('fs')
const path = require('path')
const cloudinary = require('../config/cloudinary');

module.exports = {

  //view all brands in admin side with search and pagination--------------------------------------------------
  viewBrand: async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search || '';

    const query = search ? { name: new RegExp(search, 'i') } : {};

    try {
        const brands = await Brand.find(query)
            .skip((page - 1) * 5)
            .limit(5)
            .exec();
        
        const plainbrands = brands.map(brand => brand.toObject());
        const totalPages = Math.ceil(await Brand.countDocuments(query) / 5);

        res.render('admin/viewbrand', {
            adminHeader: true,
            brands: plainbrands,
            currentPage: page,
            totalPages,
            search,
            success: req.flash('success')
        })
    } catch (err) {
        console.error(err);
        res.redirect("/admin/error");
    }
},

    //brand add page render-----------------------------------------------------------
    addBrandPage : (req,res) => {
        res.render('admin/add-brand',{adminHeader:true, error: req.flash('error'),
          success: req.flash('success') })
          req.flash('error', null);
          req.flash('success', null);
    },

    //brand add in database-------------------------------------------------------------
    addBrand: async (req, res) => {
      try {
        const { name } = req.body;
        const image = req.file; // This is the uploaded file from multer
    
        if (!name || !image) {
          req.flash('error', 'Brand name and image are required');
          return res.redirect('/admin/add-brand');
        }
    
        // Check if the brand already exists
        const existingBrand = await Brand.findOne({ name });
        console.log('Existing brand:', existingBrand);
        if (existingBrand) {
          console.log('Brand exists, setting flash message and redirecting');
          req.flash('error', 'Brand with this name already exists');
          return res.redirect('/admin/add-brand');
        }
    
        // Upload the image to Cloudinary
        const result = await cloudinary.uploader.upload(image.path, {
          folder: 'brands', // Specify the folder in Cloudinary (optional)
        });
    
        const imageUrl = result.secure_url; // Get the URL of the uploaded image
    
        const newBrand = new Brand({
          name: name,
          image: imageUrl, // Save the Cloudinary image URL
        });
    
        await newBrand.save();
    
        req.flash('success', 'Brand added successfully');
        res.redirect('/admin/viewbrand');
      } catch (err) {
        console.error('Error adding brand:', err);
        req.flash('error', 'Failed to add brand');
        res.redirect('/admin/add-brand');
      }
    },

        //delete brand---------------------------------------------------------------
        deleteBrand: async (req, res) => {
          const brandId = req.params.id;
          const currentPage = req.query.page || 1;
        
          try {
            const brand = await Brand.findById(brandId);
            if (!brand) {
              req.flash('error', 'brand not found');
              return res.redirect('/admin/viewbrand?page=${currentPage}');
            }
        
            const products = await Product.find({ brand: brandId });
            if (products.length > 0) {
              // Check if all products in this brand are deleted
              const activeProducts = products.filter(product => !product.is_deleted);
              if (activeProducts.length > 0) {
                return res.json({ success: false, message: 'Cannot delete brand because there are active products under this brand' });
              }
            }
      
            brand.is_deleted = true;
            await brand.save();
        
            res.json({ success: true, message: 'Brand deleted successfully' });
          } catch (error) {
            console.error(error);
            res.json({ success: false, message: 'An error occurred while deleting the Brand' });
          }
        } ,
        
        //restore brand-------------------------------------------------------------
        restoreBrand: async (req, res) => {
          const brandId = req.params.id;
        
          try {
            const brand = await Brand.findById(brandId);
            if (!brand) {
              req.flash('error', 'Brand not found');
              return res.redirect('/admin/viewbrand?page=${currentPage}');
            }
        
            brand.is_deleted = false;
            await brand.save();
        
            res.json({ success: true, message: 'Brand restored successfully' });
          } catch (error) {
            console.error(error);
            res.json({ success: false, message: 'An error occurred while restoring the brand' });
          }
        },

     
      }