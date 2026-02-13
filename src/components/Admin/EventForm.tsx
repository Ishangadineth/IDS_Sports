'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrash, FaPlus } from 'react-icons/fa';

interface EventFormProps {
    initialData?: any;
    isEdit?: boolean;
}

export default function EventForm({ initialData, isEdit = false }: EventFormProps) {
    const router = useRouter();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        teamA: { name: '', logo: '' },
        teamB: { name: '', logo: '' },
        startTime: '',
        timezone: 'Asia/Colombo', // Default to Sri Lanka as per user context
        status: 'Scheduled',
        apiMatchId: '',
        useAutomatedScore: false,
        manualScore: { teamA: '', teamB: '', status: '' },
        streamLinks: [{ name: 'Main Link', url: '' }],
    });

    useEffect(() => {
        if (initialData) {
            // Convert UTC start time to selected timezone string if possible, 
            // or just keep it as ISO string for manipulation. 
            // For simplicity in this input, we might need to convert to 'YYYY-MM-DDTHH:mm'.
            const date = new Date(initialData.startTime);
            // specific logic to format date for datetime-local input based on timezone would go here
            // For MVP, we will stick to local browser time for the input value
            const formattedDate = date.toISOString().slice(0, 16);

            setFormData({
                ...initialData,
                startTime: formattedDate,
                streamLinks: initialData.streamLinks.length > 0 ? initialData.streamLinks : [{ name: 'Main Link', url: '' }]
            });
        }
    }, [initialData]);

    const handleChange = (e: any) => {
        const { name, value, type, checked } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData((prev: any) => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData((prev) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value
            }));
        }
    };

    const handleLinkChange = (index: number, field: string, value: string) => {
        const newLinks = [...formData.streamLinks];
        newLinks[index] = { ...newLinks[index], [field]: value };
        setFormData({ ...formData, streamLinks: newLinks });
    };

    const addLink = () => {
        setFormData({
            ...formData,
            streamLinks: [...formData.streamLinks, { name: `Link ${formData.streamLinks.length + 1}`, url: '' }]
        });
    };

    const removeLink = (index: number) => {
        const newLinks = formData.streamLinks.filter((_, i) => i !== index);
        setFormData({ ...formData, streamLinks: newLinks });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Timezone handling: In a real robust app, we would use date-fns-tz or dayjs to convert 
        // the input time (considered as 'timezone' time) to UTC.
        // For now, we will assume the input time IS in the selected timezone relative to UTC, 
        // or just standard ISO if 'local' is used. 
        // Let's send the ISO string; the backend expects a Date object.

        const payload = { ...formData };

        const method = isEdit ? 'PUT' : 'POST';
        const url = isEdit ? `/api/events/${initialData._id}` : '/api/events';

        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                router.push('/adminaaids/dashboard');
                router.refresh(); // Refresh server components
            } else {
                alert('Failed to save event');
            }
        } catch (err) {
            alert('An error occurred');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded shadow-lg border border-gray-700 space-y-6">

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Event Title</label>
                    <input name="title" value={formData.title} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <input name="description" value={formData.description} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded" />
                </div>
            </div>

            {/* Teams */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-600 p-4 rounded">
                    <h3 className="font-bold mb-2 text-blue-400">Team A</h3>
                    <div className="space-y-2">
                        <input placeholder="Name" name="teamA.name" value={formData.teamA.name} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded" />
                        <input placeholder="Logo URL" name="teamA.logo" value={formData.teamA.logo} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded" />
                    </div>
                </div>
                <div className="border border-gray-600 p-4 rounded">
                    <h3 className="font-bold mb-2 text-red-400">Team B</h3>
                    <div className="space-y-2">
                        <input placeholder="Name" name="teamB.name" value={formData.teamB.name} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded" />
                        <input placeholder="Logo URL" name="teamB.logo" value={formData.teamB.logo} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded" />
                    </div>
                </div>
            </div>

            {/* Timing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input type="datetime-local" name="startTime" value={formData.startTime} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded" required />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Timezone</label>
                    <select name="timezone" value={formData.timezone} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded">
                        <option value="Asia/Colombo">Asia/Colombo (Sri Lanka)</option>
                        <option value="UTC">UTC</option>
                        <option value="Asia/Dubai">Asia/Dubai</option>
                        <option value="Europe/London">Europe/London</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded">
                        <option value="Scheduled">Scheduled</option>
                        <option value="Live">Live</option>
                        <option value="Delayed">Delayed (Rain)</option>
                        <option value="Ended">Ended</option>
                    </select>
                </div>
            </div>

            {/* Score Automation */}
            <div className="border border-gray-600 p-4 rounded">
                <div className="flex items-center gap-2 mb-4">
                    <input type="checkbox" name="useAutomatedScore" checked={formData.useAutomatedScore} onChange={handleChange} id="autoScore" className="w-5 h-5" />
                    <label htmlFor="autoScore" className="font-bold">Use Automated Score (External API)</label>
                </div>

                {formData.useAutomatedScore ? (
                    <div>
                        <label className="block text-sm font-medium mb-1">API Match ID</label>
                        <input name="apiMatchId" value={formData.apiMatchId} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded" placeholder="e.g., 12345" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Team A Score</label>
                            <input name="manualScore.teamA" value={formData.manualScore.teamA} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded" placeholder="225/5 (20)" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Team B Score</label>
                            <input name="manualScore.teamB" value={formData.manualScore.teamB} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded" placeholder="10/0 (2.1)" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Match Status Text</label>
                            <input name="manualScore.status" value={formData.manualScore.status} onChange={handleChange} className="w-full bg-gray-700 p-2 rounded" placeholder="Innings Break" />
                        </div>
                    </div>
                )}
            </div>

            {/* Stream Links */}
            <div className="border border-gray-600 p-4 rounded">
                <h3 className="font-bold mb-4 text-green-400">Stream Links</h3>
                {formData.streamLinks.map((link: any, index: number) => (
                    <div key={index} className="flex gap-2 mb-2 items-center">
                        <input
                            value={link.name}
                            onChange={(e) => handleLinkChange(index, 'name', e.target.value)}
                            className="bg-gray-700 p-2 rounded w-1/4" placeholder="Link Name"
                        />
                        <input
                            value={link.url}
                            onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                            className="bg-gray-700 p-2 rounded w-full" placeholder="Iframe URL"
                        />
                        <button type="button" onClick={() => removeLink(index)} className="bg-red-600 p-2 rounded text-white"><FaTrash /></button>
                    </div>
                ))}
                <button type="button" onClick={addLink} className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm mt-2 flex items-center gap-1">
                    <FaPlus /> Add Link
                </button>
            </div>

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 font-bold py-3 rounded text-lg">
                {isEdit ? 'Update Event' : 'Create Event'}
            </button>

        </form>
    );
}
