'use client';
import { Card, CardContent } from "@/components/ui/card";
import { Check, Clock, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

type Task = {
    _id: string;
    title: string;
    duration: string;
    difficulty: string;
    isCompleted: boolean;
    category: string;
    date: string;
};

export default function TaskTimeline({ tasks, onToggle }: { tasks: Task[], onToggle: (id: string) => void }) {
    if (tasks.length === 0) return null;

    const total = tasks.length;
    const completed = tasks.filter(t => t.isCompleted).length;
    const progress = Math.round((completed / total) * 100);

    return (
        <div className="space-y-4 mt-8">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Daily Goal Progress
                </h2>
                <div className="flex items-center gap-3">
                    <div className="text-sm font-bold text-muted-foreground">{progress}% Completed</div>
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full bg-green-500 transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
            <div className="relative border-l-2 border-muted ml-4 space-y-6 pb-2">
                {tasks.map((task, i) => (
                    <div key={task._id} className="ml-8 relative group">
                        {/* Timeline Node */}
                        <div className={cn(
                            "absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 bg-background transition-colors",
                            task.isCompleted ? "border-green-500" : "border-muted-foreground group-hover:border-primary"
                        )}></div>

                        <Card className={cn(
                            "transition-all cursor-pointer hover:shadow-md",
                            task.isCompleted ? "opacity-60 bg-muted" : "bg-card"
                        )} onClick={() => onToggle(task._id)}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <h4 className={cn("font-semibold", task.isCompleted && "line-through")}>
                                        {task.title}
                                    </h4>
                                    <div className="flex gap-3 text-xs text-muted-foreground mt-1">
                                        <span className="bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
                                            {task.duration || 'Flexible'}
                                        </span>
                                        <span className={cn(
                                            "capitalize px-1 rounded",
                                            task.difficulty === 'hard' ? "text-red-500" : "text-green-500"
                                        )}>{task.difficulty}</span>
                                        <span>{task.category}</span>
                                    </div>
                                </div>
                                <div className={cn(
                                    "h-6 w-6 rounded-full border flex items-center justify-center cursor-pointer hover:bg-muted",
                                    task.isCompleted ? "bg-green-500 border-green-500 text-white" : "border-muted"
                                )} onClick={(e) => {
                                    e.stopPropagation(); // Prevent card click if we want separate actions later, but redundancy is fine for now
                                    onToggle(task._id);
                                }}>
                                    {task.isCompleted && <Check className="h-4 w-4" />}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}
