'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DAYS, HOURS, getCurrentWatch, getSimulatedOccupancy } from '@/lib/constants'
import { useEventTiming } from '@/hooks/useEventTiming'
import { auth, db, isFirebaseAvailable } from '@/lib/firebase'
import { collection, query, where, onSnapshot, setDoc, doc, serverTimestamp } from "firebase/firestore"

export default function SchedulePage() {
    const { isStarted } = useEventTiming()
    const currentWatch = getCurrentWatch()
    const [activeDay, setActiveDay] = useState(currentWatch.dayIdx)
    const [commitments, setCommitments] = useState<Record<string, number>>({})
    const [totalOccupied, setTotalOccupied] = useState(0)
    const [myCommitments, setMyCommitments] = useState<string[]>([])
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

        const q = query(collection(db, "commitments"), where("dayIdx", "==", activeDay))
        const unsub = onSnapshot(q,
            (snapshot) => {
                const counts: Record<string, number> = {}
                const mine: string[] = []
                snapshot.forEach(d => {
                    const data = d.data()
                    counts[data.hourIdx] = (counts[data.hourIdx] || 0) + 1
                    if (auth?.currentUser && data.userId === auth.currentUser.uid) {
                        mine.push(data.hourIdx)
                    }
                })
                setCommitments(counts)
                setMyCommitments(mine)
                setUsingSimulation(false)
            },
            (error) => {
                console.warn("Firestore access denied. Using simulation.", error)
                setUsingSimulation(true)
            }
        )

        // Fetch total coverage (all 3 days)
        const totalQ = query(collection(db, "commitments"))
        const unsubTotal = onSnapshot(totalQ, (snapshot) => {
            const occupiedSlots = new Set()
            snapshot.forEach(d => {
                const data = d.data()
                occupiedSlots.add(`${data.dayIdx}_${data.hourIdx}`)
            })
            setTotalOccupied(occupiedSlots.size)
        })

        return () => {
            unsub()
            unsubTotal()
        }
    }, [activeDay])

    const toggleCommit = async (hourIdx: number) => {
        if (!auth?.currentUser) {
            router.push('/login?redirect=/schedule')
            return
        }

        if (!isFirebaseAvailable || !db) {
            showNotification("Watch recorded locally. Connect to sync.", 'info')
            return
        }

        const commitId = `${auth.currentUser.uid}_${activeDay}_${hourIdx}`
        const docRef = doc(db, "commitments", commitId)

        if (myCommitments.includes(hourIdx.toString())) return

        try {
            await setDoc(docRef, {
                userId: auth.currentUser.uid,
                userName: auth.currentUser.displayName || "A Watchman",
                dayIdx: activeDay,
                hourIdx: hourIdx.toString(),
                timestamp: serverTimestamp()
            })
            // 2. Record this in the activity feed
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
                                <span className="text-amber-500 serif text-xl">{totalOccupied}<span className="text-stone-600 text-sm">/72</span></span>
                            </div>
                            <div className="w-48 h-1 bg-stone-900 rounded-full overflow-hidden border border-white/5">
                                <div
                                    className="h-full bg-amber-500 transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                                    style={{ width: `${(totalOccupied / 72) * 100}%` }}
                                />
                            </div>
                            <p className="mt-4 text-[9px] text-stone-600 uppercase tracking-widest font-bold">
                                {totalOccupied === 72 ? "The Wall is Complete!" : `${72 - totalOccupied} watches still need a watchman.`}
                            </p>
                        </div>
                    )}

                    <p className="text-stone-500 text-sm font-light max-w-sm mx-auto italic tracking-wide">
                        {usingSimulation
                            ? "Syncing with the heavens..."
                            : "The registry is live. Your watch is recorded in the scrolls."}
                    </p>
                </div>

                <div className="flex border-b border-white/5 mb-8 md:mb-12 overflow-x-auto no-scrollbar scroll-smooth -mx-4 px-4 md:mx-0 md:px-0">
                    {DAYS.map((day, idx) => (
                        <button
                            key={day}
                            onClick={() => setActiveDay(idx)}
                            className={`flex-1 pb-4 md:pb-6 text-[9px] md:text-[10px] font-black tracking-[0.3em] md:tracking-[0.4em] uppercase transition-all whitespace-nowrap px-6 md:px-8
                            ${activeDay === idx ? 'text-amber-500 border-b-2 border-amber-500' : 'text-stone-600 border-b-2 border-transparent hover:text-stone-400'}`}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {HOURS.map((hour, idx) => {
                        const count = usingSimulation ? getSimulatedOccupancy(activeDay, idx) : (commitments[idx.toString()] || 0)
                        const isMine = myCommitments.includes(idx.toString())
                        const isCurrentWatch = isStarted && activeDay === currentWatch.dayIdx && idx === currentWatch.hourIdx
                        const level = getLevel(count)

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
                                                {isMine ? 'Registered' : count === 0 ? 'Fill this Gap' : 'Register'}
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
