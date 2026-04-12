import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        try {
            await dbConnect();
        } catch (e) {
            // Fallback for Mock Mode if DB fails
            return NextResponse.json({
                message: 'Mock Exam Created',
                exam: { _id: Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join('') }
            }, { status: 201 });
        }

        const body = await req.json();

        const exam = await Exam.create({
            title: body.title,
            description: body.description,
            durationMinutes: body.durationMinutes,
            scheduledAt: body.scheduledAt,
            supervisorEmail: body.supervisorEmail,
            questions: [], // Initially empty
            status: 'scheduled',
            isActive: false // Prevent legacy auto-start
        });

        return NextResponse.json({ message: 'Exam created successfully', exam }, { status: 201 });
    } catch (error) {
        console.error('Create Exam Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        await dbConnect();
        const exams = await Exam.find({}).sort({ createdAt: -1 });
        return NextResponse.json({ exams }, { status: 200 });
    } catch (error) {
        // Mock fallback
        const mockExams = [
            { _id: '1', title: 'Mock Exam 1', scheduledAt: new Date(), durationMinutes: 60, isActive: true },
            { _id: '2', title: 'Mock Exam 2', scheduledAt: new Date(), durationMinutes: 45, isActive: false },
        ];
        return NextResponse.json({ exams: mockExams }, { status: 200 });
    }
}
