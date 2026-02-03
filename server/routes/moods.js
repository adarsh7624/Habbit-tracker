const express = require('express');
const router = express.Router();
const Mood = require('../models/Mood');
const jwt = require('jsonwebtoken');

// Middleware
const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = decoded;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

// @desc    Get moods for user (optional date range)
// @route   GET /api/moods
router.get('/', protect, async (req, res) => {
    try {
        const moods = await Mood.find({ user: req.user.id }).sort({ date: -1 });
        res.json(moods);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Log mood for today
// @route   POST /api/moods
router.post('/', protect, async (req, res) => {
    const { rating, energy, note, date } = req.body;
    try {
        const moodDate = new Date(date || Date.now());
        moodDate.setHours(0, 0, 0, 0);

        const mood = await Mood.findOneAndUpdate(
            { user: req.user.id, date: moodDate },
            { rating, energy, note },
            { new: true, upsert: true } // Update if exists, create if not
        );
        res.json(mood);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
