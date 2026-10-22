const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import Routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

// Initialize App
const app = express();

// ================================
// Middleware (CORS Configuration)
// ================================
// Yeh configuration mobile app aur website dono ko allow karegi
app.use(cors({
    origin: "*", // Sabhi origins (App, Website) ko allow karein
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());

// ================================
// Database Connection
// ================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected Successfully'))
    .catch(err => console.log('❌ MongoDB Connection Error:', err.message));

// ================================
// Routes
// ================================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/payment', paymentRoutes);

// Health Check Route
app.get('/', (req, res) => {
    res.json({ 
        message: 'WinzoPay Backend is Running 🚀',
        currency: 'BRL',
        country: 'Brazil',
        languages: ['English', 'Portuguese', 'Brazilian']
    });
});

// ================================
// Start Server
// ================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});