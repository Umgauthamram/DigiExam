'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Search, Filter, Play, Edit, Calendar, Clock, Loader2, Users, BarChart2, ArrowLeft } from 'lucide-react';

export default function ExamListPage() {
    const [exams, setExams] = useState([]);
    const [filteredExams, setFilteredExams] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchExams();
    }, []);

    useEffect(() => {
        if (!searchQuery) {
            setFilteredExams(exams);
        } else {
            const lowerQuery = searchQuery.toLowerCase();
            setFilteredExams(exams.filter(e =>
                e.title.toLowerCase().includes(lowerQuery) ||
                (e.description && e.description.toLowerCase().includes(lowerQuery))
            ));
        }
    }, [searchQuery, exams]);

    const fetchExams = async () => {
        try {
            const res = await fetch('/api/admin/exams');
            const data = await res.json();
            if (data.exams) {
                setExams(data.exams);
                setFilteredExams(data.exams);
            }
        } catch (error) {
            console.error('Error fetching exams:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.15),transparent_60%)]"></div>
                <Loader2 className="h-10 w-10 animate-spin text-purple-500 relative z-10" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden font-sans">
            {/* Background Ambience - Purple & Black */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-fuchsia-900/10 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Back Button */}
                <div className="mb-6">
                    <Link href="/admin/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                    </Link>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6 border-b border-white/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-purple-400 mb-2 tracking-tight">
                            Exam Command Center
                        </h1>
                        <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                            Manage sessions, edit questions, and view results.
                        </p>
                    </div>
                    <Link href="/admin/exams/create">
                        <button className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/40 active:scale-95 transition-all group border border-purple-500/20">
                            <Plus className="h-4 w-4 group-hover:rotate-90 transition-transform" />
                            Create New Exam
                        </button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="flex gap-4 mb-8">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search active exams..."
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder:text-slate-500 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 text-sm transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Exam Grid - 2 Columns */}
                {filteredExams.length === 0 ? (
                    <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-dashed border-slate-800 backdrop-blur-sm relative overflow-hidden">
                        <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                            <Search className="h-6 w-6 text-slate-600" />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-1">No Result Found</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            We couldn't find any exams matching your search criteria.
                        </p>
                        {exams.length === 0 && (
                            <Link href="/admin/exams/create" className="text-purple-400 hover:text-purple-300 font-bold inline-flex items-center gap-2 text-sm">
                                <Plus className="h-3 w-3" /> Create your first exam
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredExams.map((exam) => (
                            <div key={exam._id} className="group bg-gradient-to-br from-purple-900/40 via-black to-black border border-white/10 hover:border-purple-500/50 p-6 rounded-2xl transition-all hover:shadow-2xl hover:shadow-purple-900/20 relative overflow-hidden flex flex-col h-full">
                                {/* Gradient Overlay for top-left effect */}
                                <div className="absolute top-0 left-0 w-40 h-40 bg-purple-600/20 blur-[60px] pointer-events-none rounded-full -translate-x-12 -translate-y-12"></div>

                                <div className="relative z-10 flex-1">
                                    <div className="flex justify-between items-start gap-3 mb-3">
                                        <h3 className="text-xl font-bold text-white leading-tight group-hover:text-purple-300 transition-colors line-clamp-2">
                                            {exam.title}
                                        </h3>
                                        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 mt-1">
                                            Active
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-4">
                                        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                                            {new Date(exam.scheduledAt).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                                            {new Date(exam.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5">
                                            <Clock className="h-3.5 w-3.5 text-purple-400" />
                                            {exam.durationMinutes}m duration
                                        </div>
                                    </div>

                                    <p className="text-slate-500 text-sm line-clamp-2 mb-6">
                                        {exam.description || 'No description provided.'}
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-3 relative z-10 pt-4 border-t border-white/5 mt-auto">
                                    <Link href={`/admin/exams/${exam._id}/control`} className="w-full">
                                        <button className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all shadow-lg shadow-purple-900/20 active:scale-95 border border-purple-500/20 h-full group/btn">
                                            <Play className="h-4 w-4 fill-current mb-0.5 group-hover/btn:scale-110 transition-transform" />
                                            OTP
                                        </button>
                                    </Link>

                                    <Link href={`/admin/exams/${exam._id}/manage-questions`} className="w-full">
                                        <button className="w-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 hover:border-white/20 py-2.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 h-full group/btn">
                                            <Edit className="h-4 w-4 mb-0.5 group-hover/btn:rotate-12 transition-transform" />
                                            Edit
                                        </button>
                                    </Link>

                                    <Link href={`/admin/exams/${exam._id}/results`} className="w-full">
                                        <button className="w-full bg-white/5 hover:bg-purple-900/20 text-slate-300 hover:text-purple-300 border border-white/10 hover:border-purple-500/30 py-2.5 rounded-lg text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 group/btn">
                                            <BarChart2 className="h-4 w-4 mb-0.5 group-hover/btn:text-purple-400 transition-colors" />
                                            Results
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
