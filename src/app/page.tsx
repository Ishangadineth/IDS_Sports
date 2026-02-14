'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useState } from 'react';
import { FaPlayCircle, FaCalendarAlt, FaClock, FaTv, FaTimes } from 'react-icons/fa';
import Countdown from '@/components/Live/Countdown';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function Home() {
  const { data, isLoading } = useSWR('/api/events', fetcher, { refreshInterval: 30000 });
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const allEvents = data?.data || [];
  const now = new Date();

  // Filter events
  const visibleEvents = allEvents.filter((event: any) => {
    // 1. Show 'Live' and 'Delayed' events always
    if (event.status === 'Live' || event.status === 'Delayed') return true;

    // 2. Show 'Ended' events if they ended within the last 24 hours
    if (event.status === 'Ended') {
      if (!event.endTime) return false; // Safety check
      const endTime = new Date(event.endTime);
      const timeSinceEnd = now.getTime() - endTime.getTime();
      const hoursSinceEnd = timeSinceEnd / (1000 * 60 * 60);
      return hoursSinceEnd <= 24;
    }

    // 3. Show 'Scheduled' events if they start within the next 24 hours (and not more than 12 hours ago?)
    const startTime = new Date(event.startTime);
    const timeDiff = startTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);
    return hoursDiff <= 24 && hoursDiff > -12;
  });

  // Sort: Live/Delayed first, then Scheduled by start time, then Ended by end time (most recent first)
  const liveEvents = visibleEvents.filter((e: any) => e.status === 'Live' || e.status === 'Delayed');
  const upcomingEvents = visibleEvents.filter((e: any) => e.status === 'Scheduled');
  const endedEvents = visibleEvents.filter((e: any) => e.status === 'Ended');

  return (
    <div className="space-y-12">

      {/* Hero Section / Live & Delayed Events */}
      {liveEvents.length > 0 && (
        <section>
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
            Live Now
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveEvents.map((event: any) => (
              <EventCard key={event._id} event={event} isLive={true} onSelect={() => setSelectedEvent(event)} />
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
              <EventCard key={event._id} event={event} onSelect={() => setSelectedEvent(event)} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No upcoming events scheduled.</p>
        )}
      </section>

      {/* Ended Events (Last 24 Hours) */}
      {endedEvents.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-6 text-gray-400">Recently Concluded</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 grayscale hover:grayscale-0 transition-all duration-500">
            {endedEvents.map((event: any) => (
              <EventCard key={event._id} event={event} onSelect={() => setSelectedEvent(event)} />
            ))}
          </div>
        </section>
      )}

      {/* Channel Selector Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-md w-full relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <FaTimes size={20} />
            </button>

            <h3 className="text-2xl font-bold mb-2 pr-8">{selectedEvent.title}</h3>
            <p className="text-gray-400 text-sm mb-6">{selectedEvent.description}</p>

            <div className="space-y-3">
              {selectedEvent.status === 'Ended' ? (
                <div className="bg-red-900/20 text-red-400 p-4 rounded text-center border border-red-900/50">
                  <p className="font-bold">This event has ended.</p>
                  <p className="text-sm opacity-75">Stream links have been removed.</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Select a Channel:</p>
                  {selectedEvent.streamLinks && selectedEvent.streamLinks.length > 0 ? (
                    selectedEvent.streamLinks.map((link: any, index: number) => (
                      <Link
                        key={index}
                        href={`/event/${selectedEvent._id}?channel=${index}`}
                        className="block bg-gray-800 hover:bg-blue-600 border border-gray-700 hover:border-blue-500 rounded-lg p-4 transition-all flex items-center justify-between group"
                      >
                        <span className="font-bold flex items-center gap-3">
                          <FaTv className="text-gray-500 group-hover:text-white" />
                          {link.name || `Channel ${index + 1}`}
                        </span>
                        <FaPlayCircle className="text-gray-600 group-hover:text-white text-xl" />
                      </Link>
                    ))
                  ) : (
                    <p className="text-red-400 text-sm">No channels available at the moment.</p>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function EventCard({ event, isLive = false, onSelect }: { event: any, isLive?: boolean, onSelect: () => void }) {
  const startTime = new Date(event.startTime);

  let statusBadge;
  if (event.status === 'Live') {
    statusBadge = (
      <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1">
        <span className="animate-pulse">●</span> LIVE
      </span>
    );
  } else if (event.status === 'Delayed') {
    statusBadge = (
      <span className="bg-yellow-500 text-black text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider flex items-center gap-1 border border-yellow-600">
        <span className="animate-pulse text-red-600">●</span> DELAYED
      </span>
    );
  } else if (event.status === 'Ended') {
    statusBadge = (
      <span className="bg-gray-700 text-gray-300 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-gray-600">
        ENDED
      </span>
    );
  } else {
    statusBadge = (
      <span className="bg-blue-600/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border border-blue-500/30">
        {event.status}
      </span>
    );
  }

  return (
    <div onClick={onSelect} className="cursor-pointer group block bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20">
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
          {statusBadge}
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
    </div>
  );
}
