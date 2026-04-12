import { GoogleGenerativeAI } from "@google/generative-ai";

import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import Question from '@/models/Question';
import Result from '@/models/Result';
import { NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';
import { submitResultOnWeb3, logViolationOnWeb3 } from '@/lib/web3';

export async function POST(req) {
    try {
        await dbConnect();

        // 1. Get User from Token
        const token = req.cookies.get('token')?.value;
        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }
        let userId;
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default_secret');
            userId = decoded.id;
        } catch (e) {
            return NextResponse.json({ message: 'Invalid Token' }, { status: 401 });
        }

        const body = await req.json();
        const { examId, answers, violations, violationReason, timeTaken } = body;

        const exam = await Exam.findById(examId);
        const questions = await Question.find({ examId: examId });

        let score = 0;
        const processedAnswers = [];

        // Grading Logic
        for (const q of questions) {
            const selectedIdx = answers[q._id.toString()];
            const correctIdx = q.options.findIndex(o => o.isCorrect);
            const selectedOptText = selectedIdx !== undefined ? q.options[selectedIdx].text : null;

            const isCorrect = selectedIdx === correctIdx;
            if (isCorrect) score++;

            // AI Explanation for wrong answers (Pre-generated during upload)
            let aiExplanation = null;
            if (!isCorrect && selectedOptText) {
                aiExplanation = q.options[selectedIdx]?.explanation || q.aiExplanation || "No explanation recorded.";
            }

            processedAnswers.push({
                questionId: q._id,
                selectedOption: selectedOptText,
                isCorrect,
                aiExplanation
            });
        }

        // Save Result
        const result = await Result.create({
            user: userId,
            exam: examId,
            score,
            totalQuestions: questions.length,
            violationCount: violations || 0,
            violationReason: violationReason || '',
            timeTaken: timeTaken || 0,
            answers: processedAnswers
        });

        // Compute On-Chain Result Hash (SHA-256)
        const crypto = require('crypto');
        const hashPayload = `${result._id.toString()}-${examId}-${userId}-${score}-${violations || 0}`;
        const resultHash = "0x" + crypto.createHash('sha256').update(hashPayload).digest('hex');

        // Submit to Web3 Immutable Ledger
        submitResultOnWeb3(result._id.toString(), examId, resultHash, "0x0000000000000000000000000000000000000000")
            .catch(err => console.error("Web3 Hash Sync Error:", err));

        // Immutable Violation Logging
        if (violations > 0) {
            logViolationOnWeb3(userId, examId, violationReason || "Security Policy Violation")
                .catch(err => console.error("Web3 Violation Sync Error:", err));
        }

        // Email Notification
        const User = require('@/models/User').default;
        const { sendEmail, buildResultEmailHtml } = require('@/lib/email');
        
        User.findById(userId).then(userDoc => {
            if (userDoc && userDoc.email && exam) {
                const html = buildResultEmailHtml(exam.title, score, questions.length, violations);
                sendEmail({ 
                    to: userDoc.email, 
                    subject: `DigiExam Analytics: Your Secure Result for ${exam.title}`, 
                    html 
                }).catch(e => console.error("Email Broadcast Error:", e));
            }
        }).catch(e => console.error("User fetch error for email:", e));

        return NextResponse.json({ message: 'Exam Submitted', resultId: result._id }, { status: 201 });

    } catch (error) {
        console.error('Submit Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}


