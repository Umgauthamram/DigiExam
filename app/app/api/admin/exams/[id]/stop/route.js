import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const { id: examId } = await params;

        await Exam.findByIdAndUpdate(examId, {
            accessCode: null,
            accessCodeExpiresAt: null,
            status: 'ended'
        });

        return NextResponse.json({ message: 'Exam Session Stopped' }, { status: 200 });
    } catch (error) {
        console.error('Stop Exam Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
