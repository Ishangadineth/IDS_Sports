'use client';

import React, { useState, useRef } from 'react';

interface VideoPlayerProps {
    streamUrl: string;
}

export default function VideoPlayer({ streamUrl }: VideoPlayerProps) {
    const [started, setStarted] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const iframeRef = useRef<HTMLIFrameElement>(null);

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

    if (!streamUrl) {
        return (
            <div className="w-full h-full bg-black flex items-center justify-center text-white">
                <p>Select a channel or wait for the stream to start.</p>
            </div>
        );
    }

    return (
        <div
            className="relative w-full h-full bg-black overflow-hidden shadow-2xl"
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
                className={`absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full text-sm z-15 whitespace-nowrap border border-white/20 pointer-events-none transition-opacity duration-500 ${showHint ? 'opacity-100 flex' : 'opacity-0 hidden'}`}
            >
                🔊 Click on the player to unmute
            </div>

            {/* WATERMARK */}
            <div className="absolute top-2 left-2 pointer-events-none z-10">
                <span className="text-white/20 text-xs font-bold">IDS Sports</span>
            </div>
        </div>
    );
}
