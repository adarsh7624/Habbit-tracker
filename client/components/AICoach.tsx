'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, X, Send, User, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

interface Message {
    role: 'user' | 'model';
    parts: string;
}

export default function AICoach() {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');
        setMessages(prev => [...prev, { role: 'user', parts: userMsg }]);
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            // Format history for Gemini API (user/model roles)
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.parts }]
            }));

            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/coach/chat`, {
                message: userMsg,
                history: history
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessages(prev => [...prev, { role: 'model', parts: res.data.reply }]);
        } catch (error) {
            console.error(error);
            setMessages(prev => [...prev, { role: 'model', parts: "I'm having trouble connecting right now. Please check your API Key." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end pointer-events-none">
            {/* Chat Window */}
            {isOpen && (
                <Card className="w-[calc(100vw-2rem)] sm:w-80 md:w-96 shadow-2xl border-primary/20 mb-4 animate-in fade-in slide-in-from-bottom-10 pointer-events-auto bg-background/95 backdrop-blur">
                    <CardHeader className="flex flex-row items-center justify-between py-3 border-b bg-primary/5">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary p-1.5 rounded-lg">
                                <Bot className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-bold">AI Habit Coach</CardTitle>
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </CardHeader>

                    <CardContent className="p-0">
                        {/* Messages Area */}
                        <div ref={scrollRef} className="h-[50vh] sm:h-80 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-muted-foreground text-sm mt-10 space-y-2">
                                    <Sparkles className="h-8 w-8 mx-auto text-primary/30" />
                                    <p>Hi! I'm your personal coach.</p>
                                    <p className="text-xs">Ask "What should I focus on today?"</p>
                                </div>
                            )}

                            {messages.map((m, i) => (
                                <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                        }`}>
                                        {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                                    </div>
                                    <div className={`rounded-2xl px-3 py-2 text-sm max-w-[80%] break-words ${m.role === 'user'
                                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                                        : 'bg-muted rounded-tl-none'
                                        }`}>
                                        {m.parts}
                                    </div>
                                </div>
                            ))}

                            {loading && (
                                <div className="flex gap-2">
                                    <div className="mt-1 h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                                        <Bot size={12} />
                                    </div>
                                    <div className="bg-muted rounded-2xl rounded-tl-none px-4 py-2 flex items-center gap-1">
                                        <div className="h-1.5 w-1.5 bg-foreground/30 rounded-full animate-bounce delay-0"></div>
                                        <div className="h-1.5 w-1.5 bg-foreground/30 rounded-full animate-bounce delay-100"></div>
                                        <div className="h-1.5 w-1.5 bg-foreground/30 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input Area */}
                        <div className="p-3 border-t bg-muted/20">
                            <form
                                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                                className="flex gap-2"
                            >
                                <Input
                                    className="bg-background"
                                    placeholder="Type a message..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <Button type="submit" size="icon" disabled={loading || !input.trim()}>
                                    <Send className="h-4 w-4" />
                                </Button>
                            </form>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Floating Toggle Button */}
            <Button
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg border-2 border-primary/20 pointer-events-auto hover:scale-110 transition-transform duration-200"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <X className="h-6 w-6" /> : <Bot className="h-8 w-8" />}
            </Button>
        </div>
    );
}
