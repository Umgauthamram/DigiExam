'use client';

import { useState, useEffect, use } from 'react';
import { Maximize, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function ExamAttemptPage({ params }) {
    const unwrappedParams = use(params);
    const examId = unwrappedParams.id;

    const [exam, setExam] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { qId: optionIndex }
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [violations, setViolations] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);

    // 1. Initial Load
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await fetch(`/api/user/exam/${examId}/start`);
                const data = await res.json();
                if (res.ok) {
                    setExam(data.exam);
                    // Use questions from API
                    // We need to merge them into the state in a way that preserves structure
                    setExam(prev => ({
                        ...data.exam,
                        questions: data.questions
                    }));
                    setTimeLeft(data.exam.durationMinutes * 60);
                } else {
                    alert('Failed to load exam: ' + data.error);
                }
            } catch (err) {
                console.error(err);
                alert('Error loading exam');
            }
        };
        fetchExam();

        // 2. Violation Listener
        const handleVisibilityChange = () => {
            if (document.hidden && !isSubmitted) {
                recordViolation('Tab Switch');
            }
        };

        const handleFullScreenChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
            if (!document.fullscreenElement && !isSubmitted) {
                recordViolation('Exited Full Screen');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullScreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, [examId, isSubmitted]);

    // 3. Timer
    useEffect(() => {
        if (timeLeft > 0 && !isSubmitted) {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && !isSubmitted && exam) {
            submitExam(); // Time up
        }
    }, [timeLeft, isSubmitted, exam]);


    const recordViolation = (reason) => {
        setViolations(v => {
            const newV = v + 1;
            if (newV >= 5) {
                submitExam(true); // Auto submit on 5th strike
                return newV;
            }
            // Logic handled in render for < 5
            return newV;
        });
    };

    const requestFullScreen = () => {
        document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(e => console.error(e));
    };

    const handleAnswer = (optionIndex) => {
        const qId = exam.questions[currentQuestionIndex]._id;
        setAnswers({ ...answers, [qId]: optionIndex });
    };

    const submitExam = async (forced = false) => {
        setIsSubmitted(true);
        // ... submission logic remains same ...
        try {
            await fetch('/api/user/result/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examId,
                    answers,
                    violations,
                    forcedSubmission: forced
                })
            });
            // Redirect logic handled by UI state for now
        } catch (e) {
            console.error('Submit error', e);
        }
    };

    const formatTime = (s) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    if (!exam) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading Exam...</div>;

    // Render Submitted State
    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
                <div className="bg-slate-800 p-10 rounded-2xl text-center max-w-lg border border-slate-700">
                    <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
                    <h1 className="text-3xl font-bold text-white mb-4">Exam Submitted</h1>
                    <p className="text-slate-400 mb-8">
                        Your answers have been recorded. <br />
                        Violations Committed: <span className="text-red-400 font-bold">{violations}</span>
                    </p>
                    <a href="/user/dashboard" className="bg-slate-700 hover:bg-slate-600 text-white py-3 px-8 rounded-lg inline-block">
                        Return to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    // Render Full Screen Warning Modal (Overlay)
    // Only show if NOT in full screen AND NOT submitted
    const showWarning = !isFullScreen && !isSubmitted;

    if (showWarning) {
        return (
            <div className="fixed inset-0 bg-slate-900 z-50 flex items-center justify-center p-4">
                <div className="bg-red-500/10 p-8 rounded-2xl max-w-md text-center border border-red-500/50 backdrop-blur-md">
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-white mb-2">Full Screen Violation!</h1>
                    <p className="text-slate-300 mb-8">
                        You have exited full screen mode. This has been recorded as a violation. <br />
                        <span className="font-bold text-red-400 text-lg mt-2 block">{5 - violations} attempts remaining before auto-submission.</span>
                    </p>
                    <button
                        onClick={requestFullScreen}
                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full transition-transform active:scale-95 shadow-lg shadow-red-900/20"
                    >
                        Resume Exam
                    </button>
                </div>
            </div>
        );
    }

    const currentQ = exam.questions[currentQuestionIndex];

    return (
        <div className="min-h-screen bg-slate-900 text-white flex flex-col md:flex-row">

            {/* Sidebar / Question Palette */}
            <aside className="w-full md:w-64 bg-slate-800 border-r border-slate-700 p-4 flex flex-col h-auto md:h-screen">
                <div className="mb-8">
                    <h2 className="font-bold text-slate-400 text-sm uppercase tracking-wider mb-4">Time Remaining</h2>
                    <div className={`text-3xl font-mono font-bold flex items-center gap-2 ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-blue-400'}`}>
                        <Clock className="h-6 w-6" />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <h2 className="font-bold text-slate-400 text-sm uppercase tracking-wider mb-4">Question Palette</h2>
                    <div className="grid grid-cols-4 gap-2">
                        {exam.questions.map((q, idx) => {
                            const isAnswered = answers[q._id] !== undefined;
                            const isCurrent = idx === currentQuestionIndex;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`h-10 w-10 rounded-lg font-bold text-sm transition-all
                                ${isCurrent ? 'bg-blue-600 text-white ring-2 ring-blue-400' :
                                            isAnswered ? 'bg-green-600 text-white' :
                                                'bg-slate-700 text-slate-400 hover:bg-slate-600'}
                            `}
                                >
                                    {idx + 1}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-slate-700 text-xs text-slate-500">
                    Session ID: {examId.slice(0, 8)}... <br />
                    Violations: {violations}/5
                </div>
            </aside>

            {/* Main Question Area */}
            <main className="flex-1 p-8 md:p-12 flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <span className="text-slate-400 font-medium">Question {currentQuestionIndex + 1} of {exam.questions.length}</span>
                    {violations > 0 && (
                        <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-3 py-1 rounded-full text-sm">
                            <AlertTriangle className="h-4 w-4" /> Warning: {violations} Strikes
                        </div>
                    )}
                </div>

                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold mb-8 leading-snug">{currentQ.text}</h1>

                    <div className="space-y-4 max-w-2xl">
                        {currentQ.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between group
                            ${answers[currentQ._id] === idx
                                        ? 'border-blue-500 bg-blue-500/10 text-white'
                                        : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700'}
                        `}
                            >
                                <span className="flex items-center gap-4">
                                    <span className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm border 
                                ${answers[currentQ._id] === idx ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-500 text-slate-500'}
                            `}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    {opt.text}
                                </span>
                                {answers[currentQ._id] === idx && <CheckCircle className="h-5 w-5 text-blue-500" />}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center border-t border-slate-700 pt-8">
                    <button
                        onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-medium"
                    >
                        Previous Question
                    </button>

                    {currentQuestionIndex === exam.questions.length - 1 ? (
                        <button
                            onClick={() => submitExam()}
                            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-green-900/20 active:scale-95 transition-transform"
                        >
                            Submit Exam
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-transform"
                        >
                            Next Question
                        </button>
                    )}
                </div>
            </main>

        </div>
    );
}
