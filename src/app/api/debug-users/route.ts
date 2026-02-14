import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        await dbConnect();
        // Fetch all users but only return username and role
        const users = await User.find({}, 'username role');

        return NextResponse.json({
            count: users.length,
            users: users,
            envAdminUser: process.env.ADMIN_USERNAME || 'Not Set (Default: aaids)'
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
