'use client';

import { useState } from 'react';
import {
    format,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameDay,
    addWeeks,
    subWeeks
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

type WeekViewProps = {
    habits: any[];
    onToggle: (habitId: string) => void;
};

// Vibrant color palette matching the requested design
const ROW_COLORS = [
    { bg: 'bg-cyan-400', text: 'text-cyan-500', light: 'bg-cyan-100' },
    { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-100' },
    { bg: 'bg-pink-500', text: 'text-pink-500', light: 'bg-pink-100' },
    { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-100' },
    { bg: 'bg-emerald-400', text: 'text-emerald-500', light: 'bg-emerald-100' },
    { bg: 'bg-orange-400', text: 'text-orange-500', light: 'bg-orange-100' },
    { bg: 'bg-indigo-400', text: 'text-indigo-500', light: 'bg-indigo-100' },
];

// Helper to get emoji for a habit title
const getHabitIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('run') || t.includes('walk')) return '🏃';
    if (t.includes('code') || t.includes('dev')) return '💻';
    if (t.includes('read') || t.includes('book')) return '📚';
    if (t.includes('water') || t.includes('drink')) return '💧';
    if (t.includes('meditate') || t.includes('mind')) return '🧘';
    if (t.includes('gym') || t.includes('workout')) return '💪';
    if (t.includes('sleep') || t.includes('bed')) return '😴';
    if (t.includes('journal') || t.includes('write')) return '✏️';
    return '✨'; // Default
};

export default function WeekView({ habits, onToggle }: WeekViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

    return (
        <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={prevWeek} className="hover:bg-transparent">
                        <ChevronLeft className="h-5 w-5 text-slate-400" />
                    </Button>
                    <span className="text-slate-400 font-medium self-center">
                        {format(startDate, 'MMM d')} - {format(endDate, 'MMM d')}
                    </span>
                    <Button variant="ghost" size="icon" onClick={nextWeek} className="hover:bg-transparent">
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                    </Button>
                </div>
                {/* Day Headers */}
                <div className="flex-1 grid grid-cols-7 gap-4 ml-4 max-w-2xl">
                    {days.map(day => (
                        <div key={day.toString()} className="text-center">
                            <span className={cn(
                                "text-sm font-medium",
                                isSameDay(day, new Date()) ? "text-slate-800" : "text-slate-400"
                            )}>
                                {format(day, 'EEE')}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="w-12"></div> {/* Spacer for alignment */}
            </div>

            {/* Habits Matrix */}
            <div className="space-y-6">
                {habits.map((habit, index) => {
                    // Assign a color based on index
                    const colorTheme = ROW_COLORS[index % ROW_COLORS.length];
                    const icon = getHabitIcon(habit.title);

                    // Calculate weekly progress
                    const weeklyCompletions = days.filter(day =>
                        habit.history?.some((h: any) =>
                            isSameDay(new Date(h.date), day) && h.status === 'completed'
                        )
                    ).length;

                    return (
                        <motion.div
                            key={habit._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between group"
                        >
                            {/* Left: Habit Name */}
                            <div className="flex items-center gap-4 w-[200px] shrink-0">
                                <div className={cn("w-3 h-3 rounded-full", colorTheme.bg)}></div>
                                <span className="text-lg mr-2">{icon}</span>
                                <span className="text-slate-600 font-medium truncate">{habit.title}</span>
                            </div>

                            {/* Middle: Grid */}
                            <div className="flex-1 grid grid-cols-7 gap-4 max-w-2xl">
                                {days.map(day => {
                                    const isCompleted = habit.history?.some((h: any) =>
                                        isSameDay(new Date(h.date), day) && h.status === 'completed'
                                    );
                                    const isToday = isSameDay(day, new Date());
                                    const isFuture = day > new Date();

                                    return (
                                        <div key={day.toString()} className="flex justify-center">
                                            <motion.button
                                                whileTap={{ scale: 0.8 }}
                                                onClick={() => isToday && onToggle(habit._id)}
                                                disabled={!isToday}
                                                className={cn(
                                                    "w-10 h-10 rounded-[10px] transition-all duration-200",
                                                    isCompleted ? colorTheme.bg : "bg-slate-100",
                                                    isToday && !isCompleted && "ring-2 ring-slate-300 ring-offset-2",
                                                    isToday ? "cursor-pointer hover:bg-slate-200" : "cursor-default"
                                                )}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Right: Progress */}
                            <div className="w-12 text-right">
                                <span className="text-slate-400 font-medium text-sm">{weeklyCompletions} / 7</span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
