'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ORGANIZATION, TAGLINE, getCurrentWatch, DAYS, getEventProgress } from '@/lib/constants'
import { auth, db, isFirebaseAvailable, onAuthStateChanged, signOut } from '@/lib/firebase'
import { doc, getDoc, collection, getDocs, query, where, limit, onSnapshot, updateDoc, setDoc, serverTimestamp } from "firebase/firestore"
import GlobalHeatmap from '@/components/GlobalHeatmap'
import CountdownTimer from '@/components/CountdownTimer'
import { useEventTiming } from '@/hooks/useEventTiming'
import { usePrayerTheme } from '@/hooks/usePrayerTheme'


export default function LandingPage() {
    const router = useRouter()

    // Dynamic Timing Hook
    const {
        isStarted,
        isEnded,
        progress: timingProgress,
        countdownString,
        currentWatch: dynamicWatch,
        startDate
    } = useEventTiming()

    const [user, setUser] = useState<any>(null)
    const [watchmanName, setWatchmanName] = useState("")
    const [userLocation, setUserLocation] = useState("")
    const [authError, setAuthError] = useState(false)

    // Dynamic Prayer Theme
    const { activeTheme: currentTheme } = usePrayerTheme()

    // Use dynamic progress if available, otherwise 0
    const progress = isStarted ? timingProgress : 0

    const [stats, setStats] = useState({ intercessors: 0, countries: 0 })
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [onlineUids, setOnlineUids] = useState<string[]>([])

    useEffect(() => {
        if (!db) return

        // Real-time Users & Stats
        const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
            const users = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setAllUsers(users)

            const locations = users.map((u: any) => u.location || u.country).filter(Boolean)
            const uniqueCountries = new Set(locations.map((loc: string) => loc.split(',').pop()?.trim())).size

            setStats({
                intercessors: users.length || 0,
                countries: uniqueCountries || 0
            })
        })

        // Real-time Online Sessions
        const unsubOnline = onSnapshot(collection(db, "active_sessions"), (snap) => {
            const active = snap.docs
                .map(d => d.data())
                .filter(s => {
                    const expiry = typeof s.expiry === 'object' && s.expiry?.toMillis ? s.expiry.toMillis() : s.expiry
                    return expiry > Date.now()
                })
                .map(s => s.userId)
            setOnlineUids(active)
        })

        return () => {
            unsubUsers()
            unsubOnline()
        }
    }, [])

    useEffect(() => {
        if (!isFirebaseAvailable || !auth) {
            setAuthError(true)
            return
        }

        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u)
                if (db) {
                    try {
                        const docRef = doc(db, "users", u.uid)
                        const docSnap = await getDoc(docRef)
                        if (docSnap.exists()) {
                            const data = docSnap.data()
                            setWatchmanName(data.name)
                            setUserLocation(data.location || "")

                            // Repair missing email for legacy users
                            if (!data.email && u.email) {
                                updateDoc(docRef, { email: u.email }).catch(err => console.warn("Email repair failed", err))
                            }
                        } else {
                            // Auth user exists but no Firestore doc -> Full Repair/Migration
                            try {
                                // 1. Attempt legacy migration if they came from 'watchmen' collection
                                const legacyRef = doc(db, "watchmen", u.uid)
                                const legacySnap = await getDoc(legacyRef)

                                const name = legacySnap.exists() ? legacySnap.data().name : (u.displayName || "Watchman")
                                const location = legacySnap.exists() ? (legacySnap.data().location || "") : ""

                                // 2. Create the missing 'users' document
                                await setDoc(docRef, {
                                    uid: u.uid,
                                    name: name,
                                    email: u.email,
                                    location: location,
                                    createdAt: serverTimestamp(),
                                    lastLogin: serverTimestamp()
                                })
                                setWatchmanName(name)
                                setUserLocation(location)
                            } catch (repairErr) {
                                console.warn("User auto-repair failed", repairErr)
                            }
                        }
                    } catch (docErr) {
                        console.warn("Could not fetch user data.", docErr)
                    }
                }
            } else {
                setUser(null)
                setWatchmanName("")
                setUserLocation("")
            }
        })
        return unsub
    }, [])

    const handleLogout = async () => {
        if (auth) {
            await signOut(auth)
            router.push('/login')
        }
    }

    return (
        <div className="relative min-h-screen selection:bg-amber-500/30">
            {/* Eternal Flame Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] aura-glow rounded-full" />
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-96 bg-amber-600/20 blur-[120px] flame-pulse" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-8 md:py-24 animate-in fade-in duration-1000 slide-in-from-bottom-8">
                {/* Header branding */}
                <div className="flex justify-between items-center mb-12 md:mb-24">
                    <div className="flex flex-col">
                        <span className="text-[10px] tracking-[0.5em] text-stone-500 uppercase font-black mb-2">
                            {ORGANIZATION}
                        </span>
                        <div className="h-px w-10 bg-amber-600/30" />
                    </div>
                </div>

                {/* Progress Pulse (Only show if started) */}
                {isStarted && (
                    <div className="mb-12 md:mb-16">
                        <div className="flex justify-between items-end mb-4">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-amber-500/60 uppercase tracking-[0.3em] mb-1">72H Progress</span>
                                <span className="serif text-lg md:text-xl text-stone-100 font-light">{progress}% Completed</span>
                            </div>
                            <span className="text-[9px] md:text-[10px] text-stone-500 font-bold tracking-widest uppercase">Hour {Math.floor((progress / 100) * 72)} of 72</span>
                        </div>
                        <div className="h-1.5 w-full bg-stone-900/50 rounded-full overflow-hidden border border-white/5 p-[1px]">
                            <div
                                className="h-full bg-gradient-to-r from-amber-900 via-amber-600 to-amber-400 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all duration-1000 ease-out"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Hero Title */}
                <div className="mb-16 md:mb-24 relative">
                    <h2 className="serif text-5xl md:text-8xl text-stone-100 leading-[1.1] md:leading-[1] mb-6 md:mb-8 tracking-tighter">
                        72 Hours <br />
                        <span className="italic text-amber-500 font-light drop-shadow-2xl opacity-90">Prayer Chain.</span>
                    </h2>
                    <p className="text-stone-500 text-xs md:text-lg font-light tracking-wide max-w-lg leading-relaxed italic">
                        A continuous global vigil of intercession, worship, and spiritual warfare.
                    </p>
                </div>

                {/* User Identity (Glass Card) */}
                <div className="mb-12">
                    {!user ? (
                        <div className="p-8 glass rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 border-amber-900/20">
                            <div className="text-center md:text-left">
                                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-2">Join the Registry</h4>
                                <p className="text-xs text-stone-400">Secure your hour on the Watchman&apos;s Wall.</p>
                            </div>
                            <div className="flex gap-4">
                                <Link href="/login" className="px-6 py-3 text-[10px] font-bold text-stone-100 uppercase border border-white/10 hover:bg-white/5 transition-all rounded-full">Log In</Link>
                                <Link href="/signup" className="px-6 py-3 text-[10px] font-bold text-[#050505] uppercase bg-amber-500 hover:bg-amber-400 transition-all rounded-full shadow-lg shadow-amber-900/20">Register</Link>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 glass rounded-xl flex items-center justify-between border-stone-800">
                            <div className="flex flex-col">
                                <span className="text-[8px] uppercase tracking-[0.3em] text-stone-500 mb-1 font-bold">Watchman Profile</span>
                                <div className="flex items-center gap-2">
                                    <Link href="/profile" className="text-sm font-medium text-stone-200 hover:text-amber-500 transition-colors">
                                        {watchmanName || user.email?.split('@')[0] || 'Intercessor'}
                                        {userLocation && <span className="ml-1 text-stone-500 text-[10px] font-light">({userLocation})</span>}
                                    </Link>
                                    <span className="w-1 h-1 rounded-full bg-stone-700" />
                                    <button onClick={handleLogout} className="text-[9px] text-stone-500 hover:text-amber-500 uppercase tracking-widest transition-colors font-bold">Logout</button>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full glass border-white/5 flex items-center justify-center shadow-inner">
                                <svg className="w-5 h-5 text-stone-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg>
                            </div>
                        </div>
                    )}
                </div>

                {/* Primary Action Card (The Altar Entrance) */}
                {!isStarted ? (
                    <div className="mb-16">
                        <div className="relative p-10 glass rounded-3xl overflow-hidden border-stone-800 flex flex-col items-center justify-center min-h-[300px]">
                            <CountdownTimer targetDate={startDate} />
                            <div className="mt-8 text-center max-w-lg mx-auto">
                                <p className="text-stone-500 text-xs italic">
                                    Prepare your heart. The Fire falls on <span className="text-amber-500 font-bold">{startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mb-16 group relative">
                        <div className="absolute -inset-1 bg-gradient-to-r from-amber-600 to-amber-900 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                        <div className="relative p-10 glass rounded-3xl overflow-hidden border-stone-800">
                            <div className="absolute top-0 right-0 p-8 text-amber-500/10">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg>
                            </div>

                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-6">Active Watch</h3>
                                <div className="mb-10">
                                    <p className="serif text-4xl text-stone-100 mb-2 font-light">
                                        {DAYS[dynamicWatch.dayIdx]} <span className="text-stone-700 mx-3 font-thin">|</span> {dynamicWatch.hourLabel}
                                    </p>
                                    <p className="text-stone-500 text-xs font-light italic tracking-wide">&quot;Could you not keep watch with me for one hour?&quot;</p>
                                </div>

                                <Link
                                    href="/enter"
                                    className="inline-flex items-center gap-4 text-[11px] font-black text-amber-500 hover:text-amber-400 uppercase tracking-[0.3em] transition-all group/link"
                                >
                                    <span className="relative">
                                        Enter the Presence
                                        <div className="absolute -bottom-1 left-0 w-0 h-px bg-amber-500 group-hover/link:w-full transition-all duration-500" />
                                    </span>
                                    <svg className="w-5 h-5 transform group-hover/link:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                </Link>
                            </div>
                        </div>
                    </div>
                )}

                {/* Global Prayer Focus */}
                <div className="mb-20 border-l border-amber-500/20 pl-8 relative">
                    <div className="absolute left-[-1px] top-0 h-12 w-px bg-gradient-to-b from-amber-500 to-transparent" />
                    <h4 className="text-[9px] font-black text-amber-500 uppercase tracking-[0.5em] mb-6 opacity-80">Global Burden</h4>
                    <p className="serif text-2xl md:text-3xl text-stone-100 mb-3 font-light leading-snug">{currentTheme.title}</p>
                    <p className="text-[11px] text-stone-500 italic mb-8 tracking-wide font-light border-b border-stone-800 pb-4">{currentTheme.scripture}</p>
                    <ul className="space-y-4">
                        {currentTheme.points.map((p, i) => (
                            <li key={i} className="text-[13px] text-stone-400 font-light flex items-start gap-4 group">
                                <span className="text-amber-500/50 mt-1 transition-transform group-hover:scale-150">•</span>
                                <span className="group-hover:text-stone-200 transition-colors">{p}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Secondary Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Link
                        href="/enter"
                        className={`flex items-center justify-center font-black py-5 px-8 rounded-2xl tracking-[0.3em] uppercase text-[10px] transition-all shadow-2xl 
                        ${isStarted
                                ? "bg-stone-100 hover:bg-white text-[#050505] shadow-stone-900/50"
                                : "glass text-stone-500 border-white/5 opacity-50"}`}
                    >
                        {isStarted ? "Enter Altar Room" : "Altar Room (Coming Soon)"}
                    </Link>
                    <Link
                        href="/schedule"
                        className="flex items-center justify-center glass hover:bg-white/5 text-stone-300 font-bold py-5 px-8 rounded-2xl tracking-[0.2em] uppercase text-[9px] transition-all"
                    >
                        Registry & Schedule
                    </Link>
                </div>

                {/* Movement Impact Stats */}
                <div className="mt-24 grid grid-cols-2 gap-4">
                    <div className="p-8 glass rounded-3xl border-stone-800 text-center group hover:border-amber-500/20 transition-all">
                        <h5 className="text-[9px] font-black text-stone-500 uppercase tracking-[0.4em] mb-4">Watchmen Joined</h5>
                        <p className="serif text-4xl text-stone-100 font-light group-hover:text-amber-500 transition-colors">{stats.intercessors}</p>
                    </div>
                    <div className="p-8 glass rounded-3xl border-stone-800 text-center group hover:border-amber-500/20 transition-all">
                        <h5 className="text-[9px] font-black text-stone-500 uppercase tracking-[0.4em] mb-4">Nations Reached</h5>
                        <p className="serif text-4xl text-stone-100 font-light group-hover:text-amber-500 transition-colors">{stats.countries}</p>
                    </div>
                </div>

                {/* Global Pulse Heatmap */}
                <div className="mt-24">
                    <GlobalHeatmap users={allUsers} onlineUids={onlineUids} />
                </div>

                {/* Footer Quote */}
                <div className="mt-24 text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <div className="h-px w-10 bg-stone-800" />
                        <div className="w-1.5 h-1.5 bg-amber-500/20 rounded-full" />
                        <div className="h-px w-10 bg-stone-800" />
                    </div>
                    <p className="text-stone-500 text-[10px] tracking-[0.4em] uppercase font-light italic">
                        {TAGLINE}
                    </p>
                </div>
            </div>
        </div>
    )
}
