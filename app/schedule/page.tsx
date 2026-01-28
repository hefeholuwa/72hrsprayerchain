'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HOURS, getCurrentWatch, getSimulatedOccupancy, ADMIN_EMAILS } from '@/lib/constants'
import { useEventTiming } from '@/hooks/useEventTiming'
import { auth, db, isFirebaseAvailable } from '@/lib/firebase'
import { collection, query, onSnapshot, setDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore"

export default function SchedulePage() {
    const { isStarted } = useEventTiming()
    const currentWatch = getCurrentWatch()
    const [user, setUser] = useState<any>(null)
    const [commitments, setCommitments] = useState<Record<string, number>>({})
    const [totalWatchesCovered, setTotalWatchesCovered] = useState(0)
    const [myWatches, setMyWatches] = useState<number[]>([])
    const [usingSimulation, setUsingSimulation] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null)
    const router = useRouter()

    const isAdmin = user?.email ? ADMIN_EMAILS.map(e => e.toLowerCase()).includes(user.email.toLowerCase()) : false

    const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 5000)
    }

    useEffect(() => {
        setMounted(true)
        if (isFirebaseAvailable) {
            setUsingSimulation(false)
        }

        const unsub = auth?.onAuthStateChanged(u => {
            setUser(u)
        })
        return () => unsub?.()
    }, [])

    useEffect(() => {
        if (!isFirebaseAvailable || !db) {
            setUsingSimulation(true)
            return
        }

        const q = query(collection(db, "watches"))
        const unsub = onSnapshot(q,
            (snapshot) => {
                const counts: Record<string, number> = {}
                const coveredWatches = new Set<number>()
                const userWatches: number[] = []

                snapshot.forEach(d => {
                    const data = d.data()
                    const hourIdx = data.hourIdx as number
                    counts[hourIdx] = (counts[hourIdx] || 0) + 1
                    coveredWatches.add(hourIdx)
                    if (user && data.userId === user.uid) {
                        userWatches.push(hourIdx)
                    }
                })

                setCommitments(counts)
                setTotalWatchesCovered(coveredWatches.size)
                setMyWatches(userWatches)
                setUsingSimulation(false)
            },
            (error) => {
                console.warn("Firestore access denied. Using simulation.", error)
                setUsingSimulation(true)
            }
        )

        return () => unsub()
    }, [user])

    const toggleCommit = async (hourIdx: number) => {
        if (!user) {
            router.push('/login?redirect=/schedule')
            return
        }

        if (!isFirebaseAvailable || !db) {
            showNotification("Watch recorded locally. Connect to sync.", 'info')
            return
        }

        const count = commitments[hourIdx] || 0
        const isMine = myWatches.includes(hourIdx)

        if (!isAdmin) {
            // Restriction: If user already has a watch, they can't change it or remove it
            if (myWatches.length > 0) {
                if (isMine) {
                    showNotification("You are already posted here. Stand firm in your watch!", 'info')
                } else {
                    showNotification("You have already committed to a watch. Please remain faithful to your post.", 'info')
                }
                return
            }
            // Note: Occupancy and "Wall Full" restrictions removed to allow new watchmen to join freely
        }

        const commitId = isAdmin ? `watch_${user.uid}_${hourIdx}` : `watch_${user.uid}`
        const docRef = doc(db, "watches", commitId)

        if (isAdmin && isMine) {
            try {
                await deleteDoc(docRef)
                showNotification("Watch removed.")
                return
            } catch (e) {
                console.error("Removal failed", e)
                showNotification("Failed to remove watch.", 'error')
                return
            }
        }

        try {
            await setDoc(docRef, {
                userId: user.uid,
                userName: user.displayName || "A Watchman",
                hourIdx: hourIdx,
                timestamp: serverTimestamp()
            })

            const { addDoc } = await import('firebase/firestore')
            await addDoc(collection(db, "activity"), {
                userName: user.displayName || "A Watchman",
                type: "commitment",
                timestamp: serverTimestamp()
            })
            showNotification("Your watch has been recorded in the scrolls.")
        } catch (e) {
            console.error("Commitment failed", e)
            showNotification("Failed to record watch. Please try again.", 'error')
        }
    }

    return (
        <div className="relative min-h-screen">
            {/* === AMBIENT BACKGROUND === */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] rounded-full aura-glow opacity-40" />
                <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-[#0a0a0f] to-transparent" />
                <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3QgZmlsdGVyPSJ1cmwoI2EpIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+PC9zdmc+')]" />
            </div>

            {/* === FIXED HEADER === */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-5xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-xs font-medium hidden sm:inline">Back</span>
                    </Link>

                    <h1 className="font-serif text-lg md:text-xl text-stone-100 font-light">The Watchman&apos;s Grid</h1>

                    {isAdmin && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                            <span className="text-[10px] uppercase tracking-wider font-bold text-amber-500">Admin</span>
                        </div>
                    )}
                    {!isAdmin && <div className="w-20" />}
                </div>
            </header>

            {/* === MAIN CONTENT === */}
            <main className="relative z-10 pt-24 pb-32 px-4 md:px-8">
                <div className="max-w-5xl mx-auto">

                    {/* Coverage Stats */}
                    {!usingSimulation && (
                        <div className="mb-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="glass-card rounded-2xl px-8 py-6 w-full max-w-md">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-stone-500">Wall Coverage</span>
                                    <span className="font-serif text-2xl text-amber-500">
                                        {totalWatchesCovered}<span className="text-stone-600 text-lg">/24</span>
                                    </span>
                                </div>
                                <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.06]">
                                    <div
                                        className="h-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-400 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.4)] transition-all duration-1000"
                                        style={{ width: `${(totalWatchesCovered / 24) * 100}%` }}
                                    />
                                </div>
                                <p className="mt-4 text-xs text-stone-500 text-center leading-relaxed">
                                    {totalWatchesCovered === 24
                                        ? "The Wall is Complete! All slots are now locked."
                                        : `${24 - totalWatchesCovered} gaps remaining — help complete the wall.`}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {usingSimulation && (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/[0.03] border border-white/[0.06]">
                                <div className="w-4 h-4 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                                <span className="text-sm text-stone-500">Syncing with the heavens...</span>
                            </div>
                        </div>
                    )}

                    {/* Schedule Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {HOURS.map((hour, idx) => {
                            const count = usingSimulation ? getSimulatedOccupancy(0, idx) : (commitments[idx] || 0)
                            const isMine = myWatches.includes(idx)
                            const isCurrentWatch = isStarted && idx === currentWatch.hourIdx
                            const isWallFull = totalWatchesCovered === 24
                            // Only lock if user already has a DIFFERENT watch. 
                            // If they have NO watch, all are open.
                            const isLocked = !isAdmin && (myWatches.length > 0 && !isMine)
                            const isEmpty = count === 0

                            return (
                                <button
                                    key={idx}
                                    disabled={isLocked && !isAdmin}
                                    onClick={() => toggleCommit(idx)}
                                    className={`group relative p-5 md:p-6 rounded-2xl transition-all text-left overflow-hidden cursor-pointer
                                        ${isCurrentWatch
                                            ? 'ring-2 ring-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.15)]'
                                            : ''
                                        }
                                        ${isMine
                                            ? 'bg-amber-500/10 border-amber-500/30 border'
                                            : 'glass-card hover:border-white/[0.12]'
                                        }
                                        ${isLocked && !isAdmin
                                            ? 'opacity-50 cursor-not-allowed'
                                            : ''
                                        }
                                        ${isEmpty && !isMine
                                            ? 'border-amber-500/20 hover:border-amber-500/40'
                                            : ''
                                        }
                                    `}
                                >
                                    {/* Current watch indicator */}
                                    {isCurrentWatch && (
                                        <div className="absolute top-3 right-3">
                                            <span className="flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                            </span>
                                        </div>
                                    )}

                                    {/* Watch header */}
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-bold tracking-[0.2em] text-stone-600 uppercase">
                                            Watch {idx + 1}
                                        </span>
                                        {count > 0 && (
                                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.05] border border-white/[0.08]">
                                                <span className="text-[10px] text-amber-500 font-bold">{count}</span>
                                                <span className="text-[9px] text-stone-500">praying</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Time */}
                                    <span className="text-base md:text-lg font-light text-stone-200 block mb-4">
                                        {hour}
                                    </span>

                                    {/* Status */}
                                    <div className="flex items-center justify-between">
                                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] transition-colors
                                            ${isMine
                                                ? 'text-amber-500'
                                                : isEmpty
                                                    ? 'text-amber-500/80'
                                                    : isLocked
                                                        ? 'text-stone-700'
                                                        : 'text-stone-500 group-hover:text-amber-500/80'
                                            }`}
                                        >
                                            {isMine
                                                ? '✓ Your Watch'
                                                : isEmpty
                                                    ? 'Fill this Gap'
                                                    : isLocked
                                                        ? 'Occupied'
                                                        : 'Join Watch'
                                            }
                                        </span>

                                        {isCurrentWatch && (
                                            <span className="text-[9px] text-amber-500/60 font-bold uppercase tracking-wider">
                                                Now
                                            </span>
                                        )}

                                        {isLocked && !isAdmin && (
                                            <svg className="w-4 h-4 text-stone-700" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Urgent badge */}
                                    {isEmpty && !isMine && (
                                        <div className="mt-3 flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-amber-500 animate-pulse" />
                                            <span className="text-[9px] text-amber-500/50 font-medium uppercase tracking-wide">
                                                Needs Coverage
                                            </span>
                                        </div>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            </main>

            {/* === TOAST NOTIFICATION === */}
            {notification && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="px-6 py-4 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/[0.1] flex items-center gap-4 shadow-2xl">
                        <div className={`w-2 h-2 rounded-full shrink-0
                            ${notification.type === 'success' ? 'bg-emerald-500' :
                                notification.type === 'error' ? 'bg-red-500' : 'bg-amber-500'}`}
                        />
                        <span className="text-sm text-stone-200">
                            {notification.message}
                        </span>
                        <button
                            onClick={() => setNotification(null)}
                            className="p-1 text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
