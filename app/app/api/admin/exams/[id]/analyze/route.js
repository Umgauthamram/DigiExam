import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Question from '@/models/Question';
import { generateQuestionAnalysis } from '@/lib/ai';

export async function POST(req, { params }) {
    try {
        await dbConnect();
        const { id: examId } = await params;
        const { limit = 5 } = await req.json();

        // Find questions without AI explanation
        const questionsToAnalyze = await Question.find({
            examId: examId,
            $or: [
                { aiExplanation: { $exists: false } },
                { aiExplanation: "" },
                { aiExplanation: null }
            ]
        }).limit(limit);

        if (questionsToAnalyze.length === 0) {
            return NextResponse.json({ message: 'All questions analyzed', processed: 0, remaining: 0 });
        }

        // Generate Analysis
        const analysisResults = await generateQuestionAnalysis(questionsToAnalyze);

        // Update DB
        let successCount = 0;
        for (const res of analysisResults) {
            const q = await Question.findById(res.id);
            if (q) {
                q.aiExplanation = res.aiExplanation;
                // Update options explanations
                if (res.optionExplanations && Array.isArray(res.optionExplanations)) {
                    q.options.forEach((opt, idx) => {
                        if (res.optionExplanations[idx]) {
                            opt.explanation = res.optionExplanations[idx];
                        }
                    });
                }
                await q.save();
                successCount++;
            }
        }

        // Check remaining count
        const remaining = await Question.countDocuments({
            examId: examId,
            $or: [
                { aiExplanation: { $exists: false } },
                { aiExplanation: "" },
                { aiExplanation: null }
            ]
        });

        return NextResponse.json({
            message: `Analyzed ${successCount} questions`,
            processed: successCount,
            remaining,
            success: true
        });

    } catch (error) {
        console.error("Analysis API Error:", error);
        return NextResponse.json(
            { message: 'Analysis failed', error: error.message },
            { status: 500 }
        );
    }
}
