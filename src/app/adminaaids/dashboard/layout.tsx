'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    const handleLogout = () => {
        // Clear cookie by expiring it
        document.cookie = 'token=; Max-Age=0; path=/;';
        router.push('/adminaaids');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col">
            <header className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-blue-400">IDS Sports Admin</h1>
                <div className="flex items-center gap-4">
                    <Link href="/adminaaids/dashboard" className="px-3 py-2 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white">
                        Dashboard
                    </Link>
                    <Link href="/adminaaids/dashboard/analytics" className="px-3 py-2 hover:bg-gray-700 rounded transition-colors text-green-400 font-bold hover:text-green-300">
                        Analytics 📊
                    </Link>
                    <Link href="/adminaaids/dashboard/moderators" className="px-3 py-2 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white">
                        Moderators
                    </Link>
                    <Link href="/adminaaids/dashboard/notifications" className="px-3 py-2 hover:bg-gray-700 rounded transition-colors text-blue-400 font-bold hover:text-blue-300">
                        Notifications 🔔
                    </Link>
                    <Link href="/adminaaids/dashboard/logs" className="px-3 py-2 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white">
                        Activity Logs
                    </Link>
                    <Link href="/adminaaids/dashboard/profile" className="px-3 py-2 hover:bg-gray-700 rounded transition-colors text-gray-300 hover:text-white">
                        Profile
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                    >
                        Logout
                    </button>
                </div>
            </header>
            <main className="p-6 flex-1 container mx-auto">
                {children}
            </main>
        </div>
    );
}
