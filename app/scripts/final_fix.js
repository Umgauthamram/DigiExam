const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Schema matching app
const ExamSchema = new mongoose.Schema({
    title: String,
    status: { type: String, enum: ['scheduled', 'active', 'ended'] },
    accessCode: String,
    isActive: Boolean
}, { strict: false });

if (mongoose.models.Exam) delete mongoose.models.Exam;
const Exam = mongoose.model('Exam', ExamSchema);

async function finalFix() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB...');

        const targetId = '696f51d567a9913d97c5d5f8';

        // 1. Force update the specific reported exam to 'ended'
        const res = await Exam.updateOne(
            { _id: targetId },
            { $set: { status: 'ended', accessCode: null } }
        );
        console.log(`Target Fix Result:`, res);

        // 2. Catch-all: Update any exam with no status and no accessCode to 'ended'
        // This covers "demo 4" if ID was wrong but pattern matches
        const res2 = await Exam.updateMany(
            { status: { $exists: false }, accessCode: null },
            { $set: { status: 'ended' } }
        );
        console.log(`Bulk Fix Result:`, res2);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

finalFix();
