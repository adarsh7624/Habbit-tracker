'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Sparkles, Save, BookOpen, Dumbbell, Calendar, Clock, BarChart } from 'lucide-react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { addDays, format } from 'date-fns';

// Define types locally or import from lib if perfectly matching.
// Redefining here to ensure strict match with Backend response.
interface DailyTask {
    day: string;
    task: string;
    duration: string;
    difficulty: string;
    type: string;
    resource?: string;
}

interface WeeklyPlan {
    week: number;
    goal: string;
    days: DailyTask[];
}

interface MonthlyPlan {
    month: number;
    focus: string;
    weeks: WeeklyPlan[];
}

interface ExpertPlan {
    overview: string;
    monthly_plan: MonthlyPlan[];
}

export default function PlannerPage() {
    const [goal, setGoal] = useState('');
    const [type, setType] = useState('learning');
    const [duration, setDuration] = useState('1 month');
    const [time, setTime] = useState('1 hr');
    const [level, setLevel] = useState('Beginner');

    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<ExpertPlan | null>(null);

    // Recovery Mode State
    const [showRecovery, setShowRecovery] = useState(false);
    const [missedDays, setMissedDays] = useState(1);
    const [adjusting, setAdjusting] = useState(false);
    const [adjustment, setAdjustment] = useState<any>(null);

    const router = useRouter();

    const handleGenerate = async () => {
        if (!goal) return;
        setLoading(true);
        setPlan(null);
        setAdjustment(null);
        setShowRecovery(false);

        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/planner/generate`, {
                goal, type, duration, time, level
            });
            setPlan(res.data);
        } catch (error) {
            console.error(error);
            alert("Failed to generate plan. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAdjustPlan = async () => {
        if (!plan) return;
        setAdjusting(true);
        try {
            // Better duration parsing
            let totalDays = 30;
            const num = parseInt(duration);
            if (duration.includes('day')) totalDays = num;
            else if (duration.includes('week')) totalDays = num * 7;
            else if (duration.includes('month')) totalDays = num * 30;

            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/planner/adjust`, {
                missedDays,
                originalPlan: plan,
                remainingDays: Math.max(1, totalDays - missedDays)
            });
            setAdjustment(res.data);
        } catch (error) {
            console.error(error);
            alert("Failed to adjust plan.");
        } finally {
            setAdjusting(false);
        }
    };

    const handleSavePlan = async () => {
        if (!plan) return;
        try {
            const token = localStorage.getItem('token');
            if (!token) return router.push('/login');

            const tasksToSave: any[] = [];
            let dayOffset = 0;

            plan.monthly_plan.forEach(month => {
                month.weeks.forEach(week => {
                    week.days.forEach(day => {
                        const difficulty = day.difficulty.toLowerCase();
                        const validDifficulties = ['easy', 'medium', 'hard'];

                        tasksToSave.push({
                            title: day.task,
                            category: type === 'learning' ? 'Study' : 'Workout',
                            date: addDays(new Date(), dayOffset + 1).toISOString(),
                            duration: day.duration,
                            difficulty: validDifficulties.includes(difficulty) ? difficulty : 'medium',
                            completed: false
                        });
                        dayOffset++;
                    });
                });
            });

            if (tasksToSave.length > 0) {
                await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks/bulk`, { tasks: tasksToSave }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            router.push('/dashboard');
        } catch (error) {
            console.error(error);
            alert('Failed to save plan');
        }
    };

    const selectClass = "flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-bold tracking-tight">AI Goal Planner</h1>
                        <p className="text-muted-foreground text-lg">
                            Get a structured expert plan tailored to your lifestyle.
                        </p>
                    </div>

                    <Card className="border-2 border-primary/20 bg-card/50 backdrop-blur">
                        <CardHeader>
                            <CardTitle>Define Your Goal</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Main Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">What do you want to achieve?</label>
                                <Input
                                    placeholder="e.g. Master Data Structures, Run a Marathon, Learn Spanish"
                                    className="text-lg h-12"
                                    value={goal}
                                    onChange={(e) => setGoal(e.target.value)}
                                />
                            </div>

                            {/* Filters Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        {type === 'learning' ? <BookOpen size={16} /> : <Dumbbell size={16} />}
                                        Type
                                    </label>
                                    <select
                                        className={selectClass}
                                        value={type}
                                        onChange={(e) => setType(e.target.value)}
                                    >
                                        <option value="learning">Learning</option>
                                        <option value="body">Body / Fitness</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Calendar size={16} />
                                        Duration
                                    </label>
                                    <select
                                        className={selectClass}
                                        value={duration}
                                        onChange={(e) => setDuration(e.target.value)}
                                    >
                                        <option value="1 day">1 Day</option>
                                        <option value="3 days">3 Days</option>
                                        <option value="1 week">1 Week</option>
                                        <option value="2 weeks">2 Weeks</option>
                                        <option value="1 month">1 Month</option>
                                        <option value="2 months">2 Months</option>
                                        <option value="3 months">3 Months</option>
                                        <option value="6 months">6 Months</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <Clock size={16} />
                                        Daily Time
                                    </label>
                                    <select
                                        className={selectClass}
                                        value={time}
                                        onChange={(e) => setTime(e.target.value)}
                                    >
                                        <option value="30 min">30 Minutes</option>
                                        <option value="1 hr">1 Hour</option>
                                        <option value="2 hrs">2 Hours</option>
                                        <option value="3+ hrs">3+ Hours</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium flex items-center gap-2">
                                        <BarChart size={16} />
                                        Level
                                    </label>
                                    <select
                                        className={selectClass}
                                        value={level}
                                        onChange={(e) => setLevel(e.target.value)}
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                            </div>

                            <Button
                                size="lg"
                                onClick={handleGenerate}
                                disabled={loading || !goal}
                                className="w-full text-lg mt-4 h-12 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Crafting your plan...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="mr-2 h-5 w-5" />
                                        Generate Expert Plan
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {plan && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">

                            {/* Overview Section */}
                            <div className="flex flex-col gap-4 bg-card p-6 rounded-xl border shadow-sm">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-semibold">Your Blueprint</h2>
                                        <p className="text-muted-foreground">{plan.overview}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            onClick={() => setShowRecovery(!showRecovery)}
                                            className="border-amber-200 hover:bg-amber-50 text-amber-900"
                                        >
                                            <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                                            Missed Days?
                                        </Button>
                                        <Button onClick={handleSavePlan} className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-green-900/20">
                                            <Save className="mr-2 h-4 w-4" />
                                            Save to Dashboard
                                        </Button>
                                    </div>
                                </div>

                                {/* Recovery Mode Input */}
                                {showRecovery && (
                                    <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-lg flex items-center gap-4 animate-in slide-in-from-top-2">
                                        <div className="flex-1">
                                            <h4 className="font-semibold text-amber-900 text-sm">Focus Mode Activation</h4>
                                            <p className="text-xs text-amber-800">We'll intelligently redistribute your missed tasks without overwhelming you.</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                min="1"
                                                max="7"
                                                value={missedDays}
                                                onChange={(e) => setMissedDays(parseInt(e.target.value))}
                                                className="w-20 bg-white"
                                            />
                                            <span className="text-sm text-amber-900">days missed</span>
                                            <Button
                                                onClick={handleAdjustPlan}
                                                disabled={adjusting}
                                                size="sm"
                                                className="bg-amber-600 hover:bg-amber-700 text-white"
                                            >
                                                {adjusting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Auto-Adjust Plan"}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Adjustment View - Premium Report Design */}
                            {adjustment && (
                                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
                                    {/* Focus Mode Header Card */}
                                    <div className="bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-10">
                                            <Sparkles className="w-32 h-32 text-amber-600" />
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="bg-amber-100 p-2 rounded-lg">
                                                    <Sparkles className="h-6 w-6 text-amber-600" />
                                                </div>
                                                <h3 className="text-xl font-bold text-amber-900">Focus Mode Activated</h3>
                                            </div>

                                            <p className="text-amber-800/90 text-lg font-medium leading-relaxed italic max-w-2xl">
                                                "{adjustment.coachMessage}"
                                            </p>

                                            <div className="mt-6 flex gap-4">
                                                <div className="bg-white/60 backdrop-blur px-4 py-2 rounded-lg border border-amber-100">
                                                    <span className="text-xs text-amber-600 uppercase font-bold tracking-wider">Missed</span>
                                                    <div className="text-xl font-bold text-amber-900">{adjustment.missedDays} Days</div>
                                                </div>
                                                <div className="bg-white/60 backdrop-blur px-4 py-2 rounded-lg border border-amber-100">
                                                    <span className="text-xs text-amber-600 uppercase font-bold tracking-wider">Strategy</span>
                                                    <div className="text-xl font-bold text-amber-900 capitalize">{adjustment.recoveryStrategy}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Schedule Adjustments */}
                                    <div className="grid gap-4">
                                        <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-slate-500" />
                                            Recovery Schedule
                                        </h4>

                                        {adjustment.adjustedDays.map((day: any, idx: number) => (
                                            <Card key={idx} className="border-l-4 border-l-amber-500 hover:shadow-md transition-shadow">
                                                <CardContent className="p-5 flex flex-col md:flex-row gap-4 justify-between items-center">
                                                    {/* Date & Task Info */}
                                                    <div className="flex items-start gap-4 flex-1">
                                                        <div className="flex flex-col items-center bg-slate-50 px-3 py-2 rounded border min-w-[3.5rem]">
                                                            <span className="text-xs font-bold text-slate-500 uppercase">Day</span>
                                                            <span className="text-xl font-bold text-slate-800">{idx + 1}</span>
                                                        </div>
                                                        <div>
                                                            <h5 className="font-bold text-lg text-slate-800">{day.task || "Recovery Focus"}</h5>
                                                            <div className="text-amber-700 text-sm mt-1 flex items-center gap-1">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block"></span>
                                                                {day.note}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Time Breakdown */}
                                                    <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                        <div className="text-center px-2">
                                                            <div className="text-xs text-slate-400 font-medium uppercase">Original</div>
                                                            <div className="text-sm font-semibold text-slate-600 line-through decoration-slate-400 decoration-2">{day.originalDuration}</div>
                                                        </div>

                                                        <div className="text-amber-500 font-bold">→</div>

                                                        <div className="text-center px-2">
                                                            <div className="text-xs text-amber-600 font-medium uppercase">Adjusted</div>
                                                            <div className="text-lg font-bold text-amber-700 flex items-center gap-1">
                                                                <Clock className="w-4 h-4" />
                                                                {day.newTotalDuration}
                                                            </div>
                                                        </div>

                                                        <div className="h-8 w-px bg-slate-200 mx-1"></div>

                                                        <div className="text-center px-2">
                                                            <div className="text-xs text-green-600 font-medium uppercase">Added</div>
                                                            <div className="text-sm font-bold text-green-700">+{day.addedRecovery}</div>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Plan Render */}
                            <div className="space-y-12">
                                {plan.monthly_plan.map((month, mIndex) => (
                                    <div key={mIndex} className="space-y-6">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 text-primary px-4 py-1 rounded-full font-bold text-sm uppercase tracking-wide">
                                                Month {month.month}
                                            </div>
                                            <h3 className="text-xl font-medium">{month.focus}</h3>
                                        </div>

                                        <div className="grid gap-6">
                                            {month.weeks.map((week, wIndex) => (
                                                <Card key={wIndex} className="overflow-hidden border-muted">
                                                    <div className="bg-muted/50 px-6 py-3 border-b border-muted flex justify-between items-center">
                                                        <h4 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Week {week.week}: {week.goal}</h4>
                                                    </div>
                                                    <div className="divide-y divide-muted/50">
                                                        {week.days.map((day, dIndex) => (
                                                            <div key={dIndex} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="min-w-[4rem] text-xs font-bold text-muted-foreground uppercase bg-background border px-2 py-1 rounded text-center">
                                                                        {day.day}
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="font-medium text-foreground">{day.task}</h5>
                                                                        {day.resource && (
                                                                            <p className="text-xs text-blue-500 mt-1">Resource: {day.resource}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-3 text-xs text-muted-foreground min-w-fit">
                                                                    <span className="flex items-center gap-1 bg-secondary px-2 py-1 rounded-full text-secondary-foreground">
                                                                        <Clock size={12} /> {day.duration}
                                                                    </span>
                                                                    <span className={`px-2 py-1 rounded-full border ${day.difficulty === 'Hard' ? 'border-red-200 text-red-700 bg-red-50' :
                                                                        day.difficulty === 'Medium' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                                                                            'border-green-200 text-green-700 bg-green-50'
                                                                        }`}>
                                                                        {day.difficulty}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
