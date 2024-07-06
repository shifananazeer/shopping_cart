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
  image: {
    type: String,  // Assuming the image is stored as a URL or file path
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
