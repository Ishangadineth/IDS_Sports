'use client';

import { useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, set } from 'firebase/database';

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

export default function PushNotificationManager() {
    useEffect(() => {
        const initPush = async () => {
            if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

            try {
                const registration = await navigator.serviceWorker.register('/sw.js');

                const requestSub = async () => {
                    try {
                        let subscription = await registration.pushManager.getSubscription();
                        if (!subscription) {
                            subscription = await registration.pushManager.subscribe({
                                userVisibleOnly: true,
                                applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
                            });
                        }

                        // Save to Firebase Realtime DB
                        const subId = btoa(subscription.endpoint).replace(/[^a-zA-Z0-9]/g, '').slice(-20);
                        await set(ref(database, `push_subscriptions/${subId}`), JSON.parse(JSON.stringify(subscription)));
                    } catch (e) {
                        console.error('Failed to subscribe:', e);
                    }
                };

                const handleInteraction = async () => {
                    document.removeEventListener('click', handleInteraction);
                    if (Notification.permission !== 'denied') {
                        const permission = await Notification.requestPermission();
                        if (permission === 'granted') {
                            requestSub();
                        }
                    }
                };

                // Check current permission
                if (Notification.permission === 'granted') {
                    requestSub();
                } else if (Notification.permission !== 'denied') {
                    // Start listener
                    setTimeout(() => document.addEventListener('click', handleInteraction, { once: true }), 2000);
                }

            } catch (err) {
                console.error('Push setup failed:', err);
            }
        };

        initPush();
    }, []);
    return null;
}
