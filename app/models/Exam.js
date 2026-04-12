import mongoose, { Schema, model, models } from 'mongoose';

const ExamSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    durationMinutes: {
        type: Number,
        required: true,
    },
    supervisorEmail: {
        type: String,
        required: true,
    },
    scheduledAt: {
        type: Date,
        required: true,
    },
    questions: [{
        type: Schema.Types.ObjectId,
        ref: 'Question',
    }],
    // Session Access Code (OTP)
    accessCode: {
        type: String,
        default: null,
    },
    accessCodeExpiresAt: {
        type: Date,
        default: null,
    },
    // Multi-OTP Support (Sequential)
    accessCodeSeries: [{
        code: String,
        startsAt: Date,
        expiresAt: Date
    }],
    status: {
        type: String,
        enum: ['scheduled', 'active', 'ended'],
        default: 'scheduled',
    },
    // Deprecated: use status instead
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Prevent Mongoose overwrite warning or stale model in dev
if (process.env.NODE_ENV !== 'production') {
    delete models.Exam;
}

const Exam = models.Exam || model('Exam', ExamSchema);

export default Exam;
