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
    const userCount = await User.countDocuments({ phoneNumber: { $ne: '' } });
    console.log(`✅ Found ${userCount} users with phone numbers.`);
    process.exit(0);
}).catch(err => {
    console.error("❌ DB Connection Failed:", err.message);
    process.exit(1);
});
