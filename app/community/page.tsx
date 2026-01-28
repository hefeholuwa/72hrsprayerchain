'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { auth, db, isFirebaseAvailable } from '@/lib/firebase'
import {
    collection,
    addDoc,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    updateDoc,
    doc,
    arrayUnion,
    limit,
    increment
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'

interface PrayerRequest {
    id: string
    userName: string
    content: string
    amenCount: number
    amenedBy: string[]
    timestamp: any
}

export default function PrayerWall() {
    const [prayers, setPrayers] = useState<PrayerRequest[]>([])
    const [newPrayer, setNewPrayer] = useState('')
    const [posting, setPosting] = useState(false)
    const [user, setUser] = useState<any>(null)
    const router = useRouter()

    useEffect(() => {
        const unsubscribeAuth = auth?.onAuthStateChanged((u) => setUser(u))

        if (!isFirebaseAvailable || !db) return

        const q = query(
            collection(db, "prayers"),
            orderBy("timestamp", "desc"),
            limit(50)
        )

        const unsubscribePrayers = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as PrayerRequest))
            setPrayers(items)
        })

        return () => {
            unsubscribeAuth?.()
            unsubscribePrayers()
        }
    }, [])

    const handlePost = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) {
            router.push('/login?redirect=/community')
            return
        }
        if (!newPrayer.trim() || !db) return

        setPosting(true)
        try {
            await addDoc(collection(db, "prayers"), {
                userId: user.uid,
                userName: user.displayName || "Intercessor",
                content: newPrayer.trim(),
                amenCount: 0,
                amenedBy: [],
                timestamp: serverTimestamp()
            })
            setNewPrayer('')
        } catch (err) {
            console.error("Failed to post prayer", err)
        } finally {
            setPosting(false)
        }
    }

    const handleAmen = async (prayerId: string, amenedBy: string[]) => {
        if (!user) {
            router.push('/login?redirect=/community')
            return
        }
        if (amenedBy.includes(user.uid) || !db) return

        try {
            const prayerRef = doc(db, "prayers", prayerId)
            await updateDoc(prayerRef, {
                amenCount: increment(1),
                amenedBy: arrayUnion(user.uid)
            })
        } catch (err) {
            console.error("Failed to Amen", err)
        }
    }

    return (
        <div className="relative min-h-screen">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[30%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full aura-glow opacity-30" />
                <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3QgZmlsdGVyPSJ1cmwoI2EpIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+PC9zdmc+')]" />
            </div>

            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-stone-500 hover:text-stone-300 transition-colors cursor-pointer"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-xs font-medium hidden sm:inline">Back</span>
                    </Link>

                    <h1 className="font-serif text-lg md:text-xl text-stone-100 font-light">Prayer Wall</h1>

                    <div className="w-16" />
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 pt-24 pb-32 px-4 md:px-8">
                <div className="max-w-2xl mx-auto">

                    {/* Header */}
                    <div className="text-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <p className="text-stone-500 text-sm italic">
                            "Bear one another&apos;s burdens, and so fulfill the law of Christ."
                        </p>
                    </div>

                    {/* Post Box */}
                    <div className="glass-card p-6 md:p-8 rounded-2xl mb-10 relative group animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <form onSubmit={handlePost}>
                            <textarea
                                value={newPrayer}
                                onChange={(e) => setNewPrayer(e.target.value)}
                                placeholder="Share your prayer burden..."
                                className="w-full bg-transparent border-none text-stone-200 placeholder:text-stone-600 text-base font-light focus:outline-none min-h-[100px] resize-none leading-relaxed"
                                maxLength={280}
                            />
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/[0.06]">
                                <span className="text-[10px] text-stone-600 font-medium">
                                    {newPrayer.length}/280
                                </span>
                                <button
                                    type="submit"
                                    disabled={posting || !newPrayer.trim()}
                                    className="px-6 py-2.5 bg-stone-100 text-[#0a0a0f] rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-black/20"
                                >
                                    {posting ? 'Posting...' : 'Share'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Prayer List */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        {prayers.map((prayer, idx) => (
                            <div
                                key={prayer.id}
                                className="glass-card p-5 md:p-6 rounded-xl hover:border-white/[0.12] transition-all"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                {/* Header */}
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                            <span className="text-xs text-amber-500 font-medium">
                                                {prayer.userName?.[0] || 'I'}
                                            </span>
                                        </div>
                                        <span className="text-sm font-medium text-stone-300">
                                            {prayer.userName}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-stone-600">
                                        {prayer.timestamp?.toDate ?
                                            new Date(prayer.timestamp.toDate()).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })
                                            : 'Just now'}
                                    </span>
                                </div>

                                {/* Content */}
                                <p className="text-stone-300 text-sm leading-relaxed mb-5">
                                    {prayer.content}
                                </p>

                                {/* Actions */}
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => handleAmen(prayer.id, prayer.amenedBy)}
                                        disabled={user && prayer.amenedBy.includes(user.uid)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all cursor-pointer
                                            ${user && prayer.amenedBy.includes(user.uid)
                                                ? 'bg-amber-500/10 border border-amber-500/30 text-amber-500'
                                                : 'bg-white/[0.03] border border-white/[0.08] text-stone-500 hover:bg-white/[0.06] hover:text-stone-300'
                                            }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${user && prayer.amenedBy.includes(user.uid)
                                                ? 'bg-amber-500'
                                                : 'bg-stone-600'
                                            }`} />
                                        <span className="text-xs font-medium">
                                            {user && prayer.amenedBy.includes(user.uid) ? 'Amen ✓' : 'Amen'}
                                        </span>
                                    </button>
                                    {prayer.amenCount > 0 && (
                                        <span className="text-[11px] text-stone-600">
                                            {prayer.amenCount} {prayer.amenCount === 1 ? 'person' : 'people'} praying
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {prayers.length === 0 && (
                            <div className="text-center py-16 border border-dashed border-white/[0.08] rounded-2xl">
                                <svg className="w-12 h-12 text-stone-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <p className="text-stone-500 text-sm mb-2">The wall is quiet</p>
                                <p className="text-stone-600 text-xs">Be the first to share a prayer burden</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
