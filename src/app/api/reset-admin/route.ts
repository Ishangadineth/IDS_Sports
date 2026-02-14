import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        await dbConnect();

        const username = 'ids';
        const newPassword = 'admin123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Find and Update
        const user = await User.findOneAndUpdate(
            { username },
            { password: hashedPassword, role: 'admin' }, // Ensure role is admin
            { new: true }
        );

        if (!user) {
            return NextResponse.json({ message: 'User not found. Use temp-seed first.' });
        }

        return NextResponse.json({
            message: 'Password reset successfully',
            username: user.username,
            role: user.role
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
