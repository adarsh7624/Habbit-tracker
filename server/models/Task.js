const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    category: {
        type: String,
        default: 'General'
    },
    duration: {
        type: String
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        default: 'medium'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', TaskSchema);
