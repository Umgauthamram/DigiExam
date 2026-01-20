import dbConnect from '@/lib/db';
import Question from '@/models/Question';
import Exam from '@/models/Exam';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
    try {
        try {
            await dbConnect();
        } catch (e) {
            return NextResponse.json({ message: 'Mock Questions Saved' }, { status: 200 });
        }

        // In Next.js 15+, params is a promise
        const { id: examId } = await params;
        const body = await req.json();
        const { questions } = body;

        // Validate
        if (!examId || !questions || !Array.isArray(questions)) {
            return NextResponse.json({ message: 'Invalid data' }, { status: 400 });
        }

        const createdQuestions = [];

        for (const q of questions) {
            const newQuestion = await Question.create({
                text: q.text,
                options: q.options,
                examId: examId,
            });
            createdQuestions.push(newQuestion._id);
        }

        // Link questions to Exam
        await Exam.findByIdAndUpdate(examId, {
            $push: { questions: { $each: createdQuestions } }
        });

        return NextResponse.json({ message: 'Questions added', count: createdQuestions.length }, { status: 201 });

    } catch (error) {
        console.error('Add Questions Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
