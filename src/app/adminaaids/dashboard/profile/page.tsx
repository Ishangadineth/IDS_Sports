'use client';

import { useState } from 'react';
import axios from 'axios';

export default function ProfilePage() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await axios.put('/api/profile', { newPassword });
            setMessage('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto mt-10">
            <h1 className="text-2xl font-bold mb-6 text-blue-400 text-center">Update Profile</h1>

            <div className="bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-700">
                {message && (
                    <div className="bg-green-900 border border-green-700 text-green-200 px-4 py-3 rounded mb-4 text-sm">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full font-bold py-2 px-4 rounded transition-colors mt-4 ${loading
                                ? 'bg-gray-600 cursor-not-allowed'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                    >
                        {loading ? 'Updating...' : 'Change Password'}
                    </button>
                </form>
            </div>
        </div>
    );
}
