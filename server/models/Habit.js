const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        default: 'General',
    },
    frequency: {
        type: String, // 'daily', 'weekly', 'custom'
        default: 'daily',
    },
    frequencyDays: {
        type: [String], // ['Mon', 'Wed', 'Fri'] for custom
        default: [],
    },
    startDate: {
        type: Date,
        default: Date.now,
    },
    endDate: {
        type: Date,
    },
    reminderTime: {
        type: String, // '09:00'
    },
    streak: {
        type: Number,
        default: 0,
    },
    bestStreak: {
        type: Number,
        default: 0,
    },
    history: [{
        date: {
            type: Date,
            required: true
        },
        status: {
            type: String,
            enum: ['completed', 'skipped', 'missed'],
            default: 'completed'
        }
    }],
    isArchived: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Habit', HabitSchema);
