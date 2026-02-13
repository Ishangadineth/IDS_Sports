import { NextResponse } from 'next/server';
import axios from 'axios';
import { database } from '@/lib/firebase';
import { ref, update, get, child } from 'firebase/database';

// Prevent unwanted caching for Cron Jobs
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    // 1. Verify Authorization (Optional but recommended: Check for a secret key)
    // For Vercel Cron, you can check 'Authorization' header if you set CRON_SECRET env var.
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    //     return new NextResponse('Unauthorized', { status: 401 });
    // }

    try {
        // 2. Get Config (Active Match ID & API Key) from Firebase
        const dbRef = ref(database);
        const configSnapshot = await get(child(dbRef, 'config'));

        if (!configSnapshot.exists()) {
            return NextResponse.json({ message: 'No config found in Firebase' }, { status: 404 });
        }

        const config = configSnapshot.val();
        const matchId = config.activeMatchId;
        const apiKey = config.cricketApiKey || process.env.CRIC_API_KEY || "18f661a9-2375-4a06-9bf9-18fd9c5426ca";

        if (!matchId || matchId === '0' || matchId === '') {
            return NextResponse.json({ message: 'No active match configured' });
        }

        // 3. Fetch Data from Cricket API
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
        const matchData = response.data;

        // 4. Update Firebase 'events/[matchId]' with new data
        // We structure data to match what ScoreCard.tsx expects
        // ScoreCard.tsx expects: { summary: { ... }, details: { ... } }
        // API returns: { matchInfo: ..., matchScore: ... } -> We need to map this if needed, 
        // OR simply store raw data and let Frontend parse it. 
        // Looking at ScoreCard.tsx, it expects:
        // status: data.summary?.status
        // teamA: data.summary?.teamA
        // teamB: data.summary?.teamB
        // note: data.summary?.note
        // details: data.details

        // Let's create a simplified summary for easier frontend consumption, plus store raw details
        const summary = {
            status: matchData.matchInfo?.status || 'Live',
            teamA: matchData.matchScore?.team1Score?.inngs1?.runs ? `${matchData.matchScore.team1Score.inngs1.runs}/${matchData.matchScore.team1Score.inngs1.wickets}` : '0/0',
            teamB: matchData.matchScore?.team2Score?.inngs1?.runs ? `${matchData.matchScore.team2Score.inngs1.runs}/${matchData.matchScore.team2Score.inngs1.wickets}` : '0/0',
            note: matchData.matchInfo?.state || '',
            // Add other needed fields
        };

        const updates: any = {};
        updates[`events/${matchId}/summary`] = summary;
        updates[`events/${matchId}/details`] = matchData; // Store full data for DetailedScoreCard
        updates[`events/${matchId}/lastUpdated`] = Date.now();

        await update(ref(database), updates);

        return NextResponse.json({ success: true, message: `Updated match ${matchId}`, data: summary });

    } catch (error: any) {
        console.error('Cron Job Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
