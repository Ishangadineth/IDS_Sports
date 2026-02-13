'use client';

import EventForm from '@/components/Admin/EventForm';
import { use, useState, useEffect } from 'react';

// Fetcher for SWR or just standard fetch
const getEvent = async (id: string) => {
    const res = await fetch(`/api/events/${id}`);
    if (!res.ok) throw new Error('Failed to fetch event');
    return res.json();
};

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use
    const resolvedParams = use(params);
    const [eventData, setEventData] = useState(null);

    useEffect(() => {
        getEvent(resolvedParams.id).then((data) => {
            setEventData(data.data);
        });
    }, [resolvedParams.id]);

    if (!eventData) return <div>Loading event data...</div>;

    return (
        <div>
            <h2 className="text-2xl font-semibold mb-6">Edit Event</h2>
            <EventForm initialData={eventData} isEdit={true} />
        </div>
    );
}
