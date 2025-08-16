// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST", "PATCH"] }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.set('socketio', io);

mongoose.connect(process.env.MONGO_URI)
.then(() => console.log('✅ MongoDB connected successfully.'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// API Routes
const authRoutes = require('./routes/auth');
const donationRoutes = require('./routes/donations');
const statsRoutes = require('./routes/stats');
const donorRoutes = require('./routes/donor');
const ngoRoutes = require('./routes/ngo');
const farmerRoutes = require('./routes/farmer'); // <-- ADD THIS

app.use('/api/auth', authRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/donor', donorRoutes);
app.use('/api/ngo', ngoRoutes);
app.use('/api/farmer', farmerRoutes); // <-- AND THIS

io.on('connection', (socket) => {
  console.log(`🔌 A user connected: ${socket.id}`);
  socket.on('disconnect', () => console.log(`🔌 User disconnected: ${socket.id}`));
});

server.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
