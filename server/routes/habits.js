const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Middleware to protect routes
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

// @desc    Get all habits for logged in user
// @route   GET /api/habits
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const habits = await Habit.find({
            user: req.user.id,
            $or: [{ isArchived: false }, { isArchived: { $exists: false } }]
        });
        res.json(habits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create a new habit
// @route   POST /api/habits
// @access  Private
router.post('/', protect, async (req, res) => {
    const { title, category, frequency, frequencyDays, reminderTime, endDate } = req.body;
    try {
        const habit = new Habit({
            user: req.user.id,
            title,
            category,
            frequency,
            frequencyDays,
            reminderTime,
            endDate
        });
        const createdHabit = await habit.save();
        res.status(201).json(createdHabit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Bulk create habits
// @route   POST /api/habits/bulk
// @access  Private
router.post('/bulk', protect, async (req, res) => {
    const { habits } = req.body; // Expects array of objects
    try {
        const habitsToCreate = habits.map(h => ({
            ...h,
            user: req.user.id
        }));
        const createdHabits = await Habit.insertMany(habitsToCreate);
        res.status(201).json(createdHabits);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Mark habit as completed/skipped for a date
// @route   PUT /api/habits/:id/check
// @access  Private
router.put('/:id/check', protect, async (req, res) => {
    try {
        const { date, status } = req.body; // Expect date string and status ('completed', 'skipped')
        const habit = await Habit.findById(req.params.id);

        if (habit.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const checkDate = new Date(date || new Date());
        checkDate.setHours(0, 0, 0, 0);

        // Check if entry exists for this date
        const existingIndex = habit.history.findIndex(h => {
            const d = new Date(h.date);
            d.setHours(0, 0, 0, 0);
            return d.getTime() === checkDate.getTime();
        });

        // XP Logic
        const user = await User.findById(req.user.id);
        const XP_REWARD = 15; // Habits are hard, give 15 XP

        if (existingIndex !== -1) {
            // Updating existing
            const oldStatus = habit.history[existingIndex].status;

            // If changing from non-completed to completed -> Add XP
            if (oldStatus !== 'completed' && status === 'completed') {
                user.points += XP_REWARD;
            }
            // If changing from completed to non-completed -> Remove XP
            else if (oldStatus === 'completed' && status !== 'completed') {
                user.points = Math.max(0, user.points - XP_REWARD);
            }

            habit.history[existingIndex].status = status || 'completed';
        } else {
            // New Entry
            habit.history.push({
                date: checkDate,
                status: status || 'completed'
            });

            // Add XP if completed
            if ((status || 'completed') === 'completed') {
                user.points += XP_REWARD;
            }

            // Simple streak logic on addition (needs comprehensive recalc for accurate logic)
            if (status !== 'skipped') {
                habit.streak += 1;
            }
        }

        // Level Up Logic
        const nextLevel = (user.level * 100);
        if (user.points >= nextLevel) {
            user.level += 1;
        }
        await user.save();

        await habit.save();
        res.json(habit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Update a habit
// @route   PUT /api/habits/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);

        if (habit.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        habit.title = req.body.title || habit.title;
        habit.category = req.body.category || habit.category;
        habit.frequency = req.body.frequency || habit.frequency;
        habit.reminderTime = req.body.reminderTime || habit.reminderTime;

        if (req.body.endDate) {
            habit.endDate = req.body.endDate;
        }

        const updatedHabit = await habit.save();
        res.json(updatedHabit);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Delete a habit
// @route   DELETE /api/habits/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);

        if (habit.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        await habit.deleteOne();
        res.json({ message: 'Habit removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
