'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlayCircle, Clock, Calendar, CheckCircle } from 'lucide-react';

export default function UserDashboard() {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Poll for exams (Using the admin API for now as it lists all)
        // Ideally should be /api/user/exams
        fetch('/api/admin/exams')
            .then(res => res.json())
            .then(data => {
                setExams(data.exams || []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <header className="mb-12">
                <h1 className="text-3xl font-bold mb-2">My Dashboard</h1>
                <p className="text-slate-400">Ready for your assignment, Cadet?</p>
            </header>

            <div className="mb-12">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <PlayCircle className="text-blue-500" /> Available Exams
                </h2>

                {loading ? (
                    <div className="text-slate-500">Loading exams...</div>
                ) : exams.length === 0 ? (
                    <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 text-center">
                        <p className="text-slate-400">No exams scheduled for you at this moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {exams.map((exam) => (
                            <div key={exam._id} className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-blue-500 transition-colors group">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{exam.title}</h3>
                                    <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-1 rounded uppercase font-bold tracking-wider">
                                        {exam.durationMinutes} Mins
                                    </span>
                                </div>

                                <p className="text-slate-400 text-sm mb-6 line-clamp-2">
                                    {exam.description || 'No description provided.'}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-slate-500 mb-6 font-mono">
                                    <div className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(exam.scheduledAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(exam.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                <Link
                                    href={`/user/exam/${exam._id}/access`}
                                    className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-all"
                                >
                                    Start Exam
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <CheckCircle className="text-green-500" /> Past Performance
                </h2>

                <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                    <p className="p-8 text-center text-slate-500">No history available yet.</p>
                </div>
            </div>
        </div>
    );
}
