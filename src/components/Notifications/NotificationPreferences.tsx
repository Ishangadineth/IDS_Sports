'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, set, remove } from 'firebase/database';
import { FaBell, FaBellSlash, FaTimes, FaCheckCircle } from 'react-icons/fa';

const PUBLIC_VAPID_KEY = 'BPKuJziX2y4UOocG-K33eXh4MksCirpPRBnld5fXRoEAkE82iZQye8oml3VT_41y6EnrIWi02-IRRS2jfYlknxI';

function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function NotificationPreferences() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSubscription();
    }, []);

    const checkSubscription = async () => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            setLoading(false);
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            setIsSubscribed(!!subscription);
        } catch (e) {
            console.error('Check sub failed', e);
        } finally {
            setLoading(false);
        }
    };

    const subscribeUser = async () => {
        setLoading(true);
        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                alert('Notification permission denied.');
                return;
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
            });

            // Save to Firebase
            const subId = btoa(subscription.endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(-20);
            await set(ref(database, `push_subscriptions/${subId}`), JSON.parse(JSON.stringify(subscription)));

            setIsSubscribed(true);
            setIsOpen(false);
            alert('Great! You will now receive match alerts.');
        } catch (err) {
            console.error('Subscription failed', err);
            alert('Failed to enable notifications. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeUser = async () => {
        if (!confirm('Are you sure you want to turn off match alerts?')) return;
        setLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();

            if (subscription) {
                const subId = btoa(subscription.endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(-20);
                await remove(ref(database, `push_subscriptions/${subId}`));
                await subscription.unsubscribe();
            }

            setIsSubscribed(false);
            setIsOpen(false);
            alert('Notifications turned off.');
        } catch (err) {
            console.error('Unsubscription failed', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !isOpen) return null;

    return (
        <div className="fixed bottom-6 left-6 z-[60] group">
            {/* Main Toggle Button (Bell) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform group-hover:scale-110 
                    ${isSubscribed ? 'bg-blue-600' : 'bg-gray-800 border border-gray-700'}
                `}
            >
                {isSubscribed ? <FaBell className="text-white text-xl" /> : <FaBellSlash className="text-gray-400 text-xl" />}
                {!isSubscribed && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                )}
            </button>

            {/* Tooltip / Hint */}
            <div className="absolute left-16 bottom-2 bg-gray-900 border border-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl">
                {isSubscribed ? 'Match Alerts Active' : 'Get Match Alerts'}
            </div>

            {/* Modal */}
            {isOpen && (
                <div className="absolute bottom-16 left-0 w-72 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl p-5 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                Notifications {isSubscribed && <FaCheckCircle className="text-green-500 text-sm" />}
                            </h3>
                            <p className="text-xs text-gray-400 mt-1">Get real-time updates for live cricket and events.</p>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                            <FaTimes />
                        </button>
                    </div>

                    <div className="space-y-3">
                        {!isSubscribed ? (
                            <button
                                onClick={subscribeUser}
                                disabled={loading}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2"
                            >
                                <FaBell /> Turn On Alerts
                            </button>
                        ) : (
                            <button
                                onClick={unsubscribeUser}
                                disabled={loading}
                                className="w-full bg-gray-800 hover:bg-gray-700 text-red-400 font-bold py-3 rounded-xl transition-all border border-gray-700 flex items-center justify-center gap-2"
                            >
                                <FaBellSlash /> Turn Off Alerts
                            </button>
                        )}
                        <p className="text-[10px] text-center text-gray-500">You can change this at any time from this menu.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
