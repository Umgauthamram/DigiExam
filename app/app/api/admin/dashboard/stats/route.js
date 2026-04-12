import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import Question from '@/models/Question';
import Result from '@/models/Result';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();

        // Run queries in parallel for performance
        const [
            totalExams,
            totalQuestions,
            totalResults,
            recentExams
        ] = await Promise.all([
            Exam.countDocuments({}),
            Question.countDocuments({}),
            Result.countDocuments({}),
            Exam.find({})
                .sort({ scheduledAt: -1 }) // Newest first
                .limit(5)
                .lean()
        ]);

        // Optimizing: Fetch result counts for all recent exams in ONE query instead of N
        const examIds = recentExams.map(e => e._id);

        const counts = await Result.aggregate([
            { $match: { exam: { $in: examIds } } },
            { $group: { _id: "$exam", count: { $sum: 1 } } }
        ]);

        // Create a lookup map for counts: { examId: count }
        const countMap = {};
        counts.forEach(c => {
            if (c._id) countMap[c._id.toString()] = c.count;
        });

        const recentExamsWithCounts = recentExams.map(exam => ({
            _id: exam._id,
            title: exam.title,
            scheduledAt: exam.scheduledAt,
            durationMinutes: exam.durationMinutes,
            status: exam.status || (new Date(exam.scheduledAt) > new Date() ? 'scheduled' : 'active'),
            resultCount: countMap[exam._id.toString()] || 0
        }));

        return NextResponse.json({
            stats: {
                totalExams,
                totalQuestions,
                totalResults
            },
            recentExams: recentExamsWithCounts
        }, { status: 200 });

    } catch (error) {
        console.error('Dashboard Stats Error:', error);

        // Return 0s on error so dashboard doesn't crash, but log it
        return NextResponse.json({
            stats: { totalExams: 0, totalQuestions: 0, totalResults: 0 },
            recentExams: []
        }, { status: 500 });
    }
}
