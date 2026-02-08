'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Plus, Check, Trash2, Flame, Trophy, ActivitySquare, LayoutGrid, Sparkles, Clock, Pencil, X } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import CalendarView from '@/components/CalendarView';
import WeekView from '@/components/WeekView';
import TaskTimeline from '@/components/TaskTimeline';
import FutureYouSimulator from '@/components/FutureYouSimulator';
import { getDailyQuote } from '@/lib/quotes';

type Habit = {
    _id: string;
    title: string;
    category: string;
    frequency: string;
    // Streak logic needs history
    streak: number;
    history: { date: string; status: string }[];
    frequencyDays?: string[]; // Optional for backward compatibility
    startDate?: string;
    endDate?: string;
    isPaused: boolean;
};

type Task = {
    _id: string;
    title: string;
    duration: string;
    difficulty: string;
    isCompleted: boolean;
    isPaused: boolean;
    category: string;
    date: string;
};

export default function Dashboard() {
    const [habits, setHabits] = useState<Habit[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [newHabit, setNewHabit] = useState('');
    const [newHabitDuration, setNewHabitDuration] = useState('infinity'); // 'infinity', '30d', '90d', '180d'
    const [editHabit, setEditHabit] = useState<Habit | null>(null);
    const [category, setCategory] = useState('Health');
    const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [creationMode, setCreationMode] = useState<'habit' | 'task'>('habit');
    const [newTaskDetails, setNewTaskDetails] = useState({ title: '', date: '', difficulty: 'medium' });
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [personality, setPersonality] = useState<'calm' | 'balanced' | 'aggressive'>('balanced');
    const [isPaused, setIsPaused] = useState(false);
    const [pausedUntil, setPausedUntil] = useState<string | null>(null);

    // Pause Modal State
    const [showPauseModal, setShowPauseModal] = useState(false);
    const [pauseDuration, setPauseDuration] = useState('7'); // Default 7 days
    const [showSimulator, setShowSimulator] = useState(false);

    const [silentMode, setSilentMode] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [showAllHabits, setShowAllHabits] = useState(false);
    const [frequency, setFrequency] = useState('daily');
    const [frequencyDays, setFrequencyDays] = useState<string[]>([]);
    const [monthlyDay, setMonthlyDay] = useState<string>('1');

    // Task Repetition State
    const [taskRepeat, setTaskRepeat] = useState<'none' | 'weekly' | 'monthly'>('none');
    const [taskRepeatDuration, setTaskRepeatDuration] = useState('1'); // Months

    const [dailyQuote, setDailyQuote] = useState({ text: 'Keep the fire burning!', author: '' });

    useEffect(() => {
        setDailyQuote(getDailyQuote());
    }, []);

    // ... useEffect ...

    const addTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskDetails.title || !newTaskDetails.date) return alert('Please provide a title and date');

        try {
            if (taskRepeat === 'none') {
                // Single Task
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
                    title: newTaskDetails.title,
                    date: newTaskDetails.date,
                    difficulty: newTaskDetails.difficulty,
                    category: category || 'Work',
                    duration: 'Flexible'
                }, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                // Bulk Generation
                const tasksToCreate = [];
                const startDate = new Date(newTaskDetails.date);
                const durationMonths = parseInt(taskRepeatDuration);
                const endDate = new Date(startDate);
                endDate.setMonth(endDate.getMonth() + durationMonths);

                let currentDate = new Date(startDate);

                while (currentDate <= endDate) {
                    tasksToCreate.push({
                        title: newTaskDetails.title,
                        date: currentDate.toISOString().split('T')[0],
                        difficulty: newTaskDetails.difficulty,
                        category: category || 'Work',
                        duration: 'Flexible'
                    });

                    // Advance Date
                    if (taskRepeat === 'weekly') {
                        currentDate.setDate(currentDate.getDate() + 7);
                    } else if (taskRepeat === 'monthly') {
                        currentDate.setMonth(currentDate.getMonth() + 1);
                    }
                }

                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/bulk`,
                    { tasks: tasksToCreate },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            }

            setNewTaskDetails({ ...newTaskDetails, title: '' });
            setTaskRepeat('none'); // Reset
            if (token) fetchData(token);
        } catch (error) {
            console.error(error);
            alert('Failed to create task');
        }
    };


    useEffect(() => {
        // Hydration fix: Set time only on client
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);

        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            router.push('/login');
        } else {
            setToken(storedToken);
            fetchData(storedToken);
        }

        return () => clearInterval(timer);
    }, []);

    const fetchData = async (authToken: string) => {
        try {
            const [habitsRes, statsRes, tasksRes] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/habits`, { headers: { Authorization: `Bearer ${authToken}` } }),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/analytics/dashboard-stats`, { headers: { Authorization: `Bearer ${authToken}` } }),
                axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, { headers: { Authorization: `Bearer ${authToken}` } })
            ]);
            console.log("Fetched Habits:", habitsRes.data);
            setHabits(habitsRes.data);
            setStats(statsRes.data);

            // Assuming the first habit request or a dedicated User endpoint returns profile data, 
            // but currently we rely on local storage or the Initial Auth response. 
            // Actually, let's fetch the User Profile explicitly or rely on what we have.
            // Since we don't have a GET /me endpoint commonly used here, I'll add a quick fetch for user details 
            // OR I will just assume the user updates it via the UI.
            // BETTER: Let's fetch the latest user details.
            const userRes = await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {}, { headers: { Authorization: `Bearer ${authToken}` } });
            setPersonality(userRes.data.personality || 'balanced');
            setIsPaused(userRes.data.isPaused || false);
            setSilentMode(userRes.data.silentMode || false); // <--- Added
            setPausedUntil(userRes.data.pausedUntil || null);

            const today = new Date().toISOString().split('T')[0];
            const todaysTasks = tasksRes.data.filter((t: any) => t.date.startsWith(today));
            setTasks(todaysTasks);

        } catch (error) {
            console.error(error);
        }
    };

    const addHabit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newHabit) return;

        try {
            let endDate = null;
            if (newHabitDuration !== 'infinity') {
                const days = parseInt(newHabitDuration);
                const date = new Date();
                date.setDate(date.getDate() + days);
                endDate = date.toISOString();
            }

            let finalFrequencyDays = frequencyDays;
            if (frequency === 'monthly') {
                finalFrequencyDays = [monthlyDay];
            }

            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/habits`,
                {
                    title: newHabit,
                    category,
                    endDate,
                    frequency,
                    frequencyDays: finalFrequencyDays
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewHabit('');
            setFrequency('daily');
            setFrequencyDays([]);
            if (token) fetchData(token);
        } catch (error) {
            console.error(error);
        }
    };

    const toggleHabit = async (id: string, status: 'completed' | 'partial' = 'completed', progress: number = 100) => {
        try {
            // FIX: Use Local Date String to ensure we mark the correct Calendar Day
            const today = new Date().toLocaleDateString('en-CA');
            await axios.put(
                `${process.env.NEXT_PUBLIC_API_URL}/api/habits/${id}/check`,
                { date: today, status, progress },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (token) fetchData(token);
        } catch (error: any) {
            alert(error.response?.data?.message || 'Error updating habit');
        }
    };

    const toggleTask = async (id: string) => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${id}/check`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (token) fetchData(token);
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to update task. Try refreshing.');
        }
    };

    const toggleTaskPause = async (id: string) => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/${id}/pause`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (token) fetchData(token);
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to pause task.');
        }
    };

    const toggleHabitPause = async (id: string) => {
        try {
            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/habits/${id}/pause`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (token) fetchData(token);
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || 'Failed to pause habit.');
        }
    };

    const deleteHabit = async (id: string) => {
        if (!confirm('Are you sure you want to delete this habit?')) return;
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/api/habits/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (token) fetchData(token);
        } catch (error) {
            console.error(error);
        }
    };

    const getTodayStatus = (history: { date: string; status: string }[]) => {
        if (!history) return null;
        // FIX: Compare using Local Date String to match what we send
        const todayKey = new Date().toLocaleDateString('en-CA');
        const entry = history.find((h) => new Date(h.date).toLocaleDateString('en-CA') === todayKey);
        return entry ? entry.status : null;
    };

    const xpProgress = stats ? (stats.xp % 100) : 0;

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />

            <main className="container mx-auto px-4 py-8">
                {/* Vacation Mode Overlay */}
                {isPaused ? (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8 animate-in fade-in duration-500">
                        <div className="bg-blue-100 p-8 rounded-full shadow-2xl shadow-blue-200">
                            <span className="text-6xl">🏖️</span>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-slate-800 mb-2">Vacation Mode Active</h1>
                            <p className="text-lg text-slate-600 max-w-md mx-auto">
                                Your streaks are frozen. No notifications. Enjoy your time off!
                            </p>
                        </div>

                        {pausedUntil && (
                            <Card className="bg-white/50 backdrop-blur border-none shadow-lg">
                                <CardContent className="p-6">
                                    <div className="text-sm uppercase tracking-wider font-bold text-slate-500 mb-1">
                                        Auto-Resuming In
                                    </div>
                                    <div className="text-3xl font-mono font-bold text-blue-600">
                                        {(() => {
                                            const end = new Date(pausedUntil);
                                            const now = currentTime || new Date();
                                            const diff = end.getTime() - now.getTime();
                                            if (diff <= 0) return "Starting soon...";

                                            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                                            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                            return `${days}d ${hours}h`;
                                        })()}
                                    </div>
                                    <div className="text-xs text-slate-400 mt-2">
                                        Until {new Date(pausedUntil).toLocaleDateString()}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        <Button
                            size="lg"
                            className="bg-slate-900 text-white hover:bg-slate-800 shadow-xl px-8"
                            onClick={() => {
                                setIsPaused(false);
                                setPausedUntil(null);
                                axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, { isPaused: false, pauseDuration: 0 }, {
                                    headers: { Authorization: `Bearer ${token}` }
                                }).catch(console.error);
                            }}
                        >
                            Resume Life Now
                        </Button>

                        <p className="text-xs text-slate-400 mt-8">
                            Note: You cannot edit tasks or habits while paused.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* 1. Gamification Hero Section - Premium Upgrade */}
                        {(() => {
                            // Rank Color Logic
                            const getRankColor = (rank: string) => {
                                switch (rank) {
                                    case 'Master': return 'from-purple-500 to-pink-600';
                                    case 'Legendary': return 'from-amber-500 to-orange-600';
                                    case 'Elite': return 'from-emerald-500 to-teal-600';
                                    case 'Disciplined': return 'from-blue-500 to-indigo-600';
                                    case 'Improver': return 'from-cyan-500 to-blue-500';
                                    default: return 'from-slate-500 to-slate-600'; // Beginner
                                }
                            };
                            const rankColor = getRankColor(stats?.rank || 'Beginner');

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                    <Card className={`md:col-span-2 bg-gradient-to-br ${rankColor} text-white border-none overflow-hidden relative shadow-xl shadow-orange-500/20`}>
                                        {/* Background Pattern */}
                                        <motion.div
                                            animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                                            className="absolute top-0 right-0 p-10 opacity-20"
                                        >
                                            <Trophy size={180} />
                                        </motion.div>
                                        <motion.div
                                            animate={{ y: [0, 10, 0], scale: [1, 1.1, 1] }}
                                            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                                            className="absolute -bottom-10 -left-10 p-10 opacity-10"
                                        >
                                            <Sparkles size={120} />
                                        </motion.div>

                                        <CardContent className="p-8 relative z-10 flex flex-col h-full justify-between">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold px-3 py-1 rounded-full text-xs uppercase tracking-wider shadow-sm">
                                                            Level {stats?.level || 1}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-white/90 text-sm font-medium bg-black/10 px-2 py-1 rounded-lg">
                                                            <Trophy size={12} />
                                                            <span>Rank: {stats?.rank || 'Beginner'}</span>
                                                        </div>
                                                    </div>
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.5 }}
                                                    >
                                                        <h2 className="text-4xl font-black mb-2 tracking-tight drop-shadow-sm">{dailyQuote.text}</h2>
                                                        <p className="text-white/80 text-lg">{dailyQuote.author ? `- ${dailyQuote.author}` : "You are unstoppable. Completing tasks earns you XP."}</p>
                                                    </motion.div>
                                                </div>
                                                <div className="text-right hidden sm:block">
                                                    <div className="text-5xl font-black text-white drop-shadow-md">{stats?.xp || 0}</div>
                                                    <div className="text-xs text-white/70 uppercase tracking-widest font-bold mt-1">Total XP</div>
                                                </div>
                                            </div>

                                            <div className="space-y-3 mt-auto">
                                                <div className="flex justify-between text-xs font-bold text-white/80 uppercase tracking-wider">
                                                    <span>Progress to Level {stats ? stats.level + 1 : 2}</span>
                                                    <span>{xpProgress} / 100 XP</span>
                                                </div>
                                                <div className="h-5 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm border border-white/20 p-0.5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${xpProgress}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                                        className="h-full rounded-full bg-gradient-to-r from-white/40 via-white/80 to-white/100 shadow-[0_0_15px_rgba(255,255,255,0.4)] relative overflow-hidden"
                                                    >
                                                        <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* 2. Habit DNA Widget inside the conditional to keep scope clean */}
                                    <Card className="bg-white border-none shadow-xl shadow-slate-200/50">
                                        <CardContent className="p-6 space-y-6 h-full flex flex-col">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="p-2 bg-indigo-50 rounded-lg">
                                                    <ActivitySquare className="text-indigo-600 h-6 w-6" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-lg leading-none text-slate-800">Habit DNA</h3>
                                                    <p className="text-xs text-slate-500 font-medium">Your Performance Stats</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 flex-1">
                                                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-center flex flex-col justify-center">
                                                    <div className="text-3xl font-black text-slate-800">{stats?.consistency || 0}%</div>
                                                    <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mt-1">Consistency</div>
                                                </div>
                                                <div className="bg-orange-50 border border-orange-100 p-4 rounded-xl text-center flex flex-col justify-center">
                                                    <div className="text-3xl font-black text-orange-600 flex items-center justify-center gap-1">
                                                        <Flame className="h-6 w-6 fill-orange-600" />
                                                        {stats?.streak || 0}
                                                    </div>
                                                    <div className="text-[10px] uppercase tracking-wider text-orange-700/70 font-bold mt-1">Global Streak</div>
                                                </div>
                                            </div>

                                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-medium">Max Rank</span>
                                                    <span className="font-bold text-indigo-600 text-xs uppercase">{stats?.maxRank || 'Beginner'}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="text-slate-500 font-medium">Max Streak</span>
                                                    <span className="font-bold text-orange-600 text-xs">{stats?.maxStreak || 0} days</span>
                                                </div>
                                            </div>
                                            {/* Silent Mode Toggle */}
                                            <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    {silentMode ? <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" /> : <div className="h-2 w-2 rounded-full bg-slate-300" />}
                                                    <span className="font-medium text-sm">Silent Accountability</span>
                                                </div>
                                                <Button
                                                    variant={silentMode ? "secondary" : "outline"}
                                                    size="sm"
                                                    onClick={async () => {
                                                        try {
                                                            const newMode = !silentMode;
                                                            await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
                                                                { silentMode: newMode },
                                                                { headers: { Authorization: `Bearer ${token}` } }
                                                            );
                                                            setSilentMode(newMode);
                                                        } catch (err) {
                                                            alert('Failed to update setting');
                                                        }
                                                    }}
                                                    className={silentMode ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" : ""}
                                                >
                                                    {silentMode ? 'Active 🤫' : 'Off 🔔'}
                                                </Button>
                                            </div>

                                            <Button
                                                variant="outline"
                                                className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 mt-2"
                                                onClick={() => setShowSimulator(true)}
                                            >
                                                <Sparkles className="w-4 h-4 mr-2" /> Future You
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <FutureYouSimulator
                                        isOpen={showSimulator}
                                        onClose={() => setShowSimulator(false)}
                                        stats={{
                                            level: stats?.level || 1,
                                            xp: stats?.xp || 0,
                                            streak: stats?.streak || 0,
                                            momentum: stats?.momentum || 0,
                                            habitCount: stats?.habitCount || 0
                                        }}
                                    />
                                </div>
                            );
                        })()}
                        {/* 3. Quick Add Section (Habits & Tasks) */}
                        <div className="mb-8">
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex gap-4 mb-4 border-b pb-4">
                                        <button
                                            onClick={() => setCreationMode('habit')}
                                            className={`text-sm font-bold pb-2 border-b-2 transition-colors ${creationMode === 'habit' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                                        >
                                            Add Recurring Habit
                                        </button>
                                        <button
                                            onClick={() => setCreationMode('task')}
                                            className={`text-sm font-bold pb-2 border-b-2 transition-colors ${creationMode === 'task' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'}`}
                                        >
                                            Add Future Task
                                        </button>
                                    </div>

                                    {creationMode === 'habit' ? (
                                        <form onSubmit={addHabit} className="flex flex-col md:flex-row gap-4 items-end">
                                            <div className="flex-1 w-full flex gap-2">
                                                <Input
                                                    placeholder="Hash out a new habit..."
                                                    value={newHabit}
                                                    onChange={(e) => setNewHabit(e.target.value)}
                                                    className="bg-muted/30 border-none shadow-inner flex-1"
                                                />
                                                <select
                                                    className="h-10 rounded-md bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-[140px]"
                                                    value={newHabitDuration}
                                                    onChange={(e) => setNewHabitDuration(e.target.value)}
                                                >
                                                    <option value="infinity">Forever</option>
                                                    <option value="1">1 Day</option>
                                                    <option value="7">1 Week</option>
                                                    <option value="14">2 Weeks</option>
                                                    <option value="21">3 Weeks</option>
                                                    <option value="30">1 Month</option>
                                                    <option value="365">1 Year</option>
                                                </select>
                                            </div>
                                            <div className="flex gap-2 w-full md:w-auto">
                                                <select
                                                    className="h-10 rounded-md bg-muted/50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary w-full md:w-auto"
                                                    value={category}
                                                    onChange={(e) => setCategory(e.target.value)}
                                                >
                                                    <option>Health</option>
                                                    <option>Study</option>
                                                    <option>Fitness</option>
                                                    <option>Mindset</option>
                                                    <option>Work</option>
                                                </select>
                                                <Button type="submit" className="px-6 font-semibold shadow-lg shadow-primary/20">
                                                    <Plus className="h-4 w-4 mr-2" /> Track
                                                </Button>
                                            </div>
                                        </form>
                                    ) : (
                                        <form onSubmit={addTask} className="flex flex-col md:flex-row gap-4 items-end">
                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                                <Input
                                                    placeholder="What do you need to get done?"
                                                    value={newTaskDetails.title}
                                                    onChange={(e) => setNewTaskDetails({ ...newTaskDetails, title: e.target.value })}
                                                    className="bg-muted/30 border-none shadow-inner"
                                                />
                                                <div className="flex gap-2">
                                                    <Input
                                                        type="date"
                                                        value={newTaskDetails.date}
                                                        onChange={(e) => setNewTaskDetails({ ...newTaskDetails, date: e.target.value })}
                                                        className="bg-muted/30 border-none shadow-inner w-full"
                                                        min={new Date().toISOString().split('T')[0]} // Min today
                                                    />
                                                    {/* Quick Date Shortcuts */}
                                                    <select
                                                        className="h-10 rounded-md bg-indigo-50 text-indigo-700 font-bold px-2 py-2 text-xs w-[100px] border border-indigo-100 focus:outline-none"
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            if (!val) return;
                                                            const today = new Date();
                                                            let target = new Date();

                                                            if (val === 'tomorrow') {
                                                                target.setDate(today.getDate() + 1);
                                                            } else if (val === 'next_monday') {
                                                                target.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7));
                                                                if (target <= today) target.setDate(target.getDate() + 7);
                                                            } else if (val === 'next_sunday') {
                                                                target.setDate(today.getDate() + ((0 + 7 - today.getDay()) % 7));
                                                                if (target <= today) target.setDate(target.getDate() + 7);
                                                            } else if (val === '1st_next_month') {
                                                                target = new Date(today.getFullYear(), today.getMonth() + 1, 1);
                                                            } else if (val.startsWith('day_')) {
                                                                const d = parseInt(val.split('_')[1]);
                                                                target.setDate(d);
                                                                if (target < today) {
                                                                    target.setMonth(target.getMonth() + 1);
                                                                }
                                                            }
                                                            setNewTaskDetails({ ...newTaskDetails, date: target.toISOString().split('T')[0] });
                                                        }}
                                                        value=""
                                                    >
                                                        <option value="" disabled>⚡ Quick</option>
                                                        <option value="tomorrow">Tomorrow</option>
                                                        <option value="next_monday">Next Mon</option>
                                                        <option value="next_sunday">Next Sun</option>
                                                        <option value="1st_next_month">1st of Month</option>
                                                        <option value="day_15">15th</option>
                                                        <option value="day_25">25th</option>
                                                    </select>
                                                    <select
                                                        className="h-10 rounded-md bg-muted/50 px-3 py-2 text-sm w-[120px]"
                                                        value={newTaskDetails.difficulty}
                                                        onChange={(e) => setNewTaskDetails({ ...newTaskDetails, difficulty: e.target.value })}
                                                    >
                                                        <option value="easy">Easy</option>
                                                        <option value="medium">Medium</option>
                                                        <option value="hard">Hard</option>
                                                    </select>
                                                </div>

                                                {/* Task Recurrence Options */}
                                                <div className="flex gap-2">
                                                    <select
                                                        className="h-10 rounded-md bg-orange-50 text-orange-800 font-medium px-3 py-2 text-sm border border-orange-100 focus:outline-none w-full"
                                                        value={taskRepeat}
                                                        onChange={(e) => setTaskRepeat(e.target.value as any)}
                                                    >
                                                        <option value="none">One-time</option>
                                                        <option value="weekly">🔁 Weekly</option>
                                                        <option value="monthly">📅 Monthly</option>
                                                    </select>
                                                    {taskRepeat !== 'none' && (
                                                        <select
                                                            className="h-10 rounded-md bg-orange-50 text-orange-800 font-medium px-3 py-2 text-sm border border-orange-100 focus:outline-none w-full"
                                                            value={taskRepeatDuration}
                                                            onChange={(e) => setTaskRepeatDuration(e.target.value)}
                                                        >
                                                            <option value="1">For 1 Month</option>
                                                            <option value="3">For 3 Months</option>
                                                            <option value="6">For 6 Months</option>
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                            <Button type="submit" className="px-6 font-semibold shadow-lg shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">
                                                <Plus className="h-4 w-4 mr-2" /> {taskRepeat !== 'none' ? 'Schedule All' : 'Schedule'}
                                            </Button>
                                        </form>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* View Selection */}
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">Your Schedule</h2>
                            <div className="flex bg-muted p-1 rounded-lg">
                                <Button
                                    variant={viewMode === 'daily' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('daily')}
                                    className="rounded-md"
                                >Daily</Button>
                                <Button
                                    variant={viewMode === 'weekly' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('weekly')}
                                    className="rounded-md"
                                >Weekly</Button>
                                <Button
                                    variant={viewMode === 'monthly' ? 'secondary' : 'ghost'}
                                    size="sm"
                                    onClick={() => setViewMode('monthly')}
                                    className="rounded-md"
                                >Monthly</Button>
                            </div>
                        </div>

                        {viewMode === 'monthly' && <CalendarView habits={habits} />}
                        {viewMode === 'weekly' && (
                            <div className="space-y-8">
                                <WeekView
                                    habits={habits}
                                    onToggle={toggleHabit}
                                    selectedDate={selectedDate}
                                    onSelectDate={setSelectedDate}
                                />
                            </div>
                        )}

                        {viewMode === 'daily' && (
                            <div className="grid gap-8">
                                <div className="">
                                    <div className="space-y-8">
                                        {/* Task Timeline from AI Planner */}
                                        {tasks.length > 0 && (
                                            <TaskTimeline tasks={tasks} onToggle={toggleTask} onPause={toggleTaskPause} />
                                        )}

                                        {/* Recurring Habits */}
                                        <div>
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                                    <LayoutGrid size={20} className="text-primary" />
                                                    Recurring Habits
                                                </h3>
                                                <div className="flex items-center space-x-2">
                                                    <label className="text-xs text-muted-foreground font-medium cursor-pointer" htmlFor="show-all-mode">
                                                        {showAllHabits ? 'Showing All' : 'Due Today Only'}
                                                    </label>
                                                    <Switch
                                                        id="show-all-mode"
                                                        checked={showAllHabits}
                                                        onCheckedChange={setShowAllHabits}
                                                    />
                                                </div>
                                            </div>
                                            {habits.length === 0 ? (
                                                <p className="text-muted-foreground">No recurring habits set.</p>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {habits.filter(habit => {
                                                        if (showAllHabits) return true;

                                                        // "Smart Recurrence" Filtering Logic
                                                        if (!habit.frequency || habit.frequency === 'daily') return true;

                                                        // Use selectedDate if available (for browsing past/future), otherwise today
                                                        const targetDate = selectedDate || currentTime || new Date();
                                                        const dayName = targetDate.toLocaleDateString('en-US', { weekday: 'short' }); // "Mon"
                                                        const dayNum = targetDate.getDate().toString(); // "15"

                                                        if (habit.frequency === 'specific_days') {
                                                            return habit.frequencyDays?.includes(dayName);
                                                        }
                                                        if (habit.frequency === 'monthly') {
                                                            return habit.frequencyDays?.includes(dayNum);
                                                        }
                                                        if (habit.frequency === 'biweekly') {
                                                            // Simplified bi-weekly check: Every even week number?
                                                            // Or check days since start date % 14?
                                                            // Let's go with exact 14-day modulo from start date.
                                                            if (!habit.startDate) return true; // Fallback
                                                            const start = new Date(habit.startDate);
                                                            start.setHours(0, 0, 0, 0);
                                                            const current = new Date(targetDate);
                                                            current.setHours(0, 0, 0, 0);
                                                            const diffDays = Math.floor((current.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
                                                            return diffDays >= 0 && diffDays % 14 === 0;
                                                        }
                                                        return true;
                                                    }).map((habit) => {
                                                        // ... habit items ...
                                                        const status = getTodayStatus(habit.history);
                                                        const finished = status === 'completed';
                                                        const partial = status === 'partial';

                                                        // Calculate time left (Client-side only)
                                                        let timeDisplay = null;
                                                        let isUrgent = false;

                                                        if (currentTime) {
                                                            const endOfDay = new Date(currentTime);
                                                            endOfDay.setHours(23, 59, 59, 999);
                                                            const diff = endOfDay.getTime() - currentTime.getTime();
                                                            const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
                                                            const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

                                                            isUrgent = hoursLeft < 4;
                                                            timeDisplay = `${hoursLeft}h ${minutesLeft}m left`;
                                                        }

                                                        return (
                                                            <Card key={habit._id} className={`group hover:shadow-lg transition-all duration-300 ${habit.isPaused ? 'border-yellow-400 bg-yellow-50/10' :
                                                                finished ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200' :
                                                                    partial ? 'bg-yellow-50/50 border-yellow-200' :
                                                                        'hover:border-primary/50'
                                                                }`}>
                                                                <CardContent className="p-5">
                                                                    <div className="flex justify-between items-start mb-4">
                                                                        <div>
                                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                                                                                {habit.category}
                                                                            </span>
                                                                            {habit.frequency === 'specific_days' && (
                                                                                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                                                                                    {habit.frequencyDays?.join(', ')}
                                                                                </span>
                                                                            )}
                                                                            {habit.frequency === 'monthly' && (
                                                                                <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                                                                    Monthly: {habit.frequencyDays?.[0]}
                                                                                </span>
                                                                            )}
                                                                            <h3 className={`font-bold text-lg mt-2 ${finished ? 'text-muted-foreground line-through decoration-green-500/50' : partial ? 'text-yellow-700' : ''}`}>
                                                                                {habit.title}
                                                                            </h3>
                                                                            {partial && <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-2 py-0.5 rounded-full">PARTIAL WIN</span>}
                                                                        </div>
                                                                        <div className="flex gap-2">
                                                                            {/* Partial Button - Only show if pending */}
                                                                            {!finished && !partial && (
                                                                                <button
                                                                                    onClick={() => toggleHabit(habit._id, 'partial', 50)}
                                                                                    title="Partial Win (50%)"
                                                                                    className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-300 bg-yellow-50 text-yellow-600 hover:bg-yellow-200 hover:scale-105"
                                                                                >
                                                                                    <span className="text-[10px] font-bold">50%</span>
                                                                                </button>
                                                                            )}

                                                                            {/* Complete Button */}
                                                                            <button
                                                                                onClick={() => toggleHabit(habit._id, 'completed')}
                                                                                className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-500 ${finished
                                                                                    ? 'bg-green-500 text-white shadow-green-500/30 shadow-lg scale-110'
                                                                                    : partial
                                                                                        ? 'bg-yellow-500 text-white shadow-yellow-500/30'
                                                                                        : 'bg-muted hover:bg-primary hover:text-white'
                                                                                    }`}
                                                                            >
                                                                                {finished ? <Check className="h-6 w-6" /> : partial ? <span className="font-bold text-xs">50%</span> : <div className="h-4 w-4 rounded-full border-2 border-current" />}
                                                                            </button>
                                                                        </div>
                                                                    </div>

                                                                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-dashed border-muted-foreground/20">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex items-center text-xs font-medium text-orange-500 bg-orange-50 dark:bg-orange-900/10 px-2 py-1 rounded">
                                                                                <Flame className="h-3 w-3 mr-1" />
                                                                                {habit.streak} streak
                                                                            </div>
                                                                            {!finished && !partial && timeDisplay && (
                                                                                <div className={`flex items-center text-xs font-semibold px-2 py-1 rounded ${isUrgent ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
                                                                                    <Clock className="h-3 w-3 mr-1" />
                                                                                    {timeDisplay}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        {/* Card Actions (Edit, Pause) */}
                                                                        <div className="flex gap-2">
                                                                            <button
                                                                                onClick={() => toggleHabitPause(habit._id)}
                                                                                className={`p-1.5 rounded-full transition-colors ${habit.isPaused ? 'text-yellow-600 bg-yellow-100 hover:bg-yellow-200' : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                                                                                title={habit.isPaused ? "Resume Habit" : "Pause Habit"}
                                                                            >
                                                                                <div className="relative w-4 h-4 flex items-center justify-center">
                                                                                    {habit.isPaused ? (
                                                                                        // Play Icon
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                                                            <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" />
                                                                                        </svg>
                                                                                    ) : (
                                                                                        // Pause Icon
                                                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                                                                            <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" />
                                                                                        </svg>
                                                                                    )}
                                                                                </div>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => {
                                                                                    setEditHabit(habit);
                                                                                    setNewHabit(habit.title);
                                                                                    setCategory(habit.category);
                                                                                    setCreationMode('habit');
                                                                                    // scroll to form?
                                                                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                                }}
                                                                                className="text-slate-400 hover:text-primary transition-colors"
                                                                            >
                                                                                <Pencil className="h-4 w-4" />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* WhatsApp Notification Settings */}
                        <div className="mt-12 mb-8">
                            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                                <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-green-100 rounded-full text-green-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-message-circle"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-green-900">Enable AI WhatsApp Coach</h3>
                                            <p className="text-green-700/80 text-sm">Get daily morning briefings and evening reports sent to your phone.</p>
                                        </div>
                                    </div>
                                    <WhatsAppSettings
                                        currentNumber={stats?.phoneNumber}
                                        token={token}
                                        onUpdate={() => token && fetchData(token)} // Refresh to get updated number
                                    />
                                </CardContent>
                            </Card>
                        </div>
                        {/* AI Personality Selector */}
                        <div className="mb-12">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Sparkles className="text-purple-500" />
                                AI Coach Personality
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[
                                    { id: 'calm', icon: '🌿', label: 'Calm', desc: 'Gentle, encouraging. Focus on mental health.' },
                                    { id: 'balanced', icon: '🚀', label: 'Balanced', desc: 'Friendly but firm. The gold standard.' },
                                    { id: 'aggressive', icon: '🔥', label: 'Aggressive', desc: 'No excuses. Intense accountability.' }
                                ].map((p) => (
                                    <Card
                                        key={p.id}
                                        onClick={async () => {
                                            setPersonality(p.id as any);
                                            try {
                                                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, { personality: p.id }, {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                            } catch (err) { console.error(err); }
                                        }}
                                        className={`cursor-pointer transition-all hover:scale-105 ${personality === p.id ? 'border-2 border-primary bg-primary/5' : 'hover:bg-muted'}`}
                                    >
                                        <CardContent className="p-6 flex flex-col items-center text-center">
                                            <div className="text-4xl mb-4">{p.icon}</div>
                                            <h4 className="font-bold text-lg mb-2">{p.label}</h4>
                                            <p className="text-xs text-muted-foreground">{p.desc}</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Pause Life Mode */}
                        <div className="mb-12">
                            <Card className="bg-slate-50 border-slate-200">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-full ${isPaused ? 'bg-blue-100 text-blue-600' : 'bg-slate-200 text-slate-500'}`}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="10" y1="15" x2="10" y2="9" /><line x1="14" y1="15" x2="14" y2="9" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900">Pause Life Mode</h3>
                                            <p className="text-slate-600 text-sm">Freeze your streaks and stop all AI notifications. Use this for vacations.</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => {
                                            if (isPaused) {
                                                // Resume immediately
                                                setIsPaused(false);
                                                axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, { isPaused: false, pauseDuration: 0 }, {
                                                    headers: { Authorization: `Bearer ${token}` }
                                                }).catch(console.error);
                                            } else {
                                                // Open Modal
                                                setShowPauseModal(true);
                                            }
                                        }}
                                        variant={isPaused ? "default" : "outline"}
                                        className={isPaused ? "bg-blue-600 hover:bg-blue-700" : ""}
                                    >
                                        {isPaused ? 'Resume Life' : 'Pause Life'}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Pause Duration Modal */}
                        {
                            showPauseModal && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                    <Card className="w-full max-w-sm bg-white shadow-2xl">
                                        <CardContent className="p-6">
                                            <h3 className="text-xl font-bold mb-4">Pause Life Mode</h3>
                                            <p className="text-sm text-muted-foreground mb-4">How long are you going on vacation? We will auto-resume tracking after this period.</p>

                                            <div className="space-y-4">
                                                <select
                                                    className="w-full h-10 rounded-md border border-input bg-background px-3"
                                                    value={pauseDuration}
                                                    onChange={(e) => setPauseDuration(e.target.value)}
                                                >
                                                    <option value="1">1 Day</option>
                                                    <option value="3">3 Days</option>
                                                    <option value="7">1 Week</option>
                                                    <option value="14">2 Weeks</option>
                                                    <option value="30">1 Month</option>
                                                    <option value="90">3 Months</option>
                                                </select>

                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        className="flex-1"
                                                        onClick={() => setShowPauseModal(false)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        className="flex-1"
                                                        onClick={async () => {
                                                            setIsPaused(true);
                                                            setShowPauseModal(false);
                                                            try {
                                                                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`, {
                                                                    isPaused: true,
                                                                    pauseDuration: parseInt(pauseDuration)
                                                                }, {
                                                                    headers: { Authorization: `Bearer ${token}` }
                                                                });
                                                            } catch (err) { console.error(err); setIsPaused(false); }
                                                        }}
                                                    >
                                                        Confirm Pause
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )
                        }


                        {/* Edit Habit Modal */}
                        {
                            editHabit && (
                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                                    <Card className="w-full max-w-md bg-white shadow-2xl">
                                        <CardContent className="p-6">
                                            <div className="flex justify-between items-center mb-6">
                                                <h3 className="text-xl font-bold">Edit Habit</h3>
                                                <button onClick={() => setEditHabit(null)} className="text-muted-foreground hover:text-black">
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>

                                            <div className="space-y-4">
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Title</label>
                                                    <Input
                                                        value={editHabit.title}
                                                        onChange={(e) => setEditHabit({ ...editHabit, title: e.target.value })}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Category</label>
                                                    <select
                                                        className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                                        value={editHabit.category}
                                                        onChange={(e) => setEditHabit({ ...editHabit, category: e.target.value })}
                                                    >
                                                        <option>Health</option>
                                                        <option>Study</option>
                                                        <option>Fitness</option>
                                                        <option>Mindset</option>
                                                        <option>Work</option>
                                                    </select>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-muted-foreground mb-1 block">Commitment End Date (Duration)</label>
                                                    <div className="flex gap-2">
                                                        <Input
                                                            type="date"
                                                            value={editHabit.endDate ? new Date(editHabit.endDate).toISOString().split('T')[0] : ''}
                                                            onChange={(e) => setEditHabit({ ...editHabit, endDate: e.target.value })}
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => {
                                                                // Quick add 30 days logic for easier editing
                                                                const current = editHabit.endDate ? new Date(editHabit.endDate) : new Date();
                                                                current.setDate(current.getDate() + 30);
                                                                setEditHabit({ ...editHabit, endDate: current.toISOString() });
                                                            }}
                                                        >
                                                            +30d
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-1">Extend or shorten your commitment.</p>
                                                </div>

                                                <div className="flex gap-3 pt-4 border-t mt-6">
                                                    <Button
                                                        variant="destructive"
                                                        className="flex-1"
                                                        onClick={() => {
                                                            deleteHabit(editHabit._id);
                                                            setEditHabit(null);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </Button>
                                                    <Button
                                                        className="flex-1"
                                                        onClick={async () => {
                                                            try {
                                                                await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/habits/${editHabit._id}`,
                                                                    {
                                                                        title: editHabit.title,
                                                                        category: editHabit.category,
                                                                        endDate: editHabit.endDate
                                                                    },
                                                                    { headers: { Authorization: `Bearer ${token}` } }
                                                                );
                                                                setEditHabit(null);
                                                                if (token) fetchData(token);
                                                            } catch (e) { console.error(e); alert("Failed to save changes"); }
                                                        }}
                                                    >
                                                        Save Changes
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )
                        }
                    </>
                )}
            </main >
        </div >
    );
}

// Sub-component to handle edit state logic cleanly
function WhatsAppSettings({ currentNumber, token, onUpdate }: { currentNumber: string, token: string | null, onUpdate: () => void }) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    // If we have a number and not editing, show "View Mode"
    if (currentNumber && !isEditing) {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-2 items-center">
                    <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-green-100 shadow-sm">
                        <div className="font-mono text-green-800 font-bold tracking-wider">
                            {currentNumber}
                        </div>
                        <div className="h-4 w-[1px] bg-green-200"></div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50 h-8"
                        >
                            Edit
                        </Button>
                    </div>
                </div>
            </div>
        );
    }



    return (
        <form
            className="flex gap-2 w-full md:w-auto"
            onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                const number = (e.target as any).phone.value;
                try {
                    await axios.put(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/profile`,
                        { phoneNumber: number },
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                    alert('Phone number saved! You will receive a confirmation message shortly.');
                    setIsEditing(false);
                    onUpdate();
                } catch (err: any) {
                    alert(err.response?.data?.message || 'Failed to save number.');
                } finally {
                    setLoading(false);
                }
            }}
        >
            <Input
                name="phone"
                placeholder="+1234567890"
                className="bg-white min-w-[200px]"
                defaultValue={currentNumber || ''}
                autoFocus
            />
            <div className="flex gap-1">
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {loading ? 'Saving...' : 'Save'}
                </Button>
                {currentNumber && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setIsEditing(false)}
                        className="text-muted-foreground"
                    >
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
}
