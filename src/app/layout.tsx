import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google"; // Keeping default fonts for now, user asked for "Google Fonts like Inter" but Geist is fine/modern.
import "./globals.css";
import AntiDebug from "@/components/Security/AntiDebug";
import Link from "next/link";
import Script from "next/script";
import { FaTelegram, FaFacebook } from "react-icons/fa";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "IDS Sports - Live Streaming",
  description: "Watch live sports events on IDS Sports.",
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon.ico',
    apple: '/icon.png',
  },
  other: {
    'monetag': '01a8574274c73162d9d5527bdb339d03',
  },
};

import GoogleAnalytics from "@/components/GoogleAnalytics";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-950 text-white min-h-screen flex flex-col`}
      >
        <AntiDebug />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || "G-S3MTWH8KWV"} />

        {/* Monetag MultiTag Script */}
        <Script
          src="https://quge5.com/88/tag.min.js"
          data-zone="211266"
          strategy="afterInteractive"
          data-cfasync="false"
        />

        {/* Navbar */}
        <header className="bg-black/50 backdrop-blur-md border-b border-gray-800 sticky top-0 z-50">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              IDS Sports
            </Link>
            <nav className="hidden md:flex gap-6">
              <Link href="/" className="hover:text-blue-400 transition">Home</Link>
              {/* <Link href="/schedule" className="hover:text-blue-400 transition">Schedule</Link> */}
            </nav>
            <div className="flex gap-4">
              <a href="https://t.me/IDS_Sports" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-xl"><FaTelegram /></a>
              <a href="https://www.facebook.com/share/1A9D7LCHnw/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-500 text-xl"><FaFacebook /></a>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-grow container mx-auto px-4 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 py-8 mt-auto">
          <div className="container mx-auto px-4 text-center text-gray-400">
            <div className="flex justify-center gap-6 mb-4">
              <a href="https://t.me/IDS_Sports" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-400"><FaTelegram /> Join Telegram</a>
              <a href="https://www.facebook.com/share/1A9D7LCHnw/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-blue-600"><FaFacebook /> Follow Facebook</a>
            </div>
            <p className="mb-2">IDS Sports Version 1.0</p>
            <p className="text-sm">
              Developed by <a href="https://ishangadineth.online/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Ishanga Dineth</a>
            </p>
            <p className="text-xs mt-4 text-gray-600">© {new Date().getFullYear()} IDS Sports. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
