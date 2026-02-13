'use client';

import useSWR from 'swr';
import { useEffect, useState } from 'react';

// Fetcher function
const fetcher = (url: string) => fetch(url).then(res => res.json());

interface ScoreCardProps {
    event: any;
}

export default function ScoreCard({ event }: ScoreCardProps) {
    const { useAutomatedScore, apiMatchId, manualScore, teamA, teamB } = event;

    // SWR Hook for polling if automated
    const shouldFetch = useAutomatedScore && apiMatchId;
    const { data, error } = useSWR(
        shouldFetch ? `/api/live-score?matchId=${apiMatchId}` : null,
        fetcher,
        { refreshInterval: 15000 } // 15 seconds polling
    );

    const [displayScore, setDisplayScore] = useState<any>(null);

    useEffect(() => {
        if (useAutomatedScore && data?.success) {
            // Map API data to display format
            // This mapping depends heavily on the specific API structure.
            // Using the mock structure defined in the API route for now.
            const apiData = data.data;
            if (apiData.type === 'mock') {
                setDisplayScore({
                    status: apiData.matchHeader.status, // "Live"
                    matchMark: apiData.matchHeader.matchDescription, // "SL vs IND" -> or specific status text
                    teamAScore: `${apiData.scoreCard[0].scoreDetails.runs}/${apiData.scoreCard[0].scoreDetails.wickets} (${apiData.scoreCard[0].scoreDetails.overs})`,
                    teamBScore: `${apiData.scoreCard[1].scoreDetails.runs}/${apiData.scoreCard[1].scoreDetails.wickets} (${apiData.scoreCard[1].scoreDetails.overs})`
                });
            } else {
                // Real API mapping would go here
                setDisplayScore({
                    status: 'Live API Data',
                    matchMark: 'Match in Progress',
                    teamAScore: '---',
                    teamBScore: '---'
                });
            }
        } else if (!useAutomatedScore) {
            // Use Manual Data
            setDisplayScore({
                status: manualScore?.status || 'Scheduled',
                matchMark: '',
                teamAScore: manualScore?.teamA || '0/0',
                teamBScore: manualScore?.teamB || '0/0'
            });
        }
    }, [data, useAutomatedScore, manualScore]);

    if (error) return <div className="text-red-500 text-center">Live Score Unavailable</div>;

    return (
        <div className="bg-gray-800 rounded-lg p-4 shadow-lg border border-gray-700 mt-4">

            {/* Match Status / Mark */}
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
                    {teamA.logo ? (
                        <img src={teamA.logo} alt={teamA.name} className="w-12 h-12 object-contain mb-2" />
                    ) : (
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2 font-bold">{teamA.name?.[0]}</div>
                    )}
                    <h3 className="font-bold text-lg">{teamA.name}</h3>
                    <p className="text-2xl font-mono text-yellow-400 mt-1">{displayScore?.teamAScore}</p>
                </div>

                <div className="text-gray-500 font-bold text-xl">VS</div>

                {/* Team B */}
                <div className="flex flex-col items-center w-1/3">
                    {teamB.logo ? (
                        <img src={teamB.logo} alt={teamB.name} className="w-12 h-12 object-contain mb-2" />
                    ) : (
                        <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center mb-2 font-bold">{teamB.name?.[0]}</div>
                    )}
                    <h3 className="font-bold text-lg">{teamB.name}</h3>
                    <p className="text-2xl font-mono text-yellow-400 mt-1">{displayScore?.teamBScore}</p>
                </div>
            </div>
        </div>
    );
}
