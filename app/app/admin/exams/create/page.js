'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CreateExamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        durationMinutes: 60,
        scheduledAt: '',
        supervisorEmail: '',
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/admin/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) throw new Error('Failed to create exam');

            const data = await res.json();
            router.push(`/admin/exams/${data.exam._id}/manage-questions`);
        } catch (error) {
            console.error(error);
            alert('Error creating exam');
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className="min-h-screen bg-black text-white p-8 relative overflow-hidden flex items-center justify-center">
            {/* Ambient Background Effects */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-5xl mx-auto w-full relative z-10">
                <Link href="/admin/dashboard" className="inline-flex items-center text-slate-400 hover:text-white mb-6 transition-colors group">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center mr-3 group-hover:bg-purple-500/20 transition-all border border-white/5 group-hover:border-purple-500/50">
                        <ArrowLeft className="h-4 w-4 group-hover:text-purple-400" />
                    </div>
                    <span className="font-medium">Back to Dashboard</span>
                </Link>

                <div className="bg-slate-900/50 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
                    {/* Card Top Highlight */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50"></div>

                    <div className="mb-8">
                        <h1 className="text-3xl font-black mb-1 bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
                            Create New Exam
                        </h1>
                        <p className="text-slate-400 text-sm">Configure the details for the upcoming assessment.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                        {/* Left Column: Core Info */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">Exam Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white placeholder-slate-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all font-medium"
                                    placeholder="e.g. Traffic Regulations 101"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">Description</label>
                                <textarea
                                    className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white placeholder-slate-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all h-[180px] font-medium resize-none"
                                    placeholder="Brief instructions for cadets..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Right Column: Settings */}
                        <div className="space-y-6 flex flex-col justify-between">
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">Duration <span className="text-slate-500 lowercase font-normal">(mins)</span></label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all font-mono font-medium"
                                            value={formData.durationMinutes}
                                            onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">Schedule</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all [color-scheme:dark] font-mono text-xs"
                                            value={formData.scheduledAt}
                                            onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider ml-1">Supervisor Email</label>
                                    <input
                                        type="email"
                                        required
                                        className="w-full bg-black/50 border border-white/10 rounded-xl p-3.5 text-white placeholder-slate-600 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 focus:outline-none transition-all font-medium"
                                        placeholder="supervisor@police.gov.in"
                                        value={formData.supervisorEmail}
                                        onChange={(e) => setFormData({ ...formData, supervisorEmail: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 active:scale-[0.98] flex items-center justify-center gap-2 border border-white/10"
                                >
                                    {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                                        <>
                                            <span>Create Exam & Add Questions</span>
                                            <ArrowLeft className="h-4 w-4 rotate-180" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </div>
    );
}
