const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const ExamSchema = new mongoose.Schema({
    title: String,
    status: { type: String, enum: ['scheduled', 'active', 'ended'], default: 'scheduled' },
    scheduledAt: Date,
    accessCode: String,
    isActive: Boolean
}, { strict: false });

// Force fresh model
if (mongoose.models.Exam) delete mongoose.models.Exam;
const Exam = mongoose.model('Exam', ExamSchema);

async function forceRepair() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB...');

        const exams = await Exam.find({});
        console.log(`Found ${exams.length} exams. Checking for missing status...`);

        let fixedCount = 0;

        for (const exam of exams) {
            const raw = exam.toObject();
            if (!raw.status) {
                console.log(`Exam '${exam.title}' (${exam._id}) is missing status.`);

                // Heuristic: If no access code, probably ended or scheduled.
                // Assuming 'ended' to prevent showing as active in UI.
                exam.status = 'ended';

                // If it looks like a new test (created recently), maybe scheduled?
                // But safer to end it so user can restart/create new.
                if (exam.accessCode) {
                    exam.status = 'active';
                }

                await exam.save();
                console.log(` -> Fixed: set to '${exam.status}'`);
                fixedCount++;
            } else {
                // console.log(`Exam '${exam.title}' has status: ${raw.status}`);
            }
        }

        console.log(`Repair Complete. Fixed ${fixedCount} exams.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

forceRepair();
