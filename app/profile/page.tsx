'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, db, signOut, isFirebaseAvailable } from '@/lib/firebase'
import { doc, getDoc, collection, query, where, getDocs, setDoc, orderBy } from 'firebase/firestore'
import { DAYS, HOURS } from '@/lib/constants'

export default function ProfilePage() {
    const [userData, setUserData] = useState<any>(null)
    const [commitments, setCommitments] = useState<any[]>([])
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
                // 1. Fetch User Profile
                const userSnap = await getDoc(doc(db, "users", auth.currentUser.uid))
                if (userSnap.exists()) {
                    const data = userSnap.data()
                    setUserData(data)
                    setNewName(data.name || '')
                    setNewLocation(data.location || '')
                }

                // 2. Fetch Watch History
                const q = query(
                    collection(db, "commitments"),
                    where("userId", "==", auth.currentUser.uid),
                    orderBy("timestamp", "desc")
                )
                const watchSnap = await getDocs(q)
                const watches = watchSnap.docs.map(d => d.data())
                setCommitments(watches)

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
    }, [auth, db, router])

    const handleUpdate = async () => {
        if (!auth?.currentUser || !db) return
        setSaving(true)
        try {
            await setDoc(doc(db, "users", auth.currentUser.uid), {
                name: newName,
                location: newLocation,
                email: auth.currentUser.email // Ensure email is preserved
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
                <div className="w-12 h-12 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen py-24 px-4 selection:bg-amber-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] aura-glow rounded-full opacity-30" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Sidebar / Identity Card */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="glass p-8 rounded-3xl border-stone-800 text-center relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                            <div className="w-24 h-24 bg-stone-900 border border-white/5 rounded-full mx-auto mb-6 flex items-center justify-center relative">
                                <span className="serif text-3xl text-stone-100">{userData?.name?.[0] || 'W'}</span>
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 rounded-full border-4 border-[#050505] flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-stone-900 rounded-full animate-pulse"></div>
                                </div>
                            </div>

                            <h2 className="serif text-2xl text-stone-100 mb-1">{userData?.name}</h2>
                            <p className="text-stone-500 text-[10px] uppercase tracking-[0.2em] mb-6 font-bold">{userData?.location || 'Watchman'}</p>

                            <div className="space-y-3 pt-6 border-t border-white/5">
                                <p className="text-stone-400 text-xs font-light">{userData?.email}</p>
                                <p className="text-stone-600 text-[10px] uppercase tracking-widest font-black">Member since {userData?.createdAt?.toDate ? userData.createdAt.toDate().toLocaleDateString() : 'recently'}</p>
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-3">
                                <button
                                    onClick={() => setEditing(!editing)}
                                    className="w-full py-3 rounded-xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-stone-300 hover:bg-white/10 transition-all"
                                >
                                    {editing ? 'Cancel Editing' : 'Edit Identity'}
                                </button>
                                <button
                                    onClick={handleSignOut}
                                    className="w-full py-3 rounded-xl bg-red-950/20 border border-red-900/30 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-900/30 transition-all"
                                >
                                    Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Edit Section */}
                        {editing && (
                            <div className="glass p-8 rounded-3xl border-stone-800 animate-in fade-in slide-in-from-top-4 duration-500">
                                <h3 className="serif text-xl text-stone-100 mb-6 font-light">Update Your Identity</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[9px] uppercase tracking-[0.3em] text-stone-500 mb-2 font-black">Display Name</label>
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all text-stone-200 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[9px] uppercase tracking-[0.3em] text-stone-500 mb-2 font-black">Location</label>
                                        <input
                                            type="text"
                                            value={newLocation}
                                            onChange={(e) => setNewLocation(e.target.value)}
                                            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all text-stone-200 text-sm"
                                        />
                                    </div>
                                    <button
                                        onClick={handleUpdate}
                                        disabled={saving}
                                        className="w-full bg-stone-100 text-[#050505] py-4 rounded-2xl uppercase text-[10px] font-black tracking-[0.3em] hover:bg-white transition-all disabled:opacity-50 mt-4"
                                    >
                                        {saving ? 'Updating...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Watch History */}
                        <div className="glass p-8 md:p-10 rounded-3xl border-stone-800">
                            <div className="flex items-center justify-between mb-10">
                                <h3 className="serif text-2xl text-stone-100 font-light">Watch History</h3>
                                <Link href="/schedule" className="text-amber-500 text-[10px] font-black uppercase tracking-widest hover:underline underline-offset-8">
                                    Register New Watch
                                </Link>
                            </div>

                            {commitments.length === 0 ? (
                                <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl">
                                    <p className="text-stone-500 text-sm italic font-light">No watches recorded yet in the scrolls.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {commitments.map((w, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-6 bg-white/5 rounded-2xl border border-white/5 group hover:border-amber-500/30 transition-all">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{DAYS[w.dayIdx]}</span>
                                                <span className="text-stone-200 font-light">{HOURS[parseInt(w.hourIdx)]}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] text-stone-500 block uppercase tracking-tighter">Status</span>
                                                <span className="text-[10px] text-stone-300 font-bold uppercase tracking-widest">Confirmed</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
