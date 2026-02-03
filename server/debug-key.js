const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

async function debug() {
    const key = process.env.GEMINI_API_KEY;
    console.log(`Debug starting...`);

    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

        const response = await fetch(url);
        const data = await response.json();

        fs.writeFileSync('models.json', JSON.stringify(data, null, 2));
        console.log("Written to models.json");

    } catch (e) {
        fs.writeFileSync('models.json', JSON.stringify({ error: e.message }, null, 2));
    }
}

debug();
