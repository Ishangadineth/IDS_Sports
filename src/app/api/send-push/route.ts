import { NextResponse } from 'next/server';
import webpush from 'web-push';

const PUBLIC_VAPID_KEY = 'BPKuJziX2y4UOocG-K33eXh4MksCirpPRBnld5fXRoEAkE82iZQye8oml3VT_41y6EnrIWi02-IRRS2jfYlknxI';
const PRIVATE_VAPID_KEY = 'r76PQYLkTGnO4vXizxr1FoTp4Ddy-T0FxSiZN8Y7U8U';
const DB_URL = "https://ids-sports-default-rtdb.asia-southeast1.firebasedatabase.app";

webpush.setVapidDetails(
    'mailto:admin@idssports.com',
    PUBLIC_VAPID_KEY,
    PRIVATE_VAPID_KEY
);

export async function POST(req: Request) {
    try {
        const { title, body, url, image } = await req.json();

        // Admin-only protection (simple check or rely on caller)
        // Here we assume it's protected by the caller (dashboard).

        const res = await fetch(`${DB_URL}/push_subscriptions.json`);
        const data = await res.json();

        if (!data) return NextResponse.json({ success: true, count: 0 });

        const subscriptions = Object.values(data);
        const payload = JSON.stringify({ title, body, url, image });

        const results = await Promise.allSettled(
            subscriptions.map((sub: any) => webpush.sendNotification(sub, payload).catch(e => {
                // If the subscription is expired or invalid (410), we could remove it from DB here.
                console.error('Push error:', e);
                throw e;
            }))
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;

        return NextResponse.json({ success: true, count: successful, total: subscriptions.length });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
