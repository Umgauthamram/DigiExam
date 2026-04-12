import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '1d';

export async function POST(req) {
    try {
        const bodyText = await req.text();
        
        if (!JWT_SECRET) {
            console.error('JWT_SECRET is not defined in environment variables');
            return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
        }

        if (!bodyText) {
            return NextResponse.json({ message: 'Empty request body' }, { status: 400 });
        }
        const { email, password } = JSON.parse(bodyText);

        // Try connecting to DB, fall back to mock if fails
        try {
            await dbConnect();

            // Explicitly select password since it's excluded by default
            const user = await User.findOne({ email }).select('+password');
            if (user) {
                const isMatch = await bcrypt.compare(password, user.password);
                if (isMatch) {
                    const token = jwt.sign(
                        { id: user._id, role: user.role, name: user.name },
                        JWT_SECRET,
                        { expiresIn: JWT_EXPIRES_IN }
                    );
                    return createLoginResponse(user, token);
                }
            }
        } catch (dbError) {
            console.warn('Database connection failed, assuming MOCK MODE for Dev');
            const mockUser = getMockUser(email, password);
            if (mockUser) {
                const token = jwt.sign(
                    { id: mockUser._id, role: mockUser.role, name: mockUser.name },
                    JWT_SECRET,
                    { expiresIn: JWT_EXPIRES_IN }
                );
                return createLoginResponse(mockUser, token);
            }
        }

        // Return invalid credentials if neither DB nor Mock matched
        return NextResponse.json(
            { message: 'Invalid credentials' },
            { status: 401 }
        );

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}

function getMockUser(email, password) {
    if (email === 'admin@police.gov.in' && password === 'admin123') {
        return { _id: 'mock_admin_id', name: 'Chief Instructor (Mock)', email, role: 'admin' };
    }
    if (email === 'cadet@police.gov.in' && password === 'cadet123') {
        return { _id: 'mock_cadet_id', name: 'Cadet Rahul (Mock)', email, role: 'cadet' };
    }
    return null;
}

function createLoginResponse(user, token) {
    const response = NextResponse.json(
        {
            message: 'Login successful',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        },
        { status: 200 }
    );

    // Set cookie
    response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24, // 1 day in seconds
        path: '/',
    });

    return response;
}



