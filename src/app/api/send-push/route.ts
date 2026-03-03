import { NextResponse } from 'next/server';
import { adminDatabase, messaging } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { title, body, url, image } = await req.json();

        if (!adminDatabase || !messaging) {
            console.error('Firebase Admin services are not initialized. Check your environment variables.');
            return NextResponse.json({
                error: 'Firebase Admin not initialized. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY on Vercel.'
            }, { status: 500 });
        }

        // 1. Fetch FCM Tokens
        const snapshot = await adminDatabase.ref('fcm_tokens').once('value');
        const data = snapshot.val();

        if (!data) return NextResponse.json({ success: true, count: 0 });

        const tokens = Object.values(data).map((entry: any) => entry.token);
        if (tokens.length === 0) return NextResponse.json({ success: true, count: 0 });

        const logId = Date.now().toString();
        const notificationUrl = `/?notif_id=${logId}`;

        // 2. Prepare FCM Payload
        // We use 'data' payload because our sw.js is set up to handle background messages via data
        const payload = {
            data: {
                title,
                body,
                url: notificationUrl,
                ...(image && { image }) // Add image only if it exists
            }
        };

        // 3. Send Multicast (Handles up to 500 tokens per batch, but Firebase Admin SDK auto-batches in some modern versions. For safety with 2300+, we chunk it into 500s)
        const CHUNK_SIZE = 500;
        let successCount = 0;
        let failureCount = 0;

        for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
            const chunk = tokens.slice(i, i + CHUNK_SIZE);
            const response = await messaging.sendEachForMulticast({
                tokens: chunk as string[],
                ...payload
            });
            successCount += response.successCount;
            failureCount += response.failureCount;
        }

        // 4. Log stats to Firebase
        await adminDatabase.ref(`notification_logs/${logId}`).set({
            id: logId,
            title,
            body,
            sentCount: successCount,
            totalSubs: tokens.length,
            clickCount: 0,
            timestamp: Date.now()
        });

        // Optional: We can also run a cleanup for failed tokens (e.g., NotRegistered) later.

        return NextResponse.json({
            success: true,
            count: successCount,
            failed: failureCount,
            total: tokens.length,
            logId
        });
    } catch (e) {
        console.error('Send Push Error:', e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
