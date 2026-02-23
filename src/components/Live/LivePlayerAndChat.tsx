'use client';

import { useState, useRef, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { FaThumbsUp, FaThumbsDown, FaShare, FaCommentDots, FaEye } from 'react-icons/fa';

interface LivePlayerAndChatProps {
    streamUrl: string;
    eventId: string;
    eventTitle?: string;
}

export default function LivePlayerAndChat({ streamUrl, eventId, eventTitle }: LivePlayerAndChatProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showChat, setShowChat] = useState(false); // Can be toggled

    // Action Stats (to be linked to Firebase later)
    const [likes, setLikes] = useState(0);
    const [dislikes, setDislikes] = useState(0);
    const [views, setViews] = useState(124); // mock data for now

    // Fullscreen listeners
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const toggleChat = () => {
        setShowChat((prev) => !prev);
    };

    const handleShare = () => {
        const url = window.location.origin; // Main page link
        if (navigator.share) {
            navigator.share({
                title: 'IDS Sports Live',
                text: `Watch ${eventTitle || 'Live Sports'} on IDS Sports!`,
                url: url,
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url);
            alert('Link copied to clipboard!');
        }
    };

    return (
        <div ref={containerRef} className="w-full flex flex-col bg-gray-900 overflow-hidden relative">

            {/* Main Content Area (Player + Chat side-by-side) */}
            <div className={`flex flex-col md:flex-row w-full transition-all duration-300 ${isFullscreen ? 'h-screen' : 'h-[500px]'}`}>

                {/* Video Player Section */}
                <div className={`transition-all duration-300 ${showChat ? 'w-full md:w-3/4' : 'w-full'} h-full`}>
                    {/* Notice how we pass streamUrl but we also need to disable VideoPlayer's own fullscreen so we don't have conflicting buttons. 
                        For now we'll keep it there, or we can hide it via CSS. We will pass a prop or use CSS. */}
                    <VideoPlayer streamUrl={streamUrl} />
                </div>

                {/* Chat Section */}
                <div className={`transition-all duration-300 bg-gray-800 border-l border-gray-700 flex flex-col ${showChat ? 'w-full md:w-1/4 translate-x-0' : 'w-0 translate-x-full overflow-hidden border-none'}`}>
                    {showChat && (
                        <>
                            {/* Chat Header */}
                            <div className="p-3 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <FaCommentDots className="text-blue-500" /> Live Chat
                                </h3>
                                <button onClick={toggleChat} className="text-gray-400 hover:text-white text-lg leading-none">
                                    &times;
                                </button>
                            </div>

                            {/* Chat Messages Area (To be implemented with Firebase) */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 stop-propagation-box" onClick={(e) => e.stopPropagation()}>
                                <div className="text-center text-gray-500 text-xs my-4">Welcome to Live Chat!</div>
                                {/* Mock Messages */}
                                <div className="text-sm">
                                    <span className="font-bold text-blue-400">Kasun:</span> <span className="text-gray-200">Wow nice shot!</span>
                                </div>
                                <div className="text-sm">
                                    <span className="font-bold text-yellow-400">Guest#123:</span> <span className="text-gray-200">Who is winning?</span>
                                </div>
                                <div className="text-sm">
                                    <span className="font-bold text-green-400 flex items-center gap-1 inline-flex">
                                        IDS_Sports <svg className="w-3 h-3 text-white bg-blue-500 rounded-full" viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" /></svg>:
                                    </span>
                                    <span className="text-gray-200 ml-1">Welcome everyone! Enjoy the stream.</span>
                                </div>
                            </div>

                            {/* Chat Input Area */}
                            <div className="p-3 bg-gray-900 border-t border-gray-700 stop-propagation-box" onClick={(e) => e.stopPropagation()}>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        className="w-full bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4 py-2 text-sm font-bold transition">
                                        Send
                                    </button>
                                </div>
                                <div className="mt-2 text-xs text-gray-400 flex justify-between items-center px-2">
                                    <span>Chatting as: <strong className="text-gray-300">Guest#4092</strong> <span className="cursor-pointer text-blue-400 ml-1 hover:underline">✏️</span></span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className={`p-3 bg-black flex flex-wrap items-center justify-between text-gray-300 border-t border-gray-800 ${isFullscreen && !showChat ? 'absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm z-30 transform translate-y-full hover:translate-y-0 transition-transform duration-300' : ''}`}>

                {/* Left side actions */}
                <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 hover:text-white transition group">
                        <FaThumbsUp className="group-hover:text-blue-500 transition" />
                        <span className="font-bold">{likes}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-white transition group">
                        <FaThumbsDown className="group-hover:text-red-500 transition" />
                        <span className="font-bold">{dislikes}</span>
                    </button>
                    <button onClick={handleShare} className="flex items-center gap-2 hover:text-white transition group">
                        <FaShare className="group-hover:text-green-500 transition" />
                        <span className="font-bold hidden sm:inline">Share</span>
                    </button>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm hidden sm:flex" title="Live Views">
                        <FaEye /> <span className="font-bold text-red-400">{views} views</span>
                    </div>

                    <button
                        onClick={toggleChat}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition ${showChat ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
                    >
                        <FaCommentDots /> {showChat ? 'Hide Chat' : 'Show Chat'}
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-gray-800 rounded transition text-white"
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5 16h3v3h2v-5H5zm3-8H5v2h5V5H8zm6 11h2v-3h3v-2h-5zm2-11V5h-2v5h5V8z" />
                            </svg>
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zM14 5v2h3v3h2V5z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

        </div>
    );
}
