import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ActivityLog from '@/models/ActivityLog';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const verifyToken = (req: Request) => {
    const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

export async function GET(req: Request) {
    await dbConnect();

    const user = verifyToken(req);
    // Only 'admin' (aaids) can view logs
    if (!user || (user as any).role !== 'admin') {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    try {
        // Fetch logs sorted by newest first
        const logs = await ActivityLog.find({}).sort({ timestamp: -1 });
        return NextResponse.json({ success: true, data: logs });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 400 });
    }
}
