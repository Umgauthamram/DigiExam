'use client';

import { useState, useEffect, useRef, use } from 'react';
import { Maximize, AlertTriangle, CheckCircle, Clock, ChevronRight, ChevronLeft, LogOut, Heart, HeartCrack } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ExamAttemptPage({ params }) {
    const unwrappedParams = use(params);
    const examId = unwrappedParams.id;
    const router = useRouter();

    const [exam, setExam] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({}); // { qId: optionIndex }
    const [timeLeft, setTimeLeft] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [violations, setViolations] = useState(0);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Refs for Debounce and State Access in Event Listeners
    const lastViolationTime = useRef(0);
    const isSubmittingRef = useRef(false);

    const violationsRef = useRef(0);
    const answersRef = useRef({});
    const timeLeftRef = useRef(0);

    // Sync refs with state
    useEffect(() => {
        answersRef.current = answers;
    }, [answers]);

    useEffect(() => {
        timeLeftRef.current = timeLeft;
    }, [timeLeft]);

    useEffect(() => {
        isSubmittingRef.current = isSubmitting;
    }, [isSubmitting]);

    // 1. Initial Load
    useEffect(() => {
        // Sync FS State immediately
        if (typeof document !== 'undefined') {
            setIsFullScreen(!!document.fullscreenElement);
        }

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

                    // PERSISTENCE LOGIC
                    const storageKey = `exam_${examId}_session`;
                    const storedSession = JSON.parse(localStorage.getItem(storageKey) || '{}');

                    let currentViolations = 0;

                    if (storedSession.startTime) {
                        // Restore Session
                        const elapsed = Math.floor((Date.now() - storedSession.startTime) / 1000);
                        const remaining = (data.exam.durationMinutes * 60) - elapsed;
                        setTimeLeft(remaining > 0 ? remaining : 0);

                        currentViolations = storedSession.violations || 0;
                        setViolations(currentViolations);
                        violationsRef.current = currentViolations;

                        // Restore Answers
                        if (storedSession.answers) {
                            setAnswers(storedSession.answers);
                        }

                        // Immediate Check: If we restored 3+ violations, Submit NOW.
                        if (currentViolations >= 3) {
                            submitExam(true);
                        }
                    } else {
                        // New Session
                        localStorage.setItem(storageKey, JSON.stringify({
                            startTime: Date.now(),
                            violations: 0,
                            answers: {}
                        }));
                        setTimeLeft(data.exam.durationMinutes * 60);
                    }
                } else {
                    toast.error('Failed to load exam: ' + data.error);
                }
            } catch (err) {
                console.error(err);
                toast.error('Error connecting to server. Please refresh.');
            }
        };
        fetchExam();

        // 2. Violation Listener
        const handleVisibilityChange = () => {
            if (document.hidden && !isSubmitted) {
                recordViolation('Tab Switch / Minimized');
            }
        };

        const handleBlur = () => {
            if (!isSubmitted) {
                recordViolation('Window Focus Lost (Alt+Tab)');
            }
        };

        const handleFullScreenChange = () => {
            const isFS = !!document.fullscreenElement;
            setIsFullScreen(isFS);
            if (!isFS && !isSubmitted) {
                // If they leave FS, it's a violation unless it's the very first load (handled by isFullScreen false init)
                // But violationsRef check ensures we don't loop on init if count is 0.
                // However, user wants strict. If they exit, we record.
                // We add a check: if violations > 0 OR we have clearly started (time passed?).
                // Simplest: If they exit FS, record it. (If they are 0, they get 1 and kicked out).
                if (violationsRef.current > 0 || isSubmittingRef.current === false) {
                    recordViolation('Exited Full Screen Mode');
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleBlur);
        document.addEventListener('fullscreenchange', handleFullScreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleBlur);
            document.removeEventListener('fullscreenchange', handleFullScreenChange);
        };
    }, [examId, isSubmitted, exam]);

    // 3. Timer
    useEffect(() => {
        if (timeLeft > 0 && !isSubmitted) {
            const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
            return () => clearInterval(timer);
        } else if (timeLeft === 0 && !isSubmitted && exam) {
            submitExam(true); // Time up
        }
    }, [timeLeft, isSubmitted, exam]);


    const recordViolation = (reason) => {
        if (!exam) return;
        const now = Date.now();
        // Debounce
        if (now - lastViolationTime.current < 2000) return;
        if (isSubmittingRef.current || isSubmitted) return;

        // If we already have 3 violations, just ensure we are submitting
        if (violationsRef.current >= 3) {
            if (!isSubmittingRef.current) {
                submitExam(true);
            }
            return;
        }

        lastViolationTime.current = now;
        violationsRef.current += 1;

        const count = violationsRef.current;
        setViolations(count);

        // Update Storage
        const storageKey = `exam_${examId}_session`;
        const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const pastReasons = stored.reasons || [];
        const newReasons = [...pastReasons, reason];

        localStorage.setItem(storageKey, JSON.stringify({
            ...stored,
            violations: count,
            reasons: newReasons
        }));

        if (count >= 3) {
            // 3rd strike: Submit immediately (no redirect)
            if (!isSubmittingRef.current) {
                submitExam(true);
            }
            return;
        }

        // 1st or 2nd strike: Redirect to Dashboard with Warning
        const reasonParam = encodeURIComponent(reason || 'Security Violation');
        router.push(`/user/dashboard?violation=true&examId=${examId}&reason=${reasonParam}`);
    };

    const requestFullScreen = async () => {
        try {
            await document.documentElement.requestFullscreen();
            setIsFullScreen(true);
        } catch (e) {
            console.error("FS Request Error:", e);
        }
    };

    const updateAnswersStorage = (newAnswers) => {
        const storageKey = `exam_${examId}_session`;
        const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
        localStorage.setItem(storageKey, JSON.stringify({
            ...stored,
            answers: newAnswers
        }));
    };

    const handleAnswer = (optionIndex) => {
        const qId = exam.questions[currentQuestionIndex]._id;
        const newAnswers = { ...answers, [qId]: optionIndex };
        setAnswers(newAnswers);
        updateAnswersStorage(newAnswers);
    };

    const clearAnswer = () => {
        const qId = exam.questions[currentQuestionIndex]._id;
        const newAnswers = { ...answers };
        delete newAnswers[qId];
        setAnswers(newAnswers);
        updateAnswersStorage(newAnswers);
    };

    const submitExam = async (forced = false) => {
        if (isSubmitting || !exam) return;
        setIsSubmitting(true);

        const timeTaken = (exam.durationMinutes * 60) - timeLeftRef.current;

        // Retrieve reasons before clearing
        const storageKey = `exam_${examId}_session`;
        const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
        const violationReason = (stored.reasons || []).join(', ');

        // Clear session on submit
        localStorage.removeItem(storageKey);

        try {
            const res = await fetch('/api/user/result/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    examId,
                    answers: answersRef.current,
                    violations,
                    violationReason,
                    timeTaken,
                    forcedSubmission: forced
                })
            });

            if (!res.ok) {
                throw new Error('Submission failed');
            }

            setIsSubmitted(true);
            toast.success("Exam Submitted Successfully!");
        } catch (e) {
            console.error('Submit error', e);
            toast.error('Failed to submit exam. Please check your connection and try again.');
            setIsSubmitting(false); // Only reset on failure to allow retry
        }
    };

    const formatTime = (s) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    // Skeleton Loading State
    if (!exam) return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row p-4 gap-4 overflow-hidden relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(100,50,255,0.1),transparent_40%)] pointer-events-none"></div>

            {/* Sidebar Skeleton */}
            <div className="w-full md:w-72 bg-white/5 border border-white/10 rounded-2xl p-6 h-full flex flex-col animate-pulse">
                <div className="h-6 w-32 bg-slate-800 rounded mb-8"></div>
                <div className="h-12 w-40 bg-slate-800 rounded mb-8"></div>
                <div className="grid grid-cols-5 gap-2">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="h-10 w-10 bg-slate-800 rounded-lg"></div>
                    ))}
                </div>
            </div>

            {/* Main Area Skeleton */}
            <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-8 animate-pulse flex flex-col">
                <div className="flex justify-between mb-8">
                    <div className="h-4 w-24 bg-slate-800 rounded"></div>
                    <div className="h-4 w-24 bg-slate-800 rounded"></div>
                </div>
                <div className="h-8 w-3/4 bg-slate-800 rounded mb-4"></div>
                <div className="h-8 w-1/2 bg-slate-800 rounded mb-12"></div>

                <div className="space-y-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 w-full bg-slate-800 rounded-xl"></div>
                    ))}
                </div>
            </div>
        </div>
    );

    // Render Submitted State
    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(50,200,50,0.1),transparent_60%)] pointer-events-none"></div>
                <div className="bg-white/5 backdrop-blur-xl p-10 rounded-3xl text-center max-w-lg border border-white/10 shadow-2xl relative z-10">
                    <div className="bg-green-500/20 p-4 rounded-full w-fit mx-auto mb-6 border border-green-500/30">
                        <CheckCircle className="h-16 w-16 text-green-400" />
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">Exam Submitted</h1>
                    <p className="text-slate-400 mb-8 border-b border-white/5 pb-8">
                        Your answers have been securely recorded. <br />
                        <span className={`text-sm mt-2 block ${violations > 0 ? 'text-red-400' : 'text-green-400'}`}>
                            {violations} Security Violations Detected
                        </span>
                    </p>
                    <a href="/user/dashboard" className="bg-white text-black font-bold py-3.5 px-8 rounded-full hover:bg-slate-200 transition-all inline-flex items-center gap-2">
                        <LogOut className="w-4 h-4" /> Return to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    // Render Full Screen Gate (Startup or Resume)
    // Only show if !isFullScreen. This is the "Door".
    const showOverlay = !isSubmitted && !isFullScreen;

    if (showOverlay) {
        return (
            <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                <div className="bg-slate-900 p-10 rounded-3xl max-w-lg w-full text-center border border-white/10 shadow-2xl relative overflow-hidden animate-in zoom-in-50 duration-300">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(100,50,255,0.1),transparent_50%)]"></div>

                    <div className="bg-blue-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8">
                        <Maximize className="h-12 w-12 text-blue-500" />
                    </div>

                    <h1 className="text-4xl font-bold text-white mb-4">
                        Enter Full Screen
                    </h1>

                    <p className="text-slate-400 mb-8 text-lg">
                        Please enter full-screen mode to continue your assessment.
                    </p>

                    {violations > 0 && (
                        <div className="bg-red-500/10 rounded-xl p-6 mb-8 border border-red-500/20">
                            <div className="flex justify-center gap-4 mb-3">
                                {[0, 1, 2].map((i) => {
                                    // 3 lives total. 
                                    // If violations=1 -> 2 lives left (indices 0, 1 are hearts, 2 is broken)
                                    // If violations=2 -> 1 life left (index 0 is heart, 1,2 are broken)
                                    // If violations=3 -> 0 lives left (all broken)
                                    const isBroken = i >= (3 - violations);

                                    return (
                                        <div key={i} className="relative">
                                            {isBroken ? (
                                                <HeartCrack
                                                    className="w-12 h-12 text-slate-500 drop-shadow-lg animate-in zoom-in duration-500 slide-in-from-bottom-2"
                                                    strokeWidth={1.5}
                                                />
                                            ) : (
                                                <Heart
                                                    className="w-12 h-12 text-red-500 fill-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse"
                                                    strokeWidth={0}
                                                />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                            <span className="text-red-400 font-bold uppercase tracking-widest text-sm">Lives Remaining</span>
                        </div>
                    )}

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            requestFullScreen();
                        }}
                        className="w-full font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98] bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/20"
                    >
                        Resume Exam
                    </button>

                </div>
            </div>
        );
    }

    const currentQ = exam.questions[currentQuestionIndex];

    if (!currentQ) {
        return (
            <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
                <Toaster position="top-center" richColors theme="dark" />
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold">No Questions Found</h2>
                    <p className="text-slate-400 mt-2">This exam has no questions or failed to load correctly.</p>
                    <a href="/user/dashboard" className="mt-6 inline-block text-blue-400 hover:underline">Return to Dashboard</a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row relative overflow-hidden font-sans">
            <Toaster position="top-center" richColors theme="dark" />

            {/* Ambient Background */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none"></div>

            {/* Sidebar / Question Palette */}
            <aside className="w-full md:w-72 bg-white/5 backdrop-blur-lg border-r border-white/10 p-6 flex flex-col h-auto md:h-screen relative z-10">
                <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/5">
                    <h2 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-2">Time Remaining</h2>
                    <div className={`text-4xl font-mono font-bold flex items-center gap-3 ${timeLeft < 300 ? 'text-red-400 animate-pulse' : 'text-blue-300'}`}>
                        <Clock className="h-6 w-6" />
                        {formatTime(timeLeft)}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                    <h2 className="font-bold text-slate-400 text-xs uppercase tracking-widest mb-4">Question Palette</h2>
                    <div className="grid grid-cols-5 gap-2">
                        {exam.questions.map((q, idx) => {
                            const isAnswered = answers[q._id] !== undefined;
                            const isCurrent = idx === currentQuestionIndex;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentQuestionIndex(idx)}
                                    className={`aspect-square rounded-lg font-bold text-sm transition-all relative overflow-hidden
                                ${isCurrent ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] border border-blue-400' :
                                            isAnswered ? 'bg-green-600/50 text-white border border-green-500/50' :
                                                'bg-white/5 text-slate-400 hover:bg-white/10 border border-white/5'}
                            `}
                                >
                                    {idx + 1}
                                    {isCurrent && <div className="absolute inset-x-0 bottom-0 h-1 bg-white/50"></div>}
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="mt-auto pt-6 border-t border-white/10 text-xs text-slate-500 flex justify-between items-center">
                    <span>Session: {examId.slice(0, 8)}</span>
                    <span className={`px-2 py-1 rounded ${violations > 0 ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                        {Math.min(violations, 3)}/3 Violations
                    </span>
                </div>
            </aside>

            {/* Main Question Area */}
            <main className="flex-1 p-6 md:p-12 flex flex-col relative z-10 h-screen overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                    <span className="text-slate-400 font-medium px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm">
                        Question {currentQuestionIndex + 1} of {exam.questions.length}
                    </span>
                    {violations > 0 && (
                        <div className="flex items-center gap-2 text-red-300 bg-red-900/20 px-4 py-1.5 rounded-full text-xs font-bold border border-red-500/20 animate-pulse">
                            <AlertTriangle className="h-4 w-4" /> {Math.min(violations, 3)} Strikes Recorded
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto pr-4 pb-20 md:pb-0">
                    <h1 className="text-2xl md:text-3xl font-bold mb-8 leading-snug text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                        {currentQ.text}
                    </h1>

                    <div className="space-y-4 max-w-3xl">
                        {currentQ.options.map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                className={`w-full text-left p-5 rounded-2xl border transition-all flex items-center justify-between group relative overflow-hidden
                            ${answers[currentQ._id] === idx
                                        ? 'border-blue-500/50 bg-blue-600/10 text-white shadow-[0_0_20px_rgba(37,99,235,0.1)]'
                                        : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20'}
                        `}
                            >
                                <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all ${answers[currentQ._id] === idx ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                                <span className="flex items-center gap-5">
                                    <span className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm border 
                                ${answers[currentQ._id] === idx ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-600 text-slate-500 group-hover:border-slate-400'}
                            `}>
                                        {String.fromCharCode(65 + idx)}
                                    </span>
                                    <span className="text-lg">{opt.text}</span>
                                </span>
                                {answers[currentQ._id] === idx && <div className="bg-blue-500 rounded-full p-1"><CheckCircle className="h-4 w-4 text-white" /></div>}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Confirmation Modal (Custom Pop-up) */}
                {showConfirmSubmit && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                        <div className="bg-slate-900 p-8 rounded-3xl max-w-sm text-center border border-white/10 shadow-2xl relative overflow-hidden">
                            {/* Gradient Border Overlay */}
                            <div className="absolute inset-0 rounded-3xl border-2 border-transparent bg-gradient-to-br from-white/10 to-transparent pointer-events-none" style={{ zIndex: -1 }}></div>

                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-blue-400" />
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-2">Ready to Submit?</h2>
                            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
                                You cannot change your answers after this. Ensure you have reviewed all questions.
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowConfirmSubmit(false)}
                                    className="py-3 px-4 rounded-xl font-bold text-slate-300 bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                                >
                                    Review
                                </button>
                                <button
                                    onClick={() => submitExam()}
                                    disabled={isSubmitting}
                                    className="py-3 px-4 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? 'Sending...' : 'Yes, Submit'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="mt-4 flex justify-between items-center border-t border-white/10 pt-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="flex items-center gap-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed font-medium transition-colors px-4 py-2 hover:bg-white/5 rounded-lg"
                        >
                            <ChevronLeft className="h-5 w-5" /> Previous
                        </button>

                        {answers[currentQ._id] !== undefined && (
                            <button
                                onClick={clearAnswer}
                                className="text-xs text-red-400 hover:text-red-300 font-bold px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors uppercase tracking-wider"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {currentQuestionIndex === exam.questions.length - 1 ? (
                        <button
                            onClick={() => setShowConfirmSubmit(true)}
                            disabled={isSubmitting}
                            className="bg-white text-black hover:bg-slate-200 px-8 py-3 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.2)] active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? 'Submitting...' : 'Finish Exam'} <LogOut className="w-4 h-4" />
                        </button>
                    ) : (
                        <button
                            onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-900/20 active:scale-95 transition-transform flex items-center gap-2"
                        >
                            Next <ChevronRight className="w-4 h-4" />
                        </button>
                    )}

                </div>
            </main>

        </div>
    );
}
