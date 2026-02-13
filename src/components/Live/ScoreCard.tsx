'use client';

import useSWR from 'swr';
import { useEffect, useState } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '@/lib/firebase';
import DetailedScoreCard from './DetailedScoreCard';

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ScoreCardProps {
    event: any;
}

export default function ScoreCard({ event }: ScoreCardProps) {
    const { useAutomatedScore, apiMatchId, firebaseMatchId, manualScore, teamA, teamB } = event;

    const [displayScore, setDisplayScore] = useState<any>(null);
    const [detailedData, setDetailedData] = useState<any>(null);

    // 1. Firebase Subscription (Priority)
    useEffect(() => {
        if (useAutomatedScore && firebaseMatchId) {
            const matchRef = ref(database, `events/${firebaseMatchId}`);

            const unsubscribe = onValue(matchRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setDisplayScore({
                        status: data.summary?.status || 'Live',
                        matchMark: data.summary?.note || '',
                        teamAScore: data.summary?.teamA || '0/0',
                        teamBScore: data.summary?.teamB || '0/0'
                    });
                    setDetailedData(data.details || null);
                }
            });

            return () => off(matchRef);
        }
    }, [useAutomatedScore, firebaseMatchId]);

    // 2. API Polling (Fallback if no Firebase ID but API ID exists)
    const shouldFetch = useAutomatedScore && apiMatchId && !firebaseMatchId;
    const { data, error } = useSWR(
        shouldFetch ? `/api/live-score?matchId=${apiMatchId}` : null,
        fetcher,
        { refreshInterval: 15000 }
    );

    useEffect(() => {
        if (shouldFetch && data?.success) {
            const apiData = data.data;
            if (apiData.type === 'mock') {
                setDisplayScore({
                    status: apiData.matchHeader.status,
                    matchMark: apiData.matchHeader.matchDescription,
                    teamAScore: `${apiData.scoreCard[0].scoreDetails.runs}/${apiData.scoreCard[0].scoreDetails.wickets} (${apiData.scoreCard[0].scoreDetails.overs})`,
                    teamBScore: `${apiData.scoreCard[1].scoreDetails.runs}/${apiData.scoreCard[1].scoreDetails.wickets} (${apiData.scoreCard[1].scoreDetails.overs})`
                });
            }
        } else if (!useAutomatedScore) {
            setDisplayScore({
                status: manualScore?.status || 'Scheduled',
                matchMark: '',
                teamAScore: manualScore?.teamA || '0/0',
                teamBScore: manualScore?.teamB || '0/0'
            });
        }
    }, [data, shouldFetch, useAutomatedScore, manualScore]);

    if (error && !displayScore) return <div className="text-red-500 text-center">Live Score Unavailable</div>;

    return (
        <div>
            {/* Main Score Card */}
            <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 mt-4">
                <div className="text-center mb-4">
                    <span className="bg-red-600 text-white px-3 py-1 rounded text-xs font-bold uppercase tracking-wider">
                        {displayScore?.status || event.status}
                    </span>
                    {displayScore?.matchMark && (
                        <p className="text-blue-400 text-sm mt-1">{displayScore.matchMark}</p>
                    )}
                </div>

                <div className="flex justify-between items-center">
                    {/* Team A */}
                    <div className="flex flex-col items-center w-1/3">
                        {teamA?.logo ? (
                            <img src={teamA.logo} alt={teamA.name} className="w-12 h-12 object-contain mb-2" />
                        ) : (
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2 font-bold text-white">{teamA?.name?.[0]}</div>
                        )}
                        <h3 className="font-bold text-lg text-white">{teamA?.name}</h3>
                        <p className="text-2xl font-mono text-yellow-400 mt-1">{displayScore?.teamAScore}</p>
                    </div>

                    <div className="text-gray-500 font-bold text-xl">VS</div>

                    {/* Team B */}
                    <div className="flex flex-col items-center w-1/3">
                        {teamB?.logo ? (
                            <img src={teamB.logo} alt={teamB.name} className="w-12 h-12 object-contain mb-2" />
                        ) : (
                            <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2 font-bold text-white">{teamB?.name?.[0]}</div>
                        )}
                        <h3 className="font-bold text-lg text-white">{teamB?.name}</h3>
                        <p className="text-2xl font-mono text-yellow-400 mt-1">{displayScore?.teamBScore}</p>
                    </div>
                </div>
            </div>

            {/* Detailed Score Card (only if data exists) */}
            {detailedData && (
                <DetailedScoreCard matchData={detailedData} />
            )}
        </div>
    );
}
