
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Result from '@/models/Result';
import Question from '@/models/Question'; // Needed for population? Mongoose might handle model name if registered
import Exam from '@/models/Exam';
import jwt from 'jsonwebtoken';

export async function GET(req, { params }) {
    try {
        await dbConnect();

        // 1. Auth Check
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

        const { id: resultId } = await params;

        // 2. Fetch Result
        // We need to populate the questions inside the answers array to get the Question Text and Correct Option
        const result = await Result.findOne({ _id: resultId, user: userId })
            .populate({
                path: 'answers.questionId',
                model: 'Question',
                select: 'text options aiExplanation'
            })
            .populate('exam', 'title') // Get Exam Name
            .lean();

        if (!result) {
            return NextResponse.json({ error: 'Result not found' }, { status: 404 });
        }

        // 3. Format Response
        // Transform populate data into a cleaner structure for the frontend
        const answers = result.answers || []; // check if empty
        const attemptedCount = answers.filter(a => a.selectedOption).length;

        const formattedAnswers = answers.map(ans => {
            const question = ans.questionId; // This is now the populated object
            if (!question) return null; // Should not happen

            // Correct Option Logic (Fix: find by isCorrect flag, not nonexistent index)
            const correctOption = question.options.find(o => o.isCorrect);
            const correctOptionText = correctOption ? correctOption.text : 'Unknown';

            // Find explanation for the selected option (if incorrect)
            const selectedOptObj = question.options.find(o => o.text === ans.selectedOption);
            let specificExplanation = "";

            if (selectedOptObj && selectedOptObj.explanation) {
                specificExplanation = selectedOptObj.explanation;
            }

            // Combine: Specific (if any) + General AI Explanation
            // If correct, maybe just show general. If wrong, show specific first.
            let finalExplanation = question.aiExplanation || "";

            if (!ans.isCorrect && specificExplanation) {
                finalExplanation = `${specificExplanation}\n\n${finalExplanation}`;
            }

            return {
                qId: question._id,
                text: question.text,
                selected: ans.selectedOption, // This is the text
                correct: correctOptionText,
                isCorrect: ans.isCorrect,
                aiExplanation: finalExplanation || null
            };
        }).filter(Boolean);

        const responseData = {
            examTitle: result.exam?.title,
            score: result.score,
            totalQuestions: result.totalQuestions,
            violationCount: result.violationCount,
            violations: result.violationCount, // Alias for frontend compatibility
            violationReason: result.violationReason,
            timeTaken: result.timeTaken,
            answers: formattedAnswers,
            attemptedCount // Send this so frontend knows
        };

        return NextResponse.json({ result: responseData }, { status: 200 });

    } catch (error) {
        console.error('Fetch Result Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const token = req.cookies.get('token')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
            userId = decoded.id;
        } catch (e) {
            return NextResponse.json({ error: 'Invalid Token' }, { status: 401 });
        }

        const { id: resultId } = await params;
        const result = await Result.findOneAndDelete({ _id: resultId, user: userId });

        if (!result) {
            return NextResponse.json({ error: 'Result not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete Result Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
