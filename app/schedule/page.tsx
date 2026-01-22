'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HOURS, getCurrentWatch, getSimulatedOccupancy } from '@/lib/constants'
import { useEventTiming } from '@/hooks/useEventTiming'
import { auth, db, isFirebaseAvailable } from '@/lib/firebase'
import { collection, query, onSnapshot, setDoc, doc, serverTimestamp, deleteDoc } from "firebase/firestore"

export default function SchedulePage() {
    const { isStarted } = useEventTiming()
    const currentWatch = getCurrentWatch()
    const [commitments, setCommitments] = useState<Record<string, number>>({})
    const [totalWatchesCovered, setTotalWatchesCovered] = useState(0)
    const [myWatch, setMyWatch] = useState<number | null>(null)
    const [usingSimulation, setUsingSimulation] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [notification, setNotification] = useState<{ message: string, type: 'success' | 'info' | 'error' } | null>(null)
    const router = useRouter()

    const showNotification = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
        setNotification({ message, type })
        setTimeout(() => setNotification(null), 5000)
    }

    useEffect(() => {
        setMounted(true)
        if (isFirebaseAvailable) {
            setUsingSimulation(false)
        }
    }, [])

    useEffect(() => {
        if (!isFirebaseAvailable || !db) {
            setUsingSimulation(true)
            return
        }

        // Fetch all watch commitments (no dayIdx filtering)
        const q = query(collection(db, "watches"))
        const unsub = onSnapshot(q,
            (snapshot) => {
                const counts: Record<string, number> = {}
                const coveredWatches = new Set<number>()
                let userWatch: number | null = null

                snapshot.forEach(d => {
                    const data = d.data()
                    const hourIdx = data.hourIdx as number
                    counts[hourIdx] = (counts[hourIdx] || 0) + 1
                    coveredWatches.add(hourIdx)
                    if (auth?.currentUser && data.userId === auth.currentUser.uid) {
                        userWatch = hourIdx
                    }
                })

                setCommitments(counts)
                setTotalWatchesCovered(coveredWatches.size)
                setMyWatch(userWatch)
                setUsingSimulation(false)
            },
            (error) => {
                console.warn("Firestore access denied. Using simulation.", error)
                setUsingSimulation(true)
            }
        )

        return () => unsub()
    }, [])

    const toggleCommit = async (hourIdx: number) => {
        if (!auth?.currentUser) {
            router.push('/login?redirect=/schedule')
            return
        }

        if (!isFirebaseAvailable || !db) {
            showNotification("Watch recorded locally. Connect to sync.", 'info')
            return
        }

        // Each user can only have one watch
        const commitId = `watch_${auth.currentUser.uid}`
        const docRef = doc(db, "watches", commitId)

        // If already registered for this watch, do nothing
        if (myWatch === hourIdx) return

        try {
            await setDoc(docRef, {
                userId: auth.currentUser.uid,
                userName: auth.currentUser.displayName || "A Watchman",
                hourIdx: hourIdx,
                timestamp: serverTimestamp()
            })

            // Record activity
            const { addDoc } = await import('firebase/firestore')
            await addDoc(collection(db, "activity"), {
                userName: auth.currentUser.displayName || "A Watchman",
                type: "commitment",
                timestamp: serverTimestamp()
            })
            showNotification("Your watch has been recorded in the scrolls.")
        } catch (e) {
            console.error("Commitment failed", e)
            showNotification("Failed to record watch. Please try again.", 'error')
        }
    }

    const getLevel = (count: number) => {
        if (count >= 10) return 'high'
        if (count >= 3) return 'medium'
        return 'low'
    }

    return (
        <div className="relative min-h-screen py-12 px-4 selection:bg-amber-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] aura-glow rounded-full opacity-30" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto animate-in fade-in duration-1000 slide-in-from-bottom-8">
                <div className="text-center mb-16">
                    <h2 className="serif text-4xl text-stone-100 mb-6 font-light tracking-tight">The Watchman&apos;s Grid</h2>

                    {/* Coverage Indicator */}
                    {!usingSimulation && (
                        <div className="mb-8 flex flex-col items-center animate-in fade-in duration-1000">
                            <div className="flex items-center gap-4 mb-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Wall Coverage</span>
                                <span className="text-amber-500 serif text-xl">{totalWatchesCovered}<span className="text-stone-600 text-sm">/24</span></span>
                            </div>
                            <div className="w-48 h-1 bg-stone-900 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-amber-500 transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                    style={{ width: `${(totalWatchesCovered / 24) * 100}%` }}
                                />
                            </div>
                            <p className="mt-4 text-[9px] text-stone-600 uppercase tracking-widest font-bold">
                                {totalWatchesCovered === 24 ? "The Wall is Complete!" : `${24 - totalWatchesCovered} watches still need a watchman.`}
                            </p>
                        </div>
                    )}

                    <p className="text-stone-500 text-sm font-light max-w-sm mx-auto italic tracking-wide">
                        {usingSimulation
                            ? "Syncing with the heavens..."
                            : "Pick your watch. One hour, all 72 hours."}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {HOURS.map((hour, idx) => {
                        const count = usingSimulation ? getSimulatedOccupancy(0, idx) : (commitments[idx] || 0)
                        const isMine = myWatch === idx
                        const isCurrentWatch = isStarted && idx === currentWatch.hourIdx

                        return (
                            <button
                                key={idx}
                                onClick={() => toggleCommit(idx)}
                                className={`group relative p-6 glass rounded-2xl transition-all text-left overflow-hidden border-stone-800
                                ${isCurrentWatch ? 'ring-2 ring-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]' : 'hover:border-stone-700 hover:bg-white/5'} 
                                ${isMine ? 'ring-1 ring-stone-100/20' : ''}`}
                            >
                                {isCurrentWatch && (
                                    <div className="absolute top-0 right-0 p-2">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                                    </div>
                                )}

                                <div>
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-[9px] font-black tracking-[0.2em] text-stone-600 uppercase">Watch {idx + 1}</span>
                                        {count > 0 && (
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-stone-900 border border-white/5">
                                                <span className="text-[8px] text-amber-500 font-black tracking-tighter">{count}</span>
                                                <span className="text-[8px] text-stone-500 lowercase font-medium tracking-tighter">interceding</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-sm font-light text-stone-200 block mb-1">{hour}</span>

                                    <div className="flex items-center justify-between mt-6">
                                        <div className="flex flex-col">
                                            <span className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors
                                                ${isMine ? 'text-stone-100' : count === 0 ? 'text-amber-500/80 animate-pulse' : 'text-stone-600 group-hover:text-amber-500/80'}`}>
                                                {isMine ? 'Your Watch' : count === 0 ? 'Fill this Gap' : 'Join Watch'}
                                            </span>
                                            {count === 0 && !isMine && (
                                                <span className="text-[7px] text-amber-500/40 font-black uppercase tracking-tighter mt-1 animate-pulse">Urgent Coverage Needed</span>
                                            )}
                                        </div>
                                        {isCurrentWatch && (
                                            <span className="text-[8px] text-amber-500/60 font-black uppercase tracking-widest italic">Current</span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Toast Notification */}
            {notification && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="px-8 py-4 glass rounded-2xl border-stone-800 flex items-center gap-4 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.5)] 
                            ${notification.type === 'success' ? 'bg-emerald-500 shadow-emerald-500/50' :
                                notification.type === 'error' ? 'bg-red-500 shadow-red-500/50' : 'bg-amber-500 shadow-amber-500/50'}`}
                        />
                        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-stone-200">
                            {notification.message}
                        </span>
                    </div>
                </div>
            )}
        </div>
    )
}
