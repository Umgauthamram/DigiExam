import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import Result from '@/models/Result';
import jwt from 'jsonwebtoken';

export async function GET(req) {
    try {
        await dbConnect();

        // 1. Get User ID from Token
        const token = req.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
            userId = decoded.id;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        // 2. Fetch All Exams & User's Results
        const [allExams, userResults] = await Promise.all([
            Exam.find({ status: { $ne: 'ended' } }).sort({ scheduledAt: -1 }).lean(),
            Result.find({ user: userId })
                .populate('exam', 'title')
                .sort({ submittedAt: -1 })
                .lean()
        ]);

        // 3. Filter out exams that are already completed
        const completedExamIds = new Set(userResults.map(r => r.exam?._id?.toString()));

        const availableExams = allExams.filter(exam => !completedExamIds.has(exam._id.toString()));

        return NextResponse.json({
            exams: availableExams,
            results: userResults.map(r => ({
                _id: r._id,
                examId: r.exam?._id,
                examTitle: r.exam?.title || 'Unknown Exam',
                score: r.score,
                totalQuestions: r.totalQuestions,
                percentage: r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : 0,
                timeTaken: r.timeTaken,
                submittedAt: r.submittedAt,
                violationCount: r.violationCount || 0,
                violationReason: r.violationReason || '',
                answers: r.answers || []
            }))
        }, { status: 200 });

    } catch (error) {
        console.error('Fetch User Exams Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
