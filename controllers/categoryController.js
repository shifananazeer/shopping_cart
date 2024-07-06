const Category = require('../models/categorymodel')
const mongoose = require('mongoose');
const fs = require('fs')
const path = require('path')
module.exports = {
    categoryPage : async(req,res) => {
    
        
      const categories = await Category.find();

      // Convert categories to plain JavaScript objects
      const plainCategories = categories.map(category => category.toObject());
  
      res.render('admin/category', { admin:true,categories:plainCategories, error: req.flash('error') });
    
    },
    
    addCategoryPage :(req,res) => {
     res.render('admin/add-category',{admin:true, error: req.flash('error') })
     req.flash('error', null)
    },

    postAddCategory : async (req, res) => {
      try {
        const { name } = req.body;
        const image = req.file;
          
          if (!name || !image) {
            req.flash('error', 'Name and image are required');
            return res.redirect('/admin/add-category'); // Redirect back to the form
          }
      
        
          const existingCategory = await Category.findOne({ name });
          if (existingCategory) {
            req.flash('error', 'Category with this name already exists');
            return res.redirect('/admin/add-category'); // Redirect back to the form
          }
          const imagePath = image.path.replace(/^public[\/\\]/, '');
          
          const newCategory = new Category({
           name: name,
           image : imagePath
           
          });
      
          
          await newCategory.save();
      
         
          req.flash('success', 'Category added successfully');
          res.redirect('/admin/view-category'); // Redirect to view category page after successful addition
        } catch (err) {
          console.error('Error adding category:', err);
          req.flash('error', 'Failed to add category');
          res.redirect('/admin/add-category'); // Redirect back to the form in case of error
        }
      },
    

   
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

        res.render('admin/edit-category', { category });
      } catch (err) {
        console.error('Error fetching category:', err);
        req.flash('error', 'Failed to fetch category');
        res.redirect('/admin/view-category');
      }
    },
   editCategory : async (req, res) => {
    const categoryId = req.params.id;
    const { name } = req.body;
    const newImage = req.file; // Assuming you use multer for file uploads

    try {
        // Validate the categoryId
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            req.flash('error', 'Invalid Category ID');
            return res.redirect('/admin/view-category');
        }

        // Find the category by ID
        const category = await Category.findById(categoryId);
        if (!category) {
            req.flash('error', 'Category not found');
            return res.redirect('/admin/view-category');
        }

        // Update the category's name
        category.name = name;

        // Handle image update
        if (newImage) {
            const oldImagePath = category.image;
            const newImagePath = path.join('images/category', newImage.filename);

            // Delete the old image
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

            // Update the category's image path
            category.image = newImagePath;
        }

        // Save the updated category
        await category.save();

        req.flash('success', 'Category updated successfully');
        res.redirect('/admin/view-category');
    } catch (err) {
        console.error(`Error during category update: ${err}`);
        req.flash('error', 'An error occurred while updating the category');
        res.redirect('/admin/view-category');
    }
},    

deleteCategory: async (req, res) => {
  const categoryId = req.params.id;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/view-category');
    }

    category.is_deleted = true;
    await category.save();

    req.flash('success', 'Category deleted successfully');
    res.redirect('/admin/view-category');
  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while deleting the category');
    res.redirect('/admin/view-category');
  }
},

restoreCategory: async (req, res) => {
  const categoryId = req.params.id;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      req.flash('error', 'Category not found');
      return res.redirect('/admin/view-category');
    }

    category.is_deleted = false;
    await category.save();

    req.flash('success', 'Category restored successfully');
    res.redirect('/admin/view-category');
  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while restoring the category');
    res.redirect('/admin/view-category');
  }
}
}