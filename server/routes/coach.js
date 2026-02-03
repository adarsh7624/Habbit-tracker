const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const jwt = require('jsonwebtoken');
const { sendChatMessageWithFallback } = require('../lib/gemini');

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

router.post('/chat', protect, async (req, res) => {
    const { message, history } = req.body;

    try {
        // 1. Fetch User Context (Tasks & Habits)
        // We'll fetch today's tasks and some recent stats to give the AI context.
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tasks = await Task.find({
            user: req.user.id,
            date: { $gte: today }
        }).limit(10);

        // Calculate a simple completion rate for context
        const completedTasks = tasks.filter(t => t.isCompleted).length;
        const totalTasks = tasks.length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        // 2. Construct System Prompt with Context
        const contextPrompt = `
        You are an elite AI Habit Coach. You are talking to a user who has:
        - ${totalTasks} tasks scheduled for today.
        - Completed ${completedTasks} so far (${completionRate}%).
        - Current Tasks: ${tasks.map(t => `${t.title} (${t.isCompleted ? 'Done' : 'Pending'})`).join(', ')}.

        Goal: Motivate them, help them replan if they are behind, and answer questions about productivity.
        Keep responses concise, encouraging, and actionable.
        If they ask to reschedule, suggest specific times based on a 9am-5pm schedule.
        `;

        // Combine context and user message for the input
        // Note: For ChatSession in SDK, we usually prepend system instruction or just send it as first message.
        // Our helper wrapper handles 'history' but we need to inject context.
        // A simple way is to pretend the context is a hidden system message or just part of the prompt.
        // Since the user sends 'history' from client, let's prepend context if history is empty, 
        // OR just append context to the current message (easiest for stateless-ish feel).

        const fullMessage = `${contextPrompt}\n\nUser: ${message}`;

        const reply = await sendChatMessageWithFallback(history, fullMessage);

        res.json({ reply });

    } catch (error) {
        console.error("AI Coach Error:", error);
        res.status(500).json({ error: 'Failed to chat with Coach. Models may be busy.' });
    }
});

module.exports = router;
