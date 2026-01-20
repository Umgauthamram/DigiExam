'use client';

import { useState, useEffect, use } from 'react';
import { CheckCircle, XCircle, Brain, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ResultPage({ params }) {
    const unwrappedParams = use(params);
    const examId = unwrappedParams.id;
    const [result, setResult] = useState(null);

    // Partial Mock implementation since we don't have full end-to-end grading yet
    useEffect(() => {
        // In real app: fetch(`/api/user/result/${examId}`)
        // Mock Data
        setTimeout(() => {
            setResult({
                score: 2,
                totalQuestions: 3,
                violationCount: 1,
                answers: [
                    {
                        qId: 'q1',
                        text: 'What is the primary duty of a constable?',
                        selected: 'Patrol',
                        correct: 'Patrol',
                        isCorrect: true
                    },
                    {
                        qId: 'q2',
                        text: 'What is Section 144?',
                        selected: 'Theft',
                        correct: 'Curfew',
                        isCorrect: false,
                        aiExplanation: "Section 144 of the CrPC empowers an executive magistrate to issue orders in urgent cases of nuisance or apprehended danger. It is widely used to prohibit assemblies of four or more people, akin to a curfew, not related to theft."
                    },
                    {
                        qId: 'q3',
                        text: 'Which color is the police beacon?',
                        selected: 'Red/Blue',
                        correct: 'Red/Blue',
                        isCorrect: true
                    },
                ]
            });
        }, 1000);
    }, [examId]);

    if (!result) return <div className="text-white p-10">Calculating Results...</div>;

    const percentage = Math.round((result.score / result.totalQuestions) * 100);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/user/dashboard" className="text-slate-400 hover:text-white flex items-center mb-8">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back to Dashboard
                </Link>

                <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 mb-8 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="text-center md:text-left">
                        <h1 className="text-3xl font-bold mb-2">Exam Result</h1>
                        <p className="text-slate-400 opacity-75">Session ID: {examId}</p>
                    </div>

                    <div className="text-center">
                        <div className={`text-6xl font-black mb-2 ${percentage >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                            {percentage}%
                        </div>
                        <div className="text-sm uppercase tracking-widest font-bold text-slate-500">
                            {result.score} / {result.totalQuestions} Correct
                        </div>
                    </div>

                    <div className="bg-slate-900/50 p-4 rounded-xl text-center">
                        <div className="text-2xl font-bold text-yellow-500 mb-1">{result.violationCount}</div>
                        <div className="text-xs text-slate-500 uppercase font-bold">Violations</div>
                    </div>
                </div>

                <h2 className="text-xl font-bold mb-6">Detailed Analysis</h2>

                <div className="space-y-6">
                    {result.answers.map((ans, idx) => (
                        <div key={idx} className={`rounded-xl border p-6 ${ans.isCorrect ? 'bg-green-900/10 border-green-500/20' : 'bg-red-900/10 border-red-500/20'}`}>
                            <div className="flex gap-4">
                                <div className="mt-1">
                                    {ans.isCorrect ? (
                                        <CheckCircle className="h-6 w-6 text-green-500" />
                                    ) : (
                                        <XCircle className="h-6 w-6 text-red-500" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-4">{ans.text}</h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div className={`p-3 rounded-lg border ${ans.isCorrect ? 'bg-green-500/20 border-green-500 text-green-200' : 'bg-red-500/20 border-red-500 text-red-200'}`}>
                                            <span className="text-xs uppercase font-bold opacity-70 block mb-1">Your Answer</span>
                                            {ans.selected}
                                        </div>
                                        {!ans.isCorrect && (
                                            <div className="p-3 rounded-lg border bg-slate-900 border-slate-600">
                                                <span className="text-xs uppercase font-bold text-slate-400 block mb-1">Correct Answer</span>
                                                {ans.correct}
                                            </div>
                                        )}
                                    </div>

                                    {!ans.isCorrect && ans.aiExplanation && (
                                        <div className="mt-4 bg-purple-500/10 border border-purple-500/30 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 text-purple-400 font-bold mb-2 text-sm">
                                                <Brain className="h-4 w-4" /> AI Explanation
                                            </div>
                                            <p className="text-purple-100 text-sm leading-relaxed">
                                                {ans.aiExplanation}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
}
