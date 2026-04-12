const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Simple Schema definitions since we can't easily import ES Modules in this script without setup
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: { type: String, select: false },
    role: { type: String, enum: ['admin', 'cadet'], default: 'cadet' },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seed() {
    if (!process.env.MONGODB_URI) {
        console.error('Please define MONGODB_URI in .env.local');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create Admin
        const adminEmail = 'admin@gmail.com';
        const adminExists = await User.findOne({ email: adminEmail });

        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await User.create({
                name: 'Chief Instructor',
                email: adminEmail,
                password: hashedPassword,
                role: 'admin',
            });
            console.log(`Admin created: ${adminEmail} / admin123`);
        } else {
            console.log('Admin already exists');
        }

        // Create User
        // const userEmail = 'cadet@police.gov.in';
        // const userExists = await User.findOne({ email: userEmail });

        // if (!userExists) {
        //     const hashedPassword = await bcrypt.hash('cadet123', 10);
        //     await User.create({
        //         name: 'Cadet Rahul',
        //         email: userEmail,
        //         password: hashedPassword,
        //         role: 'cadet',
        //     });
        //     console.log('User created: cadet@police.gov.in / cadet123');
        // } else {
        //     console.log('User already exists');
        // }

        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
}

seed();
