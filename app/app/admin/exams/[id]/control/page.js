'use client';

import { useState, useEffect, useRef, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { RefreshCw, Timer, ArrowLeft, Users, AlertTriangle } from 'lucide-react';

export default function ExamControllerPage({ params }) {
    const unwrappedParams = use(params);
    const examId = unwrappedParams.id;
    const router = useRouter();

    const [status, setStatus] = useState('scheduled');
    const [timeLeft, setTimeLeft] = useState(0);
    const [otp, setOtp] = useState(null);
    const [nextOtp, setNextOtp] = useState(null);
    const [nextStartsAt, setNextStartsAt] = useState(null);
    const [activeStudents, setActiveStudents] = useState(0);
    const [showStopModal, setShowStopModal] = useState(false);

    // Poll for status & submissions
    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Fetch Status & OTP State
                const statusRes = await fetch(`/api/admin/exams/${examId}/status`, { cache: 'no-store' });
                if (statusRes.ok) {
                    const statusData = await statusRes.json();
                    setStatus(statusData.status);
                    setOtp(statusData.otp);
                    setNextOtp(statusData.nextOtp);
                    setNextStartsAt(statusData.nextStartsAt);

                    if (statusData.status === 'active' && statusData.otp) {
                        // Sync Timer
                        if (statusData.otpExpiresAt) {
                            const expires = new Date(statusData.otpExpiresAt).getTime();
                            const now = Date.now();
                            const secondsLeft = Math.max(0, Math.floor((expires - now) / 1000));
                            if (Math.abs(timeLeft - secondsLeft) > 1 || timeLeft === 0) {
                                setTimeLeft(secondsLeft);
                            }
                        }
                    } else if (['ended', 'closed'].includes(statusData.status)) {
                        setOtp(null);
                        setNextOtp(null);
                        setTimeLeft(0);
                    }
                }

                // Fetch Stats (Active Subs)
                const statsRes = await fetch(`/api/admin/exams/${examId}/stats`, { cache: 'no-store' });
                if (statsRes.ok) {
                    const data = await statsRes.json();
                    setActiveStudents(data.submissionCount);
                }
            } catch (e) { console.log(e); }
        };

        fetchStats(); // Initial fetch
        const interval = setInterval(fetchStats, 3000);
        return () => clearInterval(interval);
    }, [examId]);

    // Timer countdown
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft]);

    const generateOtp = async () => {
        try {
            const res = await fetch(`/api/admin/exams/${examId}/otp`, { method: 'POST' });
            const data = await res.json();
            // Optimistic update handled by poll
        } catch (e) {
            console.error(e);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const stopSession = () => {
        setShowStopModal(true);
    };

    const handleConfirmStop = async () => {
        try {
            await fetch(`/api/admin/exams/${examId}/stop`, { method: 'POST' });
            setStatus('ended');
            setOtp(null);
            setNextOtp(null);
            setTimeLeft(0);
            setShowStopModal(false);
        } catch (e) {
            console.error(e);
            alert('Failed to stop session');
        }
    };

    return (
        <div className="min-h-screen bg-black text-white p-6 relative overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Ambient Effects */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Stop Session Modal */}
            {showStopModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-gradient-to-br from-black via-slate-950 to-purple-900/50  p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.05),transparent_50%)] pointer-events-none"></div>

                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ">
                            <AlertTriangle className="h-8 w-8 text-red-500" />
                        </div>

                        <h2 className="text-xl font-bold text-white mb-2">Stop Session?</h2>
                        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                            Are you sure you want to stop the session? This will force-submit all active attempts.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowStopModal(false)}
                                className="flex-1 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white border border-white/5 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmStop}
                                className="flex-1 py-3 rounded-xl font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 transition-all hover:scale-[1.02]"
                            >
                                Stop Session
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <Link href="/admin/dashboard" className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
                        <div className="bg-white/5 p-2 rounded-full group-hover:bg-white/10 transition-colors">
                            <ArrowLeft className="h-5 w-5" />
                        </div>
                        <span className="font-bold text-sm uppercase tracking-widest">Dashboard</span>
                    </Link>
                    <div className="text-center">
                        <h1 className="text-3xl font-black tracking-tight mb-1 bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent">
                            Session Controller
                        </h1>
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Live Exam Management</p>
                    </div>
                    <div className="w-32"></div> {/* Spacer for center alignment */}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* LEFT COLUMN: OTP STATUS (Span 8) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">

                        {/* Main OTP Card */}
                        <div className="relative bg-gradient-to-br from-slate-900/80 to-black border border-white/10 rounded-3xl p-10 flex flex-col items-center justify-center min-h-[400px] shadow-2xl overflow-hidden group">
                            {/* Inner Glow */}
                            <div className={`absolute inset-0 bg-gradient-to-br transition-opacity duration-1000 pointer-events-none ${otp && timeLeft > 0 ? 'from-purple-500/10 to-transparent opacity-100' : 'opacity-0'}`}></div>

                            {status === 'ended' ? (
                                <div className="text-center z-10 animate-in fade-in duration-500">
                                    <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
                                        <div className="w-3 h-3 bg-red-500 rounded-sm"></div>
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-2">Session Ended</h2>
                                    <p className="text-slate-500 mb-8">This exam session has been concluded.</p>

                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <button
                                            onClick={generateOtp}
                                            className="px-6 py-3 rounded-xl font-bold bg-white text-black hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                                        >
                                            <RefreshCw className="h-4 w-4" /> Restart Exam
                                        </button>
                                        <button
                                            onClick={() => router.push(`/admin/exams/${examId}/results`)}
                                            className="px-6 py-3 rounded-xl font-bold bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Users className="h-4 w-4" /> View Results
                                        </button>
                                    </div>
                                </div>
                            ) : otp ? (
                                timeLeft > 0 ? (
                                    <div className="relative z-10 text-center w-full">
                                        <div className="mb-4 flex items-center justify-center gap-2">
                                            <span className="flex h-3 w-3 relative">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-purple-500"></span>
                                            </span>
                                            <span className="text-purple-400 font-bold tracking-widest text-sm uppercase">Active Access Code</span>
                                        </div>

                                        <div className="text-[120px] leading-none font-black font-mono text-white tracking-widest drop-shadow-[0_0_50px_rgba(168,85,247,0.5)] select-all mb-8">
                                            {otp.toString().slice(0, 3)}<span className="text-slate-700 mx-2">-</span>{otp.toString().slice(3)}
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
                                            <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center">
                                                <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Time Remaining</span>
                                                <span className="text-3xl font-mono font-bold text-white tabular-nums">{formatTime(timeLeft)}</span>
                                            </div>

                                            {nextOtp ? (
                                                <div className="bg-purple-900/20 border border-purple-500/20 rounded-2xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
                                                    <div className="absolute top-2 right-2 flex space-x-0.5">
                                                        <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
                                                        <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse delay-75"></div>
                                                        <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse delay-150"></div>
                                                    </div>
                                                    <span className="text-purple-300 text-xs font-bold uppercase tracking-wider mb-1">Up Next</span>
                                                    <span className="text-xl font-mono font-bold text-white/50 blur-[4px] hover:blur-0 transition-all select-none">{nextOtp}</span>
                                                    <span className="text-[10px] text-purple-400 mt-1">
                                                        Starts {new Date(nextStartsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center opacity-50">
                                                    <span className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Next Code</span>
                                                    <span className="text-sm text-slate-500">Not Scheduled</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="z-10 text-center animate-in zoom-in duration-300">
                                        <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/20">
                                            <Timer className="h-10 w-10 text-yellow-500" />
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">Code Expired</h2>
                                        <p className="text-slate-500 mb-8 max-w-xs mx-auto">The previous access code has expired. Generate a new one to allow students to join.</p>

                                        {!nextOtp ? (
                                            <button
                                                onClick={generateOtp}
                                                className="group relative inline-flex h-14 items-center justify-center overflow-hidden rounded-full bg-blue-600 px-8 font-medium text-white transition-all duration-300 hover:bg-blue-600 hover:w-56 hover:pr-12 w-48 shadow-lg shadow-blue-500/30"
                                            >
                                                <span className="mr-2"><RefreshCw className="h-5 w-5" /></span>
                                                <span className="font-bold">Generate New</span>
                                            </button>
                                        ) : (
                                            <div className="flex flex-col items-center">
                                                <div className="h-8 w-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                                                <span className="text-purple-400 font-bold uppercase tracking-widest text-xs">Activating Next Schedule...</span>
                                            </div>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div className="z-10 text-center">
                                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                        <RefreshCw className="h-10 w-10 text-slate-400 group-hover:rotate-180 transition-transform duration-700" />
                                    </div>
                                    <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
                                    <p className="text-slate-400 mb-10 max-w-md mx-auto leading-relaxed">
                                        Generating an access code will start the timer.
                                        <br /> The system will automatically generate <strong>2 sequential codes</strong> for the first 10 minutes.
                                    </p>
                                    <button
                                        onClick={generateOtp}
                                        className="relative bg-white text-black hover:bg-purple-50 px-10 py-5 rounded-2xl font-black text-lg transition-all transform hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center gap-3 mx-auto"
                                    >
                                        <div className="bg-black text-white p-2 rounded-lg">
                                            <RefreshCw className="h-5 w-5" />
                                        </div>
                                        GENERATE OTP & START
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* RIGHT COLUMN: STATS & CONTROLS (Span 4) */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        {/* Live Stats Card */}
                        <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-[250px]">
                            <div className="absolute top-0 right-0 p-4 opacity-50">
                                <Users className="h-24 w-24 text-white/5" />
                            </div>

                            <div className="relative z-10 text-center">
                                <div className="text-6xl font-black text-white mb-2 tracking-tighter">
                                    {activeStudents}
                                </div>
                                <div className="text-slate-400 font-bold uppercase tracking-widest text-xs">Submissions Received</div>
                            </div>

                            <div className="w-full mt-8 pt-8 border-t border-white/5">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="text-slate-500">Active Users</span>
                                    <span className="text-green-400 font-mono">--</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Pending</span>
                                    <span className="text-yellow-400 font-mono">--</span>
                                </div>
                            </div>
                        </div>

                        {/* Control Actions */}
                        <div className={`rounded-3xl p-6 border transition-all ${status === 'ended' ? 'bg-slate-900/20 border-white/5 opacity-50 pointer-events-none' : 'bg-red-950/20 border-red-900/30'}`}>
                            <h3 className={`font-bold uppercase tracking-widest text-xs mb-4 ${status === 'ended' ? 'text-slate-600' : 'text-red-400'}`}>Danger Zone</h3>
                            <button
                                onClick={stopSession}
                                disabled={status === 'ended'}
                                className={`w-full font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group
                                    ${status === 'ended' ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20 active:scale-[0.98]'}`}
                            >
                                <div className={`p-1.5 rounded-lg transition-colors ${status === 'ended' ? 'bg-slate-700' : 'bg-black/20 group-hover:bg-black/30'}`}>
                                    <div className={`w-3 h-3 rounded-sm ${status === 'ended' ? 'bg-slate-500' : 'bg-white'}`}></div>
                                </div>
                                {status === 'ended' ? 'SESSION STOPPED' : 'STOP SESSION'}
                            </button>
                            {status !== 'ended' && (
                                <p className="text-[10px] text-red-500/60 text-center mt-3">
                                    This will force-submit all active attempts immediately.
                                </p>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
