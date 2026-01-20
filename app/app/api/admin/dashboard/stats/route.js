import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import Question from '@/models/Question';
import Result from '@/models/Result';

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

        return NextResponse.json({
            stats: {
                totalExams,
                totalQuestions,
                totalResults
            },
            recentExams: recentExams.map(exam => ({
                _id: exam._id,
                title: exam.title,
                scheduledAt: exam.scheduledAt,
                durationMinutes: exam.durationMinutes,
                // Add status logic if needed (e.g. compare date)
                status: new Date(exam.scheduledAt) > new Date() ? 'Scheduled' : 'Active'
            }))
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
