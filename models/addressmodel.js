// models/Address.js
const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    houseName: {
      type: String,
      required: true,
    },
    street: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    pincode: {
      type: String,
      required: true,
    },
    addressType: {
      type: String,
      required: true,
    },
  });
  

module.exports = mongoose.model('Address', addressSchema);
