'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { FaSync } from 'react-icons/fa';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function LogsPage() {
    const { data, error, mutate, isLoading } = useSWR('/api/admin/logs', fetcher);

    if (error) return <div className="text-red-500">Failed to load logs.</div>;
    if (isLoading) return <div className="text-white">Loading logs...</div>;

    const logs = data?.data || [];

    return (
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Activity Logs (48 Hours)</h2>
                <button
                    onClick={() => mutate()}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition"
                >
                    <FaSync /> Refresh
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-gray-400">
                    <thead className="text-xs uppercase bg-gray-800 text-gray-300">
                        <tr>
                            <th className="px-6 py-3">Time</th>
                            <th className="px-6 py-3">User</th>
                            <th className="px-6 py-3">Role</th>
                            <th className="px-6 py-3">Action</th>
                            <th className="px-6 py-3">Details</th>
                            <th className="px-6 py-3">IP Address</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {logs.length > 0 ? (
                            logs.map((log: any) => (
                                <tr key={log._id} className="hover:bg-gray-800/50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-white">{log.username}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`px-2 py-1 rounded text-xs font-bold uppercase ${log.role === 'admin'
                                                    ? 'bg-purple-900/50 text-purple-400'
                                                    : 'bg-green-900/50 text-green-400'
                                                }`}
                                        >
                                            {log.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-blue-400">{log.action}</span>
                                    </td>
                                    <td className="px-6 py-4 max-w-xs truncate" title={log.details}>
                                        {log.details}
                                    </td>
                                    <td className="px-6 py-4 text-xs font-mono">{log.ipAddress}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center">
                                    No activity logs found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
