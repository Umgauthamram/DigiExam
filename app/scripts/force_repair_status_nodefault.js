const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Schema WITHOUT defaults to see raw data
const ExamSchema = new mongoose.Schema({
    title: String,
    status: { type: String, enum: ['scheduled', 'active', 'ended'] }, // NO DEFAULT
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

        // Use .find() to get Mongoose documents so we can .save()
        const exams = await Exam.find({});
        console.log(`Found ${exams.length} exams. Checking for missing status...`);

        let fixedCount = 0;

        for (const exam of exams) {
            // Check raw value via .get() or direct access if accessible
            // Since no default, exam.status will be undefined if missing in DB

            if (!exam.status) {
                console.log(`Exam '${exam.title}' (${exam._id}) is missing status.`);

                // Heuristic: If has accessCode, it's active. Else ended (since user complained about stopped exam reverting).
                // If it's brand new (created < 1 min ago), leaving it might be safe, but better to initialize.

                if (exam.accessCode) {
                    exam.status = 'active';
                } else {
                    // Force 'ended' to fix the bug where stopped exams look scheduled
                    exam.status = 'ended';
                }

                // Explicitly mark modified if needed (Mongoose usually tracks it)
                await exam.save();
                console.log(` -> Fixed: set to '${exam.status}'`);
                fixedCount++;
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
