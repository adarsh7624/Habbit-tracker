const { GoogleGenerativeAI } = require('@google/generative-ai');

// Priority list of models to try
// We start with the newest/lightest models which typically have separate quotas or differ in availability.
const MODEL_PRIORITY = [
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.0-flash-lite-001",
    "gemini-2.0-flash",
    "gemini-flash-latest"
];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates content using the first available model from the priority list.
 * Automatically fails over to the next model on 404 (Not Found) or 429 (Rate Limit).
 */
async function generateContentWithFallback(prompt, res) {
    let lastError = null;

    for (const modelName of MODEL_PRIORITY) {
        try {
            console.log(`Trying model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            // We can't really "ping" the model without generating, so we just attempt to generate.
            // For the chat interface, this function handles "text generation", but we might need a separate one for chat.
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();

        } catch (error) {
            console.warn(`Model ${modelName} failed: ${error.message}`);
            lastError = error;

            // If it's a safety block or invalid prompt, don't retry other models, it won't help.
            if (error.message.includes("SAFETY") || error.message.includes("blocked")) {
                break;
            }
            // Continue loop for 404, 429, 503, etc.
        }
    }

    throw lastError || new Error("All models failed");
}

/**
 * Handles Chat interactions with fallback.
 * Since 'startChat' is synchronous, we need to wrap the *sendMessage* call in the fallback logic.
 */
async function sendChatMessageWithFallback(history, message) {
    let lastError = null;

    for (const modelName of MODEL_PRIORITY) {
        try {
            console.log(`Attempting Chat with model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const chat = model.startChat({
                history: history || [],
                generationConfig: {
                    maxOutputTokens: 200,
                },
            });

            const result = await chat.sendMessage(message);
            const response = await result.response;
            return response.text();

        } catch (error) {
            console.warn(`Chat Model ${modelName} failed: ${error.message}`);
            lastError = error;

            if (error.message.includes("SAFETY") || error.message.includes("blocked")) {
                break;
            }
        }
    }
    throw lastError || new Error("All chat models failed");
}


module.exports = {
    generateContentWithFallback,
    sendChatMessageWithFallback
};
