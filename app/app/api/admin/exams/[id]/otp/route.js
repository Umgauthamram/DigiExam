import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

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
        const exam = await Exam.findById(examId);

        if (!exam) return NextResponse.json({ message: 'Not Found' }, { status: 404 });

        let updateData = {};
        const now = new Date();
        const otp1 = Math.floor(100000 + Math.random() * 900000).toString();
        const otp2 = Math.floor(100000 + Math.random() * 900000).toString(); // Pre-generate explicitly

        // Scenario 1: Fresh Start (No Series) -> Generate 2 Sequential Otps
        if (!exam.accessCodeSeries || exam.accessCodeSeries.length === 0) {

            const expiry1 = new Date(now.getTime() + 5 * 60 * 1000); // T+5m
            const start2 = expiry1;
            const expiry2 = new Date(start2.getTime() + 5 * 60 * 1000); // T+10m

            updateData = {
                status: 'active',
                accessCode: otp1,
                accessCodeExpiresAt: expiry1,
                accessCodeSeries: [
                    { code: otp1, startsAt: now, expiresAt: expiry1 },
                    { code: otp2, startsAt: start2, expiresAt: expiry2 }
                ]
            };
        }
        // Scenario 2: Manual Refresh (Series exists) -> Generate 1 Immediate OTP
        else {
            const expiry = new Date(now.getTime() + 5 * 60 * 1000);
            updateData = {
                status: 'active',
                accessCode: otp1,
                accessCodeExpiresAt: expiry,
                $push: { accessCodeSeries: { code: otp1, startsAt: now, expiresAt: expiry } }
            };
        }

        await Exam.findByIdAndUpdate(examId, updateData);

        // Return current active one
        return NextResponse.json({ otp: otp1 }, { status: 200 });
    } catch (error) {
        console.error('OTP Gen Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
