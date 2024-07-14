const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  brand: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  discount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
  },
  is_deleted:{
    type:Boolean,
    default:false
  },
  images: [
    {
      type: String,
      required: true,
    }
  ],
  ratings: [
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User' // Reference to the User model if you have one
        },
        rating: {
            type: Number,
            required: true
        },
        comment: {
            type: String
        }
    }
],
avgRating: {
    type: Number,
    default: 0 // Default average rating
},
minStockLevel: { type: Number, default: 5 } 
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
