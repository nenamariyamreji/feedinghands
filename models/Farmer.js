// backend/models/Farmer.js
const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    // NEW FIELDS
    farmSize: { type: Number, default: 0 },
    primaryCrops: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Farmer', farmerSchema);
