// backend/routes/donor.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Donation = require('../models/Donation');

// --- API Endpoint to Get Donor Dashboard Data ---
// This is a protected route, only accessible by logged-in users.
// Path: GET /api/donor/dashboard
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        // 1. Check the user's role from the token to ensure they are a donor.
        // The `req.user` object is added by the `authMiddleware`.
        if (req.user.role !== 'donor') {
            return res.status(403).json({ message: 'Access denied. This route is for donors only.' });
        }

        const donorId = req.user.id;

        // 2. Fetch all donations from the database that were made by this specific donor.
        const donations = await Donation.find({ donor: donorId }).sort({ createdAt: -1 });

        // 3. Calculate statistics based on the fetched donations.
        const totalDonations = donations.length;
        const activeListings = donations.filter(d => d.status === 'available').length;
        const claimedListings = donations.filter(d => d.status === 'claimed').length;
        
        // A simple way to calculate total quantity (this assumes the quantity is a string like "50 kg").
        // It extracts the number part and adds it up.
        const totalQuantity = donations.reduce((accumulator, currentDonation) => {
            const quantityNumber = parseInt(currentDonation.quantity) || 0;
            return accumulator + quantityNumber;
        }, 0);

        // 4. Send the donations and the calculated stats back to the frontend.
        res.json({
            donations,
            stats: {
                totalDonations,
                activeListings,
                claimedListings,
                totalQuantity
            }
        });

    } catch (error) {
        console.error('Error fetching donor dashboard data:', error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
