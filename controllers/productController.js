const Product = require("../models/productmodel");
const Category = require('../models/categorymodel')
const Brand = require('../models/brandmodel')
const fs = require('fs');
const path = require('path');
module.exports ={
  //get all products in admin------------------------------------------------------------
  adminProduct: async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const search = req.query.search || '';
  
      const query = search ? { name: new RegExp(search, 'i') } : {};
  
      const products = await Product.find(query)
        .skip((page - 1) * 5)
        .limit(5)
        .exec();
      
      const categories = await Category.find();
      const brands = await Brand.find();
      
      const plainProducts = products.map(product => {
        const plainProduct = product.toObject();
        
        const category = categories.find(cat => cat._id.toString() === plainProduct.category.toString());
        const brand = brands.find(brd => brd._id.toString() === plainProduct.brand.toString());
  
        plainProduct.category = category.name;
        plainProduct.brand = brand.name;
        
        return plainProduct;
      });
  
      res.render("admin/view-products", {
        adminHeader: true,
        products: plainProducts,
        currentPage: page,
        totalPages: Math.ceil(await Product.countDocuments(query) / 5),
        search
      });
    } catch (err) {
      console.error(err);
      res.redirect("/admin/error");
    }
  },
  
//add product page render--------------------------------------------------------
  addProduct : async (req,res )=> {
    const categories = await Category.find()
    const brands = await Brand .find()
   res.render('admin/add-product',{adminHeader:true,categories,brands, error: req.flash('error')})
  },

//product updation -------------------------------------------------------------
  updateProduct : async (req, res) => {
    try {
      const { name,description, price, discount,stock, category,brand } = req.body;
      const images = req.files; 
      console.log( req.body);
      console.log( images);
      if (!name || !description || !price || !discount || !category || !brand|| !stock || images.length === 0) {
        req.flash('error', 'All fields are required');
        return res.redirect('/admin/add-product');
      }
      const imagePaths = images.map(image => image.path.replace(/^public[\/\\]/, ''));
      const newProduct = new Product({
        name,
        description,
        price,
        discount,
        category,
        brand,
        stock,
        images: imagePaths
      });
      await newProduct.save();
      req.flash('success', 'Product added successfully');
      res.redirect('/admin/viewproducts');
    } catch (err) {
      console.error( err);
      req.flash('error', 'Failed to add product');
      res.redirect('/admin/add-product');
    }
  },

//edit product page render with current product information----------------------------------------------------
  editProductPage :async (req,res) =>{
    const productId = req.params.id;
    const product = await Product.findById(productId)
    .populate('category')
    .populate('brand');
    if (!product) {
      return res.status(404).send('Product not found');
  }
  const categories = await Category.find({}); 
  const brands = await Brand.find({});
        console.log(product.category)
        console.log(product.category._id)
       
    res.render('admin/edit-products',{adminHeader:true , product: product,
      categories: categories,
      brands:brands
     })
  },

//post the edited product details-------------------------------------------------------
  editproduct : async(req,res) => {
    const proId = req.params.id
    const { name, category, description, price, discount, stock,brand, deletedImages } = req.body;
        const newImages = req.files; 
        console.log(newImages)

    const product = await Product.findById(proId);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        let updatedImages = product.images;
        if (deletedImages) {
        const imagesToDelete = JSON.parse(deletedImages);
      const imagesFolderPath = path.join(__dirname, '../public');

      imagesToDelete.forEach(image => {
        const imagePath = path.join(imagesFolderPath, image);
        fs.unlink(imagePath, (err) => {
          if (err) {
            console.error(`Failed to delete image: ${imagePath}`, err);
          } else {
            console.log(`Deleted image: ${imagePath}`);
          }
        });
      });
      updatedImages = updatedImages.filter(img => !imagesToDelete.includes(img));
    }
        if (newImages && newImages.length > 0) {
            const imagePaths = newImages.map(image => image.path.replace(/^public[\/\\]/, ''));
            updatedImages = updatedImages.concat(imagePaths);
        }
        product.name = name;
        product.category = category;
        product.brand = brand;
        product.description = description;
        product.price = price;
        product.discount = discount;
        product.stock = stock;
        product.images = updatedImages;
        await product.save();
        res.redirect('/admin/viewproducts');
  },

  //delete product-----------------------------------------------------------------------
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

  //restore products--------------------------------------------------------------------
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