'use client';

import { useState, useEffect, use } from 'react';
import { CheckCircle, XCircle, Brain, ArrowLeft, Flag, RotateCcw } from 'lucide-react';
import Link from 'next/link';

export default function ResultPage({ params }) {
    const unwrappedParams = use(params);
    const examId = unwrappedParams.id;
    const [result, setResult] = useState(null);

    // Partial Mock implementation since we don't have full end-to-end grading yet
    useEffect(() => {
        const fetchResult = async () => {
            try {
                const res = await fetch(`/api/user/result/${examId}`);
                const data = await res.json();
                if (res.ok) {
                    setResult(data.result);
                } else {
                    console.error("Failed to load result");
                }
            } catch (error) {
                console.error("Error fetching result:", error);
            }
        };

        if (examId) {
            fetchResult();
        }
    }, [examId]);

    if (!result) return (
        <div className="min-h-screen bg-black p-6 md:p-12 font-sans relative overflow-hidden">
            <div className="max-w-5xl mx-auto relative z-10 animate-pulse">
                {/* Back Button Skeleton */}
                <div className="w-32 h-10 bg-white/5 rounded-full mb-8"></div>

                {/* Main Card Skeleton - Purple Gradient */}
                <div className="w-full h-[300px] rounded-3xl mb-12 relative overflow-hidden bg-gradient-to-br from-purple-900/40 via-slate-900 to-black border border-purple-500/20">
                    <div className="p-10 h-full flex flex-col justify-between">
                        <div className="h-8 w-64 bg-white/5 rounded"></div>
                        <div className="flex justify-around items-center">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex flex-col items-center gap-3">
                                    <div className="w-24 h-24 rounded-full border-4 border-white/5 bg-purple-500/10"></div>
                                    <div className="h-2 w-16 bg-white/5 rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* List Items Skeleton */}
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="w-full h-48 bg-slate-900/40 rounded-2xl border border-white/5 p-6 space-y-4">
                            <div className="h-6 w-3/4 bg-white/5 rounded"></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="h-20 bg-white/5 rounded-xl"></div>
                                <div className="h-20 bg-white/5 rounded-xl"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    // Helper for formatting time
    const formatTime = (s) => {
        if (s === undefined || s === null) return 'N/A';
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60);
        const sec = s % 60;
        if (sec === 0) return `${m}m`;
        return `${m}m ${sec}s`;
    };

    // Calculate Stats
    const attemptedCount = result.answers.filter(a => a.selected).length;
    let accuracy = attemptedCount > 0 ? Math.round((result.score / attemptedCount) * 100) : 0;
    const scorePercentage = (result.score / result.totalQuestions) * 100;

    // Circular Progress Component
    const CircularProgress = ({ value, max, label, subtext, color = "blue", overrideColor = null }) => {
        const radius = 36;
        const circumference = 2 * Math.PI * radius;
        const percentage = Math.min(100, Math.max(0, (value / max) * 100)); // Ensure 0-100
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        const colors = {
            blue: "text-blue-500",
            green: "text-green-500",
            purple: "text-purple-500",
            yellow: "text-yellow-500",
            red: "text-red-500"
        };
        const strokeColor = colors[overrideColor || color];

        return (
            <div className="flex flex-col items-center">
                <div className="relative w-24 h-24 mb-3">
                    {/* Background Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-slate-800"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="48"
                            cy="48"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className={`${strokeColor} transition-all duration-1000 ease-out`}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className={`text-xl font-bold ${overrideColor === 'red' ? 'text-red-500' : 'text-white'}`}>{subtext}</span>
                    </div>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</span>
            </div>
        );
    };

    // Feedback Logic
    let feedbackMessage = "";
    let feedbackColor = "";

    if (scorePercentage < 30) {
        feedbackMessage = "Better luck next time.";
        feedbackColor = "text-red-400";
    } else if (scorePercentage < 100) {
        feedbackMessage = "Well done! You did well on this assessment.";
        feedbackColor = "text-green-400";
    } else {
        feedbackMessage = "Outstanding! Perfect Score!";
        feedbackColor = "text-purple-400";
    }

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-12 font-sans selection:bg-purple-500/30 relative overflow-hidden">
            {/* Ambient Effects */}
            <div className="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="max-w-5xl mx-auto relative z-10">
                <Link href="/user/dashboard" className="text-slate-400 hover:text-white flex items-center mb-8 transition-colors group w-fit">
                    <div className="bg-white/5 p-2 rounded-full group-hover:bg-white/10 mr-3 transition-all">
                        <ArrowLeft className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">Back to Dashboard</span>
                </Link>

                {/* Score Card - New Circular Design */}
                <div className={`
                    border rounded-3xl p-10 mb-12 relative overflow-hidden backdrop-blur-sm shadow-2xl
                    ${isNotAttempted
                        ? 'bg-gradient-to-r from-red-950/50 via-black to-black border-red-500/20'
                        : 'bg-gradient-to-r from-purple-900/50 via-black to-black border-purple-500/20'
                    }
                `}>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.03),transparent_40%)] pointer-events-none"></div>
                    {/* Inner Content */}
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4 text-center md:text-left">
                            <div>
                                <h1 className="text-2xl font-bold text-white mb-1">
                                    {isNotAttempted ? 'Assessment Incomplete' : 'Assessment Report'}
                                </h1>
                                <p className={`text-lg font-medium ${isNotAttempted ? 'text-red-400' : feedbackColor}`}>
                                    {isNotAttempted ? 'No questions were attempted during this session.' : feedbackMessage}
                                </p>
                            </div>

                            {isNotAttempted && (
                                <Link href="/user/dashboard">
                                    <button className="bg-white text-black hover:bg-slate-200 px-6 py-3 rounded-xl font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-white/10">
                                        <RotateCcw className="h-4 w-4" />
                                        Return to Exam Center
                                    </button>
                                </Link>
                            )}
                        </div>

                        {!isNotAttempted ? (
                            <div className="flex flex-wrap justify-center md:justify-around gap-8 md:gap-12">
                                {/* Score */}
                                <CircularProgress
                                    value={result.score}
                                    max={result.totalQuestions}
                                    label="Score"
                                    subtext={`${result.score}/${result.totalQuestions}`}
                                    color="purple"
                                    overrideColor={scorePercentage < 30 ? 'red' : null}
                                />

                                {/* Accuracy */}
                                <CircularProgress
                                    value={accuracy}
                                    max={100}
                                    label="Accuracy"
                                    subtext={`${accuracy}%`}
                                    color="green"
                                    overrideColor={accuracy < 30 ? 'red' : null}
                                />

                                {/* Time Taken */}
                                <CircularProgress
                                    value={result.timeTaken}
                                    max={result.totalQuestions * 60} // visual max approx 1 min per q? or just full circle
                                    label="Time Taken"
                                    subtext={formatTime(result.timeTaken)}
                                    color="blue"
                                />

                                {/* Attempted */}
                                <CircularProgress
                                    value={attemptedCount}
                                    max={result.totalQuestions}
                                    label="Attempted"
                                    subtext={`${attemptedCount}/${result.totalQuestions}`}
                                    color="yellow"
                                />
                            </div>
                        ) : (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center max-w-2xl mx-auto">
                                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                                    <XCircle className="h-8 w-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No Result Available</h3>
                                <p className="text-red-200/60 mb-6">
                                    It looks like you submitted the exam without answering any questions.
                                    Please check the Exam Center on your dashboard to see if a retake is available.
                                </p>
                            </div>
                        )}

                        {/* Violation Flag */}
                        {result.violations > 0 && (
                            <div className="mt-8 mb-2 bg-red-950/30 border border-red-500/20 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center md:items-start animate-in fade-in slide-in-from-bottom-4 relative overflow-hidden group">
                                <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors pointer-events-none"></div>
                                <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20 shrink-0 relative z-10">
                                    <Flag className="h-8 w-8 text-red-500" />
                                </div>
                                <div className="text-center md:text-left flex-1 relative z-10">
                                    <div className="flex justify-between items-start w-full">
                                        <div>
                                            <h3 className="text-lg font-bold text-red-400 mb-1">Security Flags Detected</h3>
                                            <p className="text-red-200/70 text-sm mb-4">
                                                Use of unfair means or suspicious activity was recorded during the session.
                                            </p>
                                        </div>
                                        <div className="text-4xl font-black text-red-500 opacity-50 hidden md:block">
                                            {result.violations}
                                        </div>
                                    </div>

                                    {result.violationReason && (
                                        <div className="mt-4 bg-black/40 border border-red-500/30 rounded-xl p-4 w-full text-left">
                                            <span className="text-red-500 font-bold text-xs uppercase tracking-widest block mb-3 border-b border-red-500/20 pb-2">
                                                Violation Details
                                            </span>
                                            <ul className="space-y-2">
                                                {[...new Set((result.violationReason || '').split(',').map(s => s.trim()))].filter(Boolean).map((reason, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-red-200 text-sm font-medium">
                                                        <span className="mt-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shrink-0 animate-pulse"></span>
                                                        {reason}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                    Detailed Analysis
                </h2>

                <div className="space-y-6">
                    {result.answers.map((ans, idx) => {
                        const isSkipped = !ans.selected;
                        const isCorrect = ans.isCorrect;

                        return (
                            <div key={idx} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-colors">
                                <div className="flex gap-4">
                                    <div className="mt-1 shrink-0">
                                        {isSkipped ? (
                                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                                <span className="text-slate-500 font-bold text-lg leading-none mb-1">-</span>
                                            </div>
                                        ) : isCorrect ? (
                                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-lg text-white mb-6 leading-snug">{ans.text}</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                            {/* User Answer */}
                                            <div className={`p-4 rounded-xl border transition-all ${isSkipped
                                                ? 'bg-slate-800/50 border-slate-700/50 text-slate-400'
                                                : isCorrect
                                                    ? 'bg-green-100 border-green-200 text-green-700'
                                                    : 'bg-red-100 border-red-200 text-red-700'
                                                }`}>
                                                <span className={`text-[10px] uppercase font-bold tracking-wider block mb-2 ${isSkipped ? 'text-slate-500' : isCorrect ? 'text-green-800' : 'text-red-800'
                                                    }`}>
                                                    Your Answer
                                                </span>

                                                {isSkipped ? (
                                                    <div className="flex items-center gap-2 text-slate-500 italic text-sm">
                                                        <span className="text-lg font-bold text-slate-600">-</span>
                                                        You didn't answer this question
                                                    </div>
                                                ) : (
                                                    <div className="font-bold text-sm">{ans.selected}</div>
                                                )}
                                            </div>

                                            {/* Correct Answer (Shown if wrong or skipped) */}
                                            {(!isCorrect || isSkipped) && (
                                                <div className="p-4 rounded-xl border bg-blue-950/10 border-blue-900/20 text-blue-100">
                                                    <span className="text-[10px] uppercase font-bold text-blue-500 tracking-wider block mb-2">
                                                        Correct Answer
                                                    </span>
                                                    <div className="font-medium text-sm">{ans.correct}</div>
                                                </div>
                                            )}
                                        </div>

                                        {/* AI Explanation */}
                                        {(!isCorrect || isSkipped) && ans.aiExplanation && (
                                            <div className="mt-4 bg-[#1a103c] border border-purple-500/10 p-5 rounded-xl relative overflow-hidden">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
                                                <div className="flex items-center gap-2 text-purple-400 font-bold mb-2 text-xs uppercase tracking-widest">
                                                    <Brain className="h-3 w-3" /> AI Explanation
                                                </div>
                                                <p className="text-slate-300 text-sm leading-relaxed opacity-90 whitespace-pre-wrap">
                                                    {ans.aiExplanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

            </div>
        </div>
    );
}
