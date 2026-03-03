import { NextResponse } from 'next/server';
import { adminDatabase, messaging } from '@/lib/firebase-admin';
import webpush from 'web-push';

export const dynamic = 'force-dynamic';

// --- LEGACY WEB-PUSH CONFIG ---
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || 'BPKuJziX2y4UOocG-K33eXh4MksCirpPRBnld5fXRoEAkE82iZQye8oml3VT_41y6EnrIWi02-IRRS2jfYlknxI';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@ishangadineth.online';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export async function POST(req: Request) {
    try {
        const { title, body, url, image } = await req.json();

        if (!adminDatabase || !messaging) {
            console.error('Firebase Admin services are not initialized. Check your environment variables.');
            return NextResponse.json({
                error: 'Firebase Admin not initialized. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY on Vercel.'
            }, { status: 500 });
        }

        // 1. Fetch ALL Subscribers (FCM holds the new ones, push_subscriptions holds the legacy)
        const [fcmSnapshot, legacySnapshot] = await Promise.all([
            adminDatabase.ref('fcm_tokens').once('value'),
            adminDatabase.ref('push_subscriptions').once('value')
        ]);

        const fcmData = fcmSnapshot.val();
        const legacyData = legacySnapshot.val();

        // Prepare Stats
        let successCount = 0;
        let failureCount = 0;
        let totalFCM = 0;
        let totalLegacy = 0;

        const logId = Date.now().toString();
        const notificationUrl = url ? (url.startsWith('http') ? url : `https://idssports.ishangadineth.online${url}`) : `https://idssports.ishangadineth.online/?notif_id=${logId}`;

        // --- PART A: SEND FCM (NEW) ---
        if (fcmData) {
            const tokens = Object.values(fcmData).map((entry: any) => entry.token);
            totalFCM = tokens.length;

            if (tokens.length > 0) {
                const payload = {
                    data: {
                        title,
                        body,
                        url: notificationUrl,
                        ...(image && { image })
                    }
                };

                const CHUNK_SIZE = 500;
                for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
                    const chunk = tokens.slice(i, i + CHUNK_SIZE);
                    const response = await messaging.sendEachForMulticast({
                        tokens: chunk as string[],
                        ...payload
                    });
                    successCount += response.successCount;
                    failureCount += response.failureCount;
                }
            }
        }

        // --- PART B: SEND LEGACY WEB-PUSH (OLD) ---
        // We do this as a fire-and-forget or in background to not block the response too long
        if (legacyData && VAPID_PRIVATE_KEY) {
            const legacySubs = Object.values(legacyData);
            totalLegacy = legacySubs.length;

            // Limit to avoid Vercel timeout - only send to first 1000 legacy subs in this immediate call
            // Ideally we'd use a background queue, but for transition this is okay.
            const subsToSend = legacySubs.slice(0, 1000);

            const legacyPayload = JSON.stringify({
                title,
                body,
                url: notificationUrl,
                image
            });

            // We don't await all of them to keep response fast, but we'll trigger them
            subsToSend.forEach((sub: any) => {
                webpush.sendNotification(sub, legacyPayload).catch(err => {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        // Cleanup expired tokens if we wanted to
                    }
                });
            });
        }

        // 4. Log combined stats
        await adminDatabase.ref(`notification_logs/${logId}`).set({
            id: logId,
            title,
            body,
            sentCount: successCount, // This specifically tracks FCM success for now
            totalSubs: totalFCM + totalLegacy,
            fcmCount: totalFCM,
            legacyCount: totalLegacy,
            clickCount: 0,
            timestamp: Date.now()
        });

        return NextResponse.json({
            success: true,
            fcmSuccess: successCount,
            totalReach: totalFCM + totalLegacy,
            logId
        });
    } catch (e) {
        console.error('Send Push Error:', e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
