import ActivityLog from '@/models/ActivityLog';
import dbConnect from '@/lib/db';

export async function logActivity(
    user: { _id: string; username: string; role: string },
    action: string,
    details?: string,
    req?: Request
) {
    try {
        await dbConnect();

        let ipAddress = 'unknown';
        if (req) {
            ipAddress = req.headers.get('x-forwarded-for') || 'unknown';
        }

        await ActivityLog.create({
            userId: user._id,
            username: user.username,
            role: user.role,
            action,
            details,
            ipAddress,
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // We don't want to fail the main request just because logging failed
    }
}
