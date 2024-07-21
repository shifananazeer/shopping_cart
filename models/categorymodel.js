// categoryModel.js

const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  is_deleted: {
    type: Boolean,
    default: false
  },
  discount: { type: Number, default: 0 },
  image: {
    type: String,  
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
