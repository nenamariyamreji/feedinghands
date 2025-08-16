// models/Ngo.js

const mongoose = require('mongoose');

// Defines the structure for an NGO user account in the database.
const ngoSchema = new mongoose.Schema({
    // Name of the NGO (e.g., "Mumbai Food Angels")
    name: {
        type: String,
        required: true, // This field is mandatory
        trim: true      // Removes whitespace from both ends
    },
    // Email for the NGO, used for login
    email: {
        type: String,
        required: true,
        unique: true,   // Each NGO must have a unique email
        lowercase: true,// Converts email to lowercase before saving
        trim: true
    },
    // Password for the account
    password: {
        type: String,
        required: true
    },
    // City where the NGO operates
    city: {
        type: String,
        required: true
    },
    // Contact phone number
    phone: {
        type: String,
        required: true
    }
}, {
    // Automatically adds `createdAt` and `updatedAt` timestamps
    timestamps: true
});

// Creates and exports the model, making it available for use in other files.
module.exports = mongoose.model('Ngo', ngoSchema);
