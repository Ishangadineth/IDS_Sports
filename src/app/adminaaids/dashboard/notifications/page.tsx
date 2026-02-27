'use client';

import { useState, useEffect } from 'react';
import { database } from '@/lib/firebase';
import { ref, push, set, onValue, remove } from 'firebase/database';
import { FaTrash, FaPaperPlane, FaClock } from 'react-icons/fa';

interface NotificationData {
    id: string;
    title: string;
    body: string;
    url: string;
    timestamp: number;
}

export default function AdminNotifications() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [url, setUrl] = useState('');
    const [image, setImage] = useState('');
    const [sendAt, setSendAt] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Recent Notifications
    const [notifications, setNotifications] = useState<NotificationData[]>([]);

    useEffect(() => {
        const notifRef = ref(database, 'notifications');
        const unsubscribe = onValue(notifRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                let notifArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a: any, b: any) => b.timestamp - a.timestamp); // Newest first
                setNotifications(notifArray);
            } else {
                setNotifications([]);
            }
        });
        return () => unsubscribe();
    }, []);

    const sendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !body) return;

        setIsSending(true);
        try {
            // If it's for later, save to scheduled collection
            if (sendAt && new Date(sendAt) > new Date()) {
                const schedRef = push(ref(database, 'scheduled_notifications'));
                await set(schedRef, {
                    title,
                    body,
                    url: url || '',
                    image: image || '',
                    sendAt: new Date(sendAt).toISOString()
                });
                alert('Notification scheduled for ' + new Date(sendAt).toLocaleString());
            } else {
                // Save to In-App Bell system (Immediate)
                const notifRef = push(ref(database, 'notifications'));
                await set(notifRef, {
                    title,
                    body,
                    url: url || '',
                    timestamp: Date.now()
                });

                // Trigger Browser Push (Immediate)
                await fetch('/api/send-push', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, body, url, image })
                });
                alert('Notification broadcasted immediately!');
            }

            setTitle('');
            setBody('');
            setUrl('');
            setImage('');
            setSendAt('');
        } catch (error) {
            console.error(error);
            alert('Failed to send notification');
        } finally {
            setIsSending(false);
        }
    };

    const deleteNotification = async (id: string) => {
        if (confirm('Are you sure you want to delete this notification?')) {
            try {
                await remove(ref(database, `notifications/${id}`));
            } catch (err) {
                console.error(err);
                alert('Failed to delete.');
            }
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-2">Notification System</h1>
            <p className="text-gray-400 mb-8">Push In-App updates and live match alerts to all active users.</p>

            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FaPaperPlane className="text-blue-500" /> Send New Notification</h2>

                <form onSubmit={sendNotification} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. SL vs IND Live Now!"
                            maxLength={50}
                            required
                            className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1">Message Body</label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            placeholder="T20 Match has started. Click to watch."
                            maxLength={200}
                            required
                            rows={3}
                            className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:border-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1">Redirect URL (Optional)</label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="e.g. /event/12345"
                            className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-4 py-2 rounded focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Leave empty if it's just an informative alert.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1">Image URL (Optional)</label>
                        <input
                            type="text"
                            value={image}
                            onChange={(e) => setImage(e.target.value)}
                            placeholder="e.g. https://.../image.jpg"
                            className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-4 py-2 rounded focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Large image to show in Browser Push (Android/Desktop).</p>
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <label className="block text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <FaClock /> Schedule for Later? (Optional)
                        </label>
                        <input
                            type="datetime-local"
                            value={sendAt}
                            onChange={(e) => setSendAt(e.target.value)}
                            className="w-full bg-gray-950 border border-blue-900/50 text-white px-4 py-2 rounded focus:outline-none focus:border-blue-500"
                        />
                        <p className="text-[10px] text-gray-500 mt-1 italic">Leave empty to send NOW. If set, it will be sent automatically at that time.</p>
                    </div>

                    <button
                        type="submit"
                        disabled={isSending}
                        className="w-full md:w-auto mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        {isSending ? 'Sending...' : 'Broadcast'}
                    </button>
                </form>
            </div>

            {/* List recent notifications */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
                <h2 className="text-xl font-bold mb-4">Recent Broadcasts</h2>

                {notifications.length > 0 ? (
                    <div className="space-y-3">
                        {notifications.map(notif => (
                            <div key={notif.id} className="p-4 bg-gray-900 border border-gray-700 rounded-lg flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-white">{notif.title}</h3>
                                    <p className="text-gray-400 text-sm mt-1">{notif.body}</p>
                                    {notif.url && <p className="text-blue-400 text-xs mt-1">Link: {notif.url}</p>}
                                    <p className="text-[10px] text-gray-500 mt-2">{new Date(notif.timestamp).toLocaleString()}</p>
                                </div>
                                <button
                                    onClick={() => deleteNotification(notif.id)}
                                    className="p-2 text-gray-500 hover:text-red-500 bg-gray-800 rounded hover:bg-gray-700 transition"
                                    title="Delete"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-4">No recent notifications.</p>
                )}
            </div>

        </div>
    );
}
