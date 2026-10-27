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
const bankRoutes = require('./routes/bankRoutes'); 

// Initialize App
const app = express();

// ================================
// 🔥 CORS Configuration (Vercel Fix)
// ================================
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// ================================
// 🔥 Database Connection (Vercel Serverless Fix)
// ================================
const connectDB = async () => {
    // Agar pehle se connected hai toh wapas connect mat karo
    if (mongoose.connection.readyState === 1) {
        return;
    }
    
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000, // 5 second timeout
        });
        console.log('✅ MongoDB Connected Successfully');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
    }
};

// 🔥 YEH MIDDLEWARE SABSE ZAROORI HAI: Har request se pehle DB connect karega
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// ================================
// Routes
// ================================
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/bank', bankRoutes); 

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
// 🔥 Server Start (Vercel & Local Fix)
// ================================
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}

// Export for Vercel Serverless
module.exports = app;