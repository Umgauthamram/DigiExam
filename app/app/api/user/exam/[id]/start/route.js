import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import Question from '@/models/Question'; // Ensure Question model is registered

export async function GET(req, { params }) {
    try {
        await dbConnect();

        // In Next.js 15+, params is a promise, but in route handlers it's often already resolved or we custom access it. 
        // Safer to await if unsure, but standard route handler signature usually has params as object.
        // However, widely compatible way:
        const { id } = await params;

        const exam = await Exam.findById(id).lean();
        if (!exam) {
            return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        }

        // Shuffle helper
        function shuffleArray(array) {
            const arr = [...array];
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }

        // Fetch questions linked to this exam
        const questions = await Question.find({ examId: id }).lean();

        // Sanitize questions: Remove isCorrect flag from options & Shuffle Question Order
        const sanitizedQuestions = shuffleArray(questions).map(q => ({
            _id: q._id,
            text: q.text,
            options: q.options.map(o => ({
                text: o.text,
                _id: o._id
                // deliberately exclude isCorrect
            }))
        }));

        return NextResponse.json({
            exam: {
                _id: exam._id,
                title: exam.title,
                durationMinutes: exam.durationMinutes,
            },
            questions: sanitizedQuestions
        }, { status: 200 });

    } catch (error) {
        console.error('Start Exam Error:', error);

        // FALLBACK MOCK MODE (If DB fails)
        if (error.name === 'MongooseError' || error.message.includes('buffering')) {
            return NextResponse.json({
                exam: { _id: 'mock_exam', title: 'Mock Exam (DB Failed)', durationMinutes: 45 },
                questions: [
                    { _id: 'm1', text: 'Mock Q1: Database is down?', options: [{ text: 'Yes' }, { text: 'No' }, { text: 'Maybe' }, { text: 'Panic' }] },
                    { _id: 'm2', text: 'Mock Q2: Is this a bug?', options: [{ text: 'Yes' }, { text: 'Feature' }, { text: 'Maybe' }, { text: 'Unknown' }] }
                ]
            }, { status: 200 });
        }

        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
