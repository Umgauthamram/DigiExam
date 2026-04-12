
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Search, Download, FileText, Key } from 'lucide-react';

export default function ExamResultsPage({ params }) {
    const unwrappedParams = use(params);
    const examId = unwrappedParams.id;
    const router = useRouter();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const res = await fetch(`/api/admin/exams/${examId}/results`);
                const data = await res.json();
                if (res.ok) {
                    setResults(data.results || []);
                }
            } catch (error) {
                console.error("Failed to load results:", error);
            } finally {
                setLoading(false);
            }
        };

        if (examId) fetchResults();
    }, [examId]);

    const filteredResults = results.filter(r =>
        r.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-black text-white p-8 relative overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Ambient Effects */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/dashboard" className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                            <div className="bg-white/5 p-2 rounded-full group-hover:bg-white/10 transition-colors">
                                <ArrowLeft className="h-5 w-5" />
                            </div>
                            <span className="font-bold text-sm uppercase tracking-widest">Dashboard</span>
                        </Link>
                    </div>

                    <div className="text-center">
                        <h1 className="text-3xl font-black tracking-tight mb-1 bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent">
                            Exam Results
                        </h1>
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Performance Reports</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href={`/admin/exams/${examId}/control`}>
                            <button className="bg-white/5 hover:bg-white/10 text-white text-sm px-5 py-2.5 rounded-xl font-bold transition-all border border-white/10 flex items-center gap-2 hover:scale-[1.02]">
                                <Key className="h-4 w-4" /> OTP
                            </button>
                        </Link>
                        <Link href={`/admin/exams/${examId}/manage-questions`}>
                            <button className="bg-white/5 hover:bg-white/10 text-white text-sm px-5 py-2.5 rounded-xl font-bold transition-all border border-white/10 flex items-center gap-2 hover:scale-[1.02]">
                                <FileText className="h-4 w-4" /> Question Paper
                            </button>
                        </Link>
                    </div>
                </div>

                <div className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="relative w-full md:w-auto">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Search student..."
                                className="bg-black/50 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 w-full md:w-72 transition-all placeholder:text-slate-600"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="text-sm text-slate-400 font-medium">
                            {results.length === 0 ? (
                                <span className="text-slate-600 italic">No submissions yet</span>
                            ) : (
                                <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg">
                                    <span className="text-slate-400">Total Participants</span>
                                    <span className="w-px h-4 bg-white/10"></span>
                                    <span className="text-white font-bold">{results.length}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-white/5 text-slate-400 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-5">Student</th>
                                    <th className="px-6 py-5 text-center">Score</th>
                                    <th className="px-6 py-5">Performance</th>
                                    <th className="px-6 py-5">Violations</th>
                                    <th className="px-6 py-5">Time Taken</th>
                                    <th className="px-6 py-5">Submitted At</th>
                                    <th className="px-6 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    // Skeleton Loader
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-white/5 rounded-full w-10 h-10"></div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="h-4 bg-white/10 rounded w-32"></div>
                                                        <div className="h-3 bg-white/5 rounded w-48"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <div className="h-6 bg-white/10 rounded w-12 mx-auto"></div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="h-2 bg-white/5 rounded-full w-32 mb-2"></div>
                                                <div className="h-3 bg-white/5 rounded w-10"></div>
                                            </td>
                                            <td className="px-6 py-6"><div className="h-6 bg-white/5 rounded w-24"></div></td>
                                            <td className="px-6 py-6"><div className="h-4 bg-white/10 rounded w-16"></div></td>
                                            <td className="px-6 py-6">
                                                <div className="space-y-1">
                                                    <div className="h-3 bg-white/10 rounded w-20"></div>
                                                    <div className="h-3 bg-white/5 rounded w-16"></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right"><div className="h-8 bg-white/10 rounded w-24 ml-auto"></div></td>
                                        </tr>
                                    ))
                                ) : filteredResults.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="p-12 text-center">
                                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Search className="text-slate-600" />
                                            </div>
                                            <p className="text-slate-500 font-medium">No results found matching your search.</p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredResults.map((result) => (
                                        <tr key={result._id} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 p-2.5 rounded-full border border-white/5 group-hover:border-white/10 transition-colors">
                                                        <User className="h-5 w-5 text-purple-300" />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-white text-base group-hover:text-purple-300 transition-colors">{result.user.name}</div>
                                                        <div className="text-xs text-slate-500 font-mono">{result.user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <span className="font-mono text-xl font-bold text-white tracking-tight">
                                                    {result.score}
                                                </span>
                                                <span className="text-slate-600 text-sm font-bold ml-1">/ {result.totalQuestions}</span>
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className={`text-xs font-bold ${result.percentage >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                                                        {result.percentage}%
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ${result.percentage >= 50 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : 'bg-gradient-to-r from-red-500 to-orange-500'}`}
                                                        style={{ width: `${result.percentage}%` }}
                                                    ></div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                {result.violationCount > 0 ? (
                                                    <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold">
                                                        {result.violationCount} Violations
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold">
                                                        Clean
                                                    </div>
                                                )}
                                                {result.violationCount > 0 && result.violationReason && (
                                                    <p className="text-[10px] text-red-400/70 mt-1 max-w-[140px] truncate" title={result.violationReason}>
                                                        {result.violationReason}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-slate-400 font-mono text-sm">
                                                {(() => {
                                                    const s = result.timeTaken;
                                                    if (!s) return 'N/A';
                                                    const m = Math.floor(s / 60);
                                                    const sec = s % 60;
                                                    return `${m}m ${sec}s`;
                                                })()}
                                            </td>
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col">
                                                    <span className="text-slate-300 text-sm font-medium">{new Date(result.submittedAt).toLocaleDateString()}</span>
                                                    <span className="text-slate-600 text-xs font-mono">{new Date(result.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <button
                                                    onClick={() => router.push(`/admin/exams/${examId}/results/${result._id}`)}
                                                    className="bg-purple-600 hover:bg-purple-500 text-white text-xs px-4 py-2 rounded-lg font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-95"
                                                >
                                                    View Report
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
