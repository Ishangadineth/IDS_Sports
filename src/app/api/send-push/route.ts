import { NextResponse } from 'next/server';
import { adminDatabase, messaging } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const { title, body, url, image } = await req.json();

        if (!adminDatabase || !messaging) {
            console.error('Firebase Admin services are not initialized.');
            return NextResponse.json({
                error: 'Firebase Admin not initialized.'
            }, { status: 500 });
        }

        // 1. Fetch FCM Tokens
        const snapshot = await adminDatabase.ref('fcm_tokens').once('value');
        const data = snapshot.val();

        if (!data) return NextResponse.json({ success: true, count: 0 });

        const tokens = Object.values(data).map((entry: any) => entry.token);
        if (tokens.length === 0) return NextResponse.json({ success: true, count: 0 });

        const logId = Date.now().toString();
        const notificationUrl = url ? (url.startsWith('http') ? url : `https://idssports.ishangadineth.online${url}`) : `https://idssports.ishangadineth.online/?notif_id=${logId}`;

        // 2. Prepare FCM Payload
        const payload = {
            data: {
                title,
                body,
                url: notificationUrl,
                ...(image && { image })
            }
        };

        // 3. Send Multicast in Chunks (FCM limit is 500 per call)
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
