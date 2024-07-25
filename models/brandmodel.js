// brandModel.js

const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
   
  },
 
  image: {
    type: String,  
    required: true,
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  salesCount: { type: Number, default: 0 }, 
}, { timestamps: true });

module.exports = mongoose.model('Brand', brandSchema);
