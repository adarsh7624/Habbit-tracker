const express = require('express');
const router = express.Router();
const { generateContentWithFallback } = require('../lib/gemini');

router.post('/generate', async (req, res) => {
    const { goal, type, duration, time, level } = req.body;

    if (!goal) return res.status(400).json({ error: 'Goal is required' });

    try {
        const prompt = `
        You are an expert AI mentor, fitness coach, and productivity planner.

        Create a structured, realistic, and motivating plan for the following goal:

        Goal Type: ${type}
        User Goal: ${goal}
        Duration: ${duration}
        Daily Time Available: ${time}
        Skill Level: ${level}

        📌 Requirements:
        1. Break the plan into:
           - Monthly goals
           - Weekly focus areas
           - Day-wise tasks
        2. Each day should have:
           - Clear task title
           - Time estimate (should match Daily Time Available roughly)
           - Difficulty level
           - Optional resource suggestion
        3. Keep the plan practical, balanced, and achievable
        4. Add rest / revision days
        5. Ensure progress builds gradually
        6. Avoid burnout

        Output MUST be valid JSON with the following structure:
        {
            "overview": "Brief summary of the plan",
            "monthly_plan": [
                {
                    "month": 1,
                    "focus": "Month focus",
                    "weeks": [
                        {
                            "week": 1,
                            "goal": "Week goal",
                            "days": [
                                {
                                    "day": "Day 1",
                                    "task": "Task title",
                                    "duration": "30 min",
                                    "difficulty": "Easy",
                                    "type": "${type}",
                                    "resource": "URL or book title (optional)"
                                }
                            ]
                        }
                    ]
                }
            ]
        }
        Return ONLY the JSON.
        `;

        // Use the fallback function
        let text = await generateContentWithFallback(prompt);

        // Find JSON start and end
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            text = text.substring(jsonStart, jsonEnd + 1);
        }

        const plan = JSON.parse(text);

        res.json(plan);
    } catch (error) {
        console.error("AI Generation Error:", error);
        res.status(500).json({ error: 'Failed to generate plan. All AI models may be busy or quota exceeded.' });
    }

});

router.post('/adjust', async (req, res) => {
    const { missedDays, originalPlan, remainingDays } = req.body;

    if (!missedDays || !originalPlan) {
        return res.status(400).json({ error: 'Missed days and original plan data required' });
    }

    try {
        const prompt = `
        You are an AI Focus Coach and Smart Planner working inside a habit and learning planner application.

        The user is currently in FOCUS MODE.

        ────────────────────────────────
        FOCUS MODE RULES (VERY IMPORTANT)
        ────────────────────────────────
        • Prioritize consistency over intensity
        • Keep daily workload light and achievable
        • Avoid overwhelming the user
        • Protect motivation and streaks

        ────────────────────────────────
        MISSED DAY HANDLING
        ────────────────────────────────
        User has missed ${missedDays} days.
        
        1. DO NOT move all missed work to a single day
        2. Calculate the total missed workload (time or effort)
        3. Redistribute the missed workload evenly across the next available days
        4. Increase daily workload slightly (5–15 minutes max)
        5. Ensure daily workload never exceeds the user’s limit
        6. Clearly mark redistributed effort as: "Recovered effort from missed day"

        ────────────────────────────────
        TASK ADJUSTMENT STRATEGY
        ────────────────────────────────
        • Small increases are better than big jumps
        • Prefer extending duration over adding new tasks
        • Maintain rest days if possible
        • If user misses multiple days, spread recovery over more days

        ────────────────────────────────
        INPUT DATA
        ────────────────────────────────
        Original Plan: ${JSON.stringify(originalPlan)}
        Remaining Available Days: ${remainingDays}

        ────────────────────────────────
        OUTPUT FORMAT (STRICT JSON ONLY)
        ────────────────────────────────
        {
          "focusMode": true,
          "missedDays": ${missedDays},
          "recoveryStrategy": "distributed",
          "adjustedDays": [
            {
              "date": "YYYY-MM-DD",
              "originalDuration": "45 min",
              "addedRecovery": "10 min",
              "newTotalDuration": "55 min",
              "note": "Includes recovered effort from missed day"
            }
          ],
          "coachMessage": "Short encouraging message"
        }

        ────────────────────────────────
        COACH TONE
        ────────────────────────────────
        • Calm
        • Supportive
        • Non-judgmental
        • Progress-focused

        Never use guilt-based language.
        Never overload the user.
        Think like a human coach, not a task manager.
        Return ONLY the JSON.
        `;

        let text = await generateContentWithFallback(prompt);

        // Clean markdown code blocks if present
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        // Find JSON start and end
        const jsonStart = text.indexOf('{');
        const jsonEnd = text.lastIndexOf('}');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            text = text.substring(jsonStart, jsonEnd + 1);
        }

        const adjustment = JSON.parse(text);
        res.json(adjustment);

    } catch (error) {
        console.error("AI Adjustment Error:", error);
        res.status(500).json({ error: 'Failed to adjust plan.' });
    }
});

module.exports = router;
