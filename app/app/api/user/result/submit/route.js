import { GoogleGenerativeAI } from "@google/generative-ai";

import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import Question from '@/models/Question';
import Result from '@/models/Result';
import { NextResponse } from 'next/server';

import jwt from 'jsonwebtoken';

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

            // AI Explanation for wrong answers
            let aiExplanation = null;
            if (!isCorrect && selectedOptText) {
                // In a real app, this would be an async queue or background job to avoid blocking
                // For now, we await a quick mock generation
                aiExplanation = await generateMockAiExplanation(q.text, selectedOptText, q.options[correctIdx].text);
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

        return NextResponse.json({ message: 'Exam Submitted', resultId: result._id }, { status: 201 });

    } catch (error) {
        console.error('Submit Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

async function generateMockAiExplanation(question, wrongAnswer, rightAnswer) {
    // 1. Check for API Key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        // Fallback to Mock if no key
        await new Promise(r => setTimeout(r, 500));
        return `Analysis (Mock): You selected "${wrongAnswer}" which is incorrect. The correct answer is "${rightAnswer}". (Add GEMINI_API_KEY to .env.local for real AI)`;
    }

    try {
        // 2. Call Gemini 1.5 Flash
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

        const prompt = `Explain strictly and concisely why "${wrongAnswer}" is incorrect and "${rightAnswer}" is correct for the Question: "${question}". 
        Focus on the reasoning. Max 2-3 sentences. Do not mention "Step 1" or markdown formatting.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini API Error:", error);
        return `Analysis Failed: Unable to generate explanation at this time. Correct Answer: ${rightAnswer}`;
    }
}
