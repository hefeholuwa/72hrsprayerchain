'use client'

import { useMemo } from 'react'

interface LocationDot {
    name: string
    x: number
    y: number
    count: number
    isOnline: boolean
}

// Simplified country coordinates (Percentage based 0-100 x, 0-50 y)
const COUNTRY_MAP: Record<string, { x: number, y: number }> = {
    "nigeria": { x: 52, y: 30 },
    "ghana": { x: 48, y: 31 },
    "south africa": { x: 55, y: 44 },
    "kenya": { x: 58, y: 33 },
    "united kingdom": { x: 48, y: 15 },
    "uk": { x: 48, y: 15 },
    "usa": { x: 22, y: 22 },
    "united states": { x: 22, y: 22 },
    "canada": { x: 20, y: 12 },
    "brazil": { x: 33, y: 38 },
    "australia": { x: 85, y: 42 },
    "india": { x: 72, y: 28 },
    "china": { x: 80, y: 22 },
    "germany": { x: 51, y: 16 },
    "france": { x: 49, y: 17 },
    "uae": { x: 62, y: 26 },
    "south korea": { x: 85, y: 22 },
    "japan": { x: 88, y: 22 },
    "israel": { x: 58, y: 22 },
    "egypt": { x: 55, y: 25 },
    "ethiopia": { x: 58, y: 29 }
}

interface Props {
    users: any[]
    onlineUids: string[]
}

export default function GlobalHeatmap({ users, onlineUids }: Props) {
    const dots = useMemo(() => {
        const counts: Record<string, { count: number, hasOnline: boolean }> = {}

        users.forEach(u => {
            const location = (u.location || u.country || "Unknown").toLowerCase()
            // Extract country from location string (e.g., "Lagos, Nigeria" -> "Nigeria")
            const parts = location.split(',')
            const country = parts[parts.length - 1].trim()

            if (!counts[country]) {
                counts[country] = { count: 0, hasOnline: false }
            }

            counts[country].count++
            if (onlineUids.includes(u.id)) {
                counts[country].hasOnline = true
            }
        })

        const mapped: LocationDot[] = []
        Object.entries(counts).forEach(([name, data]) => {
            const coords = COUNTRY_MAP[name]
            if (coords) {
                mapped.push({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    ...coords,
                    count: data.count,
                    isOnline: data.hasOnline
                })
            }
        })
        return mapped
    }, [users, onlineUids])

    return (
        <div className="relative w-full aspect-[2/1] bg-[#050505] rounded-3xl border border-stone-800 p-8 overflow-hidden group">
            {/* Ambient Depth Layer */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(#1c1c1c_1px,transparent_1px)] [background-size:20px_20px]"></div>
            </div>

            <h4 className="absolute top-8 left-8 serif text-xl text-stone-200 z-10 flex items-center gap-3">
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]"></span>
                Global Watchman Pulse
            </h4>

            {/* SVG Map Container */}
            <svg viewBox="0 0 100 50" className="w-full h-full relative z-0">
                {/* Background Continental Shapes (Subtle) */}
                <g className="fill-stone-900/40">
                    {/* Simplified Americas */}
                    <path d="M15 10c2 0 5 2 7 5s3 8 2 12-4 10-6 12-5-2-7-5-2-10 0-14 2-10 4-10z" />
                    <path d="M30 30c3 0 6 5 8 10s-2 8-5 8-6-5-8-10 2-8 5-8z" />
                    {/* simplified Eurasia & Africa */}
                    <path d="M45 10c5-2 15-2 25 3s10 10 8 15-10 8-15 10-15-5-20-10-3-15 2-18z" />
                    <path d="M48 25c5 0 10 5 12 10s-2 12-8 12-10-8-10-15 2-7 6-7z" />
                    {/* simplified Australia */}
                    <path d="M80 35c3 0 6 3 8 7s-2 5-5 5-6-3-8-7 2-5 5-5z" />
                </g>

                {/* Dots Logic */}
                {dots.map((dot) => (
                    <g key={dot.name} transform={`translate(${dot.x}, ${dot.y})`}>
                        {/* Glow Layer */}
                        <circle
                            r={dot.isOnline ? 3 : 1.5}
                            className={`${dot.isOnline ? 'fill-amber-500/30' : 'fill-stone-500/10'} animate-ping`}
                            style={{ animationDuration: '3s' }}
                        />

                        {/* Core Dot */}
                        <circle
                            r={dot.isOnline ? 1.2 : 0.6}
                            className={`${dot.isOnline ? 'fill-amber-500' : 'fill-stone-600'} transition-all duration-1000 p-1`}
                        />

                        {/* Interactive Label */}
                        <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <text
                                y={-3}
                                textAnchor="middle"
                                className="text-[2.5px] font-black uppercase tracking-widest fill-stone-500"
                            >
                                {dot.name} ({dot.count})
                            </text>
                        </g>
                    </g>
                ))}
            </svg>

            <div className="absolute bottom-6 right-8 flex gap-6 items-center bg-[#050505]/80 backdrop-blur-sm p-3 rounded-xl border border-stone-800/50">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                    <span className="text-[8px] uppercase tracking-widest text-stone-500 font-bold">Active Altar</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-stone-700 rounded-full"></div>
                    <span className="text-[8px] uppercase tracking-widest text-stone-500 font-bold">Registered</span>
                </div>
            </div>
        </div>
    )
}
