import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Event from '@/models/Event';
import { adminDatabase, messaging } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

async function sendToAll(title: string, body: string, image?: string) {
    const snapshot = await adminDatabase.ref('fcm_tokens').once('value');
    const data = snapshot.val();
    if (!data) return 0;

    const tokens = Object.values(data).map((entry: any) => entry.token);
    if (tokens.length === 0) return 0;

    const logId = `auto_${Date.now()}`;
    const notificationUrl = `/?notif_id=${logId}`;

    const payload = {
        data: {
            title,
            body,
            url: notificationUrl,
            ...(image && { image })
        }
    };

    const CHUNK_SIZE = 500;
    let successful = 0;

    for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
        const chunk = tokens.slice(i, i + CHUNK_SIZE);
        const response = await messaging.sendEachForMulticast({
            tokens: chunk as string[],
            ...payload
        });
        successful += response.successCount;
    }

    // Log to Firebase
    await adminDatabase.ref(`notification_logs/${logId}`).set({
        id: logId,
        title,
        body,
        sentCount: successful,
        totalSubs: tokens.length,
        clickCount: 0,
        timestamp: Date.now(),
        type: 'automated'
    });

    return successful;
}

export async function GET(req: Request) {
    // Basic protection using a secret header or just rely on the cron-job.org pinging
    // For now, it's public but we can add a token check later.

    try {
        await connectDB();
        const now = new Date();
        const results: any[] = [];

        // 1. Check for 1-Hour Alerts (Matches starting in 50-70 mins)
        const hourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
        const startTimeMin = new Date(hourFromNow.getTime() - 10 * 60 * 1000);
        const startTimeMax = new Date(hourFromNow.getTime() + 10 * 60 * 1000);

        const upcomingEvents = await Event.find({
            startTime: { $gte: startTimeMin, $lte: startTimeMax },
            notificationSent1hr: false,
            status: 'Scheduled'
        });

        for (const event of upcomingEvents) {
            const count = await sendToAll(
                `Match Starting Soon! 🏏`,
                `${event.title} is starting in about 1 hour. Get ready!`,
                event.coverImage
            );
            event.notificationSent1hr = true;
            await event.save();
            results.push({ type: '1hr', event: event.title, count });
        }

        // 2. Check for LIVE Alerts (Matches that just turned Live)
        const liveEvents = await Event.find({
            status: 'Live',
            notificationSentLive: false
        });

        for (const event of liveEvents) {
            // Send to global subs
            const globalCount = await sendToAll(
                `Match is LIVE! 🔴`,
                `${event.title} has started! Watch it now.`,
                event.coverImage
            );

            // Send specifically to those who clicked "Remind Me" (optional, they already got global if enabled)
            // But if they ONLY wanted this match, this is where it helps.
            // For simplicity, we assume sendToAll covers everyone who opted in globally.

            event.notificationSentLive = true;
            await event.save();
            results.push({ type: 'Live', event: event.title, count: globalCount });
        }

        // 3. Admin Scheduled Notifications (Custom)
        const schedSnapshot = await adminDatabase.ref('scheduled_notifications').once('value');
        const schedData = schedSnapshot.val();

        if (schedData) {
            for (const key in schedData) {
                const notif = schedData[key];
                if (new Date(notif.sendAt) <= now) {
                    const count = await sendToAll(notif.title, notif.body, notif.image);
                    // Remove from scheduled
                    await adminDatabase.ref(`scheduled_notifications/${key}`).remove();
                    results.push({ type: 'Scheduled', title: notif.title, count });
                }
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
