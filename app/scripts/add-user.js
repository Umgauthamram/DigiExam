const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// --- EDIT THESE VALUES TO CREATE A NEW USER ---
const NEW_USER = {
    name: 'New Officer',
    email: 'admin@police.gov.in',
    password: 'password123',
    role: 'admin' // Options: 'admin' or 'cadet'
};
// ----------------------------------------------

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: { type: String, select: false },
    role: { type: String, enum: ['admin', 'cadet'], default: 'cadet' },
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function addUser() {
    if (!process.env.MONGODB_URI) {
        console.error(' Error: MONGODB_URI not found in .env.local');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const existingUser = await User.findOne({ email: NEW_USER.email });
        if (existingUser) {
            console.log(`User with email ${NEW_USER.email} already exists.`);
            process.exit(0);
        }

        const hashedPassword = await bcrypt.hash(NEW_USER.password, 10);

        await User.create({
            name: NEW_USER.name,
            email: NEW_USER.email,
            password: hashedPassword,
            role: NEW_USER.role,
        });

        console.log(`\n🎉 User Created Successfully!`);
        console.log(`Name: ${NEW_USER.name}`);
        console.log(`Email: ${NEW_USER.email}`);
        console.log(`Role: ${NEW_USER.role}`);
        console.log(`Password: ${NEW_USER.password}`);

        process.exit(0);
    } catch (error) {
        console.error(' Error creating user:', error);
        process.exit(1);
    }
}

addUser();
