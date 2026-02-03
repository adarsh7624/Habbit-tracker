export interface DailyTask {
    day: string;
    task: string;
    duration: string;
    type: 'learning' | 'body';
    difficulty: 'easy' | 'medium' | 'hard';
}

export interface WeeklyPlan {
    week: number;
    goal: string;
    days: DailyTask[];
}

export interface MonthlyPlan {
    month: number;
    focus: string;
    weeks: WeeklyPlan[];
}

export interface ExpertPlan {
    overview: string;
    monthly_plan: MonthlyPlan[];
}

export type GeneratedHabit = {
    title: string;
    category: string;
    frequency: 'daily' | 'weekly';
    reminderTime: string;
};

// Helper to generate day tasks
const generateWeekTasks = (weekNum: number, topic: string, type: 'learning' | 'body'): DailyTask[] => {
    const days: DailyTask[] = [];
    for (let i = 1; i <= 5; i++) { // 5 days a week
        days.push({
            day: `Day ${i}`,
            task: `${topic} - Part ${i}`,
            duration: type === 'learning' ? '45 min' : '30 min',
            type: type,
            difficulty: weekNum % 4 === 0 ? 'hard' : (weekNum % 2 === 0 ? 'medium' : 'easy')
        });
    }
    // Rest day
    days.push({
        day: 'Rest & Review',
        task: 'Review notes / Light stretching',
        duration: '15 min',
        type: type,
        difficulty: 'easy'
    });
    return days;
};

export const generateExpertPlan = (goal: string, type: 'learning' | 'body' = 'learning'): ExpertPlan => {
    const normalizedGoal = goal.toLowerCase();

    // DSA Plan
    if (normalizedGoal.includes('dsa') || normalizedGoal.includes('algo') || normalizedGoal.includes('code')) {
        return {
            overview: "A comprehensive 1-month roadmap to master Data Structures & Algorithms. tailored for interview preparation.",
            monthly_plan: [
                {
                    month: 1,
                    focus: "Foundations & Core Structures",
                    weeks: [
                        { week: 1, goal: "Arrays & Strings Mastery", days: generateWeekTasks(1, "Arrays & Strings", "learning") },
                        { week: 2, goal: "Linked Lists & Pointers", days: generateWeekTasks(2, "Linked Lists", "learning") },
                        { week: 3, goal: "Stacks, Queues & Recursion", days: generateWeekTasks(3, "Stacks & Queues", "learning") },
                        { week: 4, goal: "Sorting & Searching", days: generateWeekTasks(4, "Algorithms", "learning") }
                    ]
                }
            ]
        };
    }

    // Fitness Plan
    if (normalizedGoal.includes('fit') || normalizedGoal.includes('lose') || normalizedGoal.includes('muscle')) {
        return {
            overview: "A balanced 1-month fitness program focusing on strength, cardio, and sustainable habit formation.",
            monthly_plan: [
                {
                    month: 1,
                    focus: "Conditioning & Strength Base",
                    weeks: [
                        { week: 1, goal: "Adaptation Phase", days: generateWeekTasks(1, "Full Body Circuit", "body") },
                        { week: 2, goal: "Strength Building", days: generateWeekTasks(2, "Compound Lifts", "body") },
                        { week: 3, goal: "Endurance Push", days: generateWeekTasks(3, "HIIT & Cardio", "body") },
                        { week: 4, goal: "Deload & Mobility", days: generateWeekTasks(4, "Active Recovery", "body") }
                    ]
                }
            ]
        };
    }

    // Default Plan
    return {
        overview: "A structured approach to achieving your personal goal with steady progress.",
        monthly_plan: [
            {
                month: 1,
                focus: "Building the Habit",
                weeks: [
                    { week: 1, goal: "Starting Strong", days: generateWeekTasks(1, "Core Basics", type) },
                    { week: 2, goal: "Consistency", days: generateWeekTasks(2, "Deep Dive", type) },
                    { week: 3, goal: "Challenge Week", days: generateWeekTasks(3, "Advanced Topics", type) },
                    { week: 4, goal: "Consolidation", days: generateWeekTasks(4, "Review & Practice", type) }
                ]
            }
        ]
    };
};

// Legacy support (optional, can be removed if specific types not needed)
export const generatePlan = (goal: string) => {
    // This is just a wrapper or placeholder if needed,
    // but the UI will switch to generateExpertPlan
    return { habits: [], tasks: [] };
};
