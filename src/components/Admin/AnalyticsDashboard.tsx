'use client';

import React, { useState, useMemo } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { format, subDays, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { FaEye, FaThumbsUp, FaThumbsDown, FaShare, FaCommentDots, FaFilter, FaCalendarAlt } from 'react-icons/fa';

// --- Dummy Data Generator ---
// In the future this will be replaced with real Firebase data fetched on load.
const generateMockData = () => {
    const data = [];
    const today = new Date();
    for (let i = 28; i >= 0; i--) {
        const date = subDays(today, i);
        data.push({
            dateStr: format(date, 'dd MMM'),
            timestamp: date.getTime(),
            views: Math.floor(Math.random() * 50000) + 10000,
            likes: Math.floor(Math.random() * 5000) + 500,
            dislikes: Math.floor(Math.random() * 300) + 50,
            shares: Math.floor(Math.random() * 1000) + 100,
            chats: Math.floor(Math.random() * 8000) + 2000,
        });
    }
    return data;
};

const MOCK_DATA = generateMockData();

// --- Main Component ---
export default function AnalyticsDashboard() {
    const [timeRange, setTimeRange] = useState<'today' | 'yesterday' | '7days' | '28days' | 'all'>('28days');
    const [activeMetric, setActiveMetric] = useState<'views' | 'likes' | 'dislikes' | 'shares' | 'chats'>('views');

    // Filter Data based on selection
    const filteredData = useMemo(() => {
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
                startDate = startOfDay(subDays(today, 60)); // or earliest event
                break;
        }

        return MOCK_DATA.filter((point) => {
            const pointDate = new Date(point.timestamp);
            return isWithinInterval(pointDate, { start: startDate, end: endDate });
        });
    }, [timeRange]);

    // Aggregate stats
    const totals = useMemo(() => {
        return filteredData.reduce(
            (acc, curr) => ({
                views: acc.views + curr.views,
                likes: acc.likes + curr.likes,
                dislikes: acc.dislikes + curr.dislikes,
                shares: acc.shares + curr.shares,
                chats: acc.chats + curr.chats,
            }),
            { views: 0, likes: 0, dislikes: 0, shares: 0, chats: 0 }
        );
    }, [filteredData]);

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

    return (
        <div className="bg-gray-50 min-h-screen text-gray-800 p-6 md:p-8 font-sans">

            {/* Header */}
            <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Insights & Analytics</h1>
                    <p className="text-slate-500 mt-1">Meta-Style Dashboard for Event Performance</p>
                </div>

                {/* Improved Dropdown replacing simple select */}
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
                        <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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

            {/* Breakdown Table mock */}
            <div className="bg-white border border-gray-100 shadow-sm rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800">Top Performing Events</h3>
                    <button className="text-blue-600 text-sm font-semibold hover:underline flex items-center gap-1">
                        <FaFilter size={12} /> Filter Details
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-6 py-3 font-semibold">Event Name</th>
                                <th className="px-6 py-3 font-semibold">Date</th>
                                <th className="px-6 py-3 font-semibold text-right">Views</th>
                                <th className="px-6 py-3 font-semibold text-center">Interactions</th>
                                <th className="px-6 py-3 font-semibold text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            <tr className="hover:bg-slate-50 transition cursor-pointer">
                                <td className="px-6 py-4 font-semibold text-slate-800">Sri Lanka vs India - T20</td>
                                <td className="px-6 py-4 text-slate-500">22 Feb 2026</td>
                                <td className="px-6 py-4 text-right font-medium">124.5K</td>
                                <td className="px-6 py-4 text-center text-slate-500">
                                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">4.2K Chats</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse"></span>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Live</span>
                                </td>
                            </tr>
                            <tr className="hover:bg-slate-50 transition cursor-pointer">
                                <td className="px-6 py-4 font-semibold text-slate-800">Australia vs England - Ashes</td>
                                <td className="px-6 py-4 text-slate-500">21 Feb 2026</td>
                                <td className="px-6 py-4 text-right font-medium">89.2K</td>
                                <td className="px-6 py-4 text-center text-slate-500">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold">12K Likes</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className="inline-block w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ended (Hidden)</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
}
