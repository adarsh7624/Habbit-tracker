'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2 } from 'lucide-react';

export default function SignupPage() {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Signup failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));

            toast.success('Account created!', {
                description: "Welcome to the family. Let's get started.",
                icon: <CheckCircle2 className="text-emerald-500" />
            });

            // Direct navigation to dashboard
            router.push('/dashboard');
        } catch (err: any) {
            toast.error('Signup Failed', {
                description: err.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid lg:grid-cols-2">
            {/* Left Side - Motivational/Brand */}
            <div className="relative hidden lg:flex flex-col justify-between p-12 bg-slate-900 text-white overflow-hidden">
                {/* Background Image */}
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/50 to-slate-900/30"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
                        <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        HabitFlow
                    </div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h1 className="text-5xl font-bold tracking-tight mb-6">
                            Transform your life, one habit at a time.
                        </h1>
                        <ul className="space-y-4 text-lg text-slate-300">
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="text-orange-500" />
                                <span>Track your daily progress</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="text-orange-500" />
                                <span>Get AI-powered insights</span>
                            </li>
                            <li className="flex items-center gap-3">
                                <CheckCircle2 className="text-orange-500" />
                                <span>Build streaks and earn XP</span>
                            </li>
                        </ul>
                    </motion.div>
                </div>

                <div className="relative z-10 flex gap-4 text-sm text-slate-400">
                    <span>© 2026 HabitFlow</span>
                    <span>Terms of Service</span>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex items-center justify-center p-8 bg-slate-50 lg:bg-white min-h-screen lg:min-h-0">
                <div className="w-full max-w-md space-y-8 bg-white lg:bg-transparent p-8 lg:p-0 rounded-2xl shadow-xl lg:shadow-none ring-1 lg:ring-0 ring-slate-100">
                    <div className="text-center lg:text-left">
                        {/* Mobile Branding */}
                        <div className="flex lg:hidden justify-center mb-8">
                            <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-slate-900">
                                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-orange-200 shadow-lg">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <span className="text-2xl">HabitFlow</span>
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Create an account</h2>
                        <p className="mt-2 text-slate-500">
                            Start your journey to a better you.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700">Full Name</label>
                                <Input
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    className="mt-1 h-12 bg-slate-50 lg:bg-white border-slate-200 focus:bg-white transition-all text-base"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Email</label>
                                <Input
                                    type="email"
                                    placeholder="hello@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="mt-1 h-12 bg-slate-50 lg:bg-white border-slate-200 focus:bg-white transition-all text-base"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700">Password</label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    placeholder="Create a strong password"
                                    className="mt-1 h-12 bg-slate-50 lg:bg-white border-slate-200 focus:bg-white transition-all text-base"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-orange-600 hover:bg-orange-500 text-white font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-500/20 disabled:opacity-70 disabled:hover:scale-100 text-base"
                        >
                            {loading ? 'Creating account...' : 'Get Started'}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-500">
                        Already have an account?{' '}
                        <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
