'use client';

import { useState, useRef, useEffect } from 'react';

interface VideoPlayerProps {
    streamUrl: string;
}

export default function VideoPlayer({ streamUrl }: VideoPlayerProps) {
    const [started, setStarted] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Sync fullscreen state if changed via Escape key
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    const handleTapToWatch = () => {
        setStarted(true);
        if (iframeRef.current) {
            // Set src for the FIRST TIME inside user gesture context (allows audio autoplay in chromium/safari)
            iframeRef.current.src = streamUrl;
        }

        // Show unmute hint
        setShowHint(true);
        setTimeout(() => {
            setShowHint(false);
        }, 4000); // Hide after 4 seconds
    };

    const handleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    if (!streamUrl) {
        return (
            <div className="w-full h-[500px] bg-black flex items-center justify-center text-white">
                <p>Select a channel or wait for the stream to start.</p>
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className="relative w-full bg-black overflow-hidden rounded-lg shadow-2xl border border-gray-800"
            style={{ height: '500px' }}
            onContextMenu={handleContextMenu}
        >
            {/* IFRAME - starts blank, loads only after user tap */}
            <iframe
                ref={iframeRef}
                src=""
                width="100%"
                height="100%"
                scrolling="no"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-orientation-lock allow-popups"
                className="w-full h-full block border-none"
            />

            {/* TAP TO WATCH OVERLAY */}
            {!started && (
                <div
                    onClick={handleTapToWatch}
                    className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer z-10 transition-opacity duration-300"
                    style={{ background: 'rgba(0,0,0,0.85)' }}
                >
                    <div className="w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-transform duration-200 hover:scale-110" style={{ background: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.35)' }}>
                        <svg width="36" height="36" viewBox="0 0 36 36" fill="white" className="ml-1">
                            <polygon points="12,8 30,18 12,28" />
                        </svg>
                    </div>
                    <p className="text-white font-bold text-lg tracking-wide">TAP TO WATCH LIVE</p>
                    <p className="text-white/50 text-xs mt-1">Tap once to enable sound</p>
                </div>
            )}

            {/* UNMUTE HINT */}
            <div
                className={`absolute bottom-12 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm z-15 whitespace-nowrap border border-white/20 pointer-events-none transition-opacity duration-500 ${showHint ? 'opacity-100 flex' : 'opacity-0 hidden'}`}
            >
                🔊 Click on the player to unmute
            </div>

            {/* FULLSCREEN BUTTON */}
            <button
                onClick={handleFullscreen}
                className="absolute top-2 right-2 z-20 flex items-center justify-center rounded p-1.5 transition-colors duration-200 bg-black/50 hover:bg-white/15 border border-white/20"
                title="Fullscreen"
            >
                {isFullscreen ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M5 16h3v3h2v-5H5zm3-8H5v2h5V5H8zm6 11h2v-3h3v-2h-5zm2-11V5h-2v5h5V8z" />
                    </svg>
                ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                        <path d="M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zM14 5v2h3v3h2V5z" />
                    </svg>
                )}
            </button>

            {/* WATERMARK */}
            <div className="absolute bottom-2 left-2 pointer-events-none z-10">
                <span className="text-white/20 text-xs font-bold">IDS Sports</span>
            </div>
        </div>
    );
}
