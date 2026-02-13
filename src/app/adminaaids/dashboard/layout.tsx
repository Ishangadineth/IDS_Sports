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
                    <Link href="/adminaaids/dashboard" className="hover:text-blue-300">
                        Dashboard
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
