'use client';

import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCloudRain, FaEye, FaEyeSlash } from 'react-icons/fa';


const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Dashboard() {
    const { data, error, isLoading } = useSWR('/api/events', fetcher);
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        setDeleting(id);
        try {
            const res = await fetch(`/api/events/${id}`, { method: 'DELETE' });
            if (res.ok) {
                mutate('/api/events');
            } else {
                alert('Failed to delete event');
            }
        } catch (err) {
            alert('Error deleting event');
        } finally {
            setDeleting(null);
        }
    };

    const handleRainDelay = async (id: string) => {
        const newStatus = prompt('Enter new status (Delayed / Live / Scheduled):', 'Delayed');
        if (!newStatus) return;

        try {
            const res = await fetch(`/api/events/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (res.ok) {
                mutate('/api/events');
            } else {
                alert('Failed to update status');
            }
        } catch (err) {
            alert('Error updating status');
        }
    };

    const handleToggleHide = async (event: any) => {
        try {
            const res = await fetch(`/api/events/${event._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isHidden: !event.isHidden }),
            });
            if (res.ok) {
                mutate('/api/events');
            } else {
                alert('Failed to update visibility');
            }
        } catch (err) {
            alert('Error updating visibility');
        }
    };

    if (error) return <div>failed to load</div>;
    if (isLoading) return <div>loading...</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold">Manage Events</h2>
                <Link
                    href="/adminaaids/dashboard/new"
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded flex items-center gap-2"
                >
                    <FaPlus /> Add New Event
                </Link>
            </div>

            <div className="grid gap-4">
                {data?.data?.map((event: any) => (
                    <div key={event._id} className="bg-gray-800 p-4 rounded border border-gray-700 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-lg">
                                {event.teamA.name} <span className="text-gray-400">vs</span> {event.teamB.name}
                            </h3>
                            <p className="text-sm text-gray-400">
                                {new Date(event.startTime).toLocaleString()} | Status: <span className={
                                    event.status === 'Live' ? 'text-red-500 font-bold' :
                                        event.status === 'Delayed' ? 'text-yellow-500 font-bold' : 'text-green-500'
                                }>{event.status}</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleRainDelay(event._id)}
                                className="bg-yellow-600 hover:bg-yellow-700 p-2 rounded text-white"
                                title="Rain Delay / Update Status"
                            >
                                <FaCloudRain />
                            </button>
                            <button
                                onClick={() => handleToggleHide(event)}
                                className={`p-2 rounded text-white ${event.isHidden ? 'bg-gray-600 hover:bg-gray-500' : 'bg-teal-600 hover:bg-teal-700'}`}
                                title={event.isHidden ? "Unhide Event" : "Hide Event"}
                            >
                                {event.isHidden ? <FaEyeSlash /> : <FaEye />}
                            </button>
                            <Link
                                href={`/adminaaids/dashboard/edit/${event._id}`}
                                className="bg-blue-600 hover:bg-blue-700 p-2 rounded text-white"
                            >
                                <FaEdit />
                            </Link>
                            <button
                                onClick={() => handleDelete(event._id)}
                                disabled={deleting === event._id}
                                className="bg-red-600 hover:bg-red-700 p-2 rounded text-white"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </div>
                ))}
                {data?.data?.length === 0 && (
                    <p className="text-gray-500 text-center py-8">No events found.</p>
                )}
            </div>
        </div>
    );
}
