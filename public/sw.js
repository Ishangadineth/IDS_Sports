importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAiBsH-BBRucReKK620xIa-X5ir2vk_FCQ",
    authDomain: "ids-sports.firebaseapp.com",
    projectId: "ids-sports",
    storageBucket: "ids-sports.firebasestorage.app",
    messagingSenderId: "94022513408",
    appId: "1:94022513408:web:b9c5f0d78d0d370b3a39e5"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);

    const notificationTitle = payload.data?.title || payload.notification?.title || 'IDS Sports';
    const notificationOptions = {
        body: payload.data?.body || payload.notification?.body || 'New update available.',
        icon: '/icon.png',
        data: { url: payload.data?.url || '/' },
        requireInteraction: true
    };

    if (payload.data?.image) {
        notificationOptions.image = payload.data.image;
    }

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});
