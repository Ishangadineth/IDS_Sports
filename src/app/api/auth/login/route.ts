import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logActivity } from '@/lib/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export async function POST(req: Request) {
    try {
        await dbConnect();
        const { username, password } = await req.json();

        const user = await User.findOne({ username });

        if (!user) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // In a real app, use bcrypt.compare(password, user.password)
        // For now, assuming the password might be stored as plain text initially 
        // or hashed. Let's try to compare assuming it's hashed, if not, direct compare (for flexibility during dev).
        // Ideally, ALWAYS hash. I'll stick to bcrypt.
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return NextResponse.json(
                { message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, JWT_SECRET, {
            expiresIn: '1d',
        });

        // Log Activity
        await logActivity(
            { _id: user._id, username: user.username, role: user.role },
            'LOGIN',
            'User logged in successfully',
            req
        );

        const response = NextResponse.json({
            message: 'Login successful',
            user: {
                username: user.username,
                role: user.role
            }
        });

        // Set cookie
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 86400, // 1 day
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
