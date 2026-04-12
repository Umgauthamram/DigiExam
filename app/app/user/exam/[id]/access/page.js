'use client';

import { useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, ArrowRight, Lock, Maximize, Loader2, AlertTriangle } from 'lucide-react';

export default function ExamAccessPage({ params }) {
    const unwrappedParams = use(params);
    const examId = unwrappedParams.id;
    const router = useRouter();
    const searchParams = useSearchParams();
    const isViolation = searchParams.get('violation') === 'true';

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const handleVerify = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/user/exam/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ examId, otp }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Invalid Access Code');

            setIsVerified(true);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const startExam = async () => {
        // Request Full Screen -> Then Navigate
        try {
            await document.documentElement.requestFullscreen();
        } catch (e) {
            console.log("Full screen denied, will force on next page");
        }
        router.push(`/user/exam/${examId}/attempt`);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-purple-500/30">
            {/* Ambient Effects */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">

                <div className="bg-gradient-to-br from-slate-900/90 via-black to-slate-950 border border-white/10 p-10 rounded-3xl shadow-2xl backdrop-blur-xl relative overflow-hidden">
                    {/* Inner Texture/Glow */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.03),transparent_70%)] pointer-events-none"></div>

                    {isVerified ? (
                        <div className="animate-in fade-in zoom-in duration-500 text-center">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-green-500/20 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                                <Maximize className="h-10 w-10 text-green-400" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Ready to Begin</h1>
                            <p className="text-slate-400 mb-8 leading-relaxed">
                                Entering full-screen mode...
                                <br /><span className="text-yellow-500/80 text-xs font-bold uppercase tracking-widest mt-2 block">Strict Monitoring Enabled</span>
                            </p>
                            <button
                                onClick={startExam}
                                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/20 active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-3 group"
                            >
                                Enter Exam Environment <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ) : isViolation ? (
                        <div className="animate-in fade-in zoom-in duration-500 text-center">
                            <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20 animate-pulse">
                                <AlertTriangle className="h-12 w-12 text-red-500" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Session Interrupted</h1>
                            <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                                A security violation was detected. You must explicitly confirm to resume.
                                <br /><span className="text-red-400 text-xs font-bold uppercase tracking-widest mt-3 block bg-red-950/30 py-1 px-2 rounded border border-red-500/20 inline-block">Violations are logged</span>
                            </p>
                            <button
                                onClick={startExam}
                                className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/20 active:scale-[0.98] transition-all text-sm uppercase tracking-wider gap-2 flex items-center justify-center"
                            >
                                I Understand & Resume
                            </button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-blue-500/20 shadow-[0_0_30px_rgba(37,99,235,0.1)] rotate-3 hover:rotate-6 transition-transform duration-500">
                                <ShieldCheck className="h-8 w-8 text-blue-500" />
                            </div>

                            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Exam Security Check</h1>
                            <p className="text-slate-500 mb-8 text-sm">Enter the secure access code to authenticate.</p>

                            {error && (
                                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-6 text-sm flex items-center gap-3 animate-shake">
                                    <AlertTriangle className="h-4 w-4 shrink-0" />
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleVerify} className="space-y-6">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        maxLength="6"
                                        required
                                        className="block w-full bg-black/50 border border-slate-700 rounded-xl py-4 pl-12 pr-4 text-white text-center font-mono text-2xl tracking-[0.5em] placeholder:text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all uppercase shadow-inner"
                                        placeholder="000000"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
                                >
                                    {loading ? (
                                        <Loader2 className="animate-spin h-5 w-5" />
                                    ) : (
                                        <>
                                            Verify Access <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                <p className="text-center text-slate-600 text-xs mt-8">
                    Secure Examination Environment &bull; v2.4
                </p>
            </div>
        </div>
    );
}
