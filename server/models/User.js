const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    points: {
        type: Number,
        default: 0,
    },
    level: {
        type: Number,
        default: 1,
    },
    streak: {
        type: Number,
        default: 0,
    },
    maxStreak: {
        type: Number,
        default: 0,
    },
    rank: {
        type: String,
        enum: ['Beginner', 'Improver', 'Disciplined', 'Elite', 'Legendary', 'Master'],
        default: 'Beginner',
    },
    maxRank: {
        type: String,
        default: 'Beginner',
    },
    personality: {
        type: String,
        enum: ['calm', 'aggressive', 'balanced'],
        default: 'balanced'
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    isPaused: {
        type: Boolean,
        default: false
    },
    pausedUntil: {
        type: Date
    },
    // Phase 14: Core Intelligence Fields
    insuranceTokens: {
        type: Number,
        default: 0
    },
    momentumScore: {
        type: Number,
        default: 0
    },
    habitDNA: {
        type: Object, // Stores analysis like { bestTime: '08:00', recoverySpeed: 2, etc. }
        default: {}
    },
    silentMode: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
// Encrypt password using bcrypt
UserSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
