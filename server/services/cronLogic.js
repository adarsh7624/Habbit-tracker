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
        return true;
    }).map(h => {
        // Find today's entry in history
        const todayEntry = h.history.find(entry => {
            const entryDate = new Date(entry.date).setHours(0, 0, 0, 0);
            return entryDate === todayStr;
        });

        const status = todayEntry ? todayEntry.status : (h.isPaused ? 'paused' : 'missed');

        return {
            _id: h._id, // Keep ID for potential updates
            title: h.title,
            isCompleted: status === 'completed',
            isPartial: status === 'partial',
            isPaused: h.isPaused,
            status: status,
            type: 'habit',
            streak: h.streak
        };
    });

    return todaysHabits;
}

// 1. Morning Briefing Logic
const sendMorningBriefing = async (user) => {
    if (user.isPaused) return { sent: false, reason: 'User is paused' };
    if (user.silentMode) return { sent: false, reason: 'Silent Mode Active' };

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
    if (user.silentMode) return { sent: false, reason: 'Silent Mode Active' };

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
    const partialHabits = habits.filter(h => h.isPartial).length;

    const total = totalTasks + totalHabits;
    const completed = completedTasks + completedHabits;
    // Weighted Consistency Calculation
    // Habits: 60%
    // Tasks: 40% (if present), otherwise Habits are 100%

    let consistencyScore = 0;

    if (totalTasks > 0) {
        const habitScore = totalHabits > 0 ? (completedHabits / totalHabits) : 0;
        const taskScore = completedTasks / totalTasks;
        consistencyScore = (habitScore * 0.6) + (taskScore * 0.4);
    } else {
        // No tasks today, consistency matches habit completion
        consistencyScore = totalHabits > 0 ? (completedHabits / totalHabits) : 0;
    }

    // Scale to 0-100
    const percent = Math.round(consistencyScore * 100);

    // --- PHASE 15: CONSISTENCY ENGINE (UPDATED) ---
    let savedByInsurance = false;
    let earnedToken = false;

    // 0. RESET INDIVIDUAL HABIT STREAKS
    // We need to fetch raw habits to save them, as 'habits' here is a mapped object
    for (const h of habits) {
        if (h.status === 'missed' && !h.isPaused) {
            // Reset this habit's streak
            await Habit.findByIdAndUpdate(h._id, { streak: 0 });
        }
    }

    // 1. Check for Global Streak Success (Any Activity Rule)
    const anyActivity = (completedTasks > 0) || (completedHabits > 0) || (partialHabits > 0);

    if (!anyActivity) {
        // User failed to do ANYTHING. Check insurance.
        if (user.insuranceTokens > 0) {
            user.insuranceTokens -= 1;
            savedByInsurance = true;
            // Streak preserved
        } else {
            user.streak = 0; // Streak broken
        }
    } else {
        // 2. Success! Increment Streak
        user.streak += 1;

        // 3. Check for Token Reward (Every 7 days)
        if (user.streak % 7 === 0) {
            user.insuranceTokens += 1;
            earnedToken = true;
        }
    }

    // 4. Update Momentum & Consistency
    user.momentumScore = Math.floor((user.streak * 10) + (user.points / 100));
    user.consistencyScore = percent; // Save the daily calculated score
    user.lastActiveDate = new Date(); // Using today's cron run time

    await user.save();
    // -------------------------------------

    // SILENT MODE check
    if (user.silentMode) {
        return { sent: false, reason: 'Silent Mode Active' };
    }

    let verdict = "";
    let msg = "";

    if (user.personality === 'calm') {
        if (percent === 100) verdict = "Perfect harmony. 🌿";
        else if (savedByInsurance) verdict = "Streak saved by insurance. Breathe. 🛡️";
        else if (percent >= 50) verdict = "Good effort today.";
        else verdict = "Tomorrow is a new beginning.";

        msg = `📉 *Daily Reflection (${dateStr})*\n\nHabits: ${completedHabits}/${totalHabits}\nTasks: ${completedTasks}/${totalTasks}\nScore: ${percent}%\n\n${verdict}\n${earnedToken ? '🌟 New Consistency Token Earned!' : ''}\nSleep peacefully. 💤`;
    } else if (user.personality === 'aggressive') {
        if (percent === 100) verdict = "CHAMPION. 🏆";
        else if (savedByInsurance) verdict = "WEAKNESS DETECTED. Token burned. 🛡️";
        else if (percent >= 80) verdict = "Acceptable. Push harder.";
        else verdict = "WEAKNESS DETECTED. DO BETTER. 🛑";

        msg = `💀 *REPORT CARD (${dateStr})*\n\nScore: ${percent}%\nActions: ${completed}/${total}\n\n${verdict}\n${earnedToken ? '🔥 TOKEN EARNED.' : ''}\n\nReset. Tomorrow we dominate.`;
    } else {
        if (percent === 100) verdict = "🏆 Perfect Score!";
        else if (savedByInsurance) verdict = "🛡️ Streak saved with Insurance!";
        else if (percent >= 80) verdict = "🌟 Great Job!";
        else if (percent >= 50) verdict = "👍 Good Effort.";
        else verdict = "📉 Need more focus tomorrow.";

        msg = `📊 *Daily Report (${dateStr})*\n\n✅ Habits: ${completedHabits}/${totalHabits}\n✅ Tasks: ${completedTasks}/${totalTasks}\n📈 Total Score: ${percent}%\n\n${verdict}\n${earnedToken ? '💎 Consistency Token Earned!' : ''}\n\nSleep well and reset for tomorrow! 💤`;
    }

    await sendWhatsAppMessage(user.phoneNumber, msg);
    return { sent: true, msg };
};

module.exports = { sendMorningBriefing, sendEveningNudge, sendDailyReport };
