'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, LogOut, Moon, Sun, User, Sparkles, Activity, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Navbar() {
    const [token, setToken] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    useEffect(() => {
        setToken(localStorage.getItem('token'));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    return (
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="container flex h-14 items-center justify-between mx-auto px-4">
                <Link href="/" className="flex items-center space-x-2">
                    <span className="font-bold text-xl bg-gradient-to-r from-primary to-blue-500 text-transparent bg-clip-text">
                        HabitFlow
                    </span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center space-x-4">
                    {token ? (
                        <>
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm">
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    Dashboard
                                </Button>
                            </Link>
                            <Link href="/reports">
                                <Button variant="ghost" size="sm">
                                    <Activity className="mr-2 h-4 w-4" />
                                    Reports
                                </Button>
                            </Link>
                            <Link href="/planner">
                                <Button variant="ghost" size="sm">
                                    <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                                    AI Planner
                                </Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                <span className="hidden lg:inline">Logout</span>
                            </Button>
                        </>
                    ) : (
                        <>
                            <Link href="/login">
                                <Button variant="ghost" size="sm" suppressHydrationWarning>Login</Button>
                            </Link>
                            <Link href="/signup">
                                <Button size="sm" suppressHydrationWarning>Get Started</Button>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Button */}
                <div className="flex md:hidden">
                    <Button variant="ghost" size="icon" onClick={toggleMenu}>
                        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className="md:hidden border-t bg-background p-4 space-y-2 shadow-lg absolute w-full left-0 top-14">
                    {token ? (
                        <>
                            <Link href="/dashboard" onClick={toggleMenu} className="block">
                                <Button variant="ghost" size="sm" className="w-full justify-start">
                                    <LayoutDashboard className="mr-2 h-4 w-4" />
                                    Dashboard
                                </Button>
                            </Link>
                            <Link href="/reports" onClick={toggleMenu} className="block">
                                <Button variant="ghost" size="sm" className="w-full justify-start">
                                    <Activity className="mr-2 h-4 w-4" />
                                    Reports
                                </Button>
                            </Link>
                            <Link href="/planner" onClick={toggleMenu} className="block">
                                <Button variant="ghost" size="sm" className="w-full justify-start">
                                    <Sparkles className="mr-2 h-4 w-4 text-purple-500" />
                                    AI Planner
                                </Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={() => { handleLogout(); toggleMenu(); }} className="w-full justify-start text-red-500">
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </>
                    ) : (
                        <div className="flex flex-col space-y-2">
                            <Link href="/login" onClick={toggleMenu} className="block">
                                <Button variant="ghost" size="sm" className="w-full justify-start" suppressHydrationWarning>Login</Button>
                            </Link>
                            <Link href="/signup" onClick={toggleMenu} className="block">
                                <Button size="sm" className="w-full justify-start" suppressHydrationWarning>Get Started</Button>
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
}
