// backend/models/Donation.js
const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    donorName: { type: String, required: true },
    contactPerson: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    foodType: { type: String, required: true },
    quantity: { type: String, required: true },
    foodDescription: { type: String, required: true },
    preparedTime: { type: Date },
    expiryTime: { type: Date, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    pincode: { type: String, required: true },
    specialInstructions: { type: String },
    status: {
        type: String,
        enum: ['available', 'claimed', 'expired'],
        default: 'available'
    },
    claimedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ngo'
    },
    // This new field links each donation to a specific donor account.
    donor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Donor',
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);
