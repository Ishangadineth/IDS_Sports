self.addEventListener('push', function (event) {
    if (event.data) {
        const payload = event.data.json();

        const notificationTitle = payload.title || 'IDS Sports';
        const notificationOptions = {
            body: payload.body || 'New Notification',
            icon: '/icon.png', // Fallback, doesn't matter much if it fails
            data: { url: payload.url || '/' },
            requireInteraction: true // Stays until closed
        };

        if (payload.image) {
            notificationOptions.image = payload.image;
        }

        event.waitUntil(
            self.registration.showNotification(notificationTitle, notificationOptions)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url || '/')
    );
});
