const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');

// @route   GET /api/notes/:date
// @desc    Get note for a specific date
// @access  Private
router.get('/:date', auth, async (req, res) => {
    try {
        const note = await Note.findOne({
            userId: req.user.id,
            date: req.params.date
        });

        if (!note) {
            return res.json({ content: '' }); // Return empty if no note exists
        }
        res.json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/notes
// @desc    Create or Update note for a specific date
// @access  Private
router.post('/', auth, async (req, res) => {
    const { date, content } = req.body;

    try {
        // Check if note exists for this date
        let note = await Note.findOne({ userId: req.user.id, date });

        if (note) {
            // Add new entry to existing note document
            note.entries.push({ content, timestamp: new Date() });
            // Also update legacy content for backward compat if needed (showing latest)
            note.content = content;
            await note.save();
        } else {
            // Create new note document
            note = new Note({
                userId: req.user.id,
                date,
                content, // Legacy field
                entries: [{ content, timestamp: new Date() }]
            });
            await note.save();
        }

        res.json(note);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
