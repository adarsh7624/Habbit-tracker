const cron = require('node-cron');
const User = require('./models/User');
const { sendWhatsAppMessage } = require('./services/whatsapp'); // Keeping for Auto-Resume
const { sendMorningBriefing, sendEveningNudge, sendDailyReport } = require('./services/cronLogic');

const initScheduler = () => {
    console.log("📅 Scheduler Initialized...");

    // 1. Morning Briefing: 8:00 AM
    cron.schedule('0 8 * * *', async () => {
        console.log("🌅 Running Morning Briefing...");
        const users = await User.find({ phoneNumber: { $ne: '' } });
        for (const user of users) {
            try { await sendMorningBriefing(user); } catch (e) { console.error(`Failed Morning Briefing for ${user.name}:`, e.message); }
        }
    }, { scheduled: true, timezone: "Asia/Kolkata" });

    // 2. Evening Nudge: 8:00 PM
    cron.schedule('0 20 * * *', async () => {
        console.log("🌇 Running Evening Nudge...");
        const users = await User.find({ phoneNumber: { $ne: '' } });
        for (const user of users) {
            try { await sendEveningNudge(user); } catch (e) { console.error(`Failed Evening Nudge for ${user.name}:`, e.message); }
        }
    }, { scheduled: true, timezone: "Asia/Kolkata" });

    // 3. End of Day Report: 11:59 PM
    cron.schedule('59 23 * * *', async () => {
        console.log("🌙 Running Daily Report...");
        const users = await User.find({ phoneNumber: { $ne: '' } });
        for (const user of users) {
            try { await sendDailyReport(user); } catch (e) { console.error(`Failed Daily Report for ${user.name}:`, e.message); }
        }
    }, { scheduled: true, timezone: "Asia/Kolkata" });

    // 4. Auto-Resume "Pause Life" - Checks every midnight
    cron.schedule('0 0 * * *', async () => {
        console.log('Running Auto-Resume Check...');
        try {
            const users = await User.find({ isPaused: true, pausedUntil: { $lte: new Date() } });
            for (const user of users) {
                user.isPaused = false;
                user.pausedUntil = undefined;
                await user.save();
                console.log(`Auto-resumed user: ${user.name}`);

                if (user.phoneNumber) {
                    await sendWhatsAppMessage(user.phoneNumber, `🎉 *Welcome Back, ${user.name}!* \n\nYour vacation mode has ended. We are ready to resume your tracking. Let's go! 🚀`);
                }
            }
        } catch (error) {
            console.error('Error in Auto-Resume:', error);
        }
    }, { scheduled: true, timezone: "Asia/Kolkata" });
};

module.exports = initScheduler;
