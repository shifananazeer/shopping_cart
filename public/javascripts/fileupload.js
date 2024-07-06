const path =require('path')
const multer = require('multer');




const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images/products'); 
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); 
    }
  });
  
  const upload = multer({ storage: storage });
  
 
 const storage2 = multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null,'public/images/category')
    },
    filename:(req,file,cb)=>{
        const uniqueSuffix = Date.now()+'-'+Math.round(Math.random()* 1E9);
        cb(null,file.fieldname+'-' + uniqueSuffix+path.extname(file.originalname));
    }
 
    })
const categoryUpload = multer({storage:storage2})






 module.exports= {
    upload,
    categoryUpload,
};