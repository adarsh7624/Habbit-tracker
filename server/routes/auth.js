const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
            password,
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                personality: user.personality,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
                personality: user.personality,
                personality: user.personality,
                isPaused: user.isPaused,
                pausedUntil: user.pausedUntil, // <--- Added
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const protect = require('../middleware/auth');
const { sendWhatsAppMessage } = require('../services/whatsapp');

// @desc    Update user profile (Phone Number)
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (user) {
            let phone = req.body.phoneNumber;
            // Auto-format: If missing '+' and length is 10, assume India (+91) based on user locale
            if (phone && !phone.startsWith('+')) {
                const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
                if (cleanPhone.length === 10) {
                    phone = `+91${cleanPhone}`;
                } else {
                    phone = `+${cleanPhone}`;
                }
            }

            user.phoneNumber = phone || user.phoneNumber;
            user.personality = req.body.personality || user.personality;
            if (req.body.isPaused !== undefined) user.isPaused = req.body.isPaused;

            if (req.body.name) user.name = req.body.name;
            if (req.body.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(req.body.password, salt);
            }

            const updatedUser = await user.save();

            // Send Confirmation Message if phone number was updated
            if (req.body.phoneNumber) {
                try {
                    const confirmationMsg = `🎉 *Welcome to AI Habbit Coach!* \n\nYou're all set! I'll see you tomorrow at 8:00 AM for your daily briefing. Let's crush those habits! 🚀`;
                    await sendWhatsAppMessage(updatedUser.phoneNumber, confirmationMsg);
                } catch (whatsappError) {
                    console.error("WhatsApp Confirmation Failed (Non-fatal):", whatsappError.message);
                    // Do not fail the request, just log it.
                }
            }

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phoneNumber: updatedUser.phoneNumber,
                personality: updatedUser.personality,
                personality: updatedUser.personality,
                isPaused: updatedUser.isPaused,
                pausedUntil: updatedUser.pausedUntil, // <--- Added
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

const { sendMorningBriefing, sendEveningNudge, sendDailyReport } = require('../services/cronLogic');

// @desc    Test WhatsApp Connection (Send specific trigger)
// @route   POST /api/auth/test-whatsapp
// @access  Private
router.post('/test-whatsapp', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || !user.phoneNumber) {
            return res.status(400).json({ message: 'User or phone number not found' });
        }

        const { type } = req.body; // 'morning', 'evening', 'report'

        let result;
        if (type === 'morning') {
            result = await sendMorningBriefing(user);
        } else if (type === 'evening') {
            result = await sendEveningNudge(user);
        } else if (type === 'report') {
            result = await sendDailyReport(user);
        } else {
            // Default test message if no type specified
            return res.status(400).json({ message: 'Invalid test type' });
        }

        if (result.sent) {
            res.json({ message: `Test (${type}) sent successfully` });
        } else {
            res.status(400).json({ message: `Failed to send: ${result.reason}` });
        }

    } catch (error) {
        console.error("Test WhatsApp Error:", error);
        res.status(500).json({ message: 'Error: ' + error.message });
    }
});

module.exports = router;
