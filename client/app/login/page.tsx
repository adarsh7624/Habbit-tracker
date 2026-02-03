'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, formData);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data));
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Invalid credentials');
        }
    };

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <div className="container flex items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 mx-auto">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-2xl text-center">Welcome Back</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && <p className="text-destructive text-sm text-center">{error}</p>}
                            <div>
                                <label className="text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    placeholder="hello@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Password</label>
                                <Input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />
                            </div>
                            <Button type="submit" className="w-full">Login</Button>
                            <p className="text-sm text-center text-muted-foreground">
                                Don't have an account? <Link href="/signup" className="text-primary hover:underline">Sign Up</Link>
                            </p>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
