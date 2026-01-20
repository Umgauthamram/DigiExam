import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
    try {
        try {
            await dbConnect();
        } catch (e) {
            // Mock fallback
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            return NextResponse.json({ otp }, { status: 200 });
        }

        const { id: examId } = await params;

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

        await Exam.findByIdAndUpdate(examId, {
            accessCode: otp,
            accessCodeExpiresAt: expiresAt
        });

        return NextResponse.json({ otp }, { status: 200 });
    } catch (error) {
        console.error('OTP Gen Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
