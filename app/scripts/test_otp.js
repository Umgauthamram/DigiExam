const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

// Define Schema matching the app
const ExamSchema = new mongoose.Schema({
    title: String,
    status: { type: String, enum: ['scheduled', 'active', 'ended'], default: 'scheduled' },
    scheduledAt: Date,
    accessCode: String,
    accessCodeExpiresAt: Date
});

// Force fresh model
if (mongoose.models.Exam) delete mongoose.models.Exam;
const Exam = mongoose.model('Exam', ExamSchema);

async function testFlow() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        // 1. Create Exam
        const exam = await Exam.create({
            title: 'Test OTP Persistence ' + Date.now(),
            scheduledAt: new Date(),
            durationMinutes: 60,
            status: 'scheduled'
        });
        console.log('Exam created:', exam._id, exam.status);

        // 2. Simulate Generate OTP (like the API)
        const otp = '123456';
        const expiresAt = new Date(Date.now() + 300000);

        await Exam.findByIdAndUpdate(exam._id, {
            accessCode: otp,
            accessCodeExpiresAt: expiresAt,
            status: 'active'
        });
        console.log('Simulated API Update: Set OTP & Active');

        // 3. Fetch immediately
        const fetched1 = await Exam.findById(exam._id);
        console.log('Fetch 1 (Immediate):', fetched1.status, fetched1.accessCode);

        if (fetched1.status !== 'active' || fetched1.accessCode !== otp) {
            console.error('FAIL: Immediate fetch showed wrong data');
            process.exit(1);
        }

        // 4. Wait 2 seconds and fetch again
        await new Promise(r => setTimeout(r, 2000));
        const fetched2 = await Exam.findById(exam._id);
        console.log('Fetch 2 (After 2s):', fetched2.status);

        if (fetched2.status !== 'active') {
            console.error('FAIL: Persistence lost after delay');
            process.exit(1);
        }

        console.log('SUCCESS: DB Persistence is working correctly.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

testFlow();
