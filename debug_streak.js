
const mongoose = require('mongoose');
const User = require('./server/models/User');
const Task = require('./server/models/Task');
const Habit = require('./server/models/Habit');
require('dotenv').config({ path: './server/.env' });

async function debugStreak() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        // Find a user with a streak
        const user = await User.findOne({ streak: { $gt: 0 } });
        if (!user) {
            console.log("No user with active streak found. Checking ANY user.");
            const anyUser = await User.findOne();
            if (!anyUser) {
                console.log("No users found.");
                return;
            }
            // Use this user
            console.log(`Checking user: ${anyUser.name} (${anyUser._id}) who has streak: ${anyUser.streak}`);
            await analyzeUser(anyUser);
        } else {
            console.log(`Checking user: ${user.name} (${user._id}) with streak: ${user.streak}`);
            await analyzeUser(user);
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

async function analyzeUser(user) {
    const userId = user._id;

    // 1. Fetch Tasks
    const allTasks = await Task.find({ user: userId, isCompleted: true }).select('date title');
    // 2. Fetch Habits
    const allHabits = await Habit.find({ user: userId, isArchived: false }).select('history title');

    console.log("\n--- RAW DATA INSPECTION ---");

    const activityByDate = {};

    console.log("\n[TASKS]");
    allTasks.forEach(t => {
        const utc = t.date.toISOString();
        const localDate = t.date.toLocaleDateString('en-CA');
        console.log(`Task: "${t.title}" | UTC: ${utc} | LocalKey: ${localDate}`);
        activityByDate[localDate] = true;
    });

    console.log("\n[HABITS]");
    allHabits.forEach(h => {
        if (h.history && h.history.length > 0) {
            h.history.forEach(entry => {
                if (entry.status === 'completed' || entry.status === 'partial') {
                    const utc = entry.date.toISOString();
                    const localDate = new Date(entry.date).toLocaleDateString('en-CA');
                    console.log(`Habit: "${h.title}" | UTC: ${utc} | LocalKey: ${localDate} | Status: ${entry.status}`);
                    activityByDate[localDate] = true;
                }
            });
        }
    });

    console.log("\n--- STREAK CALCULATION DEBUG ---");
    const today = new Date(); // NOW

    // Force specific date if needed for repro? No, let's look at NOW.
    console.log(`Analyze executed at (Local): ${today.toString()}`);

    let streak = 0;
    for (let i = 0; i < 10; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - i);
        const key = d.toLocaleDateString('en-CA');

        const active = activityByDate[key];
        console.log(`Day -${i} (${key}): Active? ${active ? 'YES' : 'NO'}`);

        if (i === 0 && !active) {
            console.log("  (Skipping Today as allowed gap)");
            continue;
        }

        if (active) {
            streak++;
        } else {
            console.log(`  Streak BROKEN at Day -${i}`);
            break;
        }
    }
    console.log(`Calculated Streak: ${streak}`);
    console.log(`User Stored Streak: ${user.streak}`);
}

debugStreak();
