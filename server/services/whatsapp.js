const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

// Store number WITHOUT `whatsapp:` in .env
const FROM_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER || '+14155238886';

let client = null;

if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
} else {
    console.warn('⚠️ Twilio credentials missing. WhatsApp service running in mock mode.');
}

/**
 * Normalize phone numbers for WhatsApp
 * Ensures exactly one `whatsapp:` prefix
 */
const normalizeWhatsAppNumber = (number) => {
    if (!number) throw new Error('Phone number is required');
    return `whatsapp:${number.replace(/^whatsapp:/i, '').trim()}`;
};

/**
 * Send a WhatsApp message
 * @param {string} to - Recipient number (with or without whatsapp:)
 * @param {string} body - Message text
 */
const sendWhatsAppMessage = async (to, body) => {
    if (!client) {
        console.log(`[MOCK WHATSAPP] To: ${to} | Body: ${body}`);
        return;
    }

    const formattedFrom = normalizeWhatsAppNumber(FROM_NUMBER);
    const formattedTo = normalizeWhatsAppNumber(to);

    console.log('📤 Sending WhatsApp message:', {
        from: formattedFrom,
        to: formattedTo
    });

    try {
        const message = await client.messages.create({
            body,
            from: formattedFrom,
            to: formattedTo
        });

        console.log('✅ WhatsApp Sent. SID:', message.sid);
        return message;
    } catch (error) {
        console.error('❌ WhatsApp Error:', error.code, error.message);
        throw error;
    }
};

module.exports = { sendWhatsAppMessage };
