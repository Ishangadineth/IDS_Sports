'use client';

import React, { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { database } from '@/lib/firebase';
import { ref, onValue } from 'firebase/database';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { FaEye, FaThumbsUp, FaThumbsDown, FaShare, FaCommentDots, FaFilter, FaCalendarAlt } from 'react-icons/fa';

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function AnalyticsDashboard() {
    const { data: eventsData, error, isLoading } = useSWR('/api/events', fetcher);
    const [firebaseData, setFirebaseData] = useState<any>({});

    const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | '7days' | '28days' | 'all'>('all');
    const [activeMetric, setActiveMetric] = useState<'views' | 'likes' | 'dislikes' | 'shares' | 'chats'>('views');

    // Fetch realtime Firebase data
    useEffect(() => {
        const eventsRef = ref(database, `events`);
        const unsubscribe = onValue(eventsRef, (snapshot) => {
            if (snapshot.exists()) {
                setFirebaseData(snapshot.val());
            } else {
                setFirebaseData({});
            }
        });
        return () => unsubscribe();
    }, []);

    // Combine MongoDB events with Firebase stats
    const combinedEvents = useMemo(() => {
        if (!eventsData?.data) return [];

        return eventsData.data.map((event: any) => {
            const fbEvent = firebaseData[event._id] || {};
            const stats = fbEvent.stats || { views: 0, likes: 0, dislikes: 0, shares: 0 };
            const chatObj = fbEvent.chat || {};
            const chatCount = Object.keys(chatObj).length;

            return {
                ...event,
                timestamp: new Date(event.startTime).getTime(),
                dateStr: format(new Date(event.startTime), 'dd MMM'),
                views: stats.views || 0,
                likes: stats.likes || 0,
                dislikes: stats.dislikes || 0,
                shares: stats.shares || 0,
                chats: chatCount,
            };
        }).sort((a: any, b: any) => b.timestamp - a.timestamp); // newest first
    }, [eventsData, firebaseData]);

    // Filter events by date range
    const filteredEvents = useMemo(() => {
        const today = new Date();
        let startDate: Date;
        let endDate: Date = endOfDay(today);

        switch (timeRange) {
            case 'today':
                startDate = startOfDay(today);
                break;
            case 'yesterday':
                startDate = startOfDay(subDays(today, 1));
                endDate = endOfDay(subDays(today, 1));
                break;
            case '7days':
                startDate = startOfDay(subDays(today, 6));
                break;
            case '28days':
                startDate = startOfDay(subDays(today, 27));
                break;
            case 'all':
            default:
                startDate = startOfDay(subDays(today, 365 * 10)); // arbitrarily 10 years ago to show all
                break;
        }

        return combinedEvents.filter((point: any) => {
            const pointDate = new Date(point.timestamp);
            return isWithinInterval(pointDate, { start: startDate, end: endDate });
        });
    }, [timeRange, combinedEvents]);

    // Format chart timeline grouping multiple events on same day
    const chartData = useMemo(() => {
        const grouped: any = {};

        // Reverse so the graph plots older to newer left-to-right
        const chronological = [...filteredEvents].reverse();

        chronological.forEach((event: any) => {
            if (!grouped[event.dateStr]) {
                grouped[event.dateStr] = {
                    dateStr: event.dateStr,
                    timestamp: event.timestamp,
                    views: 0, likes: 0, dislikes: 0, shares: 0, chats: 0
                };
            }
            grouped[event.dateStr].views += event.views;
            grouped[event.dateStr].likes += event.likes;
            grouped[event.dateStr].dislikes += event.dislikes;
            grouped[event.dateStr].shares += event.shares;
            grouped[event.dateStr].chats += event.chats;
        });

        // If there's 0 or 1 data point, chart looks empty. Let's pad it with today or empty 0s
        const out = Object.values(grouped);
        if (out.length === 0) {
            out.push({ dateStr: format(new Date(), 'dd MMM'), timestamp: Date.now(), views: 0, likes: 0, dislikes: 0, shares: 0, chats: 0 });
        }
        return out;
    }, [filteredEvents]);

    // Aggregate stats globally
    const totals = useMemo(() => {
        return filteredEvents.reduce(
            (acc: any, curr: any) => ({
                views: acc.views + curr.views,
                likes: acc.likes + curr.likes,
                dislikes: acc.dislikes + curr.dislikes,
                shares: acc.shares + curr.shares,
                chats: acc.chats + curr.chats,
            }),
            { views: 0, likes: 0, dislikes: 0, shares: 0, chats: 0 }
        );
    }, [filteredEvents]);


    // Chart Formatting
    const formatYAxis = (tickItem: number) => {
        if (tickItem >= 1000) return `${(tickItem / 1000).toFixed(1)}K`;
        return tickItem.toString();
    };

    const getMetricColor = (metric: string) => {
        switch (metric) {
            case 'views': return '#06b6d4'; // cyan
            case 'likes': return '#3b82f6'; // blue
            case 'dislikes': return '#ef4444'; // red
            case 'shares': return '#22c55e'; // green
            case 'chats': return '#8b5cf6'; // purple
            default: return '#06b6d4';
        }
    };

    // UI States
    if (error) return <div className="p-8 text-red-500">Failed to load event data.</div>;
    if (isLoading) return <div className="p-8 text-blue-500 font-bold animate-pulse">Loading Live Analytics...</div>;

    return (
        <div className="bg-gray-50 min-h-screen text-gray-800 p-6 md:p-8 font-sans">
            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                        Insights & Analytics <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full border border-red-200 uppercase font-bold tracking-widest flex items-center gap-1 shadow-sm"><span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> Live Data</span>
                    </h1>
                    <p className="text-slate-500 mt-1">Real-time engagement breakdown from Firebase and MongoDB.</p>
                </div>

                <div className="relative group">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                        <FaCalendarAlt className="text-slate-400" />
                        <select
                            className="bg-transparent border-none appearance-none outline-none font-semibold text-slate-700 cursor-pointer pr-4"
                            value={timeRange}
                            onChange={(e: any) => setTimeRange(e.target.value)}
                        >
                            <option value="today">Today</option>
                            <option value="yesterday">Yesterday</option>
                            <option value="7days">Last 7 days</option>
                            <option value="28days">Last 28 days</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                </div>
            </header>

            {/* Main Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                {[
                    { key: 'views', label: 'Views', value: totals.views, icon: <FaEye />, color: 'text-cyan-600', bg: 'bg-cyan-50', activeBorder: 'border-cyan-500' },
                    { key: 'chats', label: 'Interactions', value: totals.chats, icon: <FaCommentDots />, color: 'text-purple-600', bg: 'bg-purple-50', activeBorder: 'border-purple-500' },
                    { key: 'likes', label: 'Likes', value: totals.likes, icon: <FaThumbsUp />, color: 'text-blue-600', bg: 'bg-blue-50', activeBorder: 'border-blue-500' },
                    { key: 'dislikes', label: 'Dislikes', value: totals.dislikes, icon: <FaThumbsDown />, color: 'text-red-600', bg: 'bg-red-50', activeBorder: 'border-red-500' },
                    { key: 'shares', label: 'Shares', value: totals.shares, icon: <FaShare />, color: 'text-green-600', bg: 'bg-green-50', activeBorder: 'border-green-500' },
                ].map((stat) => (
                    <div
                        key={stat.key}
                        onClick={() => setActiveMetric(stat.key as any)}
                        className={`cursor-pointer transition-all duration-300 transform hover:-translate-y-1 bg-white rounded-xl p-5 border-2 shadow-sm ${activeMetric === stat.key ? stat.activeBorder + ' shadow-md' : 'border-transparent hover:border-gray-200'}`}
                    >
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-3">
                            <span className={`p-2 rounded-md ${stat.bg} ${stat.color}`}>{stat.icon}</span>
                            {stat.label}
                        </div>
                        <div className="text-2xl md:text-3xl font-bold text-slate-800">
                            {stat.value.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Chart Section */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl p-6 mb-8 mt-2">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 capitalize">
                    {activeMetric} Overview
                </h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={getMetricColor(activeMetric)} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={getMetricColor(activeMetric)} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                            <XAxis
                                dataKey="dateStr"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 13, dy: 10 }}
                                minTickGap={20}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#64748b', fontSize: 13, dx: -10 }}
                                tickFormatter={formatYAxis}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '3 3' }}
                            />
                            <Area
                                type="monotone"
                                dataKey={activeMetric}
                                stroke={getMetricColor(activeMetric)}
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorMetric)"
                                activeDot={{ r: 6, strokeWidth: 0, fill: getMetricColor(activeMetric) }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Breakdown Table REAL DATA */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Events Performance Breakdown</h3>
                    <div className="text-slate-500 text-sm font-semibold flex items-center gap-1">
                        Found {filteredEvents.length} Event(s)
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Event Name</th>
                                <th className="px-6 py-3 font-semibold">Date</th>
                                <th className="px-6 py-3 font-semibold text-right">Views</th>
                                <th className="px-6 py-3 font-semibold text-center">Interactions / Chats</th>
                                <th className="px-6 py-3 font-semibold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEvents.map((event: any) => (
                                <tr key={event._id} className="hover:bg-slate-50 transition cursor-pointer">
                                    <td className="px-6 py-4 font-semibold text-slate-800">
                                        <div className="line-clamp-1">{event.title} <span className="opacity-50 italic font-normal ml-2">({event.teamA.name} vs {event.teamB.name})</span></div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500">{new Date(event.startTime).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 text-right font-medium text-slate-700">
                                        {event.views.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center text-slate-500">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${event.chats > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {event.chats} Chats
                                        </span>
                                        <span className={`px-2 py-1 rounded text-xs font-bold ml-2 ${event.likes > 0 ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                                            {event.likes} Likes
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {event.status === 'Live' && (
                                            <>
                                                <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Live</span>
                                            </>
                                        )}
                                        {event.status === 'Delayed' && (
                                            <>
                                                <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-2"></span>
                                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider text-yellow-600">Delayed</span>
                                            </>
                                        )}
                                        {event.status === 'Ended' && (
                                            <>
                                                <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{event.isHidden ? 'Ended (Hidden)' : 'Ended'}</span>
                                            </>
                                        )}
                                        {event.status === 'Scheduled' && (
                                            <>
                                                <span className="inline-block w-2 h-2 rounded-full bg-blue-400 mr-2"></span>
                                                <span className="text-xs text-slate-500 font-bold uppercase tracking-wider text-blue-600">Scheduled</span>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}

                            {filteredEvents.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-8 text-center text-slate-400 italic">No events match the selected timeline filter.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
