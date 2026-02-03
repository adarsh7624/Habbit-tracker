import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Sparkles, TrendingUp, Trophy, Skull } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
    isOpen: boolean;
    onClose: () => void;
    stats: {
        level: number;
        xp: number;
        streak: number;
        momentum: number;
        habitCount: number;
    };
};

export default function FutureYouSimulator({ isOpen, onClose, stats }: Props) {
    const [days, setDays] = useState(30);
    const [projection, setProjection] = useState<any>(null);

    useEffect(() => {
        if (!stats) return;

        // Simulator Logic
        const dailyXpBase = stats.habitCount * 15; // Assumption: 15 XP per habit
        const streakBonus = Math.min(stats.streak, 30) * 2; // Cap streak bonus
        const momentumMultiplier = 1 + (stats.momentum / 2000); // 1.05x etc.

        const projectedXpGain = Math.floor((dailyXpBase + streakBonus) * momentumMultiplier * days);
        const totalXp = stats.xp + projectedXpGain;

        // Level Calc (simplified: 100 XP per level increment? Formula: Level * 100)
        // Let's approximate: XP needed for Level L = 50 * L * (L+1)  --> Quadratic curve common in RPGs?
        // Or linear from our backend: nextLevel = user.level * 100. 
        // Let's simulate the backend logic step by step.
        let simLevel = stats.level;
        let simXp = stats.xp;

        // Day by day simulation
        for (let i = 0; i < days; i++) {
            let dailyGain = (dailyXpBase + streakBonus) * momentumMultiplier;
            simXp += dailyGain;

            // Check level up
            // Check backend logic: if (points >= level * 100) level++
            // But usually points accumulate. Let's assume cumulative XP model or resetting?
            // "user.points >= nextLevel". And our backend doesn't reset points on level up? 
            // Wait, backend logic: `if (user.points >= nextLevel) { user.level += 1; }`
            // It DOES NOT reset points. So safe to just accumulate.
            while (simXp >= simLevel * 100) {
                simLevel++;
            }
        }

        setProjection({
            level: simLevel,
            totalXp: Math.floor(simXp),
            xpGained: Math.floor(simXp - stats.xp),
            rank: getRank(simLevel)
        });

    }, [days, stats]);

    const getRank = (lvl: number) => {
        if (lvl > 50) return 'Legendary';
        if (lvl > 30) return 'Elite';
        if (lvl > 15) return 'Disciplined';
        if (lvl > 5) return 'Improver';
        return 'Beginner';
    };

    if (!isOpen) return null;

    return (
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <Card className="w-full max-w-2xl bg-white border-2 border-indigo-100 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="bg-indigo-600 p-4 md:p-6 text-white relative overflow-hidden flex-shrink-0">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Sparkles size={120} /></div>
                    <h2 className="text-xl md:text-2xl font-black flex items-center gap-2 relative z-10">
                        <TrendingUp className="h-5 w-5 md:h-6 md:w-6" /> Future You Simulator
                    </h2>
                    <p className="opacity-80 relative z-10 text-sm md:text-base">See where consistency takes you.</p>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 md:top-4 md:right-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition-colors z-50"
                        aria-label="Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                    </button>
                </div>

                <CardContent className="p-4 md:p-6 overflow-y-auto">
                    <div className="mb-6 md:mb-8 p-3 md:p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                        <label className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-4 block flex justify-between">
                            <span>Projection Duration</span>
                            <span className="text-indigo-600">{days} Days</span>
                        </label>
                        <Slider
                            value={[days]}
                            onValueChange={(vals) => setDays(vals[0])}
                            min={7} max={365} step={1}
                            className="py-4"
                        />
                        <div className="flex justify-between text-[10px] md:text-xs text-slate-400 font-medium px-1">
                            <span>1 Week</span>
                            <span>1 Month</span>
                            <span>1 Year</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {/* The Path of Consistency */}
                        <div className="space-y-3 md:space-y-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                                <span className="p-1 bg-green-100 rounded text-green-600"><TrendingUp size={16} /></span>
                                If you keep going...
                            </h3>

                            <div className="bg-white border-2 border-green-100 rounded-xl p-4 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-green-100"></div>
                                <div className="relative z-10">
                                    <div className="text-[10px] md:text-sm text-slate-500 font-bold uppercase tracking-wider">Projected Level</div>
                                    <div className="text-4xl md:text-5xl font-black text-slate-800 my-2">{projection?.level}</div>
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-[10px] md:text-xs font-bold">
                                        Rank: {projection?.rank}
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-end">
                                        <div className="text-[10px] md:text-sm text-slate-500">Total XP Gained</div>
                                        <div className="font-mono font-bold text-green-600">+{projection?.xpGained.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* The Cost of Quitting */}
                        <div className="space-y-3 md:space-y-4">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                                <span className="p-1 bg-red-100 rounded text-red-600"><Skull size={16} /></span>
                                If you stop today...
                            </h3>

                            <div className="bg-slate-50 border-2 border-slate-100 rounded-xl p-4 relative overflow-hidden grayscale">
                                <div className="text-[10px] md:text-sm text-slate-500 font-bold uppercase tracking-wider">Projected Level</div>
                                <div className="text-4xl md:text-5xl font-black text-slate-400 my-2">{stats?.level}</div>
                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-slate-200 text-slate-500 rounded text-[10px] md:text-xs font-bold">
                                    Rank: Stagnant
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-end">
                                    <div className="text-[10px] md:text-sm text-slate-500">XP Missed</div>
                                    <div className="font-mono font-bold text-red-400">-{projection?.xpGained.toLocaleString()}</div>
                                </div>
                            </div>

                            <p className="text-[10px] md:text-xs text-slate-400 italic text-center mt-2">
                                "The only bad workout is the one that didn't happen."
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
