'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.message || 'Login failed');

            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data));

            toast.success('Welcome back!', {
                description: "Let's crush some habits today.",
                icon: <Sparkles className="text-orange-500" />
            });

            router.push('/dashboard');
        } catch (err: any) {
            toast.error('Login Failed', {
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
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
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
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-5xl font-bold tracking-tight mb-6"
                    >
                        Consistency is the key to success.
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-lg text-slate-300"
                    >
                        "Success occurs when opportunity meets preparation. Start preparing today."
                    </motion.p>
                </div>

                <div className="relative z-10 flex gap-4 text-sm text-slate-400">
                    <span>© 2026 HabitFlow</span>
                    <span>Privacy Policy</span>
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

                        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Sign in</h2>
                        <p className="mt-2 text-slate-500">
                            Welcome back! Please enter your details.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
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
                                    placeholder="••••••••"
                                    className="mt-1 h-12 bg-slate-50 lg:bg-white border-slate-200 focus:bg-white transition-all text-base"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600" />
                                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600">Remember me</label>
                            </div>
                            <div className="text-sm">
                                <a href="#" className="font-medium text-orange-600 hover:text-orange-500">Forgot password?</a>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100 text-base"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </Button>
                    </form>

                    <p className="text-center text-sm text-slate-500">
                        Don't have an account?{' '}
                        <Link href="/signup" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                            Sign up for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
