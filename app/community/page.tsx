'use client'

import { useState, useEffect } from 'react'
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
        <div className="relative min-h-screen py-12 px-4 animate-in fade-in duration-700">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="serif text-4xl text-stone-100 mb-4">Prayer Wall</h2>
                    <p className="text-stone-500 text-[10px] uppercase tracking-[0.4em] font-black">Bearing one another&apos;s burdens</p>
                </div>

                {/* Post Box */}
                <div className="glass p-8 rounded-3xl border-stone-800 mb-16 relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/10 to-transparent rounded-3xl blur group-hover:opacity-100 transition duration-1000" />
                    <form onSubmit={handlePost} className="relative z-10">
                        <textarea
                            value={newPrayer}
                            onChange={(e) => setNewPrayer(e.target.value)}
                            placeholder="What is your prayer burden?"
                            className="w-full bg-transparent border-none text-stone-200 placeholder:text-stone-700 text-lg serif focus:outline-none min-h-[120px] resize-none"
                            maxLength={280}
                        />
                        <div className="flex justify-between items-center mt-6 border-t border-white/5 pt-6">
                            <span className="text-[9px] text-stone-600 font-bold uppercase tracking-widest">
                                {newPrayer.length}/280
                            </span>
                            <button
                                type="submit"
                                disabled={posting || !newPrayer.trim()}
                                className="px-8 py-3 bg-stone-100 text-[#050505] rounded-full uppercase text-[9px] font-black tracking-[0.2em] hover:bg-white transition-all disabled:opacity-50 shadow-xl shadow-stone-950/50"
                            >
                                {posting ? 'Posting...' : 'Post Burden'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Prayer List */}
                <div className="space-y-6 pb-24">
                    {prayers.map((prayer) => (
                        <div key={prayer.id} className="p-6 glass rounded-2xl border-stone-800 hover:border-amber-500/20 transition-all group animate-in slide-in-from-bottom-2">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-[0.2em]">
                                    {prayer.userName}
                                </span>
                                <span className="text-[8px] text-stone-600 font-bold uppercase tracking-tighter">
                                    {prayer.timestamp?.toDate ? new Date(prayer.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Pending...'}
                                </span>
                            </div>
                            <p className="text-stone-300 text-[15px] font-light leading-relaxed mb-6 italic">
                                &ldquo;{prayer.content}&rdquo;
                            </p>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleAmen(prayer.id, prayer.amenedBy)}
                                    disabled={user && prayer.amenedBy.includes(user.uid)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all border
                                        ${user && prayer.amenedBy.includes(user.uid)
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                            : 'border-white/5 text-stone-500 hover:border-stone-700 hover:text-stone-300'}`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${user && prayer.amenedBy.includes(user.uid) ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' : 'bg-stone-800'}`}></span>
                                    <span className="text-[9px] font-black uppercase tracking-widest">
                                        {user && prayer.amenedBy.includes(user.uid) ? 'Standing In Amen' : 'Amen'}
                                    </span>
                                </button>
                                {prayer.amenCount > 0 && (
                                    <span className="text-[8px] md:text-[9px] text-stone-600 font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] leading-tight">
                                        {prayer.amenCount} intercessors standing with you
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}

                    {prayers.length === 0 && (
                        <div className="text-center py-24 border border-dashed border-stone-800 rounded-3xl">
                            <p className="text-stone-600 text-[10px] uppercase tracking-[0.4em] font-black">The wall is quiet. Be the first to post.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
