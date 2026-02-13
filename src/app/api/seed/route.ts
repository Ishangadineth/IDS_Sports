import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
    // Prevent running in production if needed, or just keep it obscure.
    // For this user, we serve it as a helper.

    try {
        await dbConnect();

        // Check if admin already exists
        const existingUser = await User.findOne({ username: 'admin' });
        if (existingUser) {
            return NextResponse.json({ message: 'Admin user already exists. You can login now.' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create the user
        await User.create({
            username: 'admin',
            password: hashedPassword,
        });

        return NextResponse.json({
            success: true,
            message: 'Admin User Created Successfully!',
            credentials: {
                username: 'admin',
                password: 'admin123'
            },
            note: 'Please delete this route or secure it after use.'
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
