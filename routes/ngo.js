// backend/routes/ngo.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Donation = require('../models/Donation');

// --- API Endpoint to Get NGO Dashboard Data ---
// This is a protected route, only accessible by logged-in NGOs.
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        // 1. Ensure the logged-in user has the 'ngo' role.
        if (req.user.role !== 'ngo') {
            return res.status(403).json({ message: 'Access denied. This route is for NGOs only.' });
        }

        const ngoId = req.user.id;

        // 2. Calculate Statistics
        // Count donations this specific NGO has claimed.
        const totalClaimed = await Donation.countDocuments({ claimedBy: ngoId });
        
        // Count all donations currently available on the platform.
        const availableNow = await Donation.countDocuments({ status: 'available' });
        
        // Estimate the number of people served (e.g., assuming 25 people per claimed donation).
        const peopleServed = totalClaimed * 25;

        // 3. Fetch all available donations to display in the list.
        const availableDonations = await Donation.find({ status: 'available' }).sort({ createdAt: -1 });

        // 4. Send the stats and the list of donations back to the frontend.
        res.json({
            stats: {
                totalClaimed,
                peopleServed,
                availableNow
            },
            availableDonations
        });

    } catch (error) {
        console.error('Error fetching NGO dashboard data:', error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
