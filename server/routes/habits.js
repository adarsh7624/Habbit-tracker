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
        const { date, status, progress } = req.body; // Expect date string, status ('completed', 'skipped', 'partial'), and progress (0-100)
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
        const XP_FULL = 15;
        const XP_PARTIAL = 7;

        const getXpForStatus = (s) => {
            if (s === 'completed') return XP_FULL;
            if (s === 'partial') return XP_PARTIAL;
            return 0;
        };

        if (existingIndex !== -1) {
            // Updating existing
            const oldStatus = habit.history[existingIndex].status;
            const newStatus = status || 'completed';

            // Revert old XP then add new XP
            user.points = Math.max(0, user.points - getXpForStatus(oldStatus));
            user.points += getXpForStatus(newStatus);

            habit.history[existingIndex].status = newStatus;
            habit.history[existingIndex].progress = (newStatus === 'partial' && progress) ? progress : (newStatus === 'completed' ? 100 : 0);
        } else {
            // New Entry
            const newStatus = status || 'completed';
            habit.history.push({
                date: checkDate,
                status: newStatus,
                progress: (newStatus === 'partial' && progress) ? progress : (newStatus === 'completed' ? 100 : 0)
            });

            // Add XP
            user.points += getXpForStatus(newStatus);

            // Streak Logic (Partial counts as keeping streak alive?? For now, yes.)
            if (status !== 'skipped' && status !== 'missed') {
                habit.streak += 1;
            }
        }

        // Level Up Logic
        const nextLevel = (user.level * 100);
        if (user.points >= nextLevel) {
            user.level += 1;
        }

        // --- PHASE 15: GAMIFICATION ENGINE ---

        // 1. Calculate Momentum
        // Formula: (Current Streak * 10) + (XP / 100)
        // Note: Ideally we want a specialized "Velocity" metric, but this is a good V1.
        user.momentumScore = Math.floor((user.streak * 10) + (user.points / 100));

        // 2. Consistency Insurance (Milestone Check)
        // Every 7 days of global streak => +1 Token
        if (user.streak > 0 && user.streak % 7 === 0) {
            // Check if we already awarded for this specific milestone?
            // For simplicity in V1, we just check if it's a multiple of 7.
            // Problem: If they check a habit, streak is 7. Check another habit SAME DAY, streak is still 7.
            // We need to ensure we don't double award.
            // Solution: We should only increment User.streak ONCE per day in a separate logic, 
            // OR we store "lastTokenAwardedStreak" in user model.
            // FOR NOW: Let's skip auto-awarding here and rely on the Cron Job "Midnight Processor" for reliable streak counting.
            // We will just calculate Momentum here.
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

// @desc    Toggle pause status
// @route   PUT /api/habits/:id/pause
router.put('/:id/pause', protect, async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        if (!habit) return res.status(404).json({ message: 'Habit not found' });
        if (habit.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        habit.isPaused = !habit.isPaused;
        await habit.save();
        res.json(habit);
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
