import { NextResponse } from 'next/server';
import { database } from '@/lib/firebase';
import { ref, get, update, child } from 'firebase/database';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get('matchId');
    const type = searchParams.get('type') || 'firebase'; // 'firebase' or 'api'

    if (!matchId) {
        return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    try {
        if (type === 'api') {
            // Fetch fresh data from Cricket API
            const dbRef = ref(database);
            const configSnapshot = await get(child(dbRef, 'config'));
            const apiKey = configSnapshot.val()?.cricketApiKey || process.env.CRIC_API_KEY || "18f661a9-2375-4a06-9bf9-18fd9c5426ca";

            const API_HOST = 'cricbuzz-cricket.p.rapidapi.com';
            const options = {
                method: 'GET',
                url: `https://${API_HOST}/mcenter/v1/${matchId}`,
                headers: {
                    'X-RapidAPI-Key': apiKey,
                    'X-RapidAPI-Host': API_HOST,
                },
            };

            const response = await axios.request(options);
            return NextResponse.json(response.data);

        } else {
            // Fetch current data from Firebase
            const dbRef = ref(database);
            const snapshot = await get(child(dbRef, `events/${matchId}/details`));

            if (snapshot.exists()) {
                return NextResponse.json(snapshot.val());
            } else {
                return NextResponse.json({ message: 'No data found in Firebase for this ID' }, { status: 404 });
            }
        }
    } catch (error: any) {
        console.error('Error in manual-score API:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { matchId, data } = body;

        if (!matchId || !data) {
            return NextResponse.json({ error: 'Match ID and Data are required' }, { status: 400 });
        }

        const updates: any = {};
        updates[`events/${matchId}/details`] = data;

        // Also update summary if possible (optional, but good for list view)
        const summary = {
            status: data.matchInfo?.status || 'Live',
            teamA: data.matchScore?.team1Score?.inngs1?.runs ? `${data.matchScore.team1Score.inngs1.runs}/${data.matchScore.team1Score.inngs1.wickets}` : '0/0',
            teamB: data.matchScore?.team2Score?.inngs1?.runs ? `${data.matchScore.team2Score.inngs1.runs}/${data.matchScore.team2Score.inngs1.wickets}` : '0/0',
            note: data.matchInfo?.state || 'Manual Update',
            type: data.matchInfo?.matchType || '',
        };
        updates[`events/${matchId}/summary`] = summary;
        updates[`events/${matchId}/lastUpdated`] = Date.now();

        await update(ref(database), updates);

        return NextResponse.json({ success: true, message: 'Data saved to Firebase' });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
