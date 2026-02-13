'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { FaPlayCircle, FaCalendarAlt, FaClock } from 'react-icons/fa';
import Countdown from '@/components/Live/Countdown'; // Optional usage if we want countdown on card

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const { data, isLoading } = useSWR('/api/events', fetcher, { refreshInterval: 30000 });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const allEvents = data?.data || [];
  const now = new Date();

  // Filter events: 
  // 1. Live or Delayed (Always show)
  // 2. Scheduled (Show if within 24 hours)
  const visibleEvents = allEvents.filter((event: any) => {
    if (event.status === 'Live' || event.status === 'Delayed') return true;
    if (event.status === 'Ended') return false; // Optionally hide ended events or show in a separate section

    const startTime = new Date(event.startTime);
    const timeDiff = startTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    return hoursDiff <= 24 && hoursDiff > -12; // Show if starting in <24h or ended <12h ago (buffer)
  });

  const liveEvents = visibleEvents.filter((e: any) => e.status === 'Live' || e.status === 'Delayed');
  const upcomingEvents = visibleEvents.filter((e: any) => e.status === 'Scheduled');

  return (
    <div className="space-y-12">

      {/* Hero Section / Live Events */}
      {liveEvents.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
            Live Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveEvents.map((event: any) => (
              <EventCard key={event._id} event={event} isLive={true} />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-blue-400">Upcoming Streams</h2>
        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event: any) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No upcoming events scheduled within 24 hours.</p>
        )}
      </section>

    </div>
  );
}

function EventCard({ event, isLive = false }: { event: any, isLive?: boolean }) {
  const startTime = new Date(event.startTime);

  return (
    <Link href={`/event/${event._id}`} className="group block bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20">
      <div className="relative h-40 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-between px-6 pt-4">
        {/* Team A */}
        <div className="flex flex-col items-center">
          {event.teamA?.logo ? (
            <img src={event.teamA.logo} alt={event.teamA.name} className="w-16 h-16 object-contain mb-2 drop-shadow-lg" />
          ) : (
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center font-bold text-xl">{event.teamA?.name?.[0]}</div>
          )}
          <span className="font-bold text-sm text-center line-clamp-1">{event.teamA?.name}</span>
        </div>

        <div className="text-gray-500 font-bold text-xl italic opacity-50">VS</div>

        {/* Team B */}
        <div className="flex flex-col items-center">
          {event.teamB?.logo ? (
            <img src={event.teamB.logo} alt={event.teamB.name} className="w-16 h-16 object-contain mb-2 drop-shadow-lg" />
          ) : (
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center font-bold text-xl">{event.teamB?.name?.[0]}</div>
          )}
          <span className="font-bold text-sm text-center line-clamp-1">{event.teamB?.name}</span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {isLive ? (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
              <span className="animate-pulse">●</span> {event.status}
            </span>
          ) : (
            <span className="bg-blue-600/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-blue-500/30">
              {event.status}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg mb-1 group-hover:text-blue-400 transition line-clamp-1">{event.title}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-800 pt-3">
          <div className="flex items-center gap-2">
            <FaCalendarAlt />
            <span>{startTime.toLocaleDateString()}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaClock />
            <span>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
