// backend/routes/farmer.js
const express = require('express');
const router = express.Router();
const axios = require('axios'); // <-- Import axios
const authMiddleware = require('../middleware/auth');
const Donation = require('../models/Donation');
const Farmer = require('../models/Farmer');

// --- (UPDATED) Function to Fetch Real-Time Market Prices ---
const getMarketPrices = async (crops) => {
    if (!Array.isArray(crops) || crops.length === 0) {
        return {};
    }

    const apiKey = process.env.DATA_GOV_API_KEY;
    const apiUrl = `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${apiKey}&format=json&limit=1000`;

    try {
        const response = await axios.get(apiUrl);
        // THE FIX: Add a check to ensure 'records' exists before trying to use it.
        const records = response.data && response.data.records ? response.data.records : [];
        
        let marketPrices = {};
        const today = new Date().toISOString().slice(0, 10);

        crops.forEach(crop => {
            const cropRecords = records.filter(record => 
                record.commodity.toLowerCase() === crop.toLowerCase() &&
                record.arrival_date.slice(0, 10) <= today
            );

            if (cropRecords.length > 0) {
                const latestRecord = cropRecords.sort((a, b) => new Date(b.arrival_date) - new Date(a.arrival_date))[0];
                marketPrices[crop] = parseInt(latestRecord.modal_price);
            } else {
                marketPrices[crop] = 'N/A';
            }
        });
        
        return marketPrices;

    } catch (error) {
        console.error('Error fetching real-time market data:', error.message);
        // Return a fallback so the app doesn't crash
        let fallbackPrices = {};
        crops.forEach(crop => { fallbackPrices[crop] = 'N/A'; });
        return fallbackPrices;
    }
};


// --- API Endpoint for Farmers to Update Their Profile ---
router.post('/profile', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'farmer') {
            return res.status(403).json({ message: 'Access denied.' });
        }
        const { farmSize, primaryCrops } = req.body;
        const farmer = await Farmer.findByIdAndUpdate(
            req.user.id,
            { farmSize, primaryCrops },
            { new: true }
        );
        if (!farmer) return res.status(404).json({ message: 'Farmer not found.' });
        res.json({ message: 'Profile updated successfully!', farmer });
    } catch (error) {
        console.error('Error updating farmer profile:', error.message);
        res.status(500).send('Server Error');
    }
});


// --- API Endpoint to Get Farmer Dashboard Data ---
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'farmer') {
            return res.status(403).json({ message: 'Access denied. Not a farmer.' });
        }

        const farmer = await Farmer.findById(req.user.id);
        if (!farmer) {
            return res.status(404).json({ message: 'Farmer not found.' });
        }

        // --- Generate Real Demand Insights ---
        const demandData = await Donation.aggregate([
            { $addFields: { numericPart: { $regexFind: { input: "$quantity", regex: "\\d+" } } } },
            { $addFields: { numericQuantity: { $toInt: { $ifNull: ["$numericPart.match", "0"] } } } },
            { $group: { _id: '$foodType', totalQuantity: { $sum: "$numericQuantity" } } },
            { $sort: { totalQuantity: -1 } }
        ]);

        const chartLabels = demandData.map(item => item._id);
        const chartDataPoints = demandData.map(item => item.totalQuantity);
        
        // --- Get Market Prices for the Farmer's Crops ---
        const marketPrices = await getMarketPrices(farmer.primaryCrops);

        const stats = [
            { label: 'Farm Size', value: `${farmer.farmSize || 0} acres`, icon: 'fa-map-marked-alt' },
            { label: 'Crops Grown', value: farmer.primaryCrops ? farmer.primaryCrops.length : 0, icon: 'fa-seedling' },
            { label: 'Markets Tracked', value: Object.keys(marketPrices).length, icon: 'fa-chart-bar' },
            { label: 'Member Since', value: new Date(farmer.createdAt).getFullYear(), icon: 'fa-clock' }
        ];

        res.json({
            stats,
            farmSize: farmer.farmSize,
            primaryCrops: farmer.primaryCrops,
            marketPrices,
            demandData,
            chartData: {
                labels: chartLabels,
                data: chartDataPoints
            }
        });

    } catch (error) {
        console.error('Error fetching farmer dashboard data:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
