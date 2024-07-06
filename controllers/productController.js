const Product = require("../models/productmodel");
const Category = require('../models/categorymodel')
const fs = require('fs');
const path = require('path');
module.exports ={
 adminProduct : async (req, res) => {
    try {
      const products = await Product.find();
      const categories = await Category.find();
      
      const plainProducts = products.map(product => {
        const plainProduct = product.toObject();
       
        const category = categories.find(cat => cat._id.toString() === plainProduct.category.toString());
       
        plainProduct.category = category ? category.name : 'N/A';
        
        return plainProduct;
      });
      res.render("admin/view-products", {admin:true,
         products:plainProducts,
        
         });
    } catch {
      
      res.redirect("/admin/error");
    }
  },
  addProduct : async (req,res )=> {
    const categories = await Category.find().lean();
   
   res.render('admin/add-product',{admin:true,categories, error: req.flash('error')})
  },
  updateProduct : async (req, res) => {
    try {
      const { name,description, price, discount,stock, category } = req.body;
      const images = req.files; 
  
     
      console.log( req.body);
      console.log( images);
  
      
      if (!name || !description || !price || !discount || !category || !stock || images.length === 0) {
        req.flash('error', 'All fields are required');
        return res.redirect('/admin/add-product');
      }
  
      
      const existingProduct = await Product.findOne({ name });
      if (existingProduct) {
        req.flash('error','alread a product exist with this name');
        return res.redirect('/admin/add-product');
      }
  
     
      const imagePaths = images.map(image => image.path.replace(/^public[\/\\]/, ''));

     
      const newProduct = new Product({
        name,
        description,
        price,
        discount,
        category,
        stock,
        images: imagePaths
      });
  
      await newProduct.save();
      req.flash('success', 'Product added successfully');
      res.redirect('/admin/viewproducts');
    } catch (err) {
      console.error('Error adding product:', err);
      req.flash('error', 'Failed to add product');
      res.redirect('/admin/add-product');
    }
  },

  editProductPage :async (req,res) =>{
    const productId = req.params.id;
    const product = await Product.findById(productId)
    .populate('category')
      
    if (!product) {
      return res.status(404).send('Product not found');
  }
  const categories = await Category.find({}); 
        
    res.render('admin/edit-products',{admin:true , product: product,
      categories: categories
     })
  },
  editproduct : async(req,res) => {
    const proId = req.params.id
    const { name, category, description, price, discount, stock } = req.body;
        const newImages = req.files; 
        console.log(newImages)

    const product = await Product.findById(proId);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        
        let updatedImages = product.images;
        if (newImages && newImages.length > 0) {
            const imagePaths = newImages.map(image => image.path.replace(/^public[\/\\]/, ''));
            updatedImages = updatedImages.concat(imagePaths);
        }

        product.name = name;
        product.category = category;
        product.description = description;
        product.price = price;
        product.discount = discount;
        product.stock = stock;
        product.images = updatedImages;

        await product.save();

        req.flash('success', 'Product updated successfully');
        res.redirect('/admin/viewproducts');
  },
  deleteProduct: async (req, res) => {
    const productId = req.params.id;

    try {
      const product = await Product.findById(productId);
      if (!product) {
        req.flash('error', 'Product not found');
        return res.redirect('/admin/viewproducts');
      }

      product.is_deleted = true;
      await product.save();

      req.flash('success', 'Product deleted successfully');
      res.redirect('/admin/viewproducts');
    } catch (error) {
      console.error(error);
      req.flash('error', 'An error occurred while deleting the product');
      res.redirect('/admin/viewproducts');
    }
  },

  restoreProduct: async (req, res) => {
    const productId = req.params.id;

    try {
      const product = await Product.findById(productId);
      if (!product) {
        req.flash('error', 'Product not found');
        return res.redirect('/admin/viewproducts');
      }

      product.is_deleted = false;
      await product.save();

      req.flash('success', 'Product restored successfully');
      res.redirect('/admin/viewproducts');
    } catch (error) {
      console.error(error);
      req.flash('error', 'An error occurred while restoring the product');
      res.redirect('/admin/viewproducts');
    }
  }

}