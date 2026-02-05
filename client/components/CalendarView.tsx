'use client';

import { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type CalendarViewProps = {
    habits: any[];
};

export default function CalendarView({ habits }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState<any[]>([]);

    useEffect(() => {
        // Fetch tasks (one-off to-dos) to include in consistency
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(data => setTasks(data))
                .catch(err => console.error(err));
        }
    }, []);

    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);
    const startDate = startOfWeek(firstDayOfMonth);
    const endDate = endOfWeek(lastDayOfMonth);

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    const getDayStats = (date: Date) => {
        let completed = 0;
        let total = 0;
        let dayItems: { title: string, completed: boolean, category: string, type: 'habit' | 'task' }[] = [];

        const dayName = format(date, 'EEE');

        habits.forEach(habit => {
            const created = new Date(habit.createdAt || habit.startDate || 0);
            created.setHours(0, 0, 0, 0);
            if (date < created) return;

            if (habit.endDate) {
                const end = new Date(habit.endDate);
                end.setHours(23, 59, 59, 999);
                if (date > end) return;
            }

            let isDue = true;
            if (habit.frequency === 'custom' && habit.frequencyDays && habit.frequencyDays.length > 0) {
                isDue = habit.frequencyDays.includes(dayName);
            }

            if (!isDue) return;

            total++;
            const isCompleted = habit.history?.some((h: any) =>
                isSameDay(new Date(h.date), date) && h.status === 'completed'
            );

            if (isCompleted) completed++;

            dayItems.push({
                title: habit.title,
                completed: isCompleted || false,
                category: habit.category,
                type: 'habit'
            });
        });

        tasks.forEach(task => {
            const taskDate = new Date(task.date);
            if (isSameDay(taskDate, date)) {
                total++;
                if (task.isCompleted) completed++;

                dayItems.push({
                    title: task.title,
                    completed: task.isCompleted,
                    category: task.category || 'Task',
                    type: 'task'
                });
            }
        });

        const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
        return { percentage, dayItems, total, completed };
    };

    return (
        <div className="bg-white/50 backdrop-blur-xl rounded-[32px] p-4 md:p-8 shadow-sm border border-white/20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="font-black text-2xl md:text-3xl text-slate-800 tracking-tight">
                        {format(currentDate, 'MMMM yyyy')}
                    </h2>
                    <p className="text-slate-400 font-medium text-sm md:text-base">Monthly Consistency</p>
                </div>

                <div className="flex gap-2 bg-white rounded-2xl p-1 shadow-sm border border-slate-100 self-start md:self-auto">
                    <Button variant="ghost" size="icon" onClick={prevMonth} className="rounded-xl h-10 w-10 hover:bg-slate-50">
                        <ChevronLeft className="h-5 w-5 text-slate-600" />
                    </Button>
                    <div className="w-px h-6 bg-slate-100 self-center"></div>
                    <Button variant="ghost" size="icon" onClick={nextMonth} className="rounded-xl h-10 w-10 hover:bg-slate-50">
                        <ChevronRight className="h-5 w-5 text-slate-600" />
                    </Button>
                </div>
            </div>

            {/* Weekday Header */}
            <div className="grid grid-cols-7 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-slate-400 font-bold text-[10px] md:text-xs uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 md:gap-3">
                <AnimatePresence mode='popLayout'>
                    {days.map((day, idx) => {
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isToday = isSameDay(day, new Date());
                        const { percentage, dayItems, total, completed } = getDayStats(day);

                        // --- Color Logic ---
                        let bgClass = "bg-slate-50/50 border-slate-100";
                        let badgeClass = "bg-slate-200 text-slate-500";
                        let statusLabel = "";

                        if (total > 0) {
                            if (percentage === 100) {
                                // Completed (Green)
                                bgClass = "bg-emerald-50/80 border-emerald-100 hover:border-emerald-200 hover:shadow-emerald-100";
                                badgeClass = "bg-emerald-500 text-white shadow-emerald-200 shadow-sm";
                                statusLabel = "All Done";
                            } else if (percentage > 0) {
                                // Partial (Orange/Amber)
                                bgClass = "bg-orange-50/80 border-orange-100 hover:border-orange-200 hover:shadow-orange-100";
                                badgeClass = "bg-orange-500 text-white shadow-orange-200 shadow-sm";
                                bgClass += " bg-[url('/stripes.png')]"; // Conceptual texture
                                statusLabel = "Partial";
                            } else {
                                // Not Started (Red/Rose)
                                bgClass = "bg-rose-50/80 border-rose-100 hover:border-rose-200 hover:shadow-rose-100";
                                badgeClass = "bg-rose-500 text-white shadow-rose-200 shadow-sm";
                                statusLabel = "Not Started";
                            }
                        } else {
                            // Empty Day
                            bgClass = "bg-slate-50/30 border-dashed border-slate-100";
                        }

                        if (!isCurrentMonth) {
                            bgClass = "bg-transparent border-transparent opacity-20 shadow-none grayscale";
                        }

                        if (isToday) {
                            bgClass += " ring-2 ring-blue-500 ring-offset-2 ring-offset-white";
                        }

                        return (
                            <motion.div
                                key={day.toISOString()}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.015, type: "spring", stiffness: 300, damping: 25 }}
                                className={cn(
                                    "min-h-[60px] md:min-h-[120px] rounded-lg md:rounded-2xl border p-1 md:p-3 flex flex-col gap-1 md:gap-2 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative group overflow-hidden",
                                    bgClass
                                )}
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <span className={cn(
                                        "text-xs md:text-lg font-bold transition-colors",
                                        isCurrentMonth ? "text-slate-700" : "text-slate-300",
                                        total > 0 && percentage === 100 && "text-emerald-700",
                                        total > 0 && percentage === 0 && percentage < 100 && "text-rose-700",
                                        total > 0 && percentage > 0 && percentage < 100 && "text-orange-700",
                                    )}>
                                        {format(day, 'd')}
                                    </span>
                                    {isCurrentMonth && total > 0 && (
                                        <div className="flex flex-col items-end">
                                            <span className={cn("text-[8px] md:text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-all", badgeClass)}>
                                                {percentage}%
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Habit List (Desktop) */}
                                <div className="hidden md:block space-y-1 overflow-y-auto max-h-[70px] custom-scrollbar relative z-10">
                                    {isCurrentMonth && dayItems.map((item, i) => (
                                        <div key={i} className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg bg-white/70 backdrop-blur-sm border border-white/50 hover:bg-white transition-colors">
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full shrink-0",
                                                item.completed ? "bg-emerald-500" : "bg-slate-300"
                                            )} />
                                            <span className={cn(
                                                "text-[10px] font-medium truncate leading-tight flex-1",
                                                item.completed ? "text-slate-700 decoration-slate-400/50" : "text-slate-400"
                                            )}>
                                                {item.title}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                {/* Habit Dots (Mobile) */}
                                <div className="md:hidden flex flex-wrap gap-1 content-start mt-1">
                                    {isCurrentMonth && dayItems.slice(0, 6).map((item, i) => (
                                        <div
                                            key={i}
                                            className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                item.completed ? "bg-emerald-500" : "bg-slate-300"
                                            )}
                                        />
                                    ))}
                                    {isCurrentMonth && dayItems.length > 6 && (
                                        <div className="w-1.5 h-1.5 text-[6px] text-slate-400 leading-none">+</div>
                                    )}
                                </div>

                                {/* Visual Progress Bar at Bottom */}
                                {total > 0 && isCurrentMonth && (
                                    <div className="absolute bottom-0 left-0 w-full h-1 bg-black/5">
                                        <div
                                            className={cn("h-full transition-all duration-1000",
                                                percentage === 100 ? "bg-emerald-500" :
                                                    percentage === 0 ? "bg-rose-500" : "bg-orange-500"
                                            )}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
