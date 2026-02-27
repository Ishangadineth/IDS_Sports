import { NextResponse } from 'next/server';
import webpush from 'web-push';
import connectDB from '@/lib/db';
import Event from '@/models/Event';

const PUBLIC_VAPID_KEY = 'BPKuJziX2y4UOocG-K33eXh4MksCirpPRBnld5fXRoEAkE82iZQye8oml3VT_41y6EnrIWi02-IRRS2jfYlknxI';
const PRIVATE_VAPID_KEY = 'r76PQYLkTGnO4vXizxr1FoTp4Ddy-T0FxSiZN8Y7U8U';
const DB_URL = "https://ids-sports-default-rtdb.asia-southeast1.firebasedatabase.app";

webpush.setVapidDetails(
    'mailto:admin@idssports.com',
    PUBLIC_VAPID_KEY,
    PRIVATE_VAPID_KEY
);

async function sendToAll(title: string, body: string, image?: string) {
    const res = await fetch(`${DB_URL}/push_subscriptions.json`);
    const data = await res.json();
    if (!data) return 0;
    const subscriptions = Object.values(data);
    const logId = `auto_${Date.now()}`;
    const payload = JSON.stringify({
        title,
        body,
        url: `/?notif_id=${logId}`,
        image
    });
    const results = await Promise.allSettled(subscriptions.map((sub: any) => webpush.sendNotification(sub, payload)));
    const successful = results.filter(r => r.status === 'fulfilled').length;

    // Log to Firebase
    await fetch(`${DB_URL}/notification_logs/${logId}.json`, {
        method: 'PUT',
        body: JSON.stringify({
            id: logId,
            title,
            body,
            sentCount: successful,
            totalSubs: subscriptions.length,
            clickCount: 0,
            timestamp: Date.now(),
            type: 'automated'
        })
    });

    return successful;
}

async function sendToEventSubscribers(eventId: string, title: string, body: string, image?: string) {
    // Get specific subscribers for this event
    const res = await fetch(`${DB_URL}/event_subscriptions/${eventId}.json`);
    const subsData = await res.json();
    if (!subsData) return 0;

    // These are just hashes, we need the actual push_subscriptions objects
    const pushRes = await fetch(`${DB_URL}/push_subscriptions.json`);
    const allPushSubs = await pushRes.json();
    if (!allPushSubs) return 0;

    const subIds = Object.keys(subsData);
    const payload = JSON.stringify({ title, body, url: '/', image });

    let count = 0;
    for (const id of subIds) {
        if (allPushSubs[id]) {
            try {
                await webpush.sendNotification(allPushSubs[id], payload);
                count++;
            } catch (e) { console.error('Event push err', e); }
        }
    }
    return count;
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
        const schedRes = await fetch(`${DB_URL}/scheduled_notifications.json`);
        const schedData = await schedRes.json();
        if (schedData) {
            for (const key in schedData) {
                const notif = schedData[key];
                if (new Date(notif.sendAt) <= now) {
                    const count = await sendToAll(notif.title, notif.body, notif.image);
                    // Remove from scheduled
                    await fetch(`${DB_URL}/scheduled_notifications/${key}.json`, { method: 'DELETE' });
                    results.push({ type: 'Scheduled', title: notif.title, count });
                }
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
