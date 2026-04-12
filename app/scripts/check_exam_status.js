const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const ExamSchema = new mongoose.Schema({
    title: String,
    status: String,
    isActive: Boolean
});

const Exam = mongoose.models.Exam || mongoose.model('Exam', ExamSchema);

async function checkStatus() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const exams = await Exam.find({}).sort({ _id: -1 }).limit(1).lean();
        console.log('Most recent exam:', JSON.stringify(exams[0], null, 2));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkStatus();
