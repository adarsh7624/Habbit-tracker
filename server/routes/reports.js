const express = require('express');
const router = express.Router();
const { generateContentWithFallback } = require('../lib/gemini');
const Habit = require('../models/Habit');
const Task = require('../models/Task'); // Assuming you have a Task model, if not we use generic collection access or define it.
// If Task model is not defined in previous context, I will assume it follows standard mongoose pattern or I might need to check. 
// From dashboard code: axios.get('/api/tasks') returns tasks. 
// I will assume standard Mongoose models are available or use the same database connection logic.
// Checking previous file usage: 'const Task = require('../models/Task')' is likely safe.

const protect = require('../middleware/auth'); // Import protect

router.get('/generate', protect, async (req, res) => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Fetch User Data
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const tasks = await Task.find({
            user: req.user.id,
            date: { $gte: thirtyDaysAgo }
        });
        const habits = await Habit.find({ user: req.user.id });

        // --- CALCULATION LOGIC ---

        // 1. Overall Stats
        const totalHabits = habits.length;
        const currentLongestStreak = Math.max(...habits.map(h => h.streak), 0);
        const bestEvaStreak = Math.max(...habits.map(h => h.bestStreak || h.streak), 0);

        // Count missed days in the last 30 days across all habits
        let totalMissedInPeriod = 0;
        let totalOpportunities = 0;
        let totalCompleted = 0;

        habits.forEach(habit => {
            const history = habit.history || [];
            // Filter history for reporting period
            const recentHistory = history.filter(h => new Date(h.date) >= thirtyDaysAgo);

            recentHistory.forEach(h => {
                totalOpportunities++;
                if (h.status === 'completed') totalCompleted++;
                if (h.status === 'missed') totalMissedInPeriod++;
            });
        });

        const overallConsistency = totalOpportunities > 0
            ? Math.round((totalCompleted / totalOpportunities) * 100)
            : 0;

        // 2. Determine Rank
        let rank = "Starter";
        if (bestEvaStreak >= 365) rank = "Legend";
        else if (bestEvaStreak >= 90) rank = "Champion";
        else if (bestEvaStreak >= 30) rank = "Warrior";
        else if (bestEvaStreak >= 15) rank = "Builder";

        // 3. Trend Analysis (Last 7 days vs Previous 7 days)
        const last7DaysStart = new Date(today);
        last7DaysStart.setDate(today.getDate() - 7);
        const prev7DaysStart = new Date(today);
        prev7DaysStart.setDate(today.getDate() - 14);

        let last7Completed = 0;
        let prev7Completed = 0;

        habits.forEach(habit => {
            (habit.history || []).forEach(h => {
                const d = new Date(h.date);
                if (d >= last7DaysStart && d <= today && h.status === 'completed') last7Completed++;
                if (d >= prev7DaysStart && d < last7DaysStart && h.status === 'completed') prev7Completed++;
            });
        });

        let trend = "Stable";
        if (last7Completed > prev7Completed) trend = "Improving";
        else if (last7Completed < prev7Completed) trend = "Declining";

        // 4. Best Habit (Highest Streak)
        const bestHabitObj = habits.reduce((prev, current) => (prev.streak > current.streak) ? prev : current, { title: "None", streak: 0 });

        // 5. Generate Graph Data (Last 14 days or Month) - Merging Habit Completion
        const graphData = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Analyze last 14 days for the graph
        for (let i = 13; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = dayNames[d.getDay()];

            let dailyCompleted = 0;
            let dailyTotal = 0;

            habits.forEach(habit => {
                // Check if habit was active/due this day (implied simple check for now)
                // In a perfect world we check creation date and frequency
                // For now, check history
                const entry = habit.history?.find(h => new Date(h.date).toISOString().split('T')[0] === dateStr);
                if (entry) {
                    dailyTotal++;
                    if (entry.status === 'completed') dailyCompleted++;
                }
            });

            // Also include Tasks if needed, but keeping it Habit focused as per request
            const dayTasks = tasks.filter(t => new Date(t.date).toISOString().split('T')[0] === dateStr);
            // tasks typically have duration, habits count as 1 unit or fixed time?
            // Let's stick to "Consistency %" for the graph Y-axis

            const consistency = dailyTotal > 0 ? Math.round((dailyCompleted / dailyTotal) * 100) : 0;

            graphData.push({
                day: dayName,
                date: dateStr,
                consistency: consistency,
                completed: dailyCompleted,
                total: dailyTotal
            });
        }

        // 6. Habit-Wise Performance Report
        const habitPerformance = habits.map(h => {
            const completes = (h.history || []).filter(item => item.status === 'completed').length;
            const total = (h.history || []).length; // Or filter by start date
            const rate = total > 0 ? Math.round((completes / total) * 100) : 0;
            return {
                title: h.title,
                streak: h.streak,
                bestStreak: h.bestStreak || h.streak,
                consistency: rate,
                missed: (h.history || []).filter(item => item.status === 'missed').length
            };
        });

        // 7. AI Insight Generation
        // Simplified data context to not overload context window
        const dataContext = {
            stats: {
                rank,
                trend,
                overallConsistency,
                bestHabit: bestHabitObj.title,
                currentStreak: currentLongestStreak
            },
            recentMisses: totalMissedInPeriod,
            habitPerformance: habitPerformance.slice(0, 5) // Top 5
        };

        const prompt = `
        As an AI Habit Coach, analyze this user's data:
        ${JSON.stringify(dataContext)}

        Output JSON with motivational analysis:
        {
          "summary": "1-2 sentence human-like insight.",
          "strengths": ["Tag 1", "Tag 2"],
          "risks": ["Risk 1", "Risk 2"],
          "nextAction": "One specific advice",
          "grade": "A/B/C/D"
        }
        `;

        let text = await generateContentWithFallback(prompt);
        // Clean JSON
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            text = text.substring(jsonStart, jsonEnd + 1);
        }

        const aiReport = JSON.parse(text);

        // Construct Final Report Object
        const finalReport = {
            stats: {
                total_habits: totalHabits,
                longest_streak: currentLongestStreak,
                best_streak_ever: bestEvaStreak,
                user_rank: rank,
                missed_days: totalMissedInPeriod,
                consistency_rate: overallConsistency,
                best_habit: bestHabitObj.title,
                trend: trend
            },
            graphData: graphData,
            habitPerformance: habitPerformance,
            ...aiReport
        };

        res.json(finalReport);

    } catch (error) {
        console.error("Report Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

module.exports = router;
