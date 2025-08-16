// backend/routes/stats.js

const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const Ngo = require('../models/Ngo');
const Farmer = require('../models/Farmer'); // <-- Import the Farmer model

// --- API Endpoint to Get Key Statistics ---
// Path: GET /api/stats
router.get('/', async (req, res) => {
    try {
        // Count the total number of donations submitted
        const mealsDonated = await Donation.countDocuments();

        // Count the total number of registered NGOs
        const ngoPartners = await Ngo.countDocuments();

        // Count the total number of registered Farmers
        const farmersConnected = await Farmer.countDocuments(); // <-- CORRECTED THIS LINE

        // Count the number of unique cities where donations have been made
        const citiesServed = (await Donation.distinct('city')).length;

        res.status(200).json({
            mealsDonated: mealsDonated,
            ngoPartners: ngoPartners,
            farmersConnected: farmersConnected, // <-- Now using the dynamic count
            citiesServed: citiesServed
        });

    } catch (error) {
        console.error('Error fetching stats:', error.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
