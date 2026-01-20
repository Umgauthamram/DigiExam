'use client';

import { useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Loader2 } from 'lucide-react';

export default function ExamAccessPage({ params }) {
    const unwrappedParams = use(params);
    const examId = unwrappedParams.id;
    const router = useRouter();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleBackspace = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) return;

        setLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/user/exam/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ examId, code }),
            });

            const data = await res.json();

            if (res.ok) {
                // Redirect to actual exam
                router.push(`/user/exam/${examId}/attempt`);
            } else {
                setError(data.message || 'Invalid or Expired Code');
            }
        } catch (err) {
            setError('Verification failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
            <div className="bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700 text-center">
                <div className="bg-blue-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="h-8 w-8 text-blue-500" />
                </div>

                <h1 className="text-2xl font-bold text-white mb-2">Enter Session Code</h1>
                <p className="text-slate-400 mb-8">Please enter the 6-digit code displayed by your instructor to begin.</p>

                <form onSubmit={handleSubmit}>
                    <div className="flex justify-center gap-2 mb-8">
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                maxLength="1"
                                className="w-12 h-14 text-center text-2xl font-bold bg-slate-900 border border-slate-600 rounded-lg text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleBackspace(index, e)}
                            />
                        ))}
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={otp.join('').length !== 6 || loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all transform active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : (
                            <>Start Exam <ArrowRight className="h-5 w-5" /></>
                        )}
                    </button>
                </form>
            </div>

            <p className="mt-8 text-slate-500 text-sm text-center max-w-xs">
                By entering this exam, you agree to the <span className="text-blue-400 cursor-pointer">Academic Honesty Policy</span>.
                Your screen will be monitored.
            </p>
        </div>
    );
}
