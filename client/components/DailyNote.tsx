import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Save, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

interface DailyNoteProps {
    date: Date;
}

export default function DailyNote({ date }: DailyNoteProps) {
    const [content, setContent] = useState('');
    const [entries, setEntries] = useState<{ content: string, timestamp: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Format date as YYYY-MM-DD for backend
    const dateStr = date.toLocaleDateString('en-CA'); // 'en-CA' outputs YYYY-MM-DD
    const displayDate = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    useEffect(() => {
        fetchNote();
    }, [dateStr]);

    const fetchNote = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/notes/${dateStr}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.data) {
                if (res.data.entries && res.data.entries.length > 0) {
                    setEntries(res.data.entries.reverse()); // Show newest first
                } else if (res.data.content) {
                    // Legacy support: Convert single content to one entry
                    setEntries([{ content: res.data.content, timestamp: res.data.updatedAt }]);
                } else {
                    setEntries([]);
                }
            } else {
                setEntries([]);
            }
        } catch (err) {
            console.error('Failed to fetch note', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        if (!content.trim()) return;

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) return;

            const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/notes`,
                { date: dateStr, content },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update entries list from response
            if (res.data && res.data.entries) {
                setEntries(res.data.entries.reverse());
            }

            setContent(''); // Clear input
            toast.success('Note added to daily log');
        } catch (err) {
            console.error('Failed to save note', err);
            toast.error('Failed to save note');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Card className="h-full border-none shadow-sm bg-white/50 backdrop-blur-sm flex flex-col">
            <CardHeader className="pb-2 flex-shrink-0">
                <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-500" />
                    Daily Journal <span className="text-slate-400 font-normal ml-auto text-xs">{displayDate}</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
                <div className="relative mb-4 flex-shrink-0">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Write your thoughts for ${displayDate}...`}
                        className="w-full h-24 p-3 rounded-lg border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none transition-all placeholder:text-slate-300"
                    />
                    <div className="flex justify-end mt-2">
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={isSaving || isLoading || !content.trim()}
                            className={`gap-2 transition-all ${isSaving ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                        >
                            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                            {isSaving ? 'Saving...' : 'Add Entry'}
                        </Button>
                    </div>
                </div>

                {/* Saved Entries List */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-20 text-slate-400">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </div>
                    ) : entries.length === 0 ? (
                        <div className="text-center text-slate-400 text-xs py-4 italic">
                            No entries for this day yet.
                        </div>
                    ) : (
                        entries.map((entry, idx) => (
                            <div key={idx} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 text-sm animate-in fade-in slide-in-from-top-2">
                                <p className="text-slate-700 whitespace-pre-wrap">{entry.content}</p>
                                <p className="text-[10px] text-slate-400 mt-2 text-right">
                                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
