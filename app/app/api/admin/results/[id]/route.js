
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Result from '@/models/Result';
import Exam from '@/models/Exam';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id: resultId } = await params;

        // Admin can fetch any result by ID
        const result = await Result.findById(resultId)
            .populate({
                path: 'answers.questionId',
                model: 'Question',
                select: 'text options correctOptionIndex'
            })
            .populate('user', 'name email image')
            .populate('exam', 'title description')
            .lean();

        if (!result) {
            return NextResponse.json({ message: 'Result not found' }, { status: 404 });
        }

        // Format answers for frontend
        const formattedAnswers = result.answers.map(ans => {
            const question = ans.questionId;
            if (!question) return null;

            // Find correct option safely
            const correctOption = question.options.find(o => o.isCorrect);
            const correctOptionText = correctOption ? correctOption.text : 'Unknown';

            return {
                qId: question._id,
                text: question.text,
                selected: ans.selectedOption,
                correct: correctOptionText,
                isCorrect: ans.isCorrect,
                aiExplanation: ans.aiExplanation || (!ans.isCorrect && ans.selectedOption ? `Correct answer: ${correctOptionText}` : null)
            };
        }).filter(Boolean);

        return NextResponse.json({
            result: {
                _id: result._id,
                examTitle: result.exam?.title || 'Unknown Exam',
                user: {
                    name: result.user?.name || 'Unknown User',
                    email: result.user?.email || 'No Email'
                },
                score: result.score,
                totalQuestions: result.totalQuestions,
                violationCount: result.violationCount,
                violationReason: result.violationReason,
                timeTaken: result.timeTaken,
                percentage: result.totalQuestions > 0 ? Math.round((result.score / result.totalQuestions) * 100) : 0,
                submittedAt: result.submittedAt,
                answers: formattedAnswers
            }
        }, { status: 200 });

    } catch (error) {
        console.error("Fetch Result Detail Error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}
