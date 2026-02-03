require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    try {
        console.log("Checking gemini-1.5-flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await model.generateContent("hello");
        console.log("SUCCESS: gemini-1.5-flash");
    } catch (e) {
        console.log("ERROR gemini-1.5-flash: " + e.message);
    }

    try {
        console.log("Checking gemini-pro...");
        const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
        await model2.generateContent("hello");
        console.log("SUCCESS: gemini-pro");
    } catch (e) {
        console.log("ERROR gemini-pro: " + e.message);
    }
}

listModels();
