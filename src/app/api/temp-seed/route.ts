import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        await dbConnect();

        const username = process.env.ADMIN_USERNAME || 'aaids';
        const password = process.env.ADMIN_PASSWORD || 'admin123';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return NextResponse.json({ message: 'Admin user already exists' });
        }

        // Create Admin
        await User.create({
            username,
            password: hashedPassword,
            role: 'admin'
        });

        return NextResponse.json({ message: `Admin user '${username}' created successfully` });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
