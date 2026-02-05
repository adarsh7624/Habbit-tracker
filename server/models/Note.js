const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // Format: YYYY-MM-DD
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    entries: [{
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Ensure one note per user per day
noteSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Note', noteSchema);
