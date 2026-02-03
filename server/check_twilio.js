require('dotenv').config();
const { sendWhatsAppMessage } = require('./services/whatsapp');
const User = require('./models/User');
const mongoose = require('mongoose');

console.log("Checking Twilio Configuration...");

if (!process.env.TWILIO_ACCOUNT_SID) console.error("❌ TWILIO_ACCOUNT_SID is missing");
else console.log("✅ TWILIO_ACCOUNT_SID is present");

if (!process.env.TWILIO_AUTH_TOKEN) console.error("❌ TWILIO_AUTH_TOKEN is missing");
else console.log("✅ TWILIO_AUTH_TOKEN is present");

if (!process.env.TWILIO_WHATSAPP_NUMBER) console.warn("⚠️ TWILIO_WHATSAPP_NUMBER is missing (using default)");
else console.log("✅ TWILIO_WHATSAPP_NUMBER is present");

console.log("Connecting to DB to check for users with phones...");
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const users = await User.find({ phoneNumber: { $ne: '' } });
    console.log(`✅ Found ${users.length} users with phone numbers.`);

    for (const user of users) {
        console.log(`User: ${user.name} | Phone: ${user.phoneNumber} | SilentMode: ${user.silentMode} | IsPaused: ${user.isPaused}`);
        try {
            // Attempt a neutral test message
            await sendWhatsAppMessage(user.phoneNumber, "🔧 This is a diagnostic test message from HabitFlow.");
            console.log(`✅ Test message sent to ${user.name}`);
        } catch (e) {
            console.error(`❌ Failed to send to ${user.name}:`, e.message);
        }
    }
    process.exit(0);
}).catch(err => {
    console.error("❌ DB Connection Failed:", err.message);
    process.exit(1);
});
