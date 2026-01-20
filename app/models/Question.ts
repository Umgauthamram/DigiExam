import mongoose, { Schema, model, models } from 'mongoose';

const QuestionSchema = new Schema({
    text: {
        type: String,
        required: true,
    },
    options: [{
        text: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
    }],
    // For IPFS images/docs. If present, we show this.
    attachmentCid: {
        type: String,
        default: null,
    },
    examId: {
        type: Schema.Types.ObjectId,
        ref: 'Exam',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Question = models.Question || model('Question', QuestionSchema);

export default Question;
