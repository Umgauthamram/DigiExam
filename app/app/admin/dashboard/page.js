'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { PlusCircle, FileText, Users, Clock, Loader2 } from 'lucide-react';

export default function AdminDashboard() {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        totalExams: 0,
        totalQuestions: 0,
        totalResults: 0
    });
    const [recentExams, setRecentExams] = useState([]);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/dashboard/stats');
                const data = await res.json();
                if (data.stats) setStats(data.stats);
                if (data.recentExams) setRecentExams(data.recentExams);
            } catch (e) {
                console.error("Dashboard Load Error", e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        { label: 'Total Exams', value: stats.totalExams, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Questions Created', value: stats.totalQuestions, icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
        { label: 'Exams Completed', value: stats.totalResults, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];

    if (isLoading) {
        return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
        </div>;
    }

    return (
        <div className="min-h-screen bg-slate-900 text-white p-8">
            <header className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                    <p className="text-slate-400">Welcome back, Instructor.</p>
                </div>
                <Link href="/admin/exams/create">
                    <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-blue-500/20">
                        <PlusCircle className="h-5 w-5" />
                        Create New Exam
                    </button>
                </Link>
            </header>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {statCards.map((stat, index) => (
                    <div key={index} className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm hover:border-slate-600 transition-colors">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-400 text-sm font-medium mb-1">{stat.label}</p>
                                <h3 className="text-3xl font-bold">{stat.value}</h3>
                            </div>
                            <div className={`${stat.bg} p-4 rounded-lg`}>
                                <stat.icon className={`h-8 w-8 ${stat.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity / Exams List */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Active & Recent Exams</h2>
                    <Link href="/admin/exams" className="text-blue-400 hover:text-blue-300 text-sm">View All</Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900/50 text-slate-400 text-sm uppercase">
                            <tr>
                                <th className="px-6 py-4 font-medium">Exam Title</th>
                                <th className="px-6 py-4 font-medium">Scheduled Date</th>
                                <th className="px-6 py-4 font-medium">Duration</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {recentExams.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No recent exams found. Create one to get started.</td>
                                </tr>
                            )}
                            {recentExams.map((exam) => (
                                <tr key={exam._id} className="hover:bg-slate-700/50 transition-colors">
                                    <td className="px-6 py-4 font-medium">{exam.title}</td>
                                    <td className="px-6 py-4 text-slate-400">{new Date(exam.scheduledAt).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-slate-400">{exam.durationMinutes} mins</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                            ${exam.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                            {exam.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/admin/exams/${exam._id}/control`} className="text-blue-400 hover:underline mr-4">Control</Link>
                                        <Link href={`/admin/exams/${exam._id}/manage-questions`} className="text-slate-400 hover:text-white">Edit</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
