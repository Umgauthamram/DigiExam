'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { RefreshCw, Timer, ArrowLeft, Users } from 'lucide-react';

export default function ExamControllerPage({ params }) {
    const unwrappedParams = use(params);
    const examId = unwrappedParams.id;

    const [otp, setOtp] = useState(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [activeStudents, setActiveStudents] = useState(0);

    // Poll for active students (Mock implementation)
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStudents(Math.floor(Math.random() * 5));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // Timer countdown
    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else if (otp) {
            setOtp(null);
        }
    }, [timeLeft, otp]);

    const generateOtp = async () => {
        try {
            const res = await fetch(`/api/admin/exams/${examId}/otp`, {
                method: 'POST',
            });
            const data = await res.json();
            setOtp(data.otp);
            setTimeLeft(300);
        } catch (e) {
            console.error(e);
            const randomOtp = Math.floor(100000 + Math.random() * 900000);
            setOtp(randomOtp.toString());
            setTimeLeft(300);
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/admin/dashboard" className="text-slate-400 hover:text-white flex items-center mb-6">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                </Link>

                <header className="mb-12 text-center">
                    <h1 className="text-4xl font-bold mb-2">Exam Session Controller</h1>
                    <p className="text-slate-400">Project this screen for students</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className={`bg-slate-800 rounded-3xl p-10 text-center border-2 ${otp ? 'border-green-500 shadow-[0_0_50px_rgba(34,197,94,0.2)]' : 'border-slate-700'} transition-all duration-500 relative overflow-hidden`}>
                        <h2 className="text-xl font-medium text-slate-400 mb-6 uppercase tracking-widest">Session Access Code</h2>

                        {otp ? (
                            <div className="animate-in zoom-in duration-300">
                                <div className="text-8xl font-black font-mono tracking-widest text-white mb-8">
                                    {otp.toString().slice(0, 3)} {otp.toString().slice(3)}
                                </div>
                                <div className="inline-flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full text-green-400 animate-pulse">
                                    <Timer className="h-5 w-5" />
                                    <span className="font-mono text-xl">{formatTime(timeLeft)}</span>
                                </div>
                                <p className="mt-6 text-sm text-slate-500">Code expires automatically. Regenerate if needed.</p>
                            </div>
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center">
                                <p className="text-slate-500 text-lg mb-8">No Active Session Code</p>
                                <button
                                    onClick={generateOtp}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-transform active:scale-95 shadow-lg shadow-blue-500/20"
                                >
                                    <RefreshCw className="h-6 w-6" /> Generate New OTP
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Live Stats */}
                    <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 flex flex-col justify-center">
                        <div className="text-center">
                            <div className="bg-blue-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users className="h-10 w-10 text-blue-500" />
                            </div>
                            <h3 className="text-5xl font-bold text-white mb-2">{activeStudents}</h3>
                            <p className="text-slate-400 font-medium">Cadets Currently in Exam</p>
                        </div>

                        <div className="mt-8 pt-8 border-t border-slate-700">
                            <h4 className="font-bold mb-4 text-slate-300">Live Activity Log</h4>
                            <div className="space-y-3 text-sm">
                                <div className="text-slate-400">Waiting for events...</div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
