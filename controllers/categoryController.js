const Category = require('../models/categorymodel')
const Product = require('../models/productmodel')
const mongoose = require('mongoose');
const fs = require('fs')
const path = require('path')
module.exports = {
//admin Category page with search and pagination-----------------------------------------
categoryPage: async (req, res) => {
  const page = parseInt(req.query.page) || 1; 
  const search = req.query.search || '';
  const query = search ? { name: new RegExp(search, 'i') } : {};

  try {
      const categories = await Category.find(query)
          .skip((page - 1) * 5)
          .limit(5)
          .exec();

      const plainCategories = categories.map(category => category.toObject());
      const totalPages = Math.ceil(await Category.countDocuments(query) / 5);

      res.render('admin/category', { 
          adminHeader: true,
          categories: plainCategories, 
          error: req.flash('error'),
          currentPage: page,
          totalPages: totalPages,
          search: search
      });
  } catch (err) {
      console.error(err);
      req.flash('error', 'An error occurred while fetching categories.');
      res.redirect('/admin/view-category');
  }
},

    // render category add page---------------------------------------------------------
    addCategoryPage :(req,res) => {
     res.render('admin/add-category',{adminHeader:true, error: req.flash('error') })
     req.flash('error', null)
    },

//add category posting---------------------------------------------------------------
    postAddCategory : async (req, res) => {
      try {
        const { name,discount } = req.body;
        const image = req.file;
          
          if (!name || !image ) {
            req.flash('error', 'Name and image are required');
            return res.redirect('/admin/add-category'); 
          }
          const existingCategory = await Category.findOne({ name });
          if (existingCategory) {
            req.flash('error', 'Category with this name already exists');
            return res.redirect('/admin/add-category'); 
          }
          const imagePath = image.path.replace(/^public[\/\\]/, '');
          
          const newCategory = new Category({
           name: name,
           discount:discount,
           image : imagePath
           
          });
      
          await newCategory.save();
      
          req.flash('success', 'Category added successfully');
          res.redirect('/admin/view-category'); 
        } catch (err) {
          console.error('Error adding category:', err);
          req.flash('error', 'Failed to add category');
          res.redirect('/admin/add-category'); 
        }
      },
    
      // edit category page render with category details--------------------------------------------------------
     getEditCategory : async (req, res) => {
      const categoryId = req.query.id;
      console.log(categoryId)
      try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);
        if (!category) {
            req.flash('error', 'Category not found');
            return res.redirect('/admin/view-category');
        }
        res.render('admin/edit-category', { category, adminHeader:true });
      } catch (err) {
        console.error( err);
        req.flash('error', 'Failed to fetch category');
        res.redirect('/admin/view-category');
      }
    },

//edit category posting--------------------------------------------------------------
   editCategory : async (req, res) => {
    const categoryId = req.params.id;
    const { name,discount } = req.body;
    const newImage = req.file; 
    try {
        const category = await Category.findById(categoryId);
        if (!category) {
            req.flash('error', 'Category not found');
            return res.redirect('/admin/view-category');
        }
        category.name = name;
        category.discount = discount;
        if (newImage) {
            const oldImagePath = category.image;
            const newImagePath = path.join('images/category', newImage.filename);
            if (oldImagePath) {
                const fullOldImagePath = path.join(__dirname, '..', 'public', oldImagePath);
                if (fs.existsSync(fullOldImagePath)) {
                    fs.unlink(fullOldImagePath, (err) => {
                        if (err) {
                            console.error(`Error deleting old image file: ${fullOldImagePath}`, err);
                        } else {
                            console.log(`Successfully deleted old image: ${fullOldImagePath}`);
                        }
                    });
                }
            }
            category.image = newImagePath;
        }
        await category.save();

        req.flash('success', 'Category updated successfully');
        res.redirect('/admin/view-category');
    } catch (err) {
        console.error(err);
        req.flash('error', 'An error occurred while updating the category');
        res.redirect('/admin/view-category');
    }
},    

//category deleting ----------------------------------------------------------
deleteCategory: async (req, res) => {
  const categoryId = req.params.id;
  const currentPage = req.query.page || 1;
  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/view-category?page=${currentPage}',currentPage);
    }

    const products = await Product.find({ category: categoryId });
    if (products.length > 0) {
      // Check if all products in this category are deleted
      const activeProducts = products.filter(product => !product.is_deleted);
      if (activeProducts.length > 0) {
        return res.json({ success: false, message: 'Cannot delete category because there are active products under this category' });
      }
    }
    category.is_deleted = true;
    await category.save();
    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'An error occurred while deleting the category' });
  }
},

//category restoring---------------------------------------------------------------
restoreCategory: async (req, res) => {
  const categoryId = req.params.id;
  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/view-category?page=${currentPage}');
    }
    category.is_deleted = false;
    await category.save();
    res.json({ success: true, message: 'Category restored successfully' });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: 'An error occurred while restoring the category' });
  }
}
}