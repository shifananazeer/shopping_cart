const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController')
const {adminsessionHandler,} = require('../middlewares/middleware')
const productController = require('../controllers/productController')
const categoryController = require('../controllers/categoryController')
const brandController = require('../controllers/brandController')
const adminOrderController = require('../controllers/adminOrderController')
const {upload,categoryUpload,brandUpload} = require('../public/javascripts/fileupload')


router.get('/',adminsessionHandler,adminController.getDashboard)

router.get('/adminlogin', adminController.loginLoad);

router.post ('/adminlogin',adminController.verifyLogin)

router.get("/viewproducts",adminsessionHandler, productController.adminProduct);

router.get ('/add-product',adminsessionHandler,productController.addProduct)

router.post('/add-product',adminsessionHandler, upload.array('image', 5),productController.updateProduct);

router.get('/edit-product/:id',adminsessionHandler,productController.editProductPage)

router.post('/update-product/:id',adminsessionHandler, upload.array('image', 10) ,productController.editproduct)

router.post('/delete-product/:id',adminsessionHandler, productController.deleteProduct);

router.post('/restore-product/:id',adminsessionHandler, productController.restoreProduct);

router.get('/view-category',adminsessionHandler,categoryController.categoryPage)

router.get('/add-category',adminsessionHandler,categoryController.addCategoryPage)

router.post('/add-category',adminsessionHandler,categoryUpload.single('image'),categoryController.postAddCategory)

router.delete('/delete-category/:id',adminsessionHandler, categoryController.deleteCategory);

router.post('/restore-category/:id',adminsessionHandler, categoryController.restoreCategory);

router.get('/edit-category/:id',adminsessionHandler,categoryController.getEditCategory)

router.post('/edit-category/:id',adminsessionHandler, categoryUpload.single('image'),categoryController.editCategory );

router.get('/allUsers',adminsessionHandler,adminController.getAllUsers)

router.post('/blockuser/:id',adminsessionHandler, adminController.blockUser);

router.post('/unblockuser/:id',adminsessionHandler, adminController.unblockUser);

router.get('/logout',adminsessionHandler,adminController.logout)

router.get('/viewbrand',adminsessionHandler,brandController.viewbrand)

router.get('/add-brand',adminsessionHandler,brandController.addbrandPage)

router.post('/add-brand', adminsessionHandler,brandUpload.single('image'), brandController.addBrand);

router.delete('/delete-brand/:id',adminsessionHandler, brandController.deleteBrand);

router.post('/restore-brand/:id',adminsessionHandler, brandController.restoreBrand);

router.get('/orders',adminsessionHandler, adminOrderController.listOrders);

router.post('/orders/:orderId/change-status',adminsessionHandler, adminOrderController.changeOrderStatus);

router.post('/orders/:orderId/cancel',adminsessionHandler, adminOrderController.cancelOrder);


module.exports = router;