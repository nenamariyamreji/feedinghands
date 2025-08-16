// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Import all three user models
const Ngo = require('../models/Ngo');
const Donor = require('../models/Donor');
const Farmer = require('../models/Farmer');

// --- UNIFIED REGISTRATION ---
router.post('/register', async (req, res) => {
    const { name, email, password, phone, city, role } = req.body;

    // Basic input validation
    if (!name || !email || !password || !phone || !role) {
        return res.status(400).json({ message: 'Please provide all required fields.' });
    }
    if (password.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    try {
        let UserCollection;
        let userData;

        if (role === 'ngo') {
            if (!city) return res.status(400).json({ message: 'City is required for NGOs' });
            UserCollection = Ngo;
            userData = { name, email, password, phone, city };
        } else if (role === 'donor') {
            UserCollection = Donor;
            userData = { name, email, password, phone };
        } else if (role === 'farmer') {
            if (!city) return res.status(400).json({ message: 'City is required for Farmers' });
            UserCollection = Farmer;
            userData = { name, email, password, phone, city };
        } else {
            return res.status(400).json({ message: 'Invalid role specified' });
        }

        let user = await UserCollection.findOne({ email });
        if (user) {
            return res.status(400).json({ message: `A user with this email already exists as a(n) ${role}` });
        }

        const salt = await bcrypt.genSalt(10);
        userData.password = await bcrypt.hash(password, salt);

        user = new UserCollection(userData);
        await user.save();
        
        res.status(201).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} registered successfully!` });

    } catch (error) {
        console.error(`[REGISTER ERROR] for role ${role}:`, error.message);
        res.status(500).json({ message: 'Server error during registration.' });
    }
});

// --- UNIFIED LOGIN (REWRITTEN FOR ROBUSTNESS) ---
router.post('/login', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'Please provide email, password, and role.' });
    }

    try {
        let UserCollection;
        if (role === 'ngo') UserCollection = Ngo;
        else if (role === 'donor') UserCollection = Donor;
        else if (role === 'farmer') UserCollection = Farmer;
        else return res.status(400).json({ message: 'Invalid role specified' });

        // Step 1: Find the user in the database
        const user = await UserCollection.findOne({ email });
        if (!user) {
            console.error(`[LOGIN FAILED] No user found for role '${role}' with email '${email}'`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Step 2: Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.error(`[LOGIN FAILED] Password mismatch for role '${role}' with email '${email}'`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Step 3: Create a clean user object for the payload to ensure all data is included
        const userPayload = {
            id: user._id, // Use _id for consistency
            name: user.name,
            role: role,
            email: user.email,
            phone: user.phone
        };
        
        // **NEW VALIDATION STEP**
        // Ensure all necessary fields exist before creating a token. This prevents errors later on.
        if (!userPayload.id || !userPayload.name || !userPayload.role || !userPayload.email || !userPayload.phone) {
            console.error('[LOGIN ERROR] User object from database is missing required fields:', user);
            return res.status(500).json({ message: 'User data is incomplete. Cannot create session.' });
        }

        // Log the payload to the server console for debugging
        console.log('[LOGIN SUCCESS] Creating token with payload:', userPayload);

        // Step 4: Sign the JWT with the payload nested inside a 'user' key
        jwt.sign({ user: userPayload }, process.env.JWT_SECRET, { expiresIn: '3h' }, (err, token) => {
            if (err) {
                console.error('[JWT SIGN ERROR]', err);
                return res.status(500).json({ message: 'Error creating session token.' });
            }
            // Send back the token and the same user payload
            res.json({ token, user: userPayload });
        });

    } catch (error) {
        console.error(`[LOGIN ERROR] for role ${role}:`, error.message);
        res.status(500).json({ message: 'Server error during login.' });
    }
});

module.exports = router;
