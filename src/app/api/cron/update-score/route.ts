import { NextResponse } from 'next/server';
import axios from 'axios';
import { database } from '@/lib/firebase';
import { ref, update, get, child } from 'firebase/database';

// Prevent unwanted caching for Cron Jobs
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        // 1. Get Config (Active Match IDs & API Key) from Firebase
        const dbRef = ref(database);
        const configSnapshot = await get(child(dbRef, 'config'));

        if (!configSnapshot.exists()) {
            return NextResponse.json({ message: 'No config found in Firebase' }, { status: 404 });
        }

        const config = configSnapshot.val();
        let activeMatchIds = config.activeMatchId; // Can be "123" or "123,456"
        const apiKey = config.cricketApiKey || process.env.CRIC_API_KEY || "18f661a9-2375-4a06-9bf9-18fd9c5426ca";

        if (!activeMatchIds || activeMatchIds === '0' || activeMatchIds === '') {
            return NextResponse.json({ message: 'No active match configured' });
        }

        // Convert command-separated string to array
        const matchIds = activeMatchIds.toString().split(',').map((id: string) => id.trim()).filter((id: string) => id !== '' && id !== '0');

        if (matchIds.length === 0) {
            return NextResponse.json({ message: 'No valid active match IDs' });
        }

        const API_HOST = 'cricbuzz-cricket.p.rapidapi.com';
        const results = [];

        // 2. Loop through all match IDs
        await Promise.all(matchIds.map(async (matchId: string) => {
            try {
                // Fetch Data from Cricket API
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

                // Create simplified summary
                const summary = {
                    status: matchData.matchInfo?.status || 'Live',
                    teamA: matchData.matchScore?.team1Score?.inngs1?.runs ? `${matchData.matchScore.team1Score.inngs1.runs}/${matchData.matchScore.team1Score.inngs1.wickets}` : '0/0',
                    teamB: matchData.matchScore?.team2Score?.inngs1?.runs ? `${matchData.matchScore.team2Score.inngs1.runs}/${matchData.matchScore.team2Score.inngs1.wickets}` : '0/0',
                    note: matchData.matchInfo?.state || '',
                    type: matchData.matchInfo?.matchType || '',
                };

                const updates: any = {};
                updates[`events/${matchId}/summary`] = summary;
                updates[`events/${matchId}/details`] = matchData; // Store full data
                updates[`events/${matchId}/lastUpdated`] = Date.now();

                // Update Firebase
                await update(ref(database), updates);
                results.push({ matchId, status: 'Updated', summary });

            } catch (err: any) {
                console.error(`Error updating match ${matchId}:`, err.message);
                results.push({ matchId, status: 'Failed', error: err.message });
            }
        }));

        return NextResponse.json({ success: true, results });

    } catch (error: any) {
        console.error('Cron Job Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
