'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PRAYER_ROOM_URL, ORGANIZATION } from '@/lib/constants'
import { auth } from '@/lib/firebase'
import { useSanctuary } from '@/hooks/useSanctuary'
import { usePrayerTheme } from '@/hooks/usePrayerTheme'

export default function AltarRoom() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [userName, setUserName] = useState<string>('Intercessor')
    const [loading, setLoading] = useState(true)
    const [showVocalRoom, setShowVocalRoom] = useState(false)
    const [vocalMinimized, setVocalMinimized] = useState(false)
    const [isPipMode, setIsPipMode] = useState(false)
    const [vocalPos, setVocalPos] = useState({ x: 0, y: 0 })
    const [isDragging, setIsDragging] = useState(false)
    const dragStart = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 })
    const [promptingText, setPromptingText] = useState('')
    const [mounted, setMounted] = useState(false)
    const [activeReaction, setActiveReaction] = useState<string | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const { activeTheme } = usePrayerTheme()
    const {
        connections,
        intensity,
        bursts,
        promptings,
        focusedPoint,
        sendBurst,
        sendPrompting,
        isConnected
    } = useSanctuary({
        userId: user?.uid || undefined,
        userName: userName
    })

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const unsub = auth?.onAuthStateChanged(async (u) => {
            if (!u) {
                router.push('/enter')
                return
            }
            setUser(u)
            if (u && u.displayName) {
                setUserName(u.displayName)
            }
            setLoading(false)
        })
        return () => unsub?.()
    }, [router])

    const handleReaction = (emoji: '🔥' | '🙏' | '🙌' | '❤️' | '✨') => {
        setActiveReaction(emoji)
        sendBurst(emoji)
        setTimeout(() => setActiveReaction(null), 200)
    }

    const handleDragStart = (e: React.PointerEvent) => {
        if ((e.target as HTMLElement).closest('button')) return
        setIsDragging(true)
        dragStart.current = {
            x: e.clientX,
            y: e.clientY,
            initialX: vocalPos.x,
            initialY: vocalPos.y
        }
            ; (e.target as HTMLElement).setPointerCapture(e.pointerId)
    }

    const handleDragMove = (e: React.PointerEvent) => {
        if (!isDragging) return
        const dx = e.clientX - dragStart.current.x
        const dy = e.clientY - dragStart.current.y
        setVocalPos({
            x: dragStart.current.initialX + dx,
            y: dragStart.current.initialY + dy
        })
    }

    const handleDragEnd = (e: React.PointerEvent) => {
        setIsDragging(false)
            ; (e.target as HTMLElement).releasePointerCapture(e.pointerId)
    }

    // Reset position when changing modes to prevent jumps
    useEffect(() => {
        setVocalPos({ x: 0, y: 0 })
    }, [isPipMode, vocalMinimized, showVocalRoom])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
                {/* Ambient glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px]" />
                </div>
                <div className="relative">
                    <div className="w-16 h-16 border-2 border-amber-500/20 rounded-full flex items-center justify-center">
                        <div className="w-12 h-12 border-t-2 border-amber-500 rounded-full animate-spin" />
                    </div>
                </div>
                <p className="mt-8 text-stone-600 text-xs uppercase tracking-[0.4em] font-medium">
                    Preparing the Sanctuary...
                </p>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className="relative min-h-screen overflow-hidden bg-[#0a0a0f]"
        >
            {/* === LAYERED AMBIENT BACKGROUND === */}
            <div className="fixed inset-0 pointer-events-none">
                {/* Base gradient */}
                <div
                    className="absolute inset-0 transition-all duration-[2000ms]"
                    style={{
                        background: `radial-gradient(ellipse 80% 50% at 50% 30%, ${activeTheme.colorScheme.background}15 0%, transparent 70%)`
                    }}
                />
                {/* Eternal Flame Core - more prominent */}
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div
                        className="w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full blur-[120px] md:blur-[180px] transition-all duration-1000"
                        style={{
                            background: `radial-gradient(circle, ${activeTheme.colorScheme.primary}40 0%, ${activeTheme.colorScheme.glow}20 40%, transparent 70%)`,
                            transform: `scale(${1 + intensity * 0.005})`,
                        }}
                    />
                </div>
                {/* Secondary glow */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[400px] bg-gradient-to-t from-amber-900/5 to-transparent" />
                {/* Noise texture overlay */}
                <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3QgZmlsdGVyPSJ1cmwoI2EpIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+PC9zdmc+')]" />
            </div>

            {/* === BURST ANIMATIONS === */}
            {bursts.map((burst) => (
                <div
                    key={burst.id}
                    className="fixed flex flex-col items-center pointer-events-none z-20 animate-burst"
                    style={{
                        left: `${burst.x}%`,
                        bottom: '120px'
                    }}
                >
                    <span className="text-4xl md:text-5xl drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]">{burst.emoji}</span>
                    {burst.userName && (
                        <span className="text-[8px] text-stone-500 uppercase tracking-[0.2em] mt-2 backdrop-blur-sm px-2 py-0.5 rounded-full bg-black/20">
                            {burst.userName}
                        </span>
                    )}
                </div>
            ))}

            {/* === HEADER === */}
            <header className="fixed top-0 left-0 right-0 z-40">
                <div className="flex items-center justify-between px-4 md:px-8 py-4 md:py-6">
                    <Link
                        href="/"
                        className="group flex items-center gap-2 text-stone-600 hover:text-amber-500 transition-colors cursor-pointer"
                    >
                        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-[10px] md:text-xs uppercase tracking-[0.3em] font-medium hidden sm:inline">
                            Return
                        </span>
                    </Link>

                    {/* Connection Status Pill */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.05]">
                            <span className={`w-2 h-2 rounded-full transition-all duration-500 ${mounted && isConnected
                                ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]'
                                : 'bg-stone-700'
                                }`} />
                            <span className="text-[10px] md:text-xs text-stone-400 font-medium tracking-wide">
                                <span className="text-stone-200 font-semibold">{mounted ? connections : 0}</span>
                                <span className="hidden sm:inline ml-1">Intercessors</span>
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* === SPIRIT-LED PROMPTINGS DISPLAY (Top) === */}
            <div className="fixed top-20 md:top-24 left-4 right-4 z-30 flex flex-col items-center gap-2 pointer-events-none">
                {promptings.map((p) => (
                    <div
                        key={p.id}
                        className="px-5 py-3 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.3)] animate-in fade-in slide-in-from-top-4 duration-500 max-w-sm"
                    >
                        <p className="text-sm md:text-base text-stone-200 italic text-center font-light leading-relaxed">
                            "{p.text}"
                        </p>
                        {p.userName && (
                            <p className="text-[9px] text-amber-500/60 uppercase tracking-[0.2em] text-center mt-2 font-medium">
                                — {p.userName}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            {/* === MAIN CONTENT === */}
            <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 md:px-8 pt-24 pb-52 md:pb-48 md:pt-32">
                {/* Title Section */}
                <div className="text-center mb-8 md:mb-12">
                    <p
                        className="text-[10px] md:text-xs uppercase tracking-[0.5em] font-bold mb-3 md:mb-4 transition-colors duration-1000"
                        style={{ color: activeTheme.colorScheme.primary }}
                    >
                        {ORGANIZATION}
                    </p>
                    <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl text-stone-100 font-light mb-4 md:mb-6 tracking-tight">
                        The Altar Room
                    </h1>
                    <p className="text-stone-500 text-sm md:text-base italic max-w-md mx-auto font-light leading-relaxed">
                        You are in the presence of the Most High. Pray as the Spirit leads.
                    </p>
                </div>

                {/* === PRAYER FOCUS CARD (Glass Morphism) === */}
                <div
                    className={`w-full max-w-lg md:max-w-xl transition-all duration-700 ${focusedPoint !== null ? 'scale-[1.02]' : ''}`}
                >
                    <div
                        className="relative p-6 md:p-10 rounded-3xl overflow-hidden transition-all duration-500"
                        style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                            boxShadow: focusedPoint !== null
                                ? `0 8px 60px ${activeTheme.colorScheme.glow}20, inset 0 1px 0 rgba(255,255,255,0.05)`
                                : '0 8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
                            border: `1px solid ${focusedPoint !== null ? activeTheme.colorScheme.primary + '30' : 'rgba(255,255,255,0.06)'}`
                        }}
                    >
                        {/* Card glow effect */}
                        <div
                            className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-[80px] transition-opacity duration-1000 pointer-events-none"
                            style={{
                                background: activeTheme.colorScheme.primary,
                                opacity: focusedPoint !== null ? 0.15 : 0.05
                            }}
                        />

                        <div className="relative z-10">
                            <h3
                                className="text-[10px] md:text-xs uppercase tracking-[0.4em] font-bold mb-6 transition-colors duration-1000"
                                style={{ color: activeTheme.colorScheme.primary }}
                            >
                                Global Burden
                            </h3>

                            <p className="font-serif text-xl md:text-2xl lg:text-3xl text-stone-100 mb-3 font-light leading-snug">
                                {activeTheme.title}
                            </p>

                            <p className="text-xs md:text-sm text-stone-500 italic mb-8 pb-6 border-b border-white/[0.06] font-light">
                                {activeTheme.scripture}
                            </p>

                            <ul className="space-y-4">
                                {activeTheme.points.map((point, i) => (
                                    <li
                                        key={i}
                                        className={`text-sm md:text-base text-stone-400 font-light flex items-start gap-4 transition-all duration-500 ${focusedPoint === i ? 'translate-x-2' : ''
                                            }`}
                                        style={{
                                            color: focusedPoint === i ? activeTheme.colorScheme.primary : undefined
                                        }}
                                    >
                                        <span
                                            className="mt-2 w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-500"
                                            style={{
                                                background: focusedPoint === i
                                                    ? activeTheme.colorScheme.primary
                                                    : activeTheme.colorScheme.primary + '40',
                                                boxShadow: focusedPoint === i
                                                    ? `0 0 12px ${activeTheme.colorScheme.primary}`
                                                    : 'none'
                                            }}
                                        />
                                        <span className="leading-relaxed">{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* === VOCAL ROOM BUTTON === */}
                <button
                    onClick={() => setShowVocalRoom(!showVocalRoom)}
                    className={`group mt-6 md:mt-8 px-6 py-4 md:px-8 md:py-5 rounded-2xl transition-all duration-300 flex items-center justify-center gap-3 w-full max-w-lg md:max-w-xl cursor-pointer ${showVocalRoom
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                        } border backdrop-blur-sm`}
                >
                    <div className={`p-2 rounded-xl transition-all ${showVocalRoom ? 'bg-amber-500/20' : 'bg-white/[0.05] group-hover:bg-white/[0.08]'}`}>
                        <svg className={`w-5 h-5 transition-colors ${showVocalRoom ? 'text-amber-500' : 'text-stone-400 group-hover:text-stone-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <span className={`text-xs md:text-sm uppercase tracking-[0.2em] font-medium transition-colors ${showVocalRoom ? 'text-amber-500' : 'text-stone-400 group-hover:text-stone-300'
                        }`}>
                        {showVocalRoom ? 'Close Vocal Room' : 'Join Vocal Room'}
                    </span>
                </button>
            </main>

            {/* === REACTION BAR (Fixed Bottom) === */}
            <div className="fixed bottom-0 left-0 right-0 z-40 pb-6 md:pb-8 px-4">
                <div className="max-w-lg mx-auto flex flex-col items-center gap-3">
                    {/* Spirit-Led Prompting Input */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            if (promptingText.trim()) {
                                sendPrompting(promptingText)
                                setPromptingText('')
                            }
                        }}
                        className="flex items-center gap-2 w-full"
                    >
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={promptingText}
                                onChange={(e) => setPromptingText(e.target.value)}
                                placeholder="Share a word from the Spirit..."
                                maxLength={100}
                                className="w-full px-5 py-3.5 md:py-4 rounded-2xl text-sm md:text-base text-stone-200 placeholder-stone-600 bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] focus:outline-none focus:border-amber-500/30 focus:bg-white/[0.05] transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={promptingText.trim().length === 0}
                            className="p-3.5 md:p-4 rounded-2xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.06] hover:border-white/[0.12] disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                        >
                            <svg className="w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </form>

                    {/* Emoji Reactions */}
                    <div className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-full bg-white/[0.03] backdrop-blur-xl border border-white/[0.08]">
                        {([
                            { emoji: '🔥', label: 'Fire' },
                            { emoji: '🙏', label: 'Amen' },
                            { emoji: '🙌', label: 'Hallelujah' },
                            { emoji: '❤️', label: 'Love' },
                            { emoji: '✨', label: 'Glory' }
                        ] as const).map(({ emoji, label }) => (
                            <button
                                key={emoji}
                                onClick={() => handleReaction(emoji)}
                                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all cursor-pointer ${activeReaction === emoji
                                    ? 'bg-amber-500/20 scale-90'
                                    : 'bg-white/[0.02] hover:bg-white/[0.06] active:scale-95'
                                    } border border-white/[0.06] hover:border-amber-500/30`}
                                title={label}
                            >
                                <span className="text-xl md:text-2xl">{emoji}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* === VOCAL ROOM DRAWER === */}
            {showVocalRoom && (
                <>
                    {/* Backdrop - Only for Drawer mode */}
                    {!isPipMode && !vocalMinimized && (
                        <div
                            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 animate-in fade-in duration-300"
                            onClick={() => setShowVocalRoom(false)}
                        />
                    )}

                    {/* Drawer / PiP Container */}
                    <div
                        className={`fixed z-50 transform transition-all 
                            ${isDragging ? 'duration-0' : 'duration-500 ease-out'} 
                            ${isPipMode
                                ? 'bottom-24 right-4 md:right-8 w-[280px] h-[160px] md:w-[360px] md:h-[200px] translate-x-0'
                                : vocalMinimized
                                    ? 'translate-x-full'
                                    : 'top-0 right-0 h-full w-full md:w-[420px] translate-x-0'
                            }`}
                        style={{
                            transform: isPipMode || vocalMinimized
                                ? `translate(${vocalPos.x}px, ${vocalPos.y}px)`
                                : undefined
                        }}
                    >
                        <div className={`h-full flex flex-col bg-[#0f0f14]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl
                            ${isPipMode ? 'rounded-2xl overflow-hidden' : 'md:border-l'}`}>

                            <div
                                onPointerDown={isPipMode ? handleDragStart : undefined}
                                onPointerMove={isPipMode ? handleDragMove : undefined}
                                onPointerUp={isPipMode ? handleDragEnd : undefined}
                                style={{ touchAction: isPipMode ? 'none' : 'auto' }}
                                className={`flex items-center justify-between p-3 md:p-4 border-b border-white/[0.06] ${isPipMode ? 'cursor-move select-none' : ''}`}
                            >
                                <div className={isPipMode ? 'hidden md:block' : ''}>
                                    <h3 className="text-sm font-semibold text-stone-100 tracking-wide">Vocal Room</h3>
                                    {!isPipMode && (
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                            <p className="text-[10px] text-stone-500">Live Audio</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 ml-auto">
                                    <button
                                        onClick={() => setIsPipMode(!isPipMode)}
                                        className={`p-1.5 md:p-2 rounded-xl transition-all cursor-pointer ${isPipMode ? 'text-amber-500 bg-amber-500/10' : 'text-stone-500 hover:text-stone-300 hover:bg-white/[0.05]'}`}
                                        title={isPipMode ? "Exit PiP" : "PiP Mode"}
                                    >
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16h6v6" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 8h6V2" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M22 2l-6 6" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 22l6-6" />
                                        </svg>
                                    </button>
                                    {!isPipMode && (
                                        <button
                                            onClick={() => setVocalMinimized(true)}
                                            className="p-1.5 md:p-2 text-stone-500 hover:text-stone-300 hover:bg-white/[0.05] rounded-xl transition-all cursor-pointer"
                                            title="Minimize"
                                        >
                                            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                    )}
                                    <button
                                        onClick={() => {
                                            setShowVocalRoom(false)
                                            setIsPipMode(false)
                                        }}
                                        className="p-1.5 md:p-2 text-stone-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                                        title="Close"
                                    >
                                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Jitsi Embed */}
                            <div className="flex-1 relative bg-black/30">
                                <iframe
                                    src={PRAYER_ROOM_URL}
                                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                                    className="w-full h-full absolute inset-0"
                                    style={{ border: 'none' }}
                                />
                            </div>

                            {/* Footer - Only for Drawer mode */}
                            {!isPipMode && (
                                <div className="p-3 border-t border-white/[0.06] text-center bg-black/20">
                                    <p className="text-[10px] text-stone-600 flex items-center justify-center gap-2">
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                                        </svg>
                                        Keep mic muted unless leading prayer
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Minimized Floating Bar */}
                    {vocalMinimized && !isPipMode && (
                        <div
                            onPointerDown={handleDragStart}
                            onPointerMove={handleDragMove}
                            onPointerUp={handleDragEnd}
                            className={`fixed top-20 right-4 md:right-8 z-50 cursor-move select-none 
                                ${isDragging ? 'duration-0' : 'duration-300 animate-in slide-in-from-right'}`}
                            style={{
                                transform: `translate(${vocalPos.x}px, ${vocalPos.y}px)`,
                                touchAction: 'none'
                            }}
                        >
                            <div className="flex items-center gap-3 px-4 py-2.5 rounded-full bg-black/80 backdrop-blur-2xl border border-white/[0.08] shadow-2xl">
                                <div className="flex items-center gap-2 pr-3 border-r border-white/[0.1]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    <span className="text-xs text-stone-200 font-medium">Live Room</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setVocalMinimized(false)}
                                        className="p-1.5 text-stone-500 hover:text-amber-500 transition-colors cursor-pointer"
                                        title="Expand"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setShowVocalRoom(false)}
                                        className="p-1.5 text-stone-500 hover:text-red-400 transition-colors cursor-pointer"
                                        title="Close"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* === CUSTOM STYLES === */}
            <style jsx>{`
                @keyframes burst {
                    0% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    50% {
                        opacity: 0.8;
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-250px) scale(1.8);
                    }
                }
                .animate-burst {
                    animation: burst 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                }
                
                @media (prefers-reduced-motion: reduce) {
                    .animate-burst {
                        animation: none;
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    )
}
