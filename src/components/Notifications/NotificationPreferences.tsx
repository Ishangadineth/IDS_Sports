'use client';

import { useState, useEffect } from 'react';
import { database, messaging } from '@/lib/firebase';
import { ref, set, remove } from 'firebase/database';
import { FaBell, FaBellSlash, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { getToken, deleteToken } from 'firebase/messaging';

// Public VAPID Key used by FCM
const PUBLIC_VAPID_KEY = 'BEM3n3iTbbhqLkL4kqlqoO2-9xHb-bMXIVyLItY5sMssxmOljIj6viHPvBRLR6JBBujIG8u0AND28gEi8zbVkEs';

export default function NotificationPreferences() {
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [fcmToken, setFcmToken] = useState<string | null>(null);

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
            const existingPushSub = await registration.pushManager.getSubscription();
            const storedToken = localStorage.getItem('fcm_token');

            // --- AUTO MIGRATION LOGIC ---
            // If the user has an old VAPID push subscription but NO FCM token,
            // we need to auto-migrate them behind the scenes.
            if (existingPushSub && !storedToken && messaging) {
                console.log('🔄 Auto-migrating old Web-Push subscriber to FCM...');
                // 1. Unsubscribe from old VAPID subscription
                await existingPushSub.unsubscribe();

                // 2. Secretly register for FCM
                const token = await getToken(messaging, {
                    vapidKey: PUBLIC_VAPID_KEY,
                    serviceWorkerRegistration: registration
                });

                if (token) {
                    const tokenHash = btoa(token).replace(/[^a-zA-Z0-9]/g, '').slice(-30);
                    await set(ref(database, `fcm_tokens/${tokenHash}`), {
                        token: token,
                        timestamp: Date.now(),
                        migrated: true
                    });
                    localStorage.setItem('fcm_token', token);
                    setFcmToken(token);
                    setIsSubscribed(true);
                    console.log('✅ Auto-migration to FCM successful!');
                }
                setLoading(false);
                return;
            }
            // ----------------------------

            // Normal FCM Checks
            if (Notification.permission === 'granted' && messaging) {
                if (storedToken) {
                    setIsSubscribed(true);
                    setFcmToken(storedToken);
                } else {
                    // Try to get token silently if we have permission but missing local token
                    const token = await getToken(messaging, {
                        vapidKey: PUBLIC_VAPID_KEY,
                        serviceWorkerRegistration: registration
                    });
                    if (token) {
                        setIsSubscribed(true);
                        setFcmToken(token);
                        localStorage.setItem('fcm_token', token);
                    }
                }
            }
        } catch (e) {
            console.error('Check sub/migration failed', e);
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

            if (!messaging) {
                alert('Messaging system initializing. Please try again in a few seconds.');
                return;
            }

            const registration = await navigator.serviceWorker.register('/sw.js');
            const token = await getToken(messaging, {
                vapidKey: PUBLIC_VAPID_KEY,
                serviceWorkerRegistration: registration
            });

            if (token) {
                // Save to Firebase FCM tracking node
                // We use a safe hash of the token as the key
                const tokenHash = btoa(token).replace(/[^a-zA-Z0-9]/g, '').slice(-30);
                await set(ref(database, `fcm_tokens/${tokenHash}`), {
                    token: token,
                    timestamp: Date.now()
                });

                localStorage.setItem('fcm_token', token);
                setFcmToken(token);
                setIsSubscribed(true);
                setIsOpen(false);
                alert('Great! You will now receive Match Alerts.');
            } else {
                alert('Failed to generate secure token. Try again.');
            }
        } catch (err) {
            console.error('Subscription failed', err);
            alert('Failed to enable notifications. Please clear site settings and try again.');
        } finally {
            setLoading(false);
        }
    };

    const unsubscribeUser = async () => {
        if (!confirm('Are you sure you want to turn off match alerts?')) return;
        setLoading(true);
        try {
            if (messaging) {
                await deleteToken(messaging);
            }
            if (fcmToken) {
                const tokenHash = btoa(fcmToken).replace(/[^a-zA-Z0-9]/g, '').slice(-30);
                await remove(ref(database, `fcm_tokens/${tokenHash}`));
            }

            localStorage.removeItem('fcm_token');
            setIsSubscribed(false);
            setFcmToken(null);
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
