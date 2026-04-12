'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { PlayCircle, Clock, Calendar, CheckCircle, AlertTriangle, XCircle, RotateCcw } from 'lucide-react';
import { Toaster, toast } from 'sonner';

export default function UserDashboard() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [exams, setExams] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    const [activeSessions, setActiveSessions] = useState({}); // { examId: { startTime, violations } }
    const [currentTime, setCurrentTime] = useState(Date.now());

    const [violationModal, setViolationModal] = useState({
        isOpen: false,
        examId: null,
        reason: ''
    });

    // Fetch Exams
    useEffect(() => {
        fetch('/api/user/dashboard/exams')
            .then(res => res.json())
            .then(data => {
                setExams(data.exams || []);
                setResults(data.results || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
                toast.error("Failed to load dashboard data");
            });
    }, []);

    // Check LocalStorage & URL Params
    useEffect(() => {
        // 1. Load active sessions from localStorage
        const sessions = {};
        if (typeof window !== 'undefined') {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('exam_') && key.endsWith('_session')) {
                    const examId = key.replace('exam_', '').replace('_session', '');
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        sessions[examId] = data;
                    } catch (e) {
                        console.error("Error parsing session", key, e);
                    }
                }
            }
        }
        setActiveSessions(sessions);

        // 2. Check URL for violation return
        const isViolation = searchParams.get('violation') === 'true';
        const vExamId = searchParams.get('examId');
        const vReason = searchParams.get('reason');

        if (isViolation && vExamId) {
            setViolationModal({
                isOpen: true,
                examId: vExamId,
                reason: vReason || 'Security Policy Violation'
            });
            // Clean URL
            router.replace('/user/dashboard');
        }
    }, [searchParams, router]);

    // Timer Sync
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const getExamState = (exam) => {
        const session = activeSessions[exam._id];
        if (!session) return null;

        // Check for max violations immediately
        if ((session.violations || 0) >= 3) {
            return { status: 'terminated' };
        }

        const elapsedSeconds = Math.floor((currentTime - session.startTime) / 1000);
        const totalDurationSeconds = exam.durationMinutes * 60;
        const remainingSeconds = totalDurationSeconds - elapsedSeconds;

        if (remainingSeconds <= 0) return { status: 'expired', remaining: 0 };

        return {
            status: 'active',
            remaining: remainingSeconds,
            violations: session.violations || 0
        };
    };

    const formatTime = (seconds) => {
        if (seconds < 0) return "00:00:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleResume = (examId) => {
        setViolationModal({ ...violationModal, isOpen: false });
        router.push(`/user/exam/${examId}/attempt`);
    };

    const filteredExams = exams.filter(exam => {
        const state = getExamState(exam);
        return !state || state.status !== 'terminated';
    });

    const terminatedExams = exams.filter(exam => {
        const state = getExamState(exam);
        return state && state.status === 'terminated';
    });

    const handleRetake = async (resultId, examId) => {
        if (!confirm("Are you sure you want to discard this attempt and start again?")) return;

        try {
            // Clear Local Storage
            if (examId && typeof window !== 'undefined') {
                localStorage.removeItem(`exam_${examId}_session`);
                localStorage.removeItem(`exam_${examId}_answers`);
            }

            const res = await fetch(`/api/user/result/${resultId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Result cleared. You can now retake the exam.");
                // Simply reload to refresh lists
                window.location.reload();
            } else {
                toast.error("Failed to reset result.");
            }
        } catch (e) {
            console.error(e);
            toast.error("Error resetting result.");
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-8 relative">
            <Toaster position="top-right" richColors theme="dark" />

            {/* Violation Modal */}
            {violationModal.isOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-slate-900 border border-red-500/30 p-8 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.1),transparent_50%)] pointer-events-none"></div>

                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 animate-pulse">
                            <AlertTriangle className="h-10 w-10 text-red-500" />
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">Security Warning</h2>
                        <p className="text-red-300 font-medium mb-1">
                            {violationModal.reason}
                        </p>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Your exam session was interrupted. Leaving the exam environment is a violation of the rules.
                            Please resume immediately.
                        </p>

                        <button
                            onClick={() => handleResume(violationModal.examId)}
                            className="w-full py-4 px-6 rounded-xl font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-5 h-5" /> Resume Exam
                        </button>
                    </div>
                </div>
            )}

            <div className="mb-12">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-400">
                    Exam Corner
                </h2>

                {loading ? (
                    <div className="text-slate-500 animate-pulse">Loading exams...</div>
                ) : filteredExams.length === 0 ? (
                    <div className="bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-12 text-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-fuchsia-500/5 pointer-events-none"></div>
                        <div className="w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-fuchsia-500/20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400 group-hover:text-white transition-colors"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M10 13h4" /><path d="M10 17h4" /><path d="M10 9h1" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                        <p className="text-slate-400 max-w-md mx-auto">
                            No exams are scheduled for you at this moment.
                            Relax and check back later for upcoming assessments.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredExams.map((exam) => {
                            const activeState = getExamState(exam);
                            const isActive = activeState && activeState.status === 'active';
                            const isTerminated = activeState && activeState.status === 'terminated';

                            return (
                                <div key={exam._id} className={`rounded-3xl border p-8 relative overflow-hidden group shadow-2xl transition-all
                                    ${isActive ? 'bg-gradient-to-br from-purple-900/40 via-black to-black border-purple-500/50 shadow-purple-900/20' :
                                        isTerminated ? 'bg-gradient-to-br from-slate-900/30 via-black to-black border-green-500/30 opacity-75' :
                                            'bg-gradient-to-br from-purple-900/30 via-black to-black border-purple-500/20 hover:border-purple-500/50'}
                                `}>
                                    {/* Ambient Light */}
                                    <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] transition-all duration-500 pointer-events-none
                                        ${isActive ? 'bg-purple-600/20' : 'bg-fuchsia-600/10 group-hover:bg-purple-600/20'}
                                    `}></div>

                                    {/* Badges Container - Top Right */}
                                    <div className="absolute top-0 right-0 flex items-stretch h-8 z-20">
                                        {!isActive && (
                                            <div className="bg-white/5 backdrop-blur-md text-slate-300 text-[10px] font-bold px-3 flex items-center border-l border-b border-white/5 rounded-bl-lg">
                                                {exam.durationMinutes} MINS
                                            </div>
                                        )}

                                        {isActive && (
                                            <div className="bg-purple-600 text-white text-[10px] font-bold px-3 flex items-center rounded-bl-xl uppercase tracking-wider animate-pulse shadow-lg shadow-purple-500/20">
                                                In Progress
                                            </div>
                                        )}
                                        {isTerminated && (
                                            <div className="bg-green-100 text-green-700 text-[10px] font-bold px-3 flex items-center rounded-bl-xl uppercase tracking-wider shadow-lg shadow-green-500/20 z-10">
                                                Submitted
                                            </div>
                                        )}
                                    </div>

                                    <div className="relative z-10">
                                        <h3 className="font-bold text-2xl text-white mb-2 group-hover:text-purple-300 transition-colors leading-tight">
                                            {exam.title}
                                        </h3>

                                        <p className="text-slate-400 text-sm mb-8 line-clamp-2 leading-relaxed">
                                            {exam.description || 'No description provided.'}
                                        </p>

                                        {isActive ? (
                                            <div className="mb-6 bg-black/40 backdrop-blur-sm p-4 rounded-2xl border border-white/5">
                                                <div className="flex justify-between items-center text-xs text-slate-400 mb-1">
                                                    <span className="uppercase tracking-widest font-bold">Time Remaining</span>
                                                </div>
                                                <div className="font-mono text-3xl font-bold text-white flex items-center gap-3 mt-1">
                                                    <Clock className="h-6 w-6 text-purple-500" />
                                                    {formatTime(activeState.remaining)}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-6 text-xs text-slate-500 mb-8 font-mono border-t border-white/5 pt-6">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-purple-400" />
                                                    {new Date(exam.scheduledAt).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4 text-purple-400" />
                                                    {new Date(exam.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        )}

                                        {isActive ? (
                                            <button
                                                onClick={() => handleResume(exam._id)}
                                                className="w-full text-center bg-purple-600 hover:bg-purple-500 text-white py-4 rounded-xl font-bold transition-all shadow-lg shadow-purple-900/20 active:scale-[0.98] flex items-center justify-center gap-2"
                                            >
                                                <RotateCcw className="w-5 h-5" /> Resume Exam
                                            </button>
                                        ) : isTerminated ? (
                                            <button
                                                disabled
                                                className="w-full text-center bg-white/5 text-slate-400 py-4 rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-2 border border-white/5"
                                            >
                                                <CheckCircle className="w-5 h-5" /> Submitted
                                            </button>
                                        ) : (
                                            <Link
                                                href={`/user/exam/${exam._id}/access`}
                                                className="block w-full text-center bg-white text-black hover:bg-slate-200 py-4 rounded-xl font-bold transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(255,255,255,0.1)] border border-transparent hover:border-purple-500/50"
                                            >
                                                Start Exam
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="mt-16">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-purple-400">
                    Attempts Corner
                </h2>

                {results.length === 0 && terminatedExams.length === 0 ? (
                    <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 text-center p-12 backdrop-blur-sm">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="h-6 w-6 text-slate-600" />
                        </div>
                        <p className="text-slate-400 font-medium">No attempt history available yet.</p>
                    </div>
                ) : (
                    <div className="bg-gradient-to-br from-black via-slate-950 to-purple-900/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 shadow-2xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500/50 via-purple-500 to-purple-500/50 opacity-50"></div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-black/40 text-slate-400 font-bold uppercase tracking-wider text-xs border-b border-white/5">
                                    <tr>
                                        <th className="p-5 w-20 text-center">#</th>
                                        <th className="p-5">Assessment</th>
                                        <th className="p-5">Attempted On</th>
                                        <th className="p-5">Performance</th>
                                        <th className="p-5">Time</th>
                                        <th className="p-5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {results.map((res, index) => {
                                        const scoreColor = res.percentage >= 50 ? 'text-green-400' : 'text-red-400';

                                        // Calculate attempted. Logic: if answers exist, count selected. If not (legacy), check score > 0.
                                        const attempted = res.answers ? res.answers.filter(a => a.selectedOption).length : (res.score > 0 ? 1 : 0);
                                        const isNoResult = attempted === 0;

                                        return (
                                            <tr key={res._id} className="hover:bg-white/5 transition-all group">
                                                <td className="p-5 text-center text-slate-600 font-mono">{index + 1}</td>
                                                <td className="p-5">
                                                    <div className="font-bold text-white text-base mb-1">{res.examTitle}</div>
                                                    <div className="text-xs text-slate-500 font-mono">{res._id.slice(-6)}</div>
                                                </td>
                                                <td className="p-5">
                                                    <div className="flex flex-col text-slate-400 text-xs font-medium">
                                                        <span>{new Date(res.submittedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                                        <span className="opacity-50">{new Date(res.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    {isNoResult ? (
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-lg">
                                                            <XCircle className="w-4 h-4 text-red-500" />
                                                            <span className="text-red-400 font-bold text-xs uppercase tracking-wider">No Result</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-3">
                                                            <div className={`text-lg font-black ${scoreColor}`}>
                                                                {res.score}/{res.totalQuestions}
                                                            </div>

                                                            {(res.violationCount > 0) && (
                                                                <div className="group/tooltip relative">
                                                                    <div className="cursor-help text-red-500 bg-red-500/10 p-1.5 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/20">
                                                                        <AlertTriangle className="h-4 w-4" />
                                                                    </div>
                                                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 bg-slate-900 text-slate-300 text-xs p-3 rounded-xl border border-red-500/30 shadow-2xl opacity-0 group-hover/tooltip:opacity-100 pointer-events-none transition-opacity z-50">
                                                                        <strong className="text-red-400 block mb-1 uppercase tracking-wider text-[10px]">Violation Detected</strong>
                                                                        {res.violationReason || 'Multiple violations recorded.'}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-5 font-mono text-slate-400 text-sm">
                                                    {(() => {
                                                        const s = res.timeTaken;
                                                        if (s === undefined || s === null) return '-';
                                                        if (s < 60) return `${s}s`;
                                                        const m = Math.floor(s / 60);
                                                        return `${m}m`;
                                                    })()}
                                                </td>
                                                <td className="p-5 text-right">
                                                    {isNoResult ? (
                                                        <button
                                                            onClick={() => handleRetake(res._id, res.examId)}
                                                            className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-900/20 transition-all text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg"
                                                        >
                                                            <RotateCcw className="w-4 h-4" /> Start Again
                                                        </button>
                                                    ) : (
                                                        <Link href={`/user/result/${res._id}`} className="inline-flex items-center gap-2 bg-white/5 hover:bg-purple-600 hover:text-white hover:border-purple-500 transition-all text-slate-300 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg border border-white/10 group-hover:bg-white/10">
                                                            Report <span className="text-lg leading-none">&rarr;</span>
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })}

                                    {terminatedExams.map((exam, index) => (
                                        <tr key={`term-${exam._id}`} className="hover:bg-red-900/5 transition-colors group border-l-2 border-l-red-500/50">
                                            <td className="p-5 text-center text-slate-600 font-mono">{results.length + index + 1}</td>
                                            <td className="p-5">
                                                <div className="font-bold text-slate-300 text-base mb-1">{exam.title}</div>
                                                <div className="text-red-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                                                    <XCircle className="h-3 w-3" /> Terminated
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <div className="flex flex-col text-slate-500 text-xs font-medium">
                                                    <span>{new Date().toLocaleDateString()}</span>
                                                </div>
                                            </td>
                                            <td className="p-5">
                                                <span className="text-red-500/50 font-mono text-sm font-bold opacity-50">No Result</span>
                                            </td>
                                            <td className="p-5 font-mono text-slate-500">-</td>
                                            <td className="p-5 text-right">
                                                <span className="inline-flex px-3 py-1 bg-white/5 rounded-lg text-slate-500 text-xs font-bold uppercase tracking-wider cursor-wait">
                                                    Processing
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
