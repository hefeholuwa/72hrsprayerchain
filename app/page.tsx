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

    const { activeTheme: currentTheme } = usePrayerTheme()
    const progress = isStarted ? timingProgress : 0

    const [stats, setStats] = useState({ intercessors: 0, countries: 0 })
    const [allUsers, setAllUsers] = useState<any[]>([])
    const [onlineUids, setOnlineUids] = useState<string[]>([])

    useEffect(() => {
        if (!db) return

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

                            if (!data.email && u.email) {
                                updateDoc(docRef, { email: u.email }).catch(err => console.warn("Email repair failed", err))
                            }
                        } else {
                            try {
                                const legacyRef = doc(db, "watchmen", u.uid)
                                const legacySnap = await getDoc(legacyRef)

                                const name = legacySnap.exists() ? legacySnap.data().name : (u.displayName || "Watchman")
                                const location = legacySnap.exists() ? (legacySnap.data().location || "") : ""

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
        <div className="relative min-h-screen">
            {/* === LAYERED AMBIENT BACKGROUND === */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                {/* Primary flame glow */}
                <div className="absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[1000px] md:h-[1000px] rounded-full aura-glow opacity-60" />
                {/* Vertical flame pillar */}
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 md:w-48 h-[500px] bg-gradient-to-t from-transparent via-amber-600/15 to-transparent blur-[100px] flame-pulse" />
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-[300px] bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />
                {/* Noise texture */}
                <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3QgZmlsdGVyPSJ1cmwoI2EpIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+PC9zdmc+')]" />
            </div>

            {/* === FLOATING HEADER === */}
            <header className="fixed top-0 left-0 right-0 z-50">
                <div className="mx-4 md:mx-8 mt-4 md:mt-6">
                    <div className="max-w-5xl mx-auto px-4 md:px-6 py-3 md:py-4 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/[0.06]">
                        <div className="flex items-center justify-between">
                            {/* Brand */}
                            <Link href="/" className="flex items-center gap-3 group">
                                <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30">
                                    <svg className="w-4 h-4 md:w-5 md:h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                                    </svg>
                                </div>
                                <span className="text-[10px] md:text-xs tracking-[0.3em] text-stone-400 uppercase font-bold hidden lg:block group-hover:text-stone-200 transition-colors">
                                    {ORGANIZATION}
                                </span>
                            </Link>

                            {/* Navigation - Desktop */}
                            <nav className="hidden md:flex items-center gap-8">
                                <Link href="/schedule" className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-200 transition-colors">
                                    Schedule
                                </Link>
                                <Link href="/community" className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-200 transition-colors">
                                    Community
                                </Link>
                                <Link href="/rules" className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-500 hover:text-stone-200 transition-colors">
                                    Rules
                                </Link>
                            </nav>

                            {/* User / Auth */}
                            {!user ? (
                                <div className="flex items-center gap-2 md:gap-3">
                                    <Link
                                        href="/login"
                                        className="px-4 py-2 md:px-5 md:py-2.5 text-[10px] md:text-xs font-medium text-stone-300 hover:text-white transition-colors cursor-pointer"
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        href="/signup"
                                        className="px-4 py-2 md:px-5 md:py-2.5 text-[10px] md:text-xs font-bold text-[#0a0a0f] uppercase bg-amber-500 hover:bg-amber-400 rounded-xl transition-all shadow-lg shadow-amber-900/20 cursor-pointer"
                                    >
                                        Register
                                    </Link>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/profile"
                                        className="flex items-center gap-2 md:gap-3 px-3 py-2 rounded-xl hover:bg-white/[0.05] transition-all cursor-pointer"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                                            <svg className="w-4 h-4 text-stone-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                                            </svg>
                                        </div>
                                        <div className="hidden md:flex flex-col">
                                            <span className="text-xs font-medium text-stone-200">
                                                {watchmanName || user.email?.split('@')[0]}
                                            </span>
                                            {userLocation && (
                                                <span className="text-[10px] text-stone-500">{userLocation}</span>
                                            )}
                                        </div>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="p-2 text-stone-500 hover:text-red-400 transition-colors cursor-pointer"
                                        title="Logout"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Navigation - Mobile */}
                        <nav className="flex md:hidden items-center justify-center gap-6 mt-3 pt-3 border-t border-white/[0.06]">
                            <Link href="/schedule" className="text-[9px] font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-stone-200 transition-colors">
                                Schedule
                            </Link>
                            <Link href="/community" className="text-[9px] font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-stone-200 transition-colors">
                                Community
                            </Link>
                            <Link href="/rules" className="text-[9px] font-bold uppercase tracking-[0.15em] text-stone-500 hover:text-stone-200 transition-colors">
                                Rules
                            </Link>
                        </nav>
                    </div>
                </div>
            </header>

            {/* === MAIN CONTENT === */}
            <main className="relative z-10 pt-40 md:pt-40 pb-16 px-4 md:px-8">
                <div className="max-w-5xl mx-auto">

                    {/* Progress Bar (When Started) */}
                    {isStarted && (
                        <div className="mb-12 md:mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <span className="text-[10px] font-bold text-amber-500/70 uppercase tracking-[0.3em] block mb-1">72H Progress</span>
                                    <div className="flex items-baseline gap-3">
                                        <span className="font-serif text-2xl md:text-3xl text-stone-100 font-light">{progress}%</span>
                                        <div className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                                            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">Hour {dynamicWatch.totalHoursElapsed + 1} of 72</span>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-[10px] text-stone-500 font-medium tracking-wide">
                                    {(72 - dynamicWatch.totalHoursElapsed)} Hours Remaining
                                </span>
                            </div>
                            <div className="h-2 w-full bg-white/[0.03] rounded-full overflow-hidden border border-white/[0.06]">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-700 via-amber-500 to-amber-400 rounded-full shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all duration-1000 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Hero Section */}
                    <div className="mb-16 md:mb-24 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                        <h1 className="font-serif text-5xl sm:text-6xl md:text-8xl lg:text-9xl text-stone-100 leading-[0.95] mb-6 md:mb-8 tracking-tight">
                            72 Hours<br />
                            <span className="italic text-amber-500 font-light">Prayer Chain.</span>
                        </h1>
                        <p className="text-stone-500 text-sm md:text-lg font-light tracking-wide max-w-xl leading-relaxed">
                            A continuous global wave of intercession, worship, and spiritual warfare.
                        </p>
                    </div>

                    {/* Primary Action Card */}
                    {!isStarted ? (
                        <div className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            <div className="glass-card rounded-3xl p-8 md:p-12 flex flex-col items-center justify-center min-h-[280px] md:min-h-[320px]">
                                <CountdownTimer targetDate={startDate} />
                                <div className="mt-8 text-center max-w-md">
                                    <p className="text-stone-500 text-sm italic">
                                        Prepare your heart. The Fire falls on{' '}
                                        <span className="text-amber-500 font-semibold">
                                            {startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                                        </span>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="mb-16 group relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                            {/* Glow effect */}
                            <div className="absolute -inset-1 bg-gradient-to-r from-amber-600/30 to-amber-900/30 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />

                            <div className="relative glass-card rounded-3xl p-8 md:p-12 overflow-hidden">
                                {/* Background icon */}
                                <div className="absolute top-6 right-6 text-amber-500/5">
                                    <svg className="w-32 h-32 md:w-40 md:h-40" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                                    </svg>
                                </div>

                                <div className="relative z-10">
                                    <span className="text-[10px] md:text-xs font-bold text-amber-500 uppercase tracking-[0.4em] block mb-6">
                                        Active Watch
                                    </span>

                                    <div className="mb-10">
                                        <p className="font-serif text-3xl md:text-4xl lg:text-5xl text-stone-100 mb-3 font-light">
                                            {DAYS[dynamicWatch.dayIdx]}
                                            <span className="text-stone-700 mx-3 md:mx-4 font-thin">|</span>
                                            {dynamicWatch.hourLabel}
                                        </p>
                                        <p className="text-stone-500 text-sm font-light italic">
                                            "Could you not keep watch with me for one hour?"
                                        </p>
                                    </div>

                                    <Link
                                        href="/enter"
                                        className="inline-flex items-center gap-3 text-xs md:text-sm font-bold text-amber-500 hover:text-amber-400 uppercase tracking-[0.2em] transition-all group/link cursor-pointer"
                                    >
                                        <span className="relative">
                                            Enter the Presence
                                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-amber-500 group-hover/link:w-full transition-all duration-300" />
                                        </span>
                                        <svg className="w-5 h-5 transform group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                        </svg>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Global Prayer Focus */}
                    <div className="mb-16 md:mb-20 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
                        <div className="relative pl-6 md:pl-8 border-l-2 border-amber-500/20">
                            <div className="absolute left-[-1px] top-0 h-16 w-0.5 bg-gradient-to-b from-amber-500 to-transparent" />

                            <span className="text-[10px] font-bold text-amber-500/80 uppercase tracking-[0.4em] block mb-5">
                                Global Burden
                            </span>

                            <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl text-stone-100 mb-4 font-light leading-snug">
                                {currentTheme.title}
                            </h2>

                            <p className="text-sm text-stone-500 italic mb-8 pb-6 border-b border-white/[0.06] max-w-xl">
                                {currentTheme.scripture}
                            </p>

                            <ul className="space-y-4 max-w-xl">
                                {currentTheme.points.map((point, i) => (
                                    <li key={i} className="flex items-start gap-4 group">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/40 mt-2 shrink-0 group-hover:bg-amber-500 transition-colors" />
                                        <span className="text-sm md:text-base text-stone-400 font-light leading-relaxed group-hover:text-stone-300 transition-colors">
                                            {point}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-20 animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-400">
                        <Link
                            href="/enter"
                            className="flex items-center justify-center gap-2 font-bold py-4 md:py-5 px-6 md:px-8 rounded-2xl tracking-[0.2em] uppercase text-[11px] md:text-xs transition-all bg-stone-100 hover:bg-white text-[#0a0a0f] shadow-xl shadow-black/30 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                            </svg>
                            Enter Altar Room
                        </Link>
                        <Link
                            href="/schedule"
                            className="flex items-center justify-center gap-2 glass-button font-bold py-4 md:py-5 px-6 md:px-8 rounded-2xl tracking-[0.2em] uppercase text-[11px] md:text-xs text-stone-300 hover:text-white cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            View Schedule
                        </Link>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 md:gap-4 mb-16 animate-in fade-in slide-in-from-bottom-14 duration-1000 delay-500">
                        <div className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 text-center group hover:border-amber-500/20 transition-all cursor-default">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.3em] block mb-3">
                                Watchmen Joined
                            </span>
                            <p className="font-serif text-3xl md:text-5xl text-stone-100 font-light group-hover:text-amber-500 transition-colors">
                                {stats.intercessors}
                            </p>
                        </div>
                        <div className="glass-card rounded-2xl md:rounded-3xl p-6 md:p-8 text-center group hover:border-amber-500/20 transition-all cursor-default">
                            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.3em] block mb-3">
                                Nations Reached
                            </span>
                            <p className="font-serif text-3xl md:text-5xl text-stone-100 font-light group-hover:text-amber-500 transition-colors">
                                {stats.countries}
                            </p>
                        </div>
                    </div>

                    {/* Global Heatmap */}
                    <div className="mb-16">
                        <GlobalHeatmap users={allUsers} onlineUids={onlineUids} />
                    </div>

                    {/* Footer */}
                    <footer className="text-center pt-8 border-t border-white/[0.04]">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <div className="h-px w-12 bg-gradient-to-r from-transparent to-stone-800" />
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
                            <div className="h-px w-12 bg-gradient-to-l from-transparent to-stone-800" />
                        </div>
                        <p className="text-stone-600 text-[10px] tracking-[0.4em] uppercase font-light">
                            {TAGLINE}
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    )
}
