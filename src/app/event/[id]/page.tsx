import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import Event from '@/models/Event';
import EventClientWrapper from '@/components/Live/EventClientWrapper';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function EventPage({ params }: PageProps) {
    const { id } = await params;

    await dbConnect();

    // Serialize Mongo object to plain JSON
    // lean() returns a plain JS object, but ObjIDs need string conversion
    const eventDoc = await Event.findById(id).lean();

    if (!eventDoc) {
        notFound();
    }

    // Convert _id and dates to string for serialization
    const event = JSON.parse(JSON.stringify(eventDoc));

    return <EventClientWrapper event={event} />;
}
