import { NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get, update, child } from 'firebase/database';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const dbRef = ref(database);
        const snapshot = await get(child(dbRef, 'config'));
        return NextResponse.json(snapshot.exists() ? snapshot.val() : {});
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // body should be { activeMatchId: "...", cricketApiKey: "..." }

        await update(ref(database, 'config'), body);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
