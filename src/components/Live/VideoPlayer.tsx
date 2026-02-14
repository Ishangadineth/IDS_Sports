'use client';

import { useState, useEffect } from 'react';

interface VideoPlayerProps {
    streamUrl: string;
}

export default function VideoPlayer({ streamUrl }: VideoPlayerProps) {
    // Anti-debug: Prevent Context Menu
    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
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
            className="relative w-full h-[500px] bg-black overflow-hidden rounded-lg shadow-2xl border border-gray-800"
            onContextMenu={handleContextMenu}
        >
            <iframe
                src={streamUrl}
                width="100%"
                height="500px"
                scrolling="no"
                frameBorder="0"
                allowFullScreen
                // sandbox="allow-scripts allow-same-origin allow-presentation" 
                // Note: sandbox might break some streams if they need more permissions. 
                // User explicitly asked for these.
                sandbox="allow-scripts allow-same-origin allow-presentation allow-orientation-lock"
                className="w-full h-full"
            />

            {/* Overlay to prevent direct interaction or right clicks if needed, 
          but iframe handles its own events usually.
          To truly block right click on iframe content, it's hard cross-origin, 
          but we can block on the container.
      */}
            <div className="absolute top-0 right-0 p-2 pointer-events-none">
                {/* Watermark or branding could go here */}
                <span className="text-white/20 text-xs font-bold">IDS Sports</span>
            </div>
        </div>
    );
}
