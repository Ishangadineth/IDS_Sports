'use client';

import { useState } from 'react';

export default function ManualScorePage() {
    const [matchId, setMatchId] = useState('');
    const [jsonData, setJsonData] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const fetchData = async (type: 'firebase' | 'api') => {
        if (!matchId) {
            alert('Please enter a Match ID');
            return;
        }
        setLoading(true);
        setMessage('Fetching data...');
        try {
            const res = await fetch(`/api/admin/manual-score?matchId=${matchId}&type=${type}`);
            const data = await res.json();

            if (res.ok) {
                setJsonData(JSON.stringify(data, null, 2));
                setMessage('Data loaded successfully.');
            } else {
                setMessage(`Error: ${data.message || 'Failed to fetch data'}`);
            }
        } catch (error) {
            setMessage('Error fetching data.');
        } finally {
            setLoading(false);
        }
    };

    const saveData = async () => {
        if (!matchId || !jsonData) {
            alert('Match ID and Data are required');
            return;
        }
        try {
            // Validate JSON
            const parsedData = JSON.parse(jsonData);

            setLoading(true);
            setMessage('Saving to Firebase...');

            const res = await fetch('/api/admin/manual-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId, data: parsedData }),
            });

            const result = await res.json();
            if (res.ok) {
                setMessage('Success! Data saved to live score.');
            } else {
                setMessage(`Error: ${result.error}`);
            }
        } catch (error) {
            alert('Invalid JSON! Please check your syntax.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-6 text-blue-400">🛠️ Manual Score Editor (Data Inspector)</h1>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 max-w-4xl mx-auto">
                <div className="flex gap-4 mb-6">
                    <input
                        type="text"
                        placeholder="Enter Match ID (e.g., 100850)"
                        value={matchId}
                        onChange={(e) => setMatchId(e.target.value)}
                        className="flex-grow bg-gray-900 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    />
                    <button
                        onClick={() => fetchData('api')}
                        disabled={loading}
                        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-bold transition"
                    >
                        🔍 Inspect API Data
                    </button>
                    <button
                        onClick={() => fetchData('firebase')}
                        disabled={loading}
                        className="bg-yellow-600 hover:bg-yellow-700 px-4 py-2 rounded font-bold transition"
                    >
                        📂 Load Current Live
                    </button>
                </div>

                <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">JSON Editor (Be careful with syntax!)</p>
                    <textarea
                        value={jsonData}
                        onChange={(e) => setJsonData(e.target.value)}
                        className="w-full h-96 bg-black text-green-400 font-mono text-sm p-4 rounded border border-gray-700 focus:outline-none focus:border-blue-500"
                        placeholder="// JSON Response will appear here..."
                    />
                </div>

                <div className="flex justify-between items-center">
                    <p className={`text-sm ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
                        {message}
                    </p>
                    <button
                        onClick={saveData}
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded font-bold text-white transition shadow-lg"
                    >
                        🚀 Push to Live Score
                    </button>
                </div>
            </div>

            <div className="mt-8 text-center text-gray-500 text-sm">
                <p>⚠️ Warning: Pushing data here will immediately update the website for all users.</p>
                <p>Use "Inspect API Data" to see available fields (Win Probability, etc.).</p>
            </div>
        </div>
    );
}
