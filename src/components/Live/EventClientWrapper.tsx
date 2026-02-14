'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import VideoPlayer from '@/components/Live/VideoPlayer';
import ScoreCard from '@/components/Live/ScoreCard';
import Countdown from '@/components/Live/Countdown';
import { FaTv, FaLock } from 'react-icons/fa';

export default function EventClientWrapper({ event: initialEvent }: { event: any }) {
    const searchParams = useSearchParams();
    const initialChannelIndex = parseInt(searchParams.get('channel') || '0');

    const event = initialEvent;

    // Ensure index is valid
    const safeIndex = (initialChannelIndex >= 0 && initialChannelIndex < (event.streamLinks?.length || 0))
        ? initialChannelIndex
        : 0;

    const [currentLink, setCurrentLink] = useState(event.streamLinks?.[safeIndex]?.url || '');
    const [showPlayer, setShowPlayer] = useState(false);
    const [statusLabel, setStatusLabel] = useState<string>('');
    const [targetDate] = useState(new Date(event.startTime));
    const [matchStarted, setMatchStarted] = useState(false);
    const [showBanner, setShowBanner] = useState(true);



    useEffect(() => {
        if (matchStarted) {
            const timer = setTimeout(() => setShowBanner(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [matchStarted]);

    // 35-Minute Logic
    useEffect(() => {
        const checkTime = () => {
            const now = new Date();
            const diff = targetDate.getTime() - now.getTime();
            const minutesLeft = diff / (1000 * 60);

            if (event.status === 'Ended') {
                setShowPlayer(false);
                setStatusLabel('ENDED');
            } else if (event.status === 'Live' || event.status === 'Delayed') {
                setShowPlayer(true);
                setStatusLabel('LIVE');
            } else if (minutesLeft <= 35) {
                // State 2: Within 35 mins (Pre-show)
                setShowPlayer(true);
                setStatusLabel('PRE_SHOW');
            } else {
                // State 1: > 35 mins (Locked)
                setShowPlayer(false);
                setStatusLabel('LOCKED');
            }
        };

        checkTime();
        const timer = setInterval(checkTime, 1000); // Check every second to unlock automatically
        return () => clearInterval(timer);
    }, [event.status, targetDate]);

    return (
        <div className="max-w-6xl mx-auto space-y-8">

            {/* Header Info */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="bg-blue-600/20 p-3 rounded-full text-blue-400">
                        <FaTv size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{event.title}</h1>
                        <p className="text-gray-400 text-sm">{event.description}</p>
                    </div>
                </div>
                {statusLabel === 'LIVE' && (
                    <div className="bg-red-600 px-4 py-2 rounded font-bold animate-pulse text-sm tracking-widest">
                        🔴 LIVE
                    </div>
                )}
                {statusLabel === 'ENDED' && (
                    <div className="bg-gray-600 px-4 py-2 rounded font-bold text-sm tracking-widest text-gray-300">
                        ENDED
                    </div>
                )}
            </div>

            {/* Channel Buttons (Only if player is shown) */}
            {showPlayer && event.streamLinks?.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    {event.streamLinks.map((link: any, index: number) => (
                        <button
                            key={index}
                            onClick={() => setCurrentLink(link.url)}
                            className={`px-4 py-2 rounded font-bold text-sm transition flex items-center gap-2 ${currentLink === link.url
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                                }`}
                        >
                            <FaTv /> {link.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Main Content Area: Player or Countdown */}
            <div className="bg-black/50 rounded-xl overflow-hidden border border-gray-800 min-h-[500px] relative">

                {statusLabel === 'ENDED' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                        <FaLock className="text-6xl text-gray-600 mb-6" />
                        <h2 className="text-2xl font-bold mb-2">Stream Ended</h2>
                        <p className="text-gray-400 mb-8 max-w-md">This event has concluded. Thank you for watching.</p>
                        <a href="/" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition">
                            Back to Home
                        </a>
                    </div>
                ) : !showPlayer ? (
                    // State 1: Locked
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
                        <FaLock className="text-6xl text-gray-600 mb-6" />
                        <h2 className="text-2xl font-bold mb-2">Event Locked</h2>
                        <p className="text-gray-400 mb-8 max-w-md">The stream will be available 35 minutes before the start.</p>
                        <Countdown targetDate={event.startTime} label="Unlocks In" />
                    </div>
                ) : (
                    // State 2 & 3: Player
                    <div className="relative">
                        {/* Pre-show Countdown Overlay (Within 35 mins but not started) */}
                        {statusLabel === 'PRE_SHOW' && showBanner && (
                            <div className="bg-blue-900/90 text-white py-2 text-center font-bold text-sm z-10 w-full transition-all duration-500">
                                {matchStarted ? (
                                    <span className="text-green-400 animate-pulse text-lg">Match Started Now</span>
                                ) : (
                                    <>
                                        Typically starts soon. <Countdown targetDate={event.startTime} label="Event Starts in:" minimal={true} onComplete={() => setMatchStarted(true)} />
                                    </>
                                )}
                            </div>
                        )}

                        <VideoPlayer streamUrl={currentLink} />
                    </div>
                )}
            </div>

            {/* Scorecard */}
            {/* Scorecard */}
            {/* <ScoreCard event={event} /> */}

        </div>
    );
}
