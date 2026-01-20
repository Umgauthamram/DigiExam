import mongoose, { Schema, model, models } from 'mongoose';

const ResultSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    exam: {
        type: Schema.Types.ObjectId,
        ref: 'Exam',
        required: true,
    },
    score: {
        type: Number,
        required: true,
    },
    totalQuestions: {
        type: Number,
        required: true,
    },
    violationCount: {
        type: Number,
        default: 0,
    },
    answers: [{
        questionId: { type: Schema.Types.ObjectId, required: true },
        selectedOption: { type: String }, // The text or index of the selected option
        isCorrect: { type: Boolean },
        aiExplanation: { type: String }, // Populated after AI analysis
    }],
    submittedAt: {
        type: Date,
        default: Date.now,
    },
});

const Result = models.Result || model('Result', ResultSchema);

export default Result;
