// backend/routes/donations.js
const express = require('express');
const router = express.Router();
const Donation = require('../models/Donation');
const authMiddleware = require('../middleware/auth');

// --- Create a New Donation (Now a Protected Route) ---
// This endpoint is now protected. A user must be logged in to post a donation.
router.post('/', authMiddleware, async (req, res) => {
    try {
        // 1. Check if the logged-in user has the 'donor' role from the JWT payload.
        if (req.user.role !== 'donor') {
            return res.status(403).json({ message: 'Only registered donors can create a donation.' });
        }

        // 2. Create a new donation instance, combining the form data from the request body...
        const newDonation = new Donation({
            ...req.body,
            // ...with the logged-in user's ID, which is automatically assigned to the 'donor' field.
            donor: req.user.id 
        });

        const savedDonation = await newDonation.save();
        
        // 3. Notify all connected clients in real-time about the new donation via Socket.IO.
        const io = req.app.get('socketio');
        io.emit('newDonation', savedDonation);

        res.status(201).json({ message: 'Donation created successfully!', data: savedDonation });
    } catch (error) {
        console.error("Error creating donation:", error.message);
        res.status(400).json({ message: 'Failed to create donation', error: error.message });
    }
});

// --- Get All Donations (Public Route) ---
// This endpoint allows anyone (logged in or not) to see the available donations.
router.get('/', async (req, res) => {
    try {
        const query = {};
        // Allow filtering by status, e.g., /api/donations?status=available
        if (req.query.status) {
            query.status = req.query.status;
        }
        // Fetch donations, sort by newest first, and populate the name of the NGO that claimed it.
        const donations = await Donation.find(query).sort({ createdAt: -1 }).populate('claimedBy', 'name'); 
        res.status(200).json(donations);
    } catch (error) {
        console.error("Error fetching donations:", error.message);
        res.status(500).json({ message: 'Failed to fetch donations', error: error.message });
    }
});

// --- Claim a Donation (Protected Route for NGOs) ---
// This endpoint is protected and restricted to users with the 'ngo' role.
router.patch('/:id/claim', authMiddleware, async (req, res) => {
    try {
        // 1. Check the user's role.
        if (req.user.role !== 'ngo') {
            return res.status(403).json({ message: 'Only NGOs can claim donations.' });
        }
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.status(404).json({ message: 'Donation not found' });
        if (donation.status !== 'available') return res.status(400).json({ message: `Donation is already ${donation.status}` });

        // 2. Update the donation status and link it to the claiming NGO.
        donation.status = 'claimed';
        donation.claimedBy = req.user.id;

        const updatedDonation = await donation.save();
        
        // 3. Notify all clients that this donation has been claimed.
        const io = req.app.get('socketio');
        io.emit('donationClaimed', { id: updatedDonation._id, claimedBy: req.user.name });

        res.status(200).json({ message: 'Donation claimed successfully!', data: updatedDonation });
    } catch (error) {
        console.error("Error claiming donation:", error.message);
        res.status(500).json({ message: 'Failed to claim donation', error: error.message });
    }
});

module.exports = router;
