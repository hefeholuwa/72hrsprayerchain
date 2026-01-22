'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PRAYER_ROOM_URL, ORGANIZATION } from '@/lib/constants'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
import { useSanctuary } from '@/hooks/useSanctuary'
import { usePrayerTheme } from '@/hooks/usePrayerTheme'

export default function AltarRoom() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [userName, setUserName] = useState<string>('Intercessor')
    const [loading, setLoading] = useState(true)
    const [showVocalRoom, setShowVocalRoom] = useState(false)
    const [vocalMinimized, setVocalMinimized] = useState(false)
    const [promptingText, setPromptingText] = useState('')
    const [mounted, setMounted] = useState(false)
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

            // Check for registration (commitment)
            if (db) {
                try {
                    const q = query(
                        collection(db, "commitments"),
                        where("userId", "==", u.uid),
                        limit(1)
                    );
                    const snapshot = await getDocs(q);
                    if (snapshot.empty) {
                        // Not registered (no commitment), send back to gate
                        router.push('/enter')
                        return
                    }
                } catch (err) {
                    console.error("Access verification failed:", err);
                    // Silently fail or redirect? For now, let's be strict.
                    // But if it's a transient firestore error, we might lock them out.
                    // Given previous 500 issues, let's just log and continue for now
                    // OR redirect if we are sure it's a permission/auth issue.
                }
            }

            setUser(u)
            if (u && u.displayName) {
                setUserName(u.displayName)
            }
            setLoading(false)
        })
        return () => unsub?.()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-t-2 border-amber-500 rounded-full animate-spin mb-6"></div>
                <p className="text-stone-500 text-[10px] uppercase tracking-[0.4em] font-black">Verifying Entrance...</p>
            </div>
        )
    }


    return (
        <div
            ref={containerRef}
            className="relative min-h-screen overflow-hidden transition-colors duration-1000"
            style={{
                background: `radial-gradient(ellipse at 50% 40%, ${activeTheme.colorScheme.background} 0%, transparent 60%), #050505`
            }}
        >
            {/* Eternal Flame Core */}
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-0">
                <div
                    className="w-64 h-64 rounded-full blur-[100px] flame-pulse transition-all duration-1000"
                    style={{
                        background: `radial-gradient(circle, ${activeTheme.colorScheme.primary}80 0%, ${activeTheme.colorScheme.glow}40 50%, transparent 70%)`,
                        transform: `scale(${1 + intensity * 0.003})`,
                        animationDuration: `${Math.max(1, 3 - intensity * 0.02)}s`
                    }}
                />
            </div>



            {/* Burst Animations */}
            {bursts.map((burst) => (
                <div
                    key={burst.id}
                    className="fixed flex flex-col items-center pointer-events-none z-20 animate-burst"
                    style={{
                        left: `${burst.x}%`,
                        bottom: '100px'
                    }}
                >
                    <span className="text-4xl">{burst.emoji}</span>
                    {burst.userName && (
                        <span className="text-[7px] text-stone-400 uppercase tracking-widest mt-1 opacity-60">{burst.userName}</span>
                    )}
                </div>
            ))}

            {/* Header */}
            <header className="relative z-30 flex items-center justify-between px-6 py-6">
                <Link href="/" className="text-[9px] uppercase tracking-[0.4em] text-stone-600 hover:text-amber-500 transition-colors font-bold">
                    ← Return
                </Link>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${mounted && isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-stone-700'}`} />
                        <span className="text-[9px] uppercase tracking-[0.3em] text-stone-500 font-bold">
                            {mounted ? connections : 0} Intercessors
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-20 flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
                <div className="mb-8">
                    <p className="text-[9px] uppercase tracking-[0.5em] font-black mb-4 transition-colors duration-1000" style={{ color: activeTheme.colorScheme.primary }}>{ORGANIZATION}</p>
                    <h1 className="serif text-4xl md:text-6xl text-stone-100 font-light mb-6">The Altar Room</h1>
                    <p className="text-stone-500 text-xs italic max-w-md mx-auto">
                        You are in the presence of the Most High. Pray as the Spirit leads.
                    </p>
                </div>

                {/* Prayer Focus Card */}
                <div
                    className={`max-w-xl w-full p-8 glass rounded-3xl border-stone-800 transition-all duration-1000 ${focusedPoint !== null ? 'scale-105' : ''}`}
                    style={{
                        borderColor: focusedPoint !== null ? `${activeTheme.colorScheme.primary}60` : undefined,
                        boxShadow: focusedPoint !== null ? `0 0 40px ${activeTheme.colorScheme.glow}30` : undefined
                    }}
                >
                    <h3 className="text-[9px] uppercase tracking-[0.4em] font-black mb-6 transition-colors duration-1000" style={{ color: `${activeTheme.colorScheme.primary}B0` }}>Global Burden</h3>
                    <p className="serif text-2xl text-stone-100 mb-3 font-light">{activeTheme.title}</p>
                    <p className="text-[11px] text-stone-500 italic mb-6 border-b border-stone-800 pb-4">{activeTheme.scripture}</p>
                    <ul className="space-y-3 text-left">
                        {activeTheme.points.map((point, i) => (
                            <li
                                key={i}
                                className={`text-sm text-stone-400 font-light flex items-start gap-3 transition-all duration-500 ${focusedPoint === i ? 'scale-105 pl-2' : ''}`}
                                style={{
                                    color: focusedPoint === i ? activeTheme.colorScheme.primary : undefined
                                }}
                            >
                                <span
                                    className="mt-1.5 transition-all"
                                    style={{ color: focusedPoint === i ? activeTheme.colorScheme.primary : `${activeTheme.colorScheme.primary}60` }}
                                >•</span>
                                <span>{point}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Vocal Room Toggle - Under Global Burden */}
                <button
                    onClick={() => setShowVocalRoom(!showVocalRoom)}
                    className={`mt-6 px-6 py-4 glass rounded-2xl border-stone-700 hover:border-amber-500/30 transition-all text-[10px] uppercase tracking-[0.3em] font-bold flex items-center justify-center gap-3 w-full max-w-xl ${showVocalRoom ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' : 'text-stone-400 hover:text-amber-500'}`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    {showVocalRoom ? 'Close Vocal Room' : 'Join Vocal Room'}
                </button>
            </main>

            {/* Reaction Bar */}
            <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center gap-3">
                {/* Spirit-Led Prompting Input */}
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        sendPrompting(promptingText)
                        setPromptingText('')
                    }}
                    className="flex items-center gap-2"
                >
                    <input
                        type="text"
                        value={promptingText}
                        onChange={(e) => setPromptingText(e.target.value)}
                        placeholder="Share a word..."
                        maxLength={100}
                        className="px-4 py-3 glass rounded-full border-stone-700 text-sm text-stone-300 placeholder-stone-600 bg-transparent focus:outline-none focus:border-amber-500/30 w-40 md:w-56 transition-all"
                    />
                    <button
                        type="submit"
                        disabled={promptingText.trim().length === 0}
                        className="px-4 py-3 glass rounded-full border-stone-700 hover:border-amber-500/30 disabled:opacity-30 transition-all text-[9px] uppercase tracking-[0.2em] text-stone-400 font-bold"
                    >
                        Send
                    </button>
                </form>

                {/* Emoji Reactions */}
                <div className="flex items-center gap-3 p-3 glass rounded-full border-stone-800">
                    <button
                        onClick={() => sendBurst('🔥')}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full glass border-stone-700 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all text-xl md:text-2xl active:scale-90"
                        title="Fire"
                    >
                        🔥
                    </button>
                    <button
                        onClick={() => sendBurst('🙏')}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full glass border-stone-700 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all text-xl md:text-2xl active:scale-90"
                        title="Amen"
                    >
                        🙏
                    </button>
                    <button
                        onClick={() => sendBurst('🙌')}
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full glass border-stone-700 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all text-xl md:text-2xl active:scale-90"
                        title="Hallelujah"
                    >
                        🙌
                    </button>
                </div>
            </div>

            {/* Spirit-Led Promptings Display */}
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-3 pointer-events-none max-w-sm px-4">
                {promptings.map((p) => (
                    <div
                        key={p.id}
                        className="px-4 py-2 glass rounded-full border-stone-700 animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                        <p className="text-sm text-stone-300 italic text-center">"{p.text}"</p>
                        {p.userName && (
                            <p className="text-[8px] text-stone-500 uppercase tracking-widest text-center mt-1">- {p.userName}</p>
                        )}
                    </div>
                ))}
            </div>

            {/* Vocal Room Drawer / Minimized Bar */}
            {showVocalRoom && (
                <>
                    {/* Full Drawer */}
                    <div
                        className={`fixed top-0 right-0 h-full w-full md:w-96 z-50 transform transition-transform duration-500 ease-out ${vocalMinimized ? 'translate-x-full' : 'translate-x-0'}`}
                    >
                        <div className="h-full glass border-l border-stone-700 flex flex-col">
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between p-4 border-b border-stone-800">
                                <div>
                                    <h3 className="text-sm text-stone-100 font-bold uppercase tracking-widest">Vocal Room</h3>
                                    <p className="text-[8px] text-stone-500 uppercase tracking-widest">Live Intercession Audio</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setVocalMinimized(true)}
                                        className="p-2 text-stone-500 hover:text-amber-500 transition-colors"
                                        title="Minimize"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setShowVocalRoom(false)}
                                        className="p-2 text-stone-500 hover:text-red-400 transition-colors"
                                        title="Leave Room"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Jitsi Embed */}
                            <div className="flex-1 relative">
                                <iframe
                                    src={PRAYER_ROOM_URL}
                                    allow="camera; microphone; fullscreen; display-capture; autoplay"
                                    className="w-full h-full absolute inset-0"
                                    style={{ border: 'none' }}
                                />
                            </div>

                            {/* Drawer Footer */}
                            <div className="p-4 border-t border-stone-800 text-center">
                                <p className="text-[8px] text-stone-600 uppercase tracking-widest">
                                    Keep mic muted unless leading prayer
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Minimized Floating Bar */}
                    {vocalMinimized && (
                        <div className="fixed top-24 right-6 md:top-8 md:right-12 z-50 animate-in slide-in-from-top duration-500">
                            <div className="flex items-center gap-3 px-4 py-2 glass rounded-full border border-stone-800 hover:border-amber-500/30 transition-all bg-black/60 backdrop-blur-2xl shadow-2xl">
                                <div className="flex items-center gap-2 pr-2 border-r border-stone-800">
                                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-stone-200 font-black">Live Room</span>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setVocalMinimized(false)}
                                        className="p-1.5 text-stone-500 hover:text-amber-500 transition-colors"
                                        title="Expand"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => setShowVocalRoom(false)}
                                        className="p-1.5 text-stone-500 hover:text-red-400 transition-colors"
                                        title="Leave"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Backdrop for drawer on mobile */}
            {showVocalRoom && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 md:hidden animate-in fade-in duration-300"
                    onClick={() => setShowVocalRoom(false)}
                />
            )}

            <style jsx>{`
                @keyframes burst {
                    0% {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                    100% {
                        opacity: 0;
                        transform: translateY(-200px) scale(1.5);
                    }
                }
                .animate-burst {
                    animation: burst 3s ease-out forwards;
                }
            `}</style>
        </div>
    )
}

// Utility
function throttle<T extends (...args: any[]) => void>(fn: T, ms: number): T {
    let lastCall = 0
    return ((...args: any[]) => {
        const now = Date.now()
        if (now - lastCall >= ms) {
            lastCall = now
            fn(...args)
        }
    }) as T
}
