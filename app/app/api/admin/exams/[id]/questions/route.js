import dbConnect from '@/lib/db';
import Question from '@/models/Question';
import Exam from '@/models/Exam';
import { NextResponse } from 'next/server';

// 1. GET: Fetch all questions for an exam
export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id: examId } = await params;

        // Find Exam to verify existence (optional but good)
        // Then find questions with matching examId
        // Safety: Valid ObjectId check
        if (typeof examId === 'string' && !examId.match(/^[0-9a-fA-F]{24}$/)) {
            return NextResponse.json({ questions: [] }, { status: 200 });
        }

        const questions = await Question.find({ examId }).sort({ createdAt: 1 });

        return NextResponse.json({ questions }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching questions' }, { status: 500 });
    }
}

// 2. POST: Add NEW questions (Bulk)
export async function POST(req, { params }) {
    try {
        const { id: examId } = await params;
        const body = await req.json();
        const { questions } = body;

        try {
            await dbConnect();
        } catch (dbError) {
            // Mock Fallback: Just return success with fake IDs
            if (!questions || !Array.isArray(questions)) return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
            const mockQuestions = questions.map(q => ({
                ...q,
                _id: Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
            }));
            return NextResponse.json({
                message: 'Mock Questions Added',
                count: mockQuestions.length,
                questions: mockQuestions.map(q => q._id)
            }, { status: 201 });
        }

        if (!examId || !questions || !Array.isArray(questions)) {
            return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
        }

        const createdQuestions = [];

        // Safety: If examId is a legacy string (from old mock mode), don't try to save to DB (it will crash)
        if (typeof examId === 'string' && !examId.match(/^[0-9a-fA-F]{24}$/)) {
            // Return mock success
            const mockQuestions = questions.map(q => ({
                ...q,
                _id: Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
            }));
            return NextResponse.json({
                message: 'Mock Questions Added (Legacy Mode)',
                count: mockQuestions.length,
                questions: mockQuestions.map(q => q._id)
            }, { status: 201 });
        }

        for (const q of questions) {
            const newQuestion = await Question.create({
                text: q.text,
                options: q.options,
                examId: examId,
                correctOptionIndex: q.correctOptionIndex
            });
            createdQuestions.push(newQuestion._id);
        }

        // Link questions to Exam
        await Exam.findByIdAndUpdate(examId, {
            $push: { questions: { $each: createdQuestions } }
        });

        return NextResponse.json({ message: 'Questions added', count: createdQuestions.length, questions: createdQuestions }, { status: 201 });
    } catch (error) {
        console.error('Add Questions Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

// 3. DELETE: Remove questions
export async function DELETE(req, { params }) {
    try {
        await dbConnect();
        const { id: examId } = await params;
        const body = await req.json();
        const { questionIds } = body; // Array of IDs

        if (!questionIds || !Array.isArray(questionIds)) {
            return NextResponse.json({ message: 'Invalid IDs' }, { status: 400 });
        }

        await Question.deleteMany({ _id: { $in: questionIds }, examId });
        await Exam.findByIdAndUpdate(examId, {
            $pull: { questions: { $in: questionIds } }
        });

        return NextResponse.json({ message: 'Questions deleted' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ message: 'Delete Error' }, { status: 500 });
    }
}

// 4. PUT: Update a single question 
export async function PUT(req, { params }) {
    try {
        await dbConnect();
        const body = await req.json();
        const { questionId, text, options, correctOptionIndex } = body;

        const updated = await Question.findByIdAndUpdate(questionId, {
            text, options, correctOptionIndex
        }, { new: true });

        return NextResponse.json({ message: 'Updated', question: updated }, { status: 200 });
    } catch (e) {
        return NextResponse.json({ message: 'Update Error' }, { status: 500 });
    }
}
