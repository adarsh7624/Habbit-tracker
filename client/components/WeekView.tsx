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
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';

type WeekViewProps = {
    habits: any[];
    onToggle: (habitId: string) => void;
};

export default function WeekView({ habits, onToggle }: WeekViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const nextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
    const prevWeek = () => setCurrentDate(subWeeks(currentDate, 1));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-lg">
                    Week of {format(startDate, 'MMM d')} - {format(endDate, 'MMM d, yyyy')}
                </h2>
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={prevWeek}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={nextWeek}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="overflow-x-auto pb-2">
                <table className="w-full min-w-[600px]">
                    <thead>
                        <tr>
                            <th className="text-left w-[200px] p-2 text-muted-foreground font-medium">Habit</th>
                            {days.map(day => (
                                <th key={day.toString()} className="p-2 w-12 text-center">
                                    <div className={cn(
                                        "flex flex-col items-center justify-center p-1 rounded-lg",
                                        isSameDay(day, new Date()) && "bg-primary/10 text-primary"
                                    )}>
                                        <span className="text-xs uppercase">{format(day, 'EEE')}</span>
                                        <span className="text-sm font-bold">{format(day, 'd')}</span>
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {habits.map(habit => (
                            <tr key={habit._id} className="border-b last:border-0 border-muted/50">
                                <td className="p-3 font-medium">{habit.title}</td>
                                {days.map(day => {
                                    const isCompleted = habit.history?.some((h: any) =>
                                        isSameDay(new Date(h.date), day) && h.status === 'completed'
                                    );
                                    const isFuture = day > new Date();

                                    return (
                                        <td key={day.toString()} className="p-2 text-center">
                                            <div className="flex justify-center">
                                                <button
                                                    onClick={() => isSameDay(day, new Date()) && onToggle(habit._id)}
                                                    disabled={!isSameDay(day, new Date())} // Currently only supporting today toggle in this view for simplicity
                                                    className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                                                        isCompleted
                                                            ? "bg-green-500 text-white"
                                                            : "bg-muted/30 hover:bg-muted",
                                                        isSameDay(day, new Date()) && !isCompleted && "ring-2 ring-primary ring-offset-2"
                                                    )}
                                                >
                                                    {isCompleted && <Check className="h-4 w-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
