const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
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

// @desc    Get tasks (optionally filter by date range later)
// @route   GET /api/tasks
router.get('/', protect, async (req, res) => {
    try {
        const tasks = await Task.find({ user: req.user.id }).sort({ date: 1 });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Create single task
// @route   POST /api/tasks
router.post('/', protect, async (req, res) => {
    const { title, date, category, duration, difficulty } = req.body;
    try {
        const task = await Task.create({
            user: req.user.id,
            title,
            date,
            category,
            duration,
            difficulty
        });
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Bulk create tasks
// @route   POST /api/tasks/bulk
router.post('/bulk', protect, async (req, res) => {
    const { tasks } = req.body;
    try {
        const tasksToCreate = tasks.map(t => ({
            ...t,
            user: req.user.id
        }));
        const createdTasks = await Task.insertMany(tasksToCreate);
        res.status(201).json(createdTasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @desc    Toggle completion
// @route   PUT /api/tasks/:id/check
router.put('/:id/check', protect, async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (task.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

        const wasCompleted = task.isCompleted;
        const isNowCompleted = !wasCompleted;
        task.isCompleted = isNowCompleted;
        await task.save();

        // Gamification Logic
        if (isNowCompleted) {
            const user = await User.findById(req.user.id);
            if (user) {
                // Award 10 XP per task
                user.points = (user.points || 0) + 10;

                // Level Up Logic (Simple: Level up every 100 points)
                const newLevel = Math.floor(user.points / 100) + 1;
                if (newLevel > user.level) {
                    user.level = newLevel;
                    // In a real app we might emit a socket event here
                }
                await user.save();
            }
        } else {
            // Optional: Remove XP if unchecked? 
            // For now, let's keep it simple and preventing farming by toggle
            // To prevent farming, we should probably track if XP was already awarded for this task instance
            // But for MVP, simple toggle is fine or we just don't decrement to avoid "debt"
            // Let's decrement to keep balance if they unchecked it immediately
            const user = await User.findById(req.user.id);
            if (user && user.points >= 10) {
                user.points -= 10;
                if (user.points < 0) user.points = 0;
                // Recalculate level
                const newLevel = Math.floor(user.points / 100) + 1;
                user.level = newLevel;
                await user.save();
            }
        }

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
