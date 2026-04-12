import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Result from '@/models/Result';

export async function GET(req, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        const submissionCount = await Result.countDocuments({ exam: id });

        return NextResponse.json({ submissionCount }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ submissionCount: 0 }, { status: 500 });
    }
}
