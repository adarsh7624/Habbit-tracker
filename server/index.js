const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', // Allow all or specific frontend
    credentials: true
}));
app.use(express.json());

// Database Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Routes Placeholder
const authRoutes = require('./routes/auth');
const habitRoutes = require('./routes/habits');
const moodRoutes = require('./routes/moods');
const taskRoutes = require('./routes/tasks');
const plannerRoutes = require('./routes/planner');
const coachRoutes = require('./routes/coach');
const analyticsRoutes = require('./routes/analytics');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/moods', moodRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/coach', coachRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', require('./middleware/auth'), require('./routes/reports'));


app.get('/', (req, res) => {
    res.send('Habit Tracker API is running...');
});

// Initialize Scheduler (WhatsApp Notifications)
const initScheduler = require('./scheduler');
initScheduler();

// Start Server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
});
