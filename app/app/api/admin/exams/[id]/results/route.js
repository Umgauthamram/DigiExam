
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Result from '@/models/Result';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id: examId } = await params;

        // Fetch all results for this exam, excluding heavy 'answers' array
        const results = await Result.find({ exam: examId })
            .select('-answers') // performance optimization
            .populate('user', 'name email image')
            .sort({ score: -1 })
            .lean();

        // Transform slightly for frontend
        const formattedResults = results.map(r => ({
            _id: r._id,
            user: {
                name: r.user?.name || 'Unknown User',
                email: r.user?.email || 'No Email',
                image: r.user?.image
            },
            score: r.score,
            totalQuestions: r.totalQuestions,
            percentage: r.totalQuestions > 0 ? Math.round((r.score / r.totalQuestions) * 100) : 0,
            violationCount: r.violationCount,
            violationReason: r.violationReason,
            timeTaken: r.timeTaken,
            submittedAt: r.submittedAt
        }));

        return NextResponse.json({ results: formattedResults }, { status: 200 });

    } catch (error) {
        console.error("Fetch Exam Results Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
