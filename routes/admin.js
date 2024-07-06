const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController')
const {adminsessionHandler,} = require('../middlewares/middleware')
const productController = require('../controllers/productController')
const categoryController = require('../controllers/categoryController')
const {upload,categoryUpload} = require('../public/javascripts/fileupload')


router.get('/',adminsessionHandler,adminController.getDashboard)

router.get('/adminlogin', adminController.loginLoad);

router.post ('/adminlogin',adminController.verifyLogin)

router.get("/viewproducts", productController.adminProduct);

router.get ('/add-product',productController.addProduct)

router.post('/add-product', upload.array('image', 5),productController.updateProduct);

router.get('/edit-product/:id',adminsessionHandler,productController.editProductPage)

router.post('/update-product/:id',adminsessionHandler, upload.array('image', 10) ,productController.editproduct)

router.post('/delete-product/:id', productController.deleteProduct);

router.post('/restore-product/:id', productController.restoreProduct);

router.get('/view-category',adminsessionHandler,categoryController.categoryPage)

router.get('/add-category',adminsessionHandler,categoryController.addCategoryPage)

router.post('/add-category',adminsessionHandler,categoryUpload.single('image'),categoryController.postAddCategory)

router.post('/delete-category/:id', categoryController.deleteCategory);

router.post('/restore-category/:id', categoryController.restoreCategory);

router.get('/edit-category/:id',adminsessionHandler,categoryController.getEditCategory)

router.post('/edit-category/:id',adminsessionHandler, categoryUpload.single('image'),categoryController.editCategory );

router.get('/allUsers',adminsessionHandler,adminController.getAllUsers)

router.post('/blockuser/:id', adminController.blockUser);

router.post('/unblockuser/:id', adminController.unblockUser);

module.exports = router;