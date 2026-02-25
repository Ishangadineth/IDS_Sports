'use client';

import React, { useState, useRef, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';
import { FaThumbsUp, FaThumbsDown, FaShare, FaCommentDots, FaEye, FaCheckCircle, FaEdit } from 'react-icons/fa';
import { database } from '@/lib/firebase';
import { ref, onValue, set, update, push, serverTimestamp, increment } from 'firebase/database';

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

interface PinnedMessage {
    text: string;
    userName: string;
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
    const [pinnedMsg, setPinnedMsg] = useState<PinnedMessage | null>(null);

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
            update(ref(database, `events/${eventId}/stats`), { views: increment(1) });
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

        // Listen to Pinned Message
        const pinRef = ref(database, `events/${eventId}/pinnedMessage`);
        const unsubscribePin = onValue(pinRef, (snapshot) => {
            if (snapshot.exists()) {
                setPinnedMsg(snapshot.val());
            } else {
                setPinnedMsg(null);
            }
        });

        return () => {
            unsubscribeStats();
            unsubscribeChat();
            unsubscribePin();
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
            containerRef.current?.requestFullscreen().then(() => {
                // Auto rotate to landscape if on mobile
                const orientation = window.screen?.orientation as any;
                if (orientation && orientation.lock) {
                    orientation.lock('landscape').catch((err: any) => {
                        console.log("Could not lock orientation", err);
                    });
                }
            }).catch((err: any) => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen().then(() => {
                // Unlock orientation on exit
                const orientation = window.screen?.orientation as any;
                if (orientation && orientation.unlock) {
                    orientation.unlock();
                }
            });
        }
    };

    const toggleChat = () => setShowChat((prev) => !prev);

    // --- Action Handlers --- 

    const handleLike = async () => {
        if (hasLiked) {
            // Remove Like
            await update(ref(database, `events/${eventId}/stats`), { likes: increment(-1) });
            setHasLiked(false);
            localStorage.removeItem(`liked_${eventId}`);
        } else {
            // Add Like
            await update(ref(database, `events/${eventId}/stats`), { likes: increment(1) });
            setHasLiked(true);
            localStorage.setItem(`liked_${eventId}`, 'true');

            // If previously disliked, remove the dislike
            if (hasDisliked) {
                await update(ref(database, `events/${eventId}/stats`), { dislikes: increment(-1) });
                setHasDisliked(false);
                localStorage.removeItem(`disliked_${eventId}`);
            }
        }
    };

    const handleDislike = async () => {
        if (hasDisliked) {
            // Remove Dislike
            await update(ref(database, `events/${eventId}/stats`), { dislikes: increment(-1) });
            setHasDisliked(false);
            localStorage.removeItem(`disliked_${eventId}`);
        } else {
            // Add Dislike
            await update(ref(database, `events/${eventId}/stats`), { dislikes: increment(1) });
            setHasDisliked(true);
            localStorage.setItem(`disliked_${eventId}`, 'true');

            // If previously liked, remove the like
            if (hasLiked) {
                await update(ref(database, `events/${eventId}/stats`), { likes: increment(-1) });
                setHasLiked(false);
                localStorage.removeItem(`liked_${eventId}`);
            }
        }
    };

    const handleShare = async () => {
        // Increment share count in DB
        await update(ref(database, `events/${eventId}/stats`), { shares: increment(1) });

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

    const pinMessage = async (msg: ChatMessage) => {
        if (!isAdmin) return;
        await set(ref(database, `events/${eventId}/pinnedMessage`), {
            text: msg.text,
            userName: msg.userName
        });
    };

    const unpinMessage = async () => {
        if (!isAdmin) return;
        await set(ref(database, `events/${eventId}/pinnedMessage`), null);
    };

    const updateName = (e: React.FocusEvent<HTMLInputElement>) => {
        let newName = e.target.value.trim();
        // Remove existing # suffix if user tried to type it manually
        if (newName.includes('#')) {
            newName = newName.split('#')[0].trim();
        }

        if (newName && newName.length <= 15) {
            // Prevent users from mimicking Admin name
            if (newName.toLowerCase().includes('ids') || newName.toLowerCase().includes('admin')) {
                alert('This name is reserved.');
                return;
            }

            // Always append a random tag to keep it unique looking
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
            <div className={`flex flex-col md:flex-row w-full relative transition-[height] duration-300 ${isFullscreen ? 'h-screen' : 'portrait:max-md:h-auto landscape:max-md:h-[80vh] md:h-[500px]'}`}>

                {/* Video Wrapper */}
                <div className={`transition-all duration-300 ${showChat ? 'md:w-3/4' : 'w-full'} flex flex-col bg-black portrait:max-md:aspect-video portrait:max-md:w-full landscape:h-full md:h-full z-10 relative`}>
                    <VideoPlayer streamUrl={streamUrl} />
                </div>

                {/* Chat Panel - Sideline on Desktop, Below on Mobile Portrait, Overlay on Mobile Landscape */}
                <div
                    className={`transition-all duration-300 bg-gray-900 border-gray-800 flex flex-col z-40 
                        ${showChat ? 'opacity-100' : 'opacity-0 hidden'} 
                        /* Landscape Array (Overlay right side) */
                        landscape:max-md:absolute landscape:max-md:top-0 landscape:max-md:right-0 landscape:max-md:h-full landscape:max-md:w-[320px] landscape:max-md:border-l
                        /* Portrait Mobile (Below Video) */
                        portrait:max-md:w-full portrait:max-md:h-[50vh] portrait:max-md:border-t portrait:max-md:relative
                        /* Desktop (Side) */
                        md:w-1/4 md:h-full md:border-l md:static
                    `}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                >
                    {/* Only render content when sliding in/open to prevent hidden interaction */}
                    {showChat && (
                        <>
                            {/* Chat Header */}
                            <div className="p-3 border-b flex-shrink-0 border-gray-800 flex justify-between items-center bg-gray-950/90 backdrop-blur-md sticky top-0 z-10">
                                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                                    <FaCommentDots className="text-blue-500" /> Live Chat
                                </h3>
                                <button onClick={toggleChat} className="text-gray-400 hover:text-white text-lg leading-none">
                                    &times;
                                </button>
                            </div>

                            {/* Chat Messages */}
                            <div
                                className="flex-1 overflow-y-auto p-4 space-y-3 relative bg-gray-900"
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                {pinnedMsg && (
                                    <div className="bg-blue-900/40 border-l-4 border-blue-500 rounded p-2 mb-4 text-sm relative shadow-md">
                                        <div className="font-bold flex items-center justify-between text-blue-200 text-xs mb-1">
                                            <span>📌 Pinned by {pinnedMsg.userName}</span>
                                            {isAdmin && (
                                                <button onClick={unpinMessage} className="text-gray-400 hover:text-red-400">
                                                    &times;
                                                </button>
                                            )}
                                        </div>
                                        <div className="text-blue-50 leading-snug break-words">
                                            {pinnedMsg.text}
                                        </div>
                                    </div>
                                )}

                                <div className="text-center text-gray-500 text-xs my-4 bg-gray-800/50 py-1 rounded-full mx-8">Welcome to Live Chat!</div>

                                {messages.map((msg) => (
                                    <div key={msg.id} className="text-sm break-words leading-relaxed group flex items-start justify-between">
                                        <div>
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
                                        {isAdmin && (
                                            <button
                                                onClick={() => pinMessage(msg)}
                                                className="opacity-0 group-hover:opacity-100 text-xs ml-2 text-gray-500 hover:text-blue-400"
                                                title="Pin Message"
                                            >
                                                📌
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <div ref={msgsEndRef} />
                            </div>

                            {/* Chat Input */}
                            <div
                                className="p-3 bg-gray-950 border-t border-gray-800"
                                onClick={(e) => e.stopPropagation()}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <form onSubmit={sendMessage} className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        maxLength={200}
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        placeholder="Type a message..."
                                        className="w-full bg-gray-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 border border-gray-700 placeholder-gray-500 relative z-50"
                                    />
                                    <button
                                        type="submit"
                                        onClick={(e) => e.stopPropagation()}
                                        onPointerDown={(e) => e.stopPropagation()}
                                        disabled={!messageInput.trim()}
                                        className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full px-4 py-2 text-sm font-bold transition shadow-lg shadow-blue-600/20 relative z-50"
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
                                                <button onClick={(e) => { e.stopPropagation(); setIsEditingName(true); }} className="text-gray-400 hover:text-blue-400 transition" title="Change Name">
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
            <div className={`p-3 border-t border-gray-800 bg-gray-950 flex flex-wrap items-center justify-between text-gray-300 shadow-inner z-20 ${isFullscreen && !showChat ? 'absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md transform translate-y-full hover:translate-y-0 transition-transform duration-300' : 'relative'}`}>

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
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold transition shadow-lg ${showChat ? 'bg-blue-600 text-white shadow-blue-600/20' : 'bg-[#1a202c] hover:bg-[#2d3748] text-white border border-gray-700'}`}
                    >
                        <div className="relative flex items-center justify-center">
                            <FaCommentDots className="text-lg" />
                            {!showChat && <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-black"></span>
                            </span>}
                        </div>
                        <span className="hidden sm:inline tracking-wide">{showChat ? 'Close Chat' : 'Live Chat'}</span>
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
