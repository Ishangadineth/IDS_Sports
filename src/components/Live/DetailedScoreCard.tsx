'use client';

import { useState } from 'react';

interface Batter {
    name: string;
    runs: number;
    balls: number;
    fours: number;
    sixes: number;
    strikeRate: number;
    outDescription?: string;
    isStriker?: boolean;
    isNonStriker?: boolean;
}

interface Bowler {
    name: string;
    overs: number;
    maidens: number;
    runs: number;
    wickets: number;
    economy: number;
}

interface TeamInning {
    name: string;
    score: string; // e.g. "225/5 (20)"
    batters: Batter[];
    bowlers: Bowler[];
    extras: string;
}

interface DetailedScoreCardProps {
    matchData: {
        teamA: TeamInning;
        teamB: TeamInning;
        status: string;
    } | null;
}

export default function DetailedScoreCard({ matchData }: DetailedScoreCardProps) {
    const [activeTab, setActiveTab] = useState<'teamA' | 'teamB'>('teamA');

    if (!matchData) return <div className="text-gray-500 text-center py-4">Waiting for detailed score...</div>;

    const activeTeam = activeTab === 'teamA' ? matchData.teamA : matchData.teamB;
    const inactiveTeam = activeTab === 'teamA' ? matchData.teamB : matchData.teamA;

    return (
        <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 mt-6 shadow-xl text-sm">
            {/* Tabs */}
            <div className="flex border-b border-gray-800">
                <button
                    className={`flex-1 py-3 font-semibold ${activeTab === 'teamA' ? 'bg-gray-800 text-white border-b-2 border-red-500' : 'text-gray-400 hover:bg-gray-800'}`}
                    onClick={() => setActiveTab('teamA')}
                >
                    {matchData.teamA.name}
                </button>
                <button
                    className={`flex-1 py-3 font-semibold ${activeTab === 'teamB' ? 'bg-gray-800 text-white border-b-2 border-red-500' : 'text-gray-400 hover:bg-gray-800'}`}
                    onClick={() => setActiveTab('teamB')}
                >
                    {matchData.teamB.name}
                </button>
            </div>

            {/* Score Summary Header */}
            <div className="p-4 bg-gray-800 flex justify-between items-center">
                <span className="font-bold text-lg text-white">{activeTeam.name}</span>
                <span className="text-xl font-mono text-yellow-400">{activeTeam.score}</span>
            </div>

            {/* Batting Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-900 text-gray-500 text-xs uppercase border-b border-gray-800">
                        <tr>
                            <th className="px-4 py-2">Batting</th>
                            <th className="px-2 py-2 text-right">R</th>
                            <th className="px-2 py-2 text-right">B</th>
                            <th className="px-2 py-2 text-right">4s</th>
                            <th className="px-2 py-2 text-right">6s</th>
                            <th className="px-2 py-2 text-right">S/R</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800 text-gray-300">
                        {activeTeam.batters.map((batsman, index) => (
                            <tr key={index} className="hover:bg-gray-800/50">
                                <td className="px-4 py-3">
                                    <div className="font-medium text-white flex items-center gap-2">
                                        {batsman.name}
                                        {batsman.isStriker && <span className="text-green-500 text-xs">*</span>}
                                        {batsman.isNonStriker && <span className="text-green-500 text-xs">*</span>}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-none">
                                        {batsman.outDescription || 'not out'}
                                    </div>
                                </td>
                                <td className="px-2 py-3 text-right font-bold text-white">{batsman.runs}</td>
                                <td className="px-2 py-3 text-right">{batsman.balls}</td>
                                <td className="px-2 py-3 text-right">{batsman.fours}</td>
                                <td className="px-2 py-3 text-right">{batsman.sixes}</td>
                                <td className="px-2 py-3 text-right">{batsman.strikeRate.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Extras */}
            <div className="px-4 py-3 bg-gray-800/50 flex justify-between text-xs text-gray-400 border-t border-gray-800">
                <span>Extras</span>
                <span>{activeTeam.extras}</span>
            </div>

            {/* Bowling Table */}
            {activeTeam.bowlers.length > 0 && (
                <div className="overflow-x-auto mt-4 border-t border-gray-800">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900 text-gray-500 text-xs uppercase border-b border-gray-800">
                            <tr>
                                <th className="px-4 py-2">Bowling</th>
                                <th className="px-2 py-2 text-right">O</th>
                                <th className="px-2 py-2 text-right">M</th>
                                <th className="px-2 py-2 text-right">R</th>
                                <th className="px-2 py-2 text-right">W</th>
                                <th className="px-2 py-2 text-right">Econ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800 text-gray-300">
                            {activeTeam.bowlers.map((bowler, index) => (
                                <tr key={index} className="hover:bg-gray-800/50">
                                    <td className="px-4 py-3 font-medium text-white">{bowler.name}</td>
                                    <td className="px-2 py-3 text-right">{bowler.overs}</td>
                                    <td className="px-2 py-3 text-right">{bowler.maidens}</td>
                                    <td className="px-2 py-3 text-right">{bowler.runs}</td>
                                    <td className="px-2 py-3 text-right font-bold text-white">{bowler.wickets}</td>
                                    <td className="px-2 py-3 text-right">{bowler.economy.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
