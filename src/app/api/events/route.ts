import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import jwt from 'jsonwebtoken';
import { logActivity } from '@/lib/logger';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// Helper to verify token
const verifyToken = (req: Request) => {
    const token = req.headers.get('cookie')?.split('token=')[1]?.split(';')[0];
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
};

export async function GET() {
    await dbConnect();
    try {
        const events = await Event.find({}).sort({ startTime: 1 });

        // Auto-update status to 'Live' if start time has passed and status is 'Scheduled'
        // Auto-update status to 'Ended' if end time has passed
        const now = new Date();
        const updates = events.map(async (event: any) => {
            const startTime = new Date(event.startTime);
            const endTime = event.endTime ? new Date(event.endTime) : null;

            // Check for 'Ended' condition
            if (endTime && endTime <= now && event.status !== 'Ended') {
                event.status = 'Ended';
                event.streamLinks = []; // Security: Clear links
                await Event.findByIdAndUpdate(event._id, { status: 'Ended', streamLinks: [] });
            }
            // Check for 'Live' condition
            else if (event.status === 'Scheduled' && startTime <= now && (!endTime || endTime > now)) {
                event.status = 'Live';
                await Event.findByIdAndUpdate(event._id, { status: 'Live' });
            }
        });
        await Promise.all(updates);

        return NextResponse.json({ success: true, data: events });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch events' }, { status: 400 });
    }
}

export async function POST(req: Request) {
    await dbConnect();

    const user = verifyToken(req);
    if (!user) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const event = await Event.create(body);

        // Log Activity
        // Note: verifyToken returns a payload, we might need to cast or ensure it has role/username
        const userData = user as any;
        await logActivity(
            { _id: userData.userId, username: userData.username, role: userData.role },
            'CREATE_EVENT',
            `Created event: ${event.title}`,
            req
        );

        return NextResponse.json({ success: true, data: event }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to create event' }, { status: 400 });
    }
}
