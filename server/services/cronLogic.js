const Task = require('../models/Task');
const Habit = require('../models/Habit');
const { sendWhatsAppMessage } = require('./whatsapp');

// Helper: Get tasks for "Today"
async function getDailyTasks(userId) {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const endOfDay = new Date(now.setHours(23, 59, 59, 999));
    const dateStr = startOfDay.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

    const tasks = await Task.find({
        user: userId,
        date: { $gte: startOfDay, $lte: endOfDay }
    });
    return { tasks, dateStr };
}

// Helper: Get Habits for "Today"
async function getDailyHabits(userId) {
    const habits = await Habit.find({ user: userId, isArchived: false });
    const now = new Date();
    const todayStr = now.setHours(0, 0, 0, 0); // Timestamp of midnight

    // Filter relevant habits & check completion
    const todaysHabits = habits.filter(h => {
        if (h.endDate && new Date(h.endDate) < now) return false; // Expired
        return true; // Assume daily for now, can add frequency check later
    }).map(h => {
        const isCompleted = h.history.some(entry => {
            const entryDate = new Date(entry.date).setHours(0, 0, 0, 0);
            return entryDate === todayStr && entry.status === 'completed';
        });
        return {
            title: h.title,
            isCompleted,
            type: 'habit'
        };
    });

    return todaysHabits;
}

// 1. Morning Briefing Logic
const sendMorningBriefing = async (user) => {
    if (user.isPaused) return { sent: false, reason: 'User is paused' };

    const { tasks, dateStr } = await getDailyTasks(user._id);
    const habits = await getDailyHabits(user._id);

    const allItems = [
        ...habits.map(h => `🔄 ${h.title}`),
        ...tasks.map(t => `📝 ${t.title} (${t.duration || '30m'})`)
    ];

    if (allItems.length === 0) return { sent: false, reason: 'No tasks or habits for today' };

    const taskList = allItems.map((t, i) => `${i + 1}. ${t}`).join('\n');

    let msg = "";
    if (user.personality === 'calm') {
        msg = `🌿 *Good Morning, ${user.name}.*\n\nA gentle start to your day (${dateStr}). Here are your intentions:\n\n${taskList}\n\nTake it one step at a time. Have a peaceful day. 🌸`;
    } else if (user.personality === 'aggressive') {
        msg = `⚡ *WAKE UP, ${user.name}!* 🛑\n\nNo excuses today (${dateStr}). Here is your mission:\n\n${taskList}\n\nCrush them all. Do not fail. 🔥`;
    } else {
        msg = `🌅 *Good Morning, ${user.name}!*\n📅 Date: ${dateStr}\n\nHere is your plan for today:\n\n${taskList}\n\nLet's get started! 🚀`;
    }

    await sendWhatsAppMessage(user.phoneNumber, msg);
    return { sent: true, msg };
};

// 2. Evening Nudge Logic
const sendEveningNudge = async (user) => {
    if (user.isPaused) return { sent: false, reason: 'User is paused' };

    const { tasks } = await getDailyTasks(user._id);
    const habits = await getDailyHabits(user._id);

    const remainingTasks = tasks.filter(t => !t.isCompleted);
    const remainingHabits = habits.filter(h => !h.isCompleted);

    const remainingCount = remainingTasks.length + remainingHabits.length;

    if (remainingCount === 0) {
        const doneMsg = user.personality === 'aggressive' ? "Mission Accomplished. Rest up for tomorrow. 👊" : "You did it! Relax and recharge. 🌙";
        await sendWhatsAppMessage(user.phoneNumber, doneMsg);
        return { sent: true, msg: doneMsg };
    } else {
        const list = [
            ...remainingHabits.map(h => `• 🔄 ${h.title}`),
            ...remainingTasks.map(t => `• 📝 ${t.title}`)
        ].join('\n');

        let msg = "";
        if (user.personality === 'calm') {
            msg = `🌘 *Gentle Reminder, ${user.name}.*\n\nThe day is winding down. You have ${remainingCount} items left:\n\n${list}\n\nDo what you can, but prioritize your rest. 🌌`;
        } else if (user.personality === 'aggressive') {
            msg = `🛑 *WHY IS THIS NOT DONE?!*\n\nYou have ${remainingCount} items incomplete:\n\n${list}\n\nNO SLEEP until these are done. GET TO WORK. 💀`;
        } else {
            msg = `👀 *Hurry up!* The day is ending.\n\nYou still have ${remainingCount} items matching your goals:\n\n${list}\n\nPush through! You got this. 💪`;
        }
        await sendWhatsAppMessage(user.phoneNumber, msg);
        return { sent: true, msg };
    }
};

// 3. Daily Report Logic
const sendDailyReport = async (user) => {
    if (user.isPaused) return { sent: false, reason: 'User is paused' };

    const { tasks, dateStr } = await getDailyTasks(user._id);
    const habits = await getDailyHabits(user._id);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.isCompleted).length;

    const totalHabits = habits.length;
    const completedHabits = habits.filter(h => h.isCompleted).length;

    const total = totalTasks + totalHabits;
    const completed = completedTasks + completedHabits;

    if (total === 0) return { sent: false, reason: 'No tasks or habits for today' };

    const percent = Math.round((completed / total) * 100);

    let verdict = "";
    let msg = "";

    if (user.personality === 'calm') {
        if (percent === 100) verdict = "Perfect harmony. 🌿";
        else if (percent >= 50) verdict = "Good effort today.";
        else verdict = "Tomorrow is a new beginning.";

        msg = `📉 *Daily Reflection (${dateStr})*\n\nHabits: ${completedHabits}/${totalHabits}\nTasks: ${completedTasks}/${totalTasks}\nScore: ${percent}%\n\n${verdict}\n\nSleep peacefully. 💤`;
    } else if (user.personality === 'aggressive') {
        if (percent === 100) verdict = "CHAMPION. 🏆";
        else if (percent >= 80) verdict = "Acceptable. Push harder.";
        else verdict = "WEAKNESS DETECTED. DO BETTER. 🛑";

        msg = `💀 *REPORT CARD (${dateStr})*\n\nScore: ${percent}%\nActions: ${completed}/${total}\n\n${verdict}\n\nReset. Tomorrow we dominate.`;
    } else {
        if (percent === 100) verdict = "🏆 Perfect Score!";
        else if (percent >= 80) verdict = "🌟 Great Job!";
        else if (percent >= 50) verdict = "👍 Good Effort.";
        else verdict = "📉 Need more focus tomorrow.";

        msg = `📊 *Daily Report (${dateStr})*\n\n✅ Habits: ${completedHabits}/${totalHabits}\n✅ Tasks: ${completedTasks}/${totalTasks}\n📈 Total Score: ${percent}%\n\n${verdict}\n\nSleep well and reset for tomorrow! 💤`;
    }

    await sendWhatsAppMessage(user.phoneNumber, msg);
    return { sent: true, msg };
};

module.exports = { sendMorningBriefing, sendEveningNudge, sendDailyReport };
