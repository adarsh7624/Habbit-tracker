'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { subDays, format } from 'date-fns';

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null); // simplified for demo
    const [habits, setHabits] = useState<any[]>([]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/habits`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(res => {
                setHabits(res.data);
                processData(res.data);
            });
        }
    }, []);

    const processData = (habits: any[]) => {
        // Mock processing for visual demo - realistically this aggregate should happen on backend
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
            const d = subDays(new Date(), 6 - i);
            return {
                name: format(d, 'EEE'),
                date: d,
                completed: 0
            };
        });

        habits.forEach(habit => {
            habit.history.forEach((h: any) => {
                const hDate = new Date(h.date);
                hDate.setHours(0, 0, 0, 0);
                const dayStat = last7Days.find(d => {
                    const target = new Date(d.date);
                    target.setHours(0, 0, 0, 0);
                    return target.getTime() === hDate.getTime();
                });
                if (dayStat && h.status === 'completed') {
                    dayStat.completed++;
                }
            });
        });

        setData(last7Days);
    };

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-8">Performance Reports</h1>

                <div className="grid md:grid-cols-2 gap-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daily Completion (Last 7 Days)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            {data && (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={data}>
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                                        <YAxis stroke="#888888" fontSize={12} allowDecimals={false} />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="completed" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Habit Consistency Score</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px] flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-5xl font-bold text-green-500 mb-2">
                                    {Math.round(habits.reduce((acc, h) => acc + (h.streak > 0 ? 1 : 0), 0) / (habits.length || 1) * 100)}%
                                </div>
                                <p className="text-muted-foreground">Active Habit Rate</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </main>
        </div>
    );
}
