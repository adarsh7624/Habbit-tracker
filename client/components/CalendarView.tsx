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
import { ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CalendarViewProps = {
    habits: any[];
};

export default function CalendarView({ habits }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [tasks, setTasks] = useState<any[]>([]);

    useEffect(() => {
        // Fetch tasks when mounted
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

    const getDayStatus = (date: Date) => {
        // Returns object with status and percentage
        if (habits.length === 0) return { status: 'none', percentage: 0 };

        let completedCount = 0;
        let totalHabits = 0;

        habits.forEach(habit => {
            // Simplified check: assume all habits are active every day (advanced would check start date / frequency)
            totalHabits++;

            const historyEntry = habit.history?.find((h: any) =>
                isSameDay(new Date(h.date), date)
            );

            if (historyEntry && historyEntry.status === 'completed') {
                completedCount++;
            }
        });

        if (totalHabits === 0) return { status: 'none', percentage: 0 };

        const percentage = Math.round((completedCount / totalHabits) * 100);

        let status = 'none';
        if (percentage === 100) status = 'all-completed';
        else if (percentage > 0) status = 'partial';
        else if (isSameDay(date, new Date())) status = 'today';

        return { status, percentage };
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

    return (
        <div className="bg-card rounded-xl border shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-lg">
                    {format(currentDate, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={prevMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={nextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2 text-muted-foreground">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((day, idx) => {
                    const { status, percentage } = getDayStatus(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);

                    const dayTasks = tasks.filter(t => isSameDay(new Date(t.date), day));

                    return (
                        <div
                            key={idx}
                            className={cn(
                                "min-h-[80px] p-1 flex flex-col items-start justify-start rounded-md text-sm transition-colors cursor-pointer hover:bg-accent relative border border-transparent",
                                !isCurrentMonth && "text-muted-foreground opacity-50",
                                status === 'all-completed' && "bg-green-500/10 border-green-200",
                                status === 'partial' && "bg-yellow-500/10 border-yellow-200",
                                status === 'today' && "border-2 border-primary"
                            )}
                        >
                            <div className="flex justify-between w-full">
                                <span className="font-medium text-xs">{format(day, 'd')}</span>
                                {percentage > 0 && <span className="text-[10px] font-bold text-green-600">{percentage}%</span>}
                            </div>

                            <div className="w-full mt-1 space-y-1">
                                {dayTasks.map((t, i) => (
                                    <div key={i} className="text-[10px] bg-primary/10 text-primary px-1 rounded truncate w-full" title={t.title}>
                                        {t.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="flex gap-4 mt-4 text-xs text-muted-foreground justify-center">
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-green-500/20 border border-green-200"></div> All Done
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-yellow-500/10 border border-yellow-200"></div> Partial
                </div>
            </div>
        </div>
    );
}
