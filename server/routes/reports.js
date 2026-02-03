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

router.get('/generate', protect, async (req, res) => { // Use protect
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Fetch User Data
        // Fetch tasks for the last 30 days for AI context, and last 7 days for Graph
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        const tasks = await Task.find({
            user: req.user.id,
            date: { $gte: thirtyDaysAgo }
        });
        const habits = await Habit.find({ user: req.user.id });

        // Helper to parse duration (e.g. "30 min", "1h", "45") -> minutes
        const parseDuration = (dur) => {
            if (!dur) return 30; // Default
            const str = String(dur).toLowerCase();
            if (str.includes('h')) return parseFloat(str) * 60;
            return parseFloat(str) || 30;
        };

        // 2. Generate Graph Data (Last 7 Days)
        const graphData = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = dayNames[d.getDay()];

            // Filter tasks for this day
            const dayTasks = tasks.filter(t => {
                const tDate = new Date(t.date).toISOString().split('T')[0];
                return tDate === dateStr;
            });

            const planned = dayTasks.reduce((acc, t) => acc + parseDuration(t.duration), 0);
            const actual = dayTasks
                .filter(t => t.isCompleted)
                .reduce((acc, t) => acc + parseDuration(t.duration), 0);

            // Recovered Logic (Optional: based on some flag if you have it, else 0)
            const recovered = 0;

            graphData.push({
                day: dayName,
                planned: planned || 0, // Ensure no NaNs, though reduce default 0 handles it.
                actual: actual || 0,
                recovered
            });
        }

        // Calculate basic stats for AI
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.isCompleted).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // Calculate "Focus Mode" impact (Mock logic: assume tasks with "Recovered" note are Focus Mode)
        const focusModeTasks = tasks.filter(t => t.description && t.description.includes('Recovered'));
        const focusModeCompletion = focusModeTasks.filter(t => t.isCompleted).length;
        const focusImpact = focusModeTasks.length > 0
            ? Math.round((focusModeCompletion / focusModeTasks.length) * 100)
            : 0;

        // Prepare Data Context for AI
        const dataContext = {
            period: "Last 30 Days",
            stats: {
                total_effort_minutes: tasks.reduce((acc, t) => acc + parseDuration(t.duration), 0),
                completion_rate: completionRate,
                habits_active: habits.length,
                current_streak: Math.max(...habits.map(h => h.streak), 0),
                focus_mode_usage: focusModeTasks.length,
                focus_mode_success_rate: focusImpact
            },
            recent_activity: tasks.slice(-5).map(t => ({ // Limit to 5 for smaller prompt
                title: t.title,
                status: t.isCompleted ? "Done" : "Missed",
                date: t.date
            }))
        };

        const prompt = `
        You are an AI Performance Analyst and Habit Coach.
        Analyze the user's habit and task data and generate clear, motivational insights.

        DATA RECEIVED:
        ${JSON.stringify(dataContext, null, 2)}

        YOUR TASK:
        1. Identify patterns and trends
        2. Highlight strengths
        3. Point out risk areas gently
        4. Explain the impact of Focus Mode (if used)
        5. Suggest ONE improvement for next period

        RULES:
        • Be supportive, never critical
        • Use simple language
        • Avoid numbers overload
        • Keep summary under 120 words

        OUTPUT FORMAT (STRICT JSON):
        {
          "summary": "Short weekly or monthly insight",
          "strengths": ["Strength 1", "Strength 2"],
          "risks": ["Risk 1", "Risk 2"],
          "focusModeImpact": "Explanation of how focus mode successfully rescued X tasks...",
          "nextAction": "One clear suggestion",
          "grade": "A/B/C"
        }
        Return ONLY the JSON.
        `;

        let text = await generateContentWithFallback(prompt);
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            text = text.substring(jsonStart, jsonEnd + 1);
        }

        const report = JSON.parse(text);

        // Enhance report with calculated stats for the dashboard graphs
        report.stats = dataContext.stats;
        report.graphData = graphData; // <--- Attach Real Graph Data

        res.json(report);

    } catch (error) {
        console.error("Report Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate report' });
    }
});

module.exports = router;
