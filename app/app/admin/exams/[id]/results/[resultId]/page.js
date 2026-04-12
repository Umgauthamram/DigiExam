'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, User, CheckCircle, XCircle, Brain, AlertTriangle, Clock, MinusCircle, Flag } from 'lucide-react';

export default function AdminResultDetailPage({ params }) {
    const unwrappedParams = use(params);
    const { id: examId, resultId } = unwrappedParams;
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const res = await fetch(`/api/admin/results/${resultId}`);
                if (res.ok) {
                    const data = await res.json();
                    setResult(data.result);
                } else {
                    console.error("Result not found");
                }
            } catch (error) {
                console.error("Fetch detail error", error);
            } finally {
                setLoading(false);
            }
        };
        if (resultId) fetchDetail();
    }, [resultId]);

    const formatTime = (seconds) => {
        if (!seconds) return '0s';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    if (loading) return (
        <div className="min-h-screen bg-black text-white p-8 relative overflow-hidden font-sans">
            {/* Ambient Effects */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none animate-pulse"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

            <div className="max-w-6xl mx-auto space-y-8 relative z-10">
                {/* Header Skeleton */}
                <div className="flex justify-between items-center animate-pulse">
                    <div className="h-6 w-32 bg-white/10 rounded-full"></div>
                    <div className="space-y-2 text-right">
                        <div className="h-8 w-48 bg-white/10 rounded-lg ml-auto"></div>
                        <div className="h-4 w-32 bg-white/5 rounded-lg ml-auto"></div>
                    </div>
                </div>

                {/* Main Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Profile Skeleton */}
                    <div className="h-64 bg-white/5 rounded-3xl border border-white/10 p-6 flex flex-col justify-center animate-pulse">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 bg-white/10 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-6 w-3/4 bg-white/10 rounded"></div>
                                <div className="h-4 w-1/2 bg-white/5 rounded"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-20 bg-white/5 rounded-2xl"></div>
                            <div className="h-20 bg-white/5 rounded-2xl"></div>
                        </div>
                    </div>

                    {/* Score Skeleton */}
                    <div className="h-64 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center animate-pulse relative overflow-hidden">
                        <div className="w-40 h-40 rounded-full border-8 border-white/5"></div>
                    </div>

                    {/* Stats Skeleton */}
                    <div className="h-64 bg-white/5 rounded-3xl border border-white/10 p-6 flex flex-col justify-center gap-4 animate-pulse">
                        <div className="h-12 bg-white/5 rounded-xl w-full"></div>
                        <div className="h-12 bg-white/5 rounded-xl w-full"></div>
                        <div className="h-12 bg-white/5 rounded-xl w-full"></div>
                    </div>
                </div>

                {/* List Skeleton */}
                <div className="space-y-4">
                    <div className="h-8 w-64 bg-white/10 rounded-lg animate-pulse mb-6"></div>
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 bg-white/5 rounded-3xl border border-white/10 animate-pulse"></div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (!result) return <div className="min-h-screen bg-black text-white p-10 flex items-center justify-center">Result not found.</div>;

    const percentage = result.percentage;
    const correctCount = result.answers.filter(a => a.isCorrect).length;
    const notAnsweredCount = result.answers.filter(a => !a.selected).length;
    const wrongCount = result.totalQuestions - correctCount - notAnsweredCount;

    // Logic for Colors/Feedback
    const isLowScore = percentage < 30;
    const scoreColor = isLowScore ? 'text-red-500' : 'text-green-500';
    const scoreGradient = isLowScore ? 'from-red-500 to-orange-500' : 'from-green-500 to-emerald-400';
    const strokeColor = isLowScore ? 'stroke-red-500' : 'stroke-green-500';

    let feedbackTitle = "Well done!";
    let feedbackDesc = "You performed well on this assessment.";
    let feedbackColor = "text-green-400";

    if (percentage === 100) {
        feedbackTitle = "Outstanding!";
        feedbackDesc = "Perfect Score! Incredible work.";
        feedbackColor = "text-purple-400";
    } else if (percentage < 30) {
        feedbackTitle = "Better luck next time";
        feedbackDesc = "Keep practicing effectively to improve.";
        feedbackColor = "text-red-400";
    }

    // SVG Graph Calculation
    const radius = 50;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="min-h-screen bg-black text-white p-8 relative overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Ambient Effects */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-900/30 rounded-full blur-[120px] pointer-events-none mix-blend-screen"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none mix-blend-screen"></div>

            <div className="max-w-6xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-10">
                    <Link href={`/admin/exams/${examId}/results`} className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <div className="bg-white/5 p-2 rounded-full group-hover:bg-white/10 transition-colors border border-white/5">
                            <ArrowLeft className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-sm uppercase tracking-widest group-hover:text-purple-300 transition-colors">Back to Results List</span>
                    </Link>
                    <div className="text-right">
                        <h1 className="text-4xl font-black tracking-tight mb-1 bg-gradient-to-r from-purple-400 via-white to-blue-400 bg-clip-text text-transparent capitalize">
                            {result.examTitle}
                        </h1>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest border-b border-white/5 pb-2 inline-block">
                            Report Generated: {new Date(result.submittedAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                {/* Score Card & Graph */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Student Info */}
                    <div className="bg-gradient-to-br from-slate-900/90 via-black to-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex flex-col justify-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-5 mb-8">
                                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-0.5 rounded-2xl shadow-lg shadow-purple-500/20">
                                    <div className="bg-black p-3.5 rounded-2xl">
                                        <User className="h-8 w-8 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white mb-1 group-hover:text-purple-300 transition-colors">{result.user.name}</h2>
                                    <p className="text-slate-400 text-sm font-mono bg-white/5 px-2 py-0.5 rounded inline-block">{result.user.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors">
                                    <AlertTriangle className={`h-5 w-5 ${result.violationCount > 0 ? 'text-red-500' : 'text-green-500'}`} />
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Violations</div>
                                        <div className="text-xl font-black text-white leading-none">{result.violationCount}</div>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-3 hover:bg-white/10 transition-colors">
                                    <Clock className="h-5 w-5 text-blue-400" />
                                    <div>
                                        <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-0.5">Time</div>
                                        <div className="text-xl font-black text-white leading-none">
                                            {formatTime(result.timeTaken)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Water Bowl Graph (Liquid Fill) */}
                    <div className="bg-gradient-to-br from-slate-900/90 via-black to-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center relative shadow-2xl overflow-hidden group">

                        <div className="relative w-48 h-48 rounded-full border-4 border-red-100/20 bg-red-100 overflow-hidden shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] transform translate-z-0">
                            {/* The Wave/Liquid */}
                            <div
                                className="absolute left-1/2 w-[200%] h-[200%] bg-red-500 rounded-[40%] animate-[spin_6s_linear_infinite] origin-center -translate-x-1/2 transition-all duration-1000 ease-out opacity-90"
                                style={{
                                    top: `${100 - percentage}%`
                                }}
                            ></div>

                            {/* Second wave for depth */}
                            <div
                                className="absolute left-1/2 w-[205%] h-[205%] bg-red-600/30 rounded-[38%] animate-[spin_8s_linear_infinite] origin-center -translate-x-1/2 transition-all duration-1000 ease-out"
                                style={{
                                    top: `${100 - percentage - 5}%`
                                }}
                            ></div>

                            {/* Text Overlay */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                <span className="text-5xl font-black text-red-700 drop-shadow-sm">{percentage}%</span>
                                <span className="text-xs text-red-700/70 uppercase font-bold tracking-widest mt-1">Total Score</span>
                            </div>
                        </div>

                        <div className="absolute bottom-6 text-center z-10">
                            <p className={`text-sm font-bold ${feedbackColor}`}>{feedbackTitle}</p>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="bg-gradient-to-br from-slate-900/90 via-black to-slate-900/90 backdrop-blur-xl p-8 rounded-3xl border border-white/10 flex flex-col justify-center gap-4 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-green-500/10 hover:border-green-500/20 transition-all duration-300 group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500 group-hover:bg-green-500 group-hover:text-white transition-colors">
                                    <CheckCircle className="h-4 w-4" />
                                </div>
                                <span className="text-slate-300 font-bold text-sm group-hover:text-green-300">Correct</span>
                            </div>
                            <span className="text-2xl font-black text-white">{correctCount}</span>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-300 group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-500/10 rounded-lg text-red-500 group-hover:bg-red-500 group-hover:text-white transition-colors">
                                    <XCircle className="h-4 w-4" />
                                </div>
                                <span className="text-slate-300 font-bold text-sm group-hover:text-red-300">Wrong</span>
                            </div>
                            <span className="text-2xl font-black text-white">{wrongCount}</span>
                        </div>

                        <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-slate-500/10 hover:border-slate-500/20 transition-all duration-300 group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-500/10 rounded-lg text-slate-400 group-hover:bg-slate-500 group-hover:text-white transition-colors">
                                    <MinusCircle className="h-4 w-4" />
                                </div>
                                <span className="text-slate-300 font-bold text-sm group-hover:text-slate-300">Skipped</span>
                            </div>
                            <span className="text-2xl font-black text-white">{notAnsweredCount}</span>
                        </div>

                        <div className="mt-2 pt-4 border-t border-white/5 flex justify-between items-center px-2">
                            <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">Total Questions</span>
                            <span className="text-white font-mono font-bold text-lg">{result.totalQuestions}</span>
                        </div>
                    </div>
                </div>

                {/* Violation Details Section (Compact) */}
                {result.violationCount > 0 && (
                    <div className="mb-8 flex items-start gap-4 p-4 bg-red-100 border border-red-200 rounded-xl relative overflow-hidden group">
                        <div className="bg-red-200 p-2 rounded-lg shrink-0 border border-red-300">
                            <Flag className="h-5 w-5 text-red-700" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-sm font-bold text-red-800">Security Flags Detected</h3>
                                <span className="px-1.5 py-0.5 bg-red-800 text-white text-[10px] font-bold rounded-md">
                                    {result.violationCount}
                                </span>
                            </div>

                            {result.violationReason ? (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {[...new Set((result.violationReason || '').split(',').map(s => s.trim()))].filter(Boolean).map((reason, i) => (
                                        <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 bg-white/60 border border-red-200 rounded text-[11px] font-bold text-red-900 shadow-sm">
                                            <span className="w-1 h-1 bg-red-600 rounded-full animate-pulse"></span>
                                            {reason}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-xs text-red-700 font-medium">Suspicious activity recorded during the session.</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Detailed Analysis Title */}
                <h2 className="text-2xl font-black mb-6 flex items-center gap-4 text-white">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">Detailed Analysis</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                </h2>

                <div className="space-y-6">
                    {result.answers.map((ans, idx) => {
                        const isSkipped = !ans.selected;
                        const isCorrect = ans.isCorrect;
                        // Card styling based on status
                        let cardClass = 'bg-gradient-to-br from-slate-900/40 to-black border-white/5 hover:border-white/10'; // Default
                        let icon = <MinusCircle className="h-6 w-6 text-slate-500" />;
                        let statusColor = "text-slate-500";

                        if (isCorrect) {
                            cardClass = 'bg-gradient-to-br from-green-950/10 to-black border-green-500/20 hover:border-green-500/30';
                            icon = <CheckCircle className="h-6 w-6 text-green-500" />;
                            statusColor = "text-green-500";
                        } else if (!isSkipped) {
                            cardClass = 'bg-gradient-to-br from-red-950/10 to-black border-red-500/20 hover:border-red-500/30';
                            icon = <XCircle className="h-6 w-6 text-red-500" />;
                            statusColor = "text-red-500";
                        }

                        return (
                            <div key={idx} className={`rounded-2xl border p-5 transition-all duration-300 ${cardClass} group hover:shadow-lg`}>
                                <div className="flex gap-4">
                                    <div className="mt-0.5 flex-shrink-0">
                                        {icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-base mb-4 text-white leading-snug">
                                            <span className={`mr-2 ${statusColor} opacity-70 font-mono text-sm`}>Q{idx + 1}.</span>
                                            {ans.text}
                                        </h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                            {/* Student Answer */}
                                            <div className={`p-3 rounded-xl border transition-colors ${isCorrect ? 'bg-green-500/10 border-green-500/30' :
                                                isSkipped ? 'bg-white/5 border-white/5' :
                                                    'bg-red-500/10 border-red-500/30'
                                                }`}>
                                                <span className="text-[9px] uppercase font-black tracking-widest mb-1 block text-slate-500">Student Answer</span>
                                                <p className={`font-medium text-sm ${isSkipped ? 'text-slate-500 italic' : 'text-white'}`}>
                                                    {isSkipped ? 'Not Answered' : ans.selected}
                                                </p>
                                            </div>

                                            {/* Correct Answer (Shows if wrong or skipped) */}
                                            {!isCorrect && (
                                                <div className="p-3 rounded-xl border bg-gradient-to-br from-slate-900 to-black border-white/10">
                                                    <span className="text-[9px] uppercase font-black tracking-widest text-slate-500 mb-1 block">Correct Answer</span>
                                                    <p className="font-medium text-sm text-slate-300">
                                                        {ans.correct}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Correct Answer (Highlighted context if correct) */}
                                            {isCorrect && (
                                                <div className="p-3 rounded-xl border bg-green-500/5 border-green-500/10 opacity-50">
                                                    <span className="text-[9px] uppercase font-black tracking-widest text-green-500/50 mb-1 block">Correct Answer</span>
                                                    <p className="font-medium text-sm text-green-100/50">
                                                        {ans.correct}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {!isCorrect && ans.aiExplanation && (
                                            <div className="mt-3 bg-gradient-to-r from-purple-900/10 to-blue-900/10 border border-purple-500/20 p-4 rounded-xl relative overflow-hidden group-hover:border-purple-500/30 transition-colors">
                                                <div className="absolute top-0 left-0 w-0.5 h-full bg-purple-500"></div>
                                                <div className="flex items-center gap-2 text-purple-400 font-bold mb-1 text-xs uppercase tracking-wider">
                                                    <Brain className="h-3 w-3" /> AI Explanation
                                                </div>
                                                <p className="text-purple-200/80 text-xs leading-relaxed font-medium">
                                                    {ans.aiExplanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
