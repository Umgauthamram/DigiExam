const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Raw Schema to see exactly what is in DB
const ExamSchema = new mongoose.Schema({
    title: String,
    status: String,
    accessCode: String,
    isActive: Boolean
}, { strict: false }); // strict: false to see all fields

const Exam = mongoose.models.Exam || mongoose.model('Exam', ExamSchema);

async function checkSpecificExam() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const examId = '696f51d567a9913d97c5d5f8';
        const exam = await Exam.findById(examId).lean();

        if (!exam) {
            console.log('Exam not found');
        } else {
            console.log('Exam Data:', JSON.stringify(exam, null, 2));
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkSpecificExam();
