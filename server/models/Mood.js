const mongoose = require('mongoose');

const MoodSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    rating: {
        type: Number, // 1-5 or 1-10
        required: true,
    },
    energy: {
        type: Number, // 1-10
    },
    note: {
        type: String,
    },
    tags: [String], // e.g., 'tired', 'happy', 'stressed'
}, {
    timestamps: true,
});

// Ensure only one mood entry per user per day
MoodSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Mood', MoodSchema);
