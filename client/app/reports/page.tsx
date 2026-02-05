'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Target, Trophy, Flame, Calendar, Activity } from 'lucide-react';
import axios from 'axios';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    ComposedChart,
    Line
} from 'recharts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any>(null);
    const [habits, setHabits] = useState<any[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReport();
        fetchHabits();
    }, []);

    const fetchHabits = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;
            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/habits`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setHabits(res.data);
        } catch (err) {
            console.error(err);
        }
    }

    const fetchReport = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/generate`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setReport(res.data);
        } catch (err) {
            console.error(err);
            setError('Failed to load analysis.');
        } finally {
            setLoading(false);
        }
    };




    // Calculate Monthly Data from Habits
    const processMonthlyData = () => {
        if (!habits.length) return [];
        const days = 30;
        const data = [];
        const today = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

            let completed = 0;
            let missed = 0;
            let total = 0;

            habits.forEach(habit => {
                const created = new Date(habit.createdAt || habit.startDate || 0);
                created.setHours(0, 0, 0, 0);
                if (date < created) return; // Skip if habit didn't exist

                // Check frequency
                const dayNameFull = date.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...
                let isDue = true;
                if (habit.frequency === 'custom' && habit.frequencyDays?.length) {
                    const isIncluded = habit.frequencyDays.some((d: string) => d.startsWith(dayNameFull));
                    if (!isIncluded) isDue = false;
                }

                if (!isDue) return;

                total++;
                const isDone = habit.history?.some((h: any) => h.date.startsWith(dateStr) && h.status === 'completed');
                if (isDone) completed++;
                else missed++;
            });

            const consistency = total > 0 ? Math.round((completed / total) * 100) : 0;

            data.push({
                day: i === 0 || i === days - 1 || dayName === 'Mon' ? dayName : '', // Sparse labels
                fullDate: date.toLocaleDateString(),
                completed,
                missed,
                consistency
            });
        }
        return data;
    };

    const monthlyData = processMonthlyData();


    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                        <BrainIcon className="h-16 w-16 text-indigo-600 animate-bounce" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-700">Analyzing Your Performance...</h2>
                </div>
            </div>
        );
    }

    if (error) return <div className="p-8 text-red-500">{error}</div>;

    const stats = report.stats;
    const rankColors: any = {
        "Starter": "bg-slate-500",
        "Builder": "bg-blue-500",
        "Warrior": "bg-orange-500",
        "Champion": "bg-purple-600",
        "Legend": "bg-yellow-400"
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Performance Intelligence
                            <span className={cn("px-3 py-1 text-sm rounded-full text-white font-bold shadow-sm", rankColors[stats.user_rank] || "bg-slate-400")}>
                                {stats.user_rank} 🏆
                            </span>
                        </h1>
                        <p className="text-slate-500 mt-1">AI-powered insights for your personal growth.</p>
                    </div>
                    <Button onClick={() => { fetchReport(); fetchHabits(); }} variant="outline" className="gap-2 no-print">
                        <Activity className="w-4 h-4" /> Refresh
                    </Button>
                </div>

                {/* 1. Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 print:grid-cols-4 gap-6 print-compact-gap">
                    {/* Consistency */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Target className="w-16 h-16" />
                        </div>
                        <CardContent className="p-6 print-p-small">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Consistency</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-indigo-600">{stats.consistency_rate}%</span>
                                <span className="text-xs font-medium text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                                    {stats.trend === 'Improving' ? '↑' : stats.trend === 'Declining' ? '↓' : '→'} {stats.trend}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Streak */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Flame className="w-16 h-16 text-orange-500" />
                        </div>
                        <CardContent className="p-6 print-p-small">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Longest Streak</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-slate-800">{stats.longest_streak}</span>
                                <span className="text-sm font-medium text-slate-400">days</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Best Ever: <span className="font-bold text-orange-500">{stats.best_streak_ever} days</span></p>
                        </CardContent>
                    </Card>

                    {/* Missed Days */}
                    <Card className="border-none shadow-sm bg-white overflow-hidden relative group hover:shadow-md transition-all">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Calendar className="w-16 h-16 text-rose-500" />
                        </div>
                        <CardContent className="p-6 print-p-small">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Missed Days (30d)</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-black text-rose-500">{stats.missed_days}</span>
                                <span className="text-sm font-medium text-slate-400">days</span>
                            </div>
                            <p className="text-xs text-emerald-500 mt-1">Recover fast to keep rank!</p>
                        </CardContent>
                    </Card>

                    {/* Best Habit */}
                    <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden relative">
                        <div className="absolute right-0 top-0 p-4 opacity-10">
                            <Trophy className="w-20 h-20" />
                        </div>
                        <CardContent className="p-6 print-p-small flex flex-col justify-center h-full relative z-10">
                            <p className="text-xs font-bold text-indigo-100 uppercase tracking-wider mb-2">Top Performer</p>
                            <div className="text-2xl font-black truncate">{stats.best_habit}</div>
                            <div className="text-xs bg-white/20 px-2 py-1 rounded inline-block self-start mt-2 backdrop-blur-sm">
                                Keep it up!
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 print:grid-cols-3 gap-8 print-compact-gap">

                    {/* Left Col: AI Analysis */}
                    <div className="lg:col-span-1 space-y-6 print-compact-gap order-2 lg:order-1">
                        <Card className="border-2 border-indigo-100 bg-white shadow-lg shadow-indigo-100/50">
                            <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-4 print-p-small">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-indigo-600" />
                                    <CardTitle className="text-indigo-900">Coach's Insight</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 print-p-small space-y-6 print-compact-gap">
                                <div>
                                    <p className="text-slate-700 leading-relaxed italic border-l-4 border-indigo-500 pl-4 py-1">
                                        "{report.summary}"
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" /> Strengths
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {report.strengths?.map((s: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-green-50 text-green-700 text-xs font-medium rounded-md border border-green-100">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4 text-amber-500" /> Risk Areas
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {report.risks?.map((r: string, i: number) => (
                                            <span key={i} className="px-2 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-md border border-amber-100">
                                                {r}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="bg-indigo-900 text-white p-4 rounded-xl mt-4 relative overflow-hidden print-p-small">
                                    <div className="absolute right-0 top-0 p-2 opacity-10"><Target /></div>
                                    <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Recommended Action</div>
                                    <div className="font-semibold text-sm relative z-10">{report.nextAction}</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Highlight of the Week (New Feature) */}
                        <Card className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white overflow-hidden relative shadow-lg shadow-indigo-200">
                            <div className="absolute right-0 top-0 p-3 opacity-10"><Trophy className="w-24 h-24" rotate={12} /></div>
                            <CardContent className="p-5 relative z-10 print-p-small">
                                <h4 className="font-bold text-indigo-100 mb-2 flex items-center gap-2 text-[10px] uppercase tracking-wider">
                                    <Sparkles className="w-3 h-3 text-yellow-300" /> Highlight of the Week
                                </h4>
                                <p className="text-lg font-bold leading-tight mb-2">
                                    “{stats.longest_streak > 3 ? `You hit a ${stats.longest_streak}-day streak!` : "You completed habits even on your lowest-energy day."}”
                                </p>
                                <p className="text-[10px] text-indigo-200 opacity-80">Small text → big motivation.</p>
                            </CardContent>
                        </Card>

                        {/* Personal Notes (Notepad) */}
                        <Card className="border-dashed border-2 border-slate-200 bg-slate-50">
                            <CardHeader className="print-p-small pb-2">
                                <CardTitle className="text-base text-slate-700 flex items-center gap-2">
                                    <span className="text-lg">📝</span> Personal Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="print-p-small">
                                <textarea
                                    className="w-full h-32 bg-transparent border-none resize-none focus:ring-0 text-sm text-slate-600 leading-relaxed p-0 placeholder:text-slate-300"
                                    placeholder="Write your reflections here..."
                                ></textarea>
                            </CardContent>
                        </Card>

                        {/* Export & Actions (New "Free Space" Filler) */}
                        <Card className="border-none shadow-sm bg-white overflow-hidden no-print">
                            <CardHeader>
                                <CardTitle className="text-base text-slate-700">Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button
                                    className="w-full justify-start gap-2 bg-slate-800 hover:bg-slate-700 text-white"
                                    onClick={() => window.print()}
                                >
                                    <FileDownIcon className="w-4 h-4" /> Download Report (PDF)
                                </Button>
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <ShareIcon className="w-4 h-4" /> Share
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <MailIcon className="w-4 h-4" /> Email
                                    </Button>
                                </div>
                                <p className="text-[10px] text-slate-400 text-center pt-2">
                                    Pro Tip: Use 'Save as PDF' in the print dialog.
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Col: Advanced Graphs & Lists */}
                    <div className="lg:col-span-2 space-y-6 lg:order-2">
                        {/* Unified Performance Graph (Merged) */}
                        <Card>
                            <CardHeader className="print-p-small">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">30-Day Performance Overview</CardTitle>
                                        <p className="text-sm text-muted-foreground">Daily habits completed vs missed with consistency trend</p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs font-medium">
                                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Done</div>
                                        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-400"></div> Missed</div>
                                        <div className="flex items-center gap-1"><div className="w-2 h-0.5 bg-indigo-500"></div> Consistency</div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="print-p-small">
                                <div className="h-[350px] w-full print-h-medium">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorConsistency" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                            <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-xs z-50">
                                                                <div className="font-bold mb-2 border-b pb-1 text-slate-700">{data.fullDate}</div>
                                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                                    <div className="flex items-center gap-2 text-emerald-600">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                                        Done: <span className="font-bold">{data.completed}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 text-rose-500">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                                                        Missed: <span className="font-bold">{data.missed}</span>
                                                                    </div>
                                                                    <div className="col-span-2 flex items-center gap-2 text-indigo-600 mt-1 pt-1 border-t border-slate-50">
                                                                        <Activity className="w-3 h-3" />
                                                                        Consistency: <span className="font-bold">{data.consistency}%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Bar yAxisId="left" dataKey="completed" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} barSize={20} />
                                            <Bar yAxisId="left" dataKey="missed" stackId="a" fill="#fb7185" radius={[4, 4, 0, 0]} barSize={20} />
                                            <Line yAxisId="right" type="monotone" dataKey="consistency" stroke="#6366f1" strokeWidth={3} dot={false} activeDot={{ r: 4 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Icon Helper
function BrainIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 3.44-2.92A2.5 2.5 0 0 1 9.5 2Z" />
            <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-3.44-2.92A2.5 2.5 0 0 0 14.5 2Z" />
        </svg>
    )
}

function FileDownIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 20h16" />
            <path d="M12 2v14" />
            <path d="m19 9-7 7-7-7" />
        </svg>
    )
}

function ShareIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" x2="12" y1="2" y2="15" />
        </svg>
    )
}

function MailIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
    )
}
