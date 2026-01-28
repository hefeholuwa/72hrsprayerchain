'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, db, signOut, isFirebaseAvailable } from '@/lib/firebase'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { HOURS } from '@/lib/constants'

export default function ProfilePage() {
    const [userData, setUserData] = useState<any>(null)
    const [myWatch, setMyWatch] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(false)
    const [newName, setNewName] = useState('')
    const [newLocation, setNewLocation] = useState('')
    const [saving, setSaving] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const fetchProfile = async () => {
            if (!auth?.currentUser || !db) {
                if (!auth?.currentUser && !loading) router.push('/login')
                return
            }

            try {
                const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid))
                if (userSnap.exists()) {
                    const data = userSnap.data()
                    setUserData(data)
                    setNewName(data.name || '')
                    setNewLocation(data.location || '')
                }

                const watchDocId = `watch_${auth.currentUser.uid}`
                const watchSnap = await getDoc(doc(db, "watches", watchDocId))
                if (watchSnap.exists()) {
                    setMyWatch(watchSnap.data())
                } else {
                    setMyWatch(null)
                }

            } catch (err) {
                console.error("Profile fetch error:", err)
            } finally {
                setLoading(false)
            }
        }

        const unsub = auth?.onAuthStateChanged((user) => {
            if (user) {
                fetchProfile()
            } else {
                router.push('/login')
            }
        })

        return () => unsub?.()
    }, [router])

    const handleUpdate = async () => {
        if (!auth?.currentUser || !db) return
        setSaving(true)
        try {
            await setDoc(doc(db, "users", auth.currentUser.uid), {
                name: newName,
                location: newLocation,
                email: auth.currentUser.email
            }, { merge: true })
            setUserData({ ...userData, name: newName, location: newLocation })
            setEditing(false)
        } catch (err) {
            console.error("Update failed:", err)
        } finally {
            setSaving(false)
        }
    }

    const handleSignOut = async () => {
        if (auth) {
            await signOut(auth)
            router.push('/')
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
            </div>
        )
    }

    return (
        <div className="relative min-h-screen">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full aura-glow opacity-30" />
                <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3QgZmlsdGVyPSJ1cmwoI2EpIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+PC9zdmc+')]" />
            </div>

            {/* Fixed Header */}
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

                    <h1 className="font-serif text-lg md:text-xl text-stone-100 font-light">Profile</h1>

                    <div className="w-16" />
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 pt-24 pb-16 px-4 md:px-8">
                <div className="max-w-4xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Identity Card */}
                        <div className="lg:col-span-1">
                            <div className="glass-card p-6 md:p-8 rounded-2xl text-center">
                                {/* Avatar */}
                                <div className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-5 rounded-full bg-gradient-to-br from-amber-500/20 to-amber-700/10 border border-white/[0.08] flex items-center justify-center relative">
                                    <span className="font-serif text-2xl md:text-3xl text-stone-100">
                                        {userData?.name?.[0] || 'W'}
                                    </span>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-4 border-[#0a0a0f] flex items-center justify-center">
                                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                    </div>
                                </div>

                                {/* Info */}
                                <h2 className="font-serif text-xl md:text-2xl text-stone-100 mb-1">
                                    {userData?.name}
                                </h2>
                                <p className="text-stone-500 text-xs uppercase tracking-[0.2em] mb-6">
                                    {userData?.location || 'Watchman'}
                                </p>

                                <div className="pt-5 border-t border-white/[0.06] space-y-2">
                                    <p className="text-stone-400 text-sm">{userData?.email}</p>
                                    <p className="text-stone-600 text-[10px] uppercase tracking-wider">
                                        Member since {userData?.createdAt?.toDate ?
                                            userData.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                                            : 'recently'}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="mt-6 pt-6 border-t border-white/[0.06] space-y-3">
                                    <button
                                        onClick={() => setEditing(!editing)}
                                        className="w-full py-3 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs font-medium text-stone-300 hover:bg-white/[0.06] transition-all cursor-pointer"
                                    >
                                        {editing ? 'Cancel' : 'Edit Profile'}
                                    </button>
                                    <button
                                        onClick={handleSignOut}
                                        className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area */}
                        <div className="lg:col-span-2 space-y-6">

                            {/* Edit Section */}
                            {editing && (
                                <div className="glass-card p-6 md:p-8 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-300">
                                    <h3 className="font-serif text-lg text-stone-100 mb-6">Update Profile</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2.5 font-bold">
                                                Display Name
                                            </label>
                                            <input
                                                type="text"
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                className="w-full px-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all text-stone-200 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2.5 font-bold">
                                                Location
                                            </label>
                                            <input
                                                type="text"
                                                value={newLocation}
                                                onChange={(e) => setNewLocation(e.target.value)}
                                                className="w-full px-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all text-stone-200 text-sm"
                                            />
                                        </div>
                                        <button
                                            onClick={handleUpdate}
                                            disabled={saving}
                                            className="w-full bg-stone-100 text-[#0a0a0f] py-4 rounded-xl uppercase text-xs font-bold tracking-[0.2em] hover:bg-white transition-all disabled:opacity-50 mt-2 cursor-pointer"
                                        >
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Watch History */}
                            <div className="glass-card p-6 md:p-8 rounded-2xl">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-serif text-lg text-stone-100">Your Watch</h3>
                                    <Link
                                        href="/schedule"
                                        className="text-xs text-amber-500 font-medium hover:text-amber-400 transition-colors cursor-pointer"
                                    >
                                        View Schedule →
                                    </Link>
                                </div>

                                {!myWatch ? (
                                    <div className="text-center py-12 border border-dashed border-white/[0.08] rounded-xl">
                                        <svg className="w-10 h-10 text-stone-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-stone-500 text-sm mb-4">No watch registered yet</p>
                                        <Link
                                            href="/schedule"
                                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-[#0a0a0f] rounded-xl text-xs font-bold hover:bg-amber-400 transition-all cursor-pointer"
                                        >
                                            Register a Watch
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="p-5 bg-white/[0.03] rounded-xl border border-white/[0.08] flex items-center justify-between">
                                        <div>
                                            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider block mb-1">
                                                All Days
                                            </span>
                                            <span className="text-lg text-stone-200 font-light">
                                                {HOURS[myWatch.hourIdx]}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[10px] text-emerald-400 font-medium uppercase tracking-wide">
                                                Confirmed
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Quick Links */}
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href="/community"
                                    className="p-5 glass-card rounded-xl text-center hover:border-white/[0.12] transition-all cursor-pointer group"
                                >
                                    <svg className="w-6 h-6 text-stone-500 mx-auto mb-2 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                    </svg>
                                    <span className="text-xs text-stone-400 group-hover:text-stone-200 transition-colors">Prayer Wall</span>
                                </Link>
                                <Link
                                    href="/rules"
                                    className="p-5 glass-card rounded-xl text-center hover:border-white/[0.12] transition-all cursor-pointer group"
                                >
                                    <svg className="w-6 h-6 text-stone-500 mx-auto mb-2 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                    </svg>
                                    <span className="text-xs text-stone-400 group-hover:text-stone-200 transition-colors">Rules</span>
                                </Link>
                            </div>

                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
