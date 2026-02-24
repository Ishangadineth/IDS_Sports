'use client';

import React, { useRef, useEffect } from 'react';

interface VideoPlayerProps {
    streamUrl: string;
}

export default function VideoPlayer({ streamUrl }: VideoPlayerProps) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
    };

    // Listen for streamUrl changes (when user changes channels)
    useEffect(() => {
        if (iframeRef.current && iframeRef.current.src !== streamUrl) {
            iframeRef.current.src = streamUrl;
        }
    }, [streamUrl]);

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
            {/* IFRAME - starts immediately */}
            <iframe
                ref={iframeRef}
                src={streamUrl}
                width="100%"
                height="100%"
                scrolling="no"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; encrypted-media; fullscreen"
                sandbox="allow-scripts allow-same-origin allow-presentation allow-orientation-lock"
                className="w-full h-full block border-none"
            />

            {/* WATERMARK */}
            <div className="absolute top-2 left-2 pointer-events-none z-10">
                <span className="text-white/20 text-xs font-bold">IDS Sports</span>
            </div>
        </div>
    );
}
