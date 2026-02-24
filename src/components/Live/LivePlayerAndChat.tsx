'use client';

import React, { useState, useRef, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { FaThumbsUp, FaThumbsDown, FaShare, FaCommentDots, FaEye, FaCheckCircle, FaEdit } from 'react-icons/fa';
import { database } from '@/lib/firebase';
import { ref, onValue, set, push, serverTimestamp, increment } from 'firebase/database';

interface LivePlayerAndChatProps {
    streamUrl: string;
    eventId: string;
    eventTitle?: string;
}

interface ChatMessage {
    id: string;
    text: string;
    userId: string;
    userName: string;
    isAdmin: boolean;
    timestamp: any;
}

export default function LivePlayerAndChat({ streamUrl, eventId, eventTitle }: LivePlayerAndChatProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const msgsEndRef = useRef<HTMLDivElement>(null);

    // UI States
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showChat, setShowChat] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false);

    // User States
    const [userName, setUserName] = useState('');
    const [userId, setUserId] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [messageInput, setMessageInput] = useState('');

    // Firebase Data States
    const [stats, setStats] = useState({ likes: 0, dislikes: 0, views: 0, shares: 0 });
    const [messages, setMessages] = useState<ChatMessage[]>([]);

    // Local Interaction States
    const [hasLiked, setHasLiked] = useState(false);
    const [hasDisliked, setHasDisliked] = useState(false);

    // Initial Setup (Session, Name, Admin Check, View Increment)
    useEffect(() => {
        // Handle User Session / Name
        let storedId = localStorage.getItem('ids_uid');
        let storedName = localStorage.getItem('ids_name');

        if (!storedId) {
            // Generate simple random ID
            storedId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('ids_uid', storedId);
        }

        if (!storedName) {
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            storedName = `Guest#${randomNum}`;
            localStorage.setItem('ids_name', storedName);
        }

        setUserId(storedId);
        setUserName(storedName);

        const checkAdmin = async () => {
            try {
                // Check local param first (useful for quick admin access from dashboard)
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('adminMode') === 'true') {
                    setIsAdmin(true);
                    setUserName('IDS_Sports');
                    return;
                }

                // Fallback to fetch API
                const res = await fetch('/api/auth/me');
                if (res.ok) {
                    const data = await res.json();
                    if (data.role === 'admin' || data.role === 'moderator') {
                        setIsAdmin(true);
                        setUserName('IDS_Sports');
                    }
                }
            } catch (e) {
                console.error('Not logged in as admin');
            }
        };
        checkAdmin();

        // Check local storage for previous likes on this event
        setHasLiked(localStorage.getItem(`liked_${eventId}`) === 'true');
        setHasDisliked(localStorage.getItem(`disliked_${eventId}`) === 'true');

        // Increment Views (Only once per session)
        const hasViewed = sessionStorage.getItem(`viewed_${eventId}`);
        if (!hasViewed) {
            sessionStorage.setItem(`viewed_${eventId}`, 'true');
            set(ref(database, `events/${eventId}/stats/views`), increment(1));
        }

    }, [eventId]);

    // Firebase Listeners (Stats & Chat)
    useEffect(() => {
        // Listen to Stats
        const statsRef = ref(database, `events/${eventId}/stats`);
        const unsubscribeStats = onValue(statsRef, (snapshot) => {
            if (snapshot.exists()) {
                setStats({
                    likes: snapshot.val().likes || 0,
                    dislikes: snapshot.val().dislikes || 0,
                    views: snapshot.val().views || 0,
                    shares: snapshot.val().shares || 0,
                });
            }
        });

        // Listen to Chat
        const chatRef = ref(database, `events/${eventId}/chat`);
        const unsubscribeChat = onValue(chatRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                const formattedMessages = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a: any, b: any) => a.timestamp - b.timestamp);

                // Keep only last 100 messages for performance
                setMessages(formattedMessages.slice(-100));
            }
        });

        return () => {
            unsubscribeStats();
            unsubscribeChat();
        };
    }, [eventId]);

    // Scroll to bottom of chat automatically
    useEffect(() => {
        if (showChat) {
            msgsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages, showChat]);

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

    const toggleChat = () => setShowChat((prev) => !prev);

    // --- Action Handlers --- 

    const handleLike = async () => {
        if (hasLiked) {
            // Remove Like
            await set(ref(database, `events/${eventId}/stats/likes`), increment(-1));
            setHasLiked(false);
            localStorage.removeItem(`liked_${eventId}`);
        } else {
            // Add Like
            await set(ref(database, `events/${eventId}/stats/likes`), increment(1));
            setHasLiked(true);
            localStorage.setItem(`liked_${eventId}`, 'true');

            // If previously disliked, remove the dislike
            if (hasDisliked) {
                await set(ref(database, `events/${eventId}/stats/dislikes`), increment(-1));
                setHasDisliked(false);
                localStorage.removeItem(`disliked_${eventId}`);
            }
        }
    };

    const handleDislike = async () => {
        if (hasDisliked) {
            // Remove Dislike
            await set(ref(database, `events/${eventId}/stats/dislikes`), increment(-1));
            setHasDisliked(false);
            localStorage.removeItem(`disliked_${eventId}`);
        } else {
            // Add Dislike
            await set(ref(database, `events/${eventId}/stats/dislikes`), increment(1));
            setHasDisliked(true);
            localStorage.setItem(`disliked_${eventId}`, 'true');

            // If previously liked, remove the like
            if (hasLiked) {
                await set(ref(database, `events/${eventId}/stats/likes`), increment(-1));
                setHasLiked(false);
                localStorage.removeItem(`liked_${eventId}`);
            }
        }
    };

    const handleShare = async () => {
        // Increment share count in DB
        await set(ref(database, `events/${eventId}/stats/shares`), increment(1));

        const url = window.location.href;
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

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!messageInput.trim()) return;

        // Basic spam protection: Max length
        if (messageInput.length > 200) {
            alert('Message too long!');
            return;
        }

        const newMsgRef = push(ref(database, `events/${eventId}/chat`));
        await set(newMsgRef, {
            text: messageInput.trim(),
            userId: userId,
            userName: userName,
            isAdmin: isAdmin,
            timestamp: serverTimestamp()
        });

        setMessageInput('');
    };

    const updateName = (e: React.FocusEvent<HTMLInputElement>) => {
        const newName = e.target.value.trim();
        if (newName && newName.length <= 15) {
            // Prevent users from mimicking Admin name
            if (newName.toLowerCase().includes('ids') || newName.toLowerCase().includes('admin')) {
                alert('This name is reserved.');
                return;
            }

            // Auto append random tag if they change name manually to keep it unique looking
            const randomNum = Math.floor(100 + Math.random() * 900);
            const finalName = `${newName}#${randomNum}`;

            setUserName(finalName);
            localStorage.setItem('ids_name', finalName);
        }
        setIsEditingName(false);
    };


    return (
        <div ref={containerRef} className="w-full flex flex-col bg-gray-900 overflow-hidden relative shadow-2xl rounded-xl border border-gray-800">

            {/* Main Content Area */}
            <div className={`flex flex-col md:flex-row w-full transition-all duration-300 ${isFullscreen ? 'h-screen' : 'h-[500px]'}`}>

                {/* Video */}
                <div className={`transition-all duration-300 ${showChat ? 'w-full md:w-3/4' : 'w-full'} h-full`}>
                    <VideoPlayer streamUrl={streamUrl} />
                </div>

                {/* Chat Panel */}
                <div className={`transition-all duration-300 bg-gray-900 border-l border-gray-800 flex flex-col ${showChat ? 'w-full md:w-1/4 translate-x-0' : 'w-0 translate-x-full overflow-hidden border-none'}`}>
                    {showChat && (
                        <>
                            {/* Chat Header */}
                            <div className="p-3 border-b border-gray-800 flex justify-between items-center bg-gray-950">
                                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                                    <FaCommentDots className="text-blue-500" /> Live Chat
                                </h3>
                                <button onClick={toggleChat} className="text-gray-400 hover:text-white text-lg leading-none">
                                    &times;
                                </button>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 stop-propagation-box relative" onClick={(e) => e.stopPropagation()}>
                                <div className="text-center text-gray-500 text-xs my-4 bg-gray-800/50 py-1 rounded-full mx-8">Welcome to Live Chat!</div>

                                {messages.map((msg) => (
                                    <div key={msg.id} className="text-sm break-words leading-relaxed">
                                        {msg.isAdmin ? (
                                            <span className="font-bold text-green-400 flex items-center gap-1 inline-flex">
                                                {msg.userName} <FaCheckCircle className="text-blue-500 bg-white rounded-full p-[1px] w-3 h-3" />:
                                            </span>
                                        ) : (
                                            <span className={`font-bold ${msg.userId === userId ? 'text-blue-400' : 'text-gray-300'}`}>
                                                {msg.userName}:
                                            </span>
                                        )}
                                        <span className="text-gray-200 ml-1">{msg.text}</span>
                                    </div>
                                ))}
                                <div ref={msgsEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div className="p-3 bg-gray-950 border-t border-gray-800 stop-propagation-box" onClick={(e) => e.stopPropagation()}>
                                <form onSubmit={sendMessage} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        maxLength={200}
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        placeholder="Type a message..."
                                        className="w-full bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700 placeholder-gray-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full px-4 py-2 text-sm font-bold transition shadow-lg shadow-blue-600/20"
                                    >
                                        Send
                                    </button>
                                </form>
                                <div className="text-xs text-gray-500 flex justify-between items-center px-1">
                                    <span className="flex items-center gap-1">
                                        Chatting as:
                                        {isAdmin ? (
                                            <strong className="text-green-400 flex items-center gap-1">{userName} <FaCheckCircle className="text-blue-500 w-3 h-3" /></strong>
                                        ) : isEditingName ? (
                                            <input
                                                autoFocus
                                                defaultValue={userName.split('#')[0]}
                                                onBlur={updateName}
                                                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                                className="bg-gray-800 text-white px-1 py-0.5 rounded outline-none w-20 border border-blue-500"
                                                maxLength={12}
                                            />
                                        ) : (
                                            <>
                                                <strong className="text-gray-300">{userName}</strong>
                                                <button onClick={() => setIsEditingName(true)} className="text-gray-400 hover:text-blue-400 transition" title="Change Name">
                                                    <FaEdit />
                                                </button>
                                            </>
                                        )}
                                    </span>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Bottom Action Bar */}
            <div className={`p-3 bg-gray-950 flex flex-wrap items-center justify-between text-gray-300 shadow-inner ${isFullscreen && !showChat ? 'absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md z-30 transform translate-y-full hover:translate-y-0 transition-transform duration-300' : ''}`}>

                {/* Left side actions */}
                <div className="flex items-center gap-4 sm:gap-6">
                    <button onClick={handleLike} className={`flex items-center gap-1.5 transition px-3 py-1.5 rounded-full ${hasLiked ? 'bg-blue-600/20 text-blue-400' : 'hover:bg-gray-800 hover:text-white'}`}>
                        <FaThumbsUp className={hasLiked ? '' : 'text-gray-400'} />
                        <span className="font-bold text-sm">{stats.likes}</span>
                    </button>

                    <button onClick={handleDislike} className={`flex items-center gap-1.5 transition px-3 py-1.5 rounded-full ${hasDisliked ? 'bg-red-600/20 text-red-400' : 'hover:bg-gray-800 hover:text-white'}`}>
                        <FaThumbsDown className={hasDisliked ? '' : 'text-gray-400'} />
                        <span className="font-bold text-sm">{stats.dislikes}</span>
                    </button>

                    <button onClick={handleShare} className="flex items-center gap-1.5 transition px-3 py-1.5 rounded-full hover:bg-gray-800 hover:text-white group relative">
                        <FaShare className="group-hover:text-green-500 transition text-gray-400" />
                        <span className="font-bold text-sm hidden sm:inline">Share</span>
                    </button>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-xs sm:text-sm bg-gray-900 px-3 py-1.5 rounded-full border border-gray-800" title="Live Views">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse hidden sm:block"></span>
                        <FaEye className="text-gray-400 sm:hidden" />
                        <span className="font-bold text-red-400">{stats.views.toLocaleString()}</span>
                    </div>

                    <button
                        onClick={toggleChat}
                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold transition shadow-lg ${showChat ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-gray-800 hover:bg-gray-700 text-white shadow-black/50'}`}
                    >
                        <FaCommentDots /> <span className="hidden sm:inline">{showChat ? 'Hide' : 'Chat'}</span>
                    </button>

                    <button
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-gray-800 rounded-full transition text-gray-300 hover:text-white border border-transparent hover:border-gray-700"
                        title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                    >
                        {isFullscreen ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M5 16h3v3h2v-5H5zm3-8H5v2h5V5H8zm6 11h2v-3h3v-2h-5zm2-11V5h-2v5h5V8z" />
                            </svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 7h-3v2h5v-5h-2zM14 5v2h3v3h2V5z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>

        </div>
    );
}
