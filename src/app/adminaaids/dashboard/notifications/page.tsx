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

interface NotificationLog {
    id: string;
    title: string;
    sentCount: number;
    totalSubs: number;
    clickCount: number;
    timestamp: number;
    type?: string;
}

export default function AdminNotifications() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [url, setUrl] = useState('');
    const [image, setImage] = useState('');
    const [sendAt, setSendAt] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Data states
    const [notifications, setNotifications] = useState<NotificationData[]>([]);
    const [logs, setLogs] = useState<NotificationLog[]>([]);

    useEffect(() => {
        // Fetch In-App notifications
        const notifRef = ref(database, 'notifications');
        const unsubNotif = onValue(notifRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                let notifArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a: any, b: any) => b.timestamp - a.timestamp);
                setNotifications(notifArray);
            } else {
                setNotifications([]);
            }
        });

        // Fetch Push Stats Logs
        const logRef = ref(database, 'notification_logs');
        const unsubLogs = onValue(logRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.val();
                let logArray = Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).sort((a: any, b: any) => b.timestamp - a.timestamp);
                setLogs(logArray);
            } else {
                setLogs([]);
            }
        });

        return () => { unsubNotif(); unsubLogs(); };
    }, []);

    const sendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !body) return;

        setIsSending(true);
        try {
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
                // Save to In-App Bell system
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

    const deleteNotification = async (id: string, path: string = 'notifications') => {
        if (confirm(`Are you sure you want to delete this from ${path}?`)) {
            try {
                await remove(ref(database, `${path}/${id}`));
            } catch (err) {
                console.error(err);
                alert('Failed to delete.');
            }
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto px-4 pb-12 text-gray-100 font-sans">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-blue-400 tracking-tight">Notification Engine</h1>
                    <p className="text-gray-400 mt-1">Manage browser push, in-app alerts, and track engagement.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Column 1: Sender */}
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 shadow-2xl border border-gray-700/50">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center"><FaPaperPlane className="text-sm" /></div> Compose Broadcast</h2>

                    <form onSubmit={sendNotification} className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. SL vs IND Live Now!"
                                    className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Message Body</label>
                                <textarea
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    placeholder="T20 Match has started. Click to watch."
                                    rows={2}
                                    className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 transition-colors"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Redirect (Optional)</label>
                                <input
                                    type="text"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="/event/123"
                                    className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Media URL (Optional)</label>
                                <input
                                    type="text"
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                    placeholder="https://..."
                                    className="w-full bg-gray-900 border border-gray-700 text-gray-300 px-4 py-3 rounded-xl focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-blue-900/20 border border-blue-800/30 rounded-xl">
                            <label className="block text-xs font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                                <FaClock /> Schedule for Future Delivery?
                            </label>
                            <input
                                type="datetime-local"
                                value={sendAt}
                                onChange={(e) => setSendAt(e.target.value)}
                                className="w-full bg-gray-950/50 border border-blue-900/50 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-blue-500"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isSending}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-50 text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-3"
                        >
                            {isSending ? 'Sending Engine Active...' : <>Broadcast to All <FaPaperPlane /></>}
                        </button>
                    </form>
                </div>

                {/* Column 2: Analytics Tracking */}
                <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 shadow-2xl border border-gray-700/50 flex flex-col h-full">
                    <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center">📈</div> Delivery & Click Stats</h2>

                    <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] pr-2 custom-scrollbar">
                        {logs.length > 0 ? (
                            logs.map(log => {
                                const clickRate = log.sentCount > 0 ? ((log.clickCount / log.sentCount) * 100).toFixed(1) : '0';
                                return (
                                    <div key={log.id} className="p-4 bg-gray-900/50 border border-gray-700/30 rounded-2xl group hover:border-emerald-500/50 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-bold text-white line-clamp-1">{log.title}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${log.type === 'automated' ? 'bg-purple-900/40 text-purple-400' : 'bg-blue-900/40 text-blue-400'}`}>
                                                        {log.type || 'Standard'}
                                                    </span>
                                                    <span className="text-[10px] text-gray-500 text-xs">{new Date(log.timestamp).toLocaleString()}</span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-black text-emerald-400">{log.clickCount} Click(s)</div>
                                                <div className="text-[10px] text-gray-500 uppercase font-bold">{clickRate}% CTR</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-700/30">
                                                <div className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">Reach</div>
                                                <div className="text-xs font-bold text-gray-200">{log.totalSubs}</div>
                                            </div>
                                            <div className="bg-gray-800/50 rounded-lg p-2 text-center border border-gray-700/30">
                                                <div className="text-gray-500 text-[10px] uppercase font-bold mb-0.5">Delivered</div>
                                                <div className="text-xs font-bold text-blue-400">{log.sentCount}</div>
                                            </div>
                                            <div className="bg-red-900/10 rounded-lg p-2 text-center border border-red-900/20 group-hover:bg-red-900/20 transition-colors">
                                                <button onClick={() => deleteNotification(log.id, 'notification_logs')} className="text-red-500 text-[10px] uppercase font-black tracking-widest h-full w-full">Delete Log</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-12 text-gray-600 grayscale opacity-50">
                                <div className="text-6xl mb-4">📉</div>
                                <p className="font-bold tracking-widest uppercase text-sm">No analytics logs yet.</p>
                                <p className="text-[10px] lowercase text-center max-w-[200px] mt-2 italic">Stats are recorded automatically when notifications are sent from the server.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* List recent notifications - Bottom Full Width */}
            <div className="bg-gray-800/50 backdrop-blur rounded-2xl p-6 shadow-xl border border-gray-700/50">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">History In-App Feed</h2>

                {notifications.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notifications.map(notif => (
                            <div key={notif.id} className="p-4 bg-gray-900 border border-gray-700/50 rounded-xl flex justify-between items-start group relative overflow-hidden">
                                <div className="z-10 relative">
                                    <h3 className="font-bold text-white leading-tight">{notif.title}</h3>
                                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">{notif.body}</p>
                                    <div className="text-[10px] text-gray-600 mt-3 font-semibold uppercase">{new Date(notif.timestamp).toLocaleString()}</div>
                                </div>
                                <button
                                    onClick={() => deleteNotification(notif.id, 'notifications')}
                                    className="p-2 text-gray-700 hover:text-red-500 transition-colors z-20"
                                    title="Delete from In-App list"
                                >
                                    <FaTrash />
                                </button>
                                <div className="absolute top-0 right-0 w-12 h-12 bg-red-600/5 translate-x-6 -translate-y-6 rotate-45 group-hover:bg-red-600/10 transition-all"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center py-8 italic border-2 border-dashed border-gray-700 rounded-xl uppercase tracking-widest text-xs font-bold">In-App feed is empty.</p>
                )}
            </div>
        </div>
    );
}
