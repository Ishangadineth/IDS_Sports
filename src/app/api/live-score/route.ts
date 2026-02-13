import { NextResponse } from 'next/server';
import axios from 'axios';
import { database } from '@/lib/firebase';
import { ref, child, get } from 'firebase/database';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) {
        return NextResponse.json({ error: 'Match ID is required' }, { status: 400 });
    }

    // Fetch API Key from Firebase Database (Config) to allow dynamic updates
    let API_KEY = process.env.CRIC_API_KEY || "18f661a9-2375-4a06-9bf9-18fd9c5426ca"; // Fallback

    try {
        const snapshot = await get(child(ref(database), 'config/cricketApiKey'));
        if (snapshot.exists()) {
            API_KEY = snapshot.val();
        }
    } catch (err) {
        console.warn('Failed to fetch API key from Firebase, using fallback.');
    }

    const API_HOST = 'cricbuzz-cricket.p.rapidapi.com'; // Example host

    if (!API_KEY || API_KEY === 'your_rapidapi_key_here') {
        // Return mock data for development if no key
        console.warn('Missing CRIC_API_KEY. Returning mock data.');
        return NextResponse.json({
            success: true,
            data: {
                type: 'mock',
                matchHeader: {
                    status: 'Live',
                    matchDescription: 'SL vs IND (Mock Data - No API Key)',
                },
                scoreCard: [
                    { batTeamDetails: { batTeamName: 'SL' }, scoreDetails: { runs: 225, wickets: 5, overs: 20 } },
                    { batTeamDetails: { batTeamName: 'IND' }, scoreDetails: { runs: 120, wickets: 2, overs: 12.4 } }
                ]
            }
        });
    }

    try {
        const options = {
            method: 'GET',
            url: `https://${API_HOST}/mcenter/v1/${matchId}`,
            headers: {
                'X-RapidAPI-Key': API_KEY,
                'X-RapidAPI-Host': API_HOST,
            },
        };

        const response = await axios.request(options);

        return NextResponse.json({ success: true, data: response.data }, {
            headers: {
                'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
            }
        });
    } catch (error) {
        console.error('External API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch live score' }, { status: 500 });
    }
}
