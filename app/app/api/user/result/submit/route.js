import dbConnect from '@/lib/db';
import Exam from '@/models/Exam';
import Question from '@/models/Question';
import Result from '@/models/Result';
import { NextResponse } from 'next/server';

export async function POST(req) {
    try {
        try {
            await dbConnect();
        } catch (e) {
            // Mock Mode Submission
            return NextResponse.json({
                message: 'Mock Submission Success',
                resultId: 'mock_result_123'
            }, { status: 200 });
        }

        const body = await req.json();
        const { examId, userId, answers, violations } = body;
        // answers = { qId: optionIndex }

        const exam = await Exam.findById(examId);
        const questions = await Question.find({ examId: examId });

        let score = 0;
        const processedAnswers = [];

        // Grading Logic
        for (const q of questions) {
            const selectedIdx = answers[q._id];
            const correctOpt = q.options.find(o => o.isCorrect);
            const correctIdx = q.options.findIndex(o => o.isCorrect);
            const selectedOptText = selectedIdx !== undefined ? q.options[selectedIdx].text : null;

            const isCorrect = selectedIdx === correctIdx;
            if (isCorrect) score++;

            let aiExplanation = null;
            if (!isCorrect && selectedIdx !== undefined) {
                // Mock AI Call
                aiExplanation = await generateMockAiExplanation(q.text, selectedOptText, correctOpt.text);
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
            answers: processedAnswers
        });

        // Send Email (Mock)
        // await sendReportEmail(userId, score); 

        return NextResponse.json({ message: 'Exam Submitted', resultId: result._id }, { status: 201 });

    } catch (error) {
        console.error('Submit Error:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

async function generateMockAiExplanation(question, wrongAnswer, rightAnswer) {
    // Simulate LLM latency
    await new Promise(r => setTimeout(r, 500));
    return `Analysis: You selected "${wrongAnswer}" which is incorrect. The correct answer is "${rightAnswer}" because based on police standard operating procedures, this protocol ensures maximum safety and legal compliance.`;
}
