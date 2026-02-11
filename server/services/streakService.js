const Habit = require('../models/Habit');

/**
 * Checks and resets streaks for a user's habits based on their frequency.
 * @param {string} userId - The ID of the user to check habits for.
 */
const checkAndResetHabitStreaks = async (userId) => {
    try {
        const habits = await Habit.find({
            user: userId,
            $or: [{ isArchived: false }, { isArchived: { $exists: false } }],
            isPaused: false // Don't reset paused habits
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        for (const habit of habits) {
            // If never completed, streak should be 0 (default), but just in case
            if (!habit.history || habit.history.length === 0) {
                if (habit.streak !== 0) {
                    habit.streak = 0;
                    await habit.save();
                }
                continue;
            }

            // Find the last completion date
            // Sort history by date descending to find the latest entry
            // Note: History creates new entries, so last item isn't guaranteed to be latest date if not sorted, 
            // but typical usage pushes. Let's start safely by finding the max date.
            const sortedHistory = habit.history.sort((a, b) => new Date(b.date) - new Date(a.date));
            const lastEntry = sortedHistory[0];

            if (!lastEntry) continue;

            const lastCompletedDate = new Date(lastEntry.date);
            lastCompletedDate.setHours(0, 0, 0, 0);

            // If completed today, streak is safe
            if (lastCompletedDate.getTime() === today.getTime()) {
                continue;
            }

            // Logic differs by frequency
            let shouldReset = false;

            if (habit.frequency === 'daily') {
                // If last completion was BEFORE yesterday, reset.
                // i.e., missed yesterday.
                if (lastCompletedDate.getTime() < yesterday.getTime()) {
                    shouldReset = true;
                }
            } else if (habit.frequency === 'custom' && habit.frequencyDays && habit.frequencyDays.length > 0) {
                // Check if any scheduled days were missed between lastCompletedDate and today.
                // We start checking from the day AFTER lastCompletedDate up to YESTERDAY (inclusive).
                // If today is a scheduled day, it doesn't matter yet (user still has time).

                const checkDate = new Date(lastCompletedDate);
                checkDate.setDate(checkDate.getDate() + 1); // Start checking from next day

                while (checkDate.getTime() < today.getTime()) {
                    const dayName = checkDate.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue, etc.

                    // If this day was a scheduled day, and we are here (meaning no completion on this day),
                    // then we missed it.
                    if (habit.frequencyDays.includes(dayName)) {
                        shouldReset = true;
                        break;
                    }

                    checkDate.setDate(checkDate.getDate() + 1);
                }
            }
            // Weekly/Monthly logic can be added here. For now, we only handle strictly defined frequencies.

            if (shouldReset) {
                console.log(`Resetting streak for habit: ${habit.title} (Last completed: ${lastCompletedDate.toISOString()})`);
                habit.streak = 0;
                await habit.save();
            }
        }
    } catch (error) {
        console.error(`Error resetting streaks for user ${userId}:`, error);
    }
};

module.exports = { checkAndResetHabitStreaks };
