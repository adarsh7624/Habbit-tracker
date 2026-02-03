'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Target, Brain, Activity } from 'lucide-react';
import axios from 'axios';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [report, setReport] = useState<any>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return; // Handle redirect if needed

            // We use the new generate endpoint which aggregates data AND gets AI insight
            // In a real app, you might separate "get stats" vs "get AI insight" to load faster.
            // For this demo, we do it in one go (might take 2-3s).
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

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30">
                <Navbar />
                <div className="flex flex-col items-center justify-center h-[80vh] space-y-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 animate-pulse rounded-full"></div>
                        <Brain className="h-16 w-16 text-indigo-600 animate-bounce" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-700">Analyzing Your Performance...</h2>
                    <p className="text-slate-500">Connecting dots between your habits, focus, and energy.</p>
                </div>
            </div>
        );
    }

    if (error) return <div className="p-8 text-red-500">{error}</div>;

    // Mock data for graphs if not enough real history
    // Use real graph data from API, or fallback to empty/loading state
    const graphData = report?.graphData || [
        { day: 'Mon', planned: 0, actual: 0, recovered: 0 },
        { day: 'Tue', planned: 0, actual: 0, recovered: 0 },
        { day: 'Wed', planned: 0, actual: 0, recovered: 0 },
        { day: 'Thu', planned: 0, actual: 0, recovered: 0 },
        { day: 'Fri', planned: 0, actual: 0, recovered: 0 },
        { day: 'Sat', planned: 0, actual: 0, recovered: 0 },
        { day: 'Sun', planned: 0, actual: 0, recovered: 0 },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar />

            <div className="container mx-auto px-4 py-8 space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Performance Intelligence</h1>
                        <p className="text-slate-500 mt-1">AI-powered insights for your personal growth.</p>
                    </div>
                    <Button onClick={fetchReport} variant="outline" className="gap-2">
                        <Activity className="w-4 h-4" /> Refresh
                    </Button>
                </div>

                {/* 1. Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consistency</p>
                                <div className="text-3xl font-black text-indigo-600 mt-1">{report.stats.completion_rate}%</div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center">
                                <Target className="h-6 w-6 text-indigo-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Streak</p>
                                <div className="text-3xl font-black text-orange-500 mt-1">{report.stats.current_streak} <span className="text-sm font-medium text-slate-400">days</span></div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-orange-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-white">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Focus Mode Impact</p>
                                <div className="text-3xl font-black text-emerald-600 mt-1">{report.stats.focus_mode_success_rate}%</div>
                            </div>
                            <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
                                <TrendingUp className="h-6 w-6 text-emerald-600" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-none shadow-sm bg-indigo-900 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Brain size={100} />
                        </div>
                        <CardContent className="p-6 flex flex-col justify-center h-full relative z-10">
                            <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider">AI Coach Grade</p>
                            <div className="text-5xl font-black text-white mt-1">{report.grade || 'B+'}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* 2. Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Col: AI Analysis */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="border-2 border-indigo-100 bg-white shadow-lg shadow-indigo-100/50">
                            <CardHeader className="bg-indigo-50/50 border-b border-indigo-100 pb-4">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-indigo-600" />
                                    <CardTitle className="text-indigo-900">Coach's Insight</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
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

                                <div className="bg-indigo-900 text-white p-4 rounded-xl mt-4">
                                    <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-1">Recommended Action</div>
                                    <div className="font-semibold text-sm">{report.nextAction}</div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Focus Mode Stat Box */}
                        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                            <CardContent className="p-5">
                                <h4 className="font-bold text-amber-900 mb-2">Focus Mode Impact</h4>
                                <p className="text-sm text-amber-800/80">{report.focusModeImpact || "Data gathering..."}</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Col: Advanced Graphs */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Effort Graph */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Effort Analysis (Minutes)</CardTitle>
                                <p className="text-sm text-muted-foreground">Planned vs Actual vs Recovered</p>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={graphData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                                <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis dataKey="day" />
                                            <YAxis />
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                            />
                                            <Area type="monotone" dataKey="planned" stroke="#94a3b8" fillOpacity={1} fill="url(#colorPlanned)" />
                                            <Area type="monotone" dataKey="actual" stroke="#6366f1" fillOpacity={1} fill="url(#colorActual)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Consistency Trend */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Consistency Trend (Las 7 Days)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[200px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={graphData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="day" />
                                            <YAxis />
                                            <Tooltip />
                                            <Line type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                                        </LineChart>
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
