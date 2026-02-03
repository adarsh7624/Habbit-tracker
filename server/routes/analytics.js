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
            res.status(401).json({ message: 'Not authorized' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized' });
    }
};

router.get('/dashboard-stats', protect, async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Fetch User Info (XP, Level)
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 2. Fetch Recent Tasks (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const recentTasks = await Task.find({
            user: userId,
            date: { $gte: thirtyDaysAgo }
        });

        // 3. Calculate Consistency
        const totalRecent = recentTasks.length;
        const completedRecent = recentTasks.filter(t => t.isCompleted).length;
        const consistency = totalRecent > 0 ? Math.round((completedRecent / totalRecent) * 100) : 0;

        // 4. Calculate Streak (Consecutive days with at least 1 completed task)
        // Group by date, using ALL history for accurate streak
        const allTasks = await Task.find({ user: userId, isCompleted: true }).select('date');
        const allTasksByDate = {};
        allTasks.forEach(t => {
            // Handle case where date might be invalid or not a Date object
            if (t.date && t.date instanceof Date) {
                const dKey = t.date.toISOString().split('T')[0];
                allTasksByDate[dKey] = true;
            }
        });

        let streak = 0;
        // Check up to 2 years back to be safe
        for (let i = 0; i < 730; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = d.toISOString().split('T')[0];

            // Allow today to be incomplete without breaking streak if yesterday was done
            if (i === 0 && !allTasksByDate[key]) continue;

            if (allTasksByDate[key]) {
                streak++;
            } else {
                break;
            }
        }

        // Update User Stats (Persist functionality)
        if (!user.maxStreak || streak > user.maxStreak) {
            user.maxStreak = streak;
        }
        user.streak = streak;

        // Rank Logic
        let rank = 'Beginner';
        if (streak >= 365) rank = 'Master';
        else if (streak >= 90) rank = 'Legendary';
        else if (streak >= 30) rank = 'Elite';
        else if (streak >= 15) rank = 'Disciplined';
        else if (streak >= 7) rank = 'Improver';

        user.rank = rank;

        // Update Max Rank if hierarchy is climbed
        const ranks = ['Beginner', 'Improver', 'Disciplined', 'Elite', 'Legendary', 'Master'];
        // Default to Beginner if undefined
        const currentRankIndex = ranks.indexOf(rank);
        const maxRankIndex = ranks.indexOf(user.maxRank || 'Beginner');

        if (currentRankIndex > maxRankIndex) {
            user.maxRank = rank;
        }

        await user.save();

        // 5. Burnout Risk / Failure Prediction
        let burnoutRisk = 'Low';
        let failurePrediction = 'Stable';

        if (totalRecent > 100 && consistency < 60) {
            burnoutRisk = 'High';
            failurePrediction = 'At Risk of Quitting';
        } else if (consistency < 40) {
            failurePrediction = 'Needs easier plan';
        } else if (totalRecent > 150) {
            burnoutRisk = 'Medium';
        }

        // 6. Habit DNA
        const dna = {
            type: consistency > 80 ? 'Marathoner' : 'Sprinter',
            bestTime: 'Morning',
            consistency: consistency
        };

        res.json({
            xp: user.points,
            level: user.level,
            streak,
            maxStreak: user.maxStreak,
            rank: user.rank,
            maxRank: user.maxRank,
            consistency,
            burnoutRisk,
            failurePrediction,
            dna,
            phoneNumber: user.phoneNumber // <--- Added for Settings UI
        });

    } catch (error) {
        const fs = require('fs');
        fs.appendFileSync('error_log.txt', `${new Date().toISOString()} - ${error.message}\n${error.stack}\n\n`);
        console.error('ANALYTICS ERROR:', error);
        res.status(500).json({
            message: 'Server Error',
            error: error.message,
            stack: error.stack
        });
    }
});

module.exports = router;
