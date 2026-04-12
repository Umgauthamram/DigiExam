import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id: examId } = await params;

        const exam = await Exam.findById(examId).select('status accessCode accessCodeExpiresAt accessCodeSeries');

        if (!exam) {
            return NextResponse.json({ message: 'Exam not found' }, { status: 404 });
        }

        const now = new Date();
        let currentOtp = null;
        let currentExpiresAt = null;
        let nextOtp = null;
        let nextStartsAt = null;

        // Legacy Fallback
        if (exam.accessCode && (!exam.accessCodeExpiresAt || new Date(exam.accessCodeExpiresAt) > now)) {
            currentOtp = exam.accessCode;
            currentExpiresAt = exam.accessCodeExpiresAt;
        }

        // Series Logic (Override Legacy if Active Series Found)
        if (exam.accessCodeSeries && exam.accessCodeSeries.length > 0) {
            // Find Active
            const active = exam.accessCodeSeries.find(c => new Date(c.startsAt) <= now && new Date(c.expiresAt) > now);
            if (active) {
                currentOtp = active.code;
                currentExpiresAt = active.expiresAt;
            }

            // Find Next Upcoming
            const upcoming = exam.accessCodeSeries.find(c => new Date(c.startsAt) > now);
            if (upcoming) {
                nextOtp = upcoming.code;
                nextStartsAt = upcoming.startsAt;
            }
        }

        const isActive = exam.status === 'active' || (currentOtp && exam.status !== 'ended');

        return NextResponse.json({
            status: isActive ? 'active' : exam.status || 'scheduled',
            otp: isActive ? currentOtp : null,
            otpExpiresAt: currentExpiresAt,
            nextOtp: isActive ? nextOtp : null, // Send next OTP info
            nextStartsAt: isActive ? nextStartsAt : null,
            users: 0
        }, { status: 200 });
    } catch (error) {
        console.error('Fetch Exam Status Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
