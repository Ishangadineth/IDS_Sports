'use client';

import { useState, useEffect } from 'react';

interface CountdownProps {
    targetDate: string; // ISO String
    onComplete?: () => void;
    label?: string;
    minimal?: boolean; // If true, show MM:SS only (or similar)
}

export default function Countdown({ targetDate, onComplete, label, minimal = false }: CountdownProps) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
        total: number;
    } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(targetDate) - +new Date();
            let timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0, total: difference };

            if (difference > 0) {
                timeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                    total: difference
                };
            } else {
                if (onComplete) onComplete();
            }

            setTimeLeft(timeLeft);
        };

        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return null;

    if (timeLeft.total <= 0) {
        return null; // Don't render if passed
    }

    if (minimal) {
        // Logic for "Event Starts in: MM:SS" type display
        // If days > 0, shows days too.
        return (
            <span className="font-mono text-xl text-yellow-500 font-bold">
                {label} {timeLeft.days > 0 ? `${timeLeft.days}d ` : ''}
                {String(timeLeft.hours).padStart(2, '0')}:
                {String(timeLeft.minutes).padStart(2, '0')}:
                {String(timeLeft.seconds).padStart(2, '0')}
            </span>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-10">
            <h3 className="text-xl text-gray-400 mb-4">{label || 'Event Starts In'}</h3>
            <div className="flex gap-4">
                <div className="bg-gray-800 p-4 rounded text-center w-20">
                    <div className="text-3xl font-bold text-blue-500">{timeLeft.days}</div>
                    <div className="text-xs uppercase text-gray-500">Days</div>
                </div>
                <div className="bg-gray-800 p-4 rounded text-center w-20">
                    <div className="text-3xl font-bold text-blue-500">{timeLeft.hours}</div>
                    <div className="text-xs uppercase text-gray-500">Hours</div>
                </div>
                <div className="bg-gray-800 p-4 rounded text-center w-20">
                    <div className="text-3xl font-bold text-blue-500">{timeLeft.minutes}</div>
                    <div className="text-xs uppercase text-gray-500">Mins</div>
                </div>
                <div className="bg-gray-800 p-4 rounded text-center w-20">
                    <div className="text-3xl font-bold text-blue-500">{timeLeft.seconds}</div>
                    <div className="text-xs uppercase text-gray-500">Secs</div>
                </div>
            </div>
        </div>
    );
}
