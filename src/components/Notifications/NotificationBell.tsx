'use client';

import { useState, useEffect, useRef } from 'react';
import { FaBell, FaTimes, FaCircle } from 'react-icons/fa';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import Link from 'next/link';

interface AppNotification {
    id: string;
    title: string;
    body: string;
    url?: string;
    timestamp: number;
}

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Notifications from Firebase
    useEffect(() => {
        const notifRef = ref(database, 'notifications');
        const unsubscribe = onValue(notifRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                let notifArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a: any, b: any) => b.timestamp - a.timestamp); // Newest first

                // Only keep last 20 notifications
                notifArray = notifArray.slice(0, 20);
                setNotifications(notifArray);

                // Check unread against localStorage
                const lastRead = Number(localStorage.getItem('ids_last_read_notif') || '0');
                const newUnread = notifArray.filter(n => n.timestamp > lastRead).length;
                setUnreadCount(newUnread);
            } else {
                setNotifications([]);
                setUnreadCount(0);
            }
        });

        return () => unsubscribe();
    }, []);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
        if (!isOpen) {
            // Mark all as read
            setUnreadCount(0);
            if (notifications.length > 0) {
                localStorage.setItem('ids_last_read_notif', notifications[0].timestamp.toString());
            }
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="relative p-2 text-gray-300 hover:text-white transition-colors"
                title="Notifications"
            >
                <FaBell className="text-xl" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-3 w-3 items-center justify-center">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 text-[8px] font-bold text-white items-center justify-center border border-gray-900">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-gray-950">
                        <h3 className="font-bold text-white flex items-center gap-2">Notifications</h3>
                        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">
                            <FaTimes />
                        </button>
                    </div>

                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length > 0 ? (
                            <div className="flex flex-col">
                                {notifications.map((notif) => {
                                    const lastRead = Number(localStorage.getItem('ids_last_read_notif_opened') || '0');
                                    const isNew = notif.timestamp > lastRead;

                                    const content = (
                                        <div
                                            key={notif.id}
                                            className={`p-4 border-b border-gray-800/50 hover:bg-gray-800 transition block ${isNew ? 'bg-blue-900/10' : ''}`}
                                            onClick={() => {
                                                localStorage.setItem('ids_last_read_notif_opened', Date.now().toString());
                                                setIsOpen(false);
                                            }}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    {isNew ? (
                                                        <FaCircle className="text-blue-500 text-[8px] mt-1" />
                                                    ) : (
                                                        <FaBell className="text-gray-600 text-[10px] mt-1" />
                                                    )}
                                                </div>
                                                <div>
                                                    <h4 className={`text-sm ${isNew ? 'text-white font-bold' : 'text-gray-300 font-medium'}`}>{notif.title}</h4>
                                                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{notif.body}</p>
                                                    <p className="text-[10px] text-gray-500 mt-2">
                                                        {new Date(notif.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );

                                    return notif.url ? (
                                        <Link key={notif.id} href={notif.url}>
                                            {content}
                                        </Link>
                                    ) : (
                                        <div key={notif.id}>{content}</div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                <FaBell className="mx-auto text-3xl mb-3 opacity-20" />
                                <p>No notifications yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
