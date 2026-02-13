'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function ModeratorsPage() {
    const [moderators, setModerators] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');

    useEffect(() => {
        fetchModerators();
    }, []);

    const fetchModerators = async () => {
        try {
            const res = await axios.get('/api/admin/moderators');
            setModerators(res.data.data);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch moderators. You might not have permission.');
            setLoading(false);
        }
    };

    const handleAddModerator = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post('/api/admin/moderators', {
                username: newUsername,
                password: newPassword
            });
            setNewUsername('');
            setNewPassword('');
            fetchModerators();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add moderator');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this moderator?')) return;
        try {
            await axios.delete(`/api/admin/moderators?id=${id}`);
            fetchModerators();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete moderator');
        }
    };

    if (loading) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6 text-blue-400">Manage Moderators</h1>

            {error && (
                <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {/* Add Moderator Form */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8 border border-gray-700">
                <h2 className="text-xl font-semibold mb-4 text-white">Add New Moderator</h2>
                <form onSubmit={handleAddModerator} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Username</label>
                        <input
                            type="text"
                            value={newUsername}
                            onChange={(e) => setNewUsername(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded transition-colors"
                    >
                        Add
                    </button>
                </form>
            </div>

            {/* Moderators List */}
            <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-900 text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Username</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Created At</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {moderators.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                    No moderators found.
                                </td>
                            </tr>
                        ) : (
                            moderators.map((mod) => (
                                <tr key={mod._id} className="hover:bg-gray-750">
                                    <td className="px-6 py-4 font-medium text-white">{mod.username}</td>
                                    <td className="px-6 py-4 text-sm text-gray-300 uppercase tracking-wide bg-blue-900/20 w-min whitespace-nowrap px-2 rounded">{mod.role}</td>
                                    <td className="px-6 py-4 text-gray-400 text-sm">
                                        {new Date(mod.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(mod._id)}
                                            className="text-red-400 hover:text-red-300 text-sm font-medium"
                                        >
                                            Remove
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
