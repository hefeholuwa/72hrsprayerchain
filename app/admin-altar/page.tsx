'use client'

import { useState, useEffect, useRef } from 'react'
import { auth, db, isFirebaseAvailable } from '@/lib/firebase'
import {
    collection,
    getDocs,
    query,
    orderBy,
    limit,
    onSnapshot,
    doc,
    deleteDoc,
    serverTimestamp,
    addDoc,
    setDoc,
    getDoc,
    where
} from 'firebase/firestore'
import { useRouter } from 'next/navigation'
import { ADMIN_EMAILS, DAYS, HOURS } from '@/lib/constants'
import GlobalHeatmap from '@/components/GlobalHeatmap'
import PrayerPointsEditor from '@/components/PrayerPointsEditor'

interface UserData {
    id: string
    name: string
    email: string
    location: string
    createdAt: any
}

interface Commitment {
    id: string
    dayIdx: number
    hourIdx: string
    userName: string
    userId: string
}

interface Activity {
    id: string
    userName: string
    type: string
    timestamp: any
    location?: string
}

interface Prayer {
    id: string
    userName: string
    content: string
    amenCount: number
    timestamp: any
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<UserData[]>([])
    const [commitments, setCommitments] = useState<Commitment[]>([])
    const [activities, setActivities] = useState<Activity[]>([])
    const [prayers, setPrayers] = useState<Prayer[]>([])
    const [loading, setLoading] = useState(true)
    const [authorized, setAuthorized] = useState(false)
    const [activeTab, setActiveTab] = useState<'users' | 'heatmap' | 'activity' | 'prayers' | 'online' | 'settings'>('heatmap')

    const formatDate = (date: any) => {
        const fallbackValue = 'Jan 2026' // Fallback for users before createdAt was added
        if (!date) return fallbackValue

        try {
            // Handle Firestore Timestamp
            if (date.toDate && typeof date.toDate === 'function') {
                return date.toDate().toLocaleDateString('en-GB')
            }
            // Handle milliseconds or seconds
            if (typeof date === 'number') {
                return new Date(date > 1e12 ? date : date * 1000).toLocaleDateString('en-GB')
            }
            // Handle seconds object { seconds, nanoseconds }
            if (date.seconds) {
                return new Date(date.seconds * 1000).toLocaleDateString('en-GB')
            }
            // Handle standard Date object or string
            return new Date(date).toLocaleDateString('en-GB')
        } catch (e) {
            return fallbackValue
        }
    }

    // Settings State
    const [configDate, setConfigDate] = useState("")
    const [isSaving, setIsSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState("")
    const [onlineSessions, setOnlineSessions] = useState<any[]>([])
    const [currentTime, setCurrentTime] = useState(Date.now())
    const router = useRouter()

    const deleteUserWatches = async (userId: string) => {
        if (!confirm("Are you sure you want to clear all watches for this intercessor?")) return
        if (!db) return

        try {
            const q = query(collection(db, "commitments"), where("userId", "==", userId))
            const snap = await getDocs(q)
            const { deleteDoc } = await import('firebase/firestore')

            await Promise.all(snap.docs.map(d => deleteDoc(d.ref)))
            alert("All watches cleared for this user.")
        } catch (err) {
            console.error("Delete failed:", err)
            alert("Failed to delete watches.")
        }
    }

    // Cleanup refs
    const unsubRef = useRef<(() => void)[]>([])

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(Date.now()), 1000)

        const checkAuth = auth?.onAuthStateChanged(async (user) => {
            if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
                setAuthorized(false)
                setLoading(false)
                return
            }

            setAuthorized(true)
            await initializeDashboard()
            setLoading(false)
        })

        return () => {
            checkAuth?.()
            unsubRef.current.forEach(u => u())
            clearInterval(timer)
        }
    }, [])

    const initializeDashboard = async () => {
        const firestore = db
        if (!firestore) return

        // Real-time listeners for all content
        const unsubUsers = onSnapshot(collection(firestore, "users"), (snap) => {
            const items = snap.docs.map(doc => {
                const data = doc.data()
                return {
                    id: doc.id,
                    ...data,
                    location: data.location || data.country || "Unknown"
                } as UserData
            }).sort((a, b) => {
                const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0
                const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0
                return timeB - timeA
            })
            setUsers(items)
        }, (err) => console.error("Users sync failed:", err))

        const unsubCommitments = onSnapshot(collection(firestore, "commitments"), (snap) => {
            setCommitments(snap.docs.map(doc => {
                const data = doc.data()
                return {
                    id: doc.id,
                    ...data,
                    userId: data.userId || data.uid
                } as Commitment
            }))
        }, (err) => console.error("Commitments sync failed:", err))

        const unsubActivity = onSnapshot(query(collection(firestore, "activity"), orderBy("timestamp", "desc"), limit(50)), (snap) => {
            setActivities(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Activity)))
        }, (err) => {
            console.warn("Activity sync falling back:", err)
            getDocs(collection(firestore, "activity")).then(s => {
                const items = s.docs.map(d => ({ id: d.id, ...d.data() } as Activity))
                setActivities(items.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 50))
            })
        })

        const unsubPrayers = onSnapshot(query(collection(firestore, "prayers"), orderBy("timestamp", "desc"), limit(50)), (snap) => {
            setPrayers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Prayer)))
        }, (err) => {
            console.warn("Prayers sync falling back:", err)
            getDocs(collection(firestore, "prayers")).then(s => {
                const items = s.docs.map(d => ({ id: d.id, ...d.data() } as Prayer))
                setPrayers(items.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0)).slice(0, 50))
            })
        })

        const unsubOnline = onSnapshot(collection(firestore, "active_sessions"), (snap) => {
            setOnlineSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })))
        }, (err) => console.error("Online sync error", err))

        // Fetch Config
        getDoc(doc(firestore, "config", "metadata")).then(snap => {
            if (snap.exists() && snap.data().startDate) {
                const date = snap.data().startDate.toDate ? snap.data().startDate.toDate() : new Date(snap.data().startDate)
                // Format for datetime-local input (YYYY-MM-DDThh:mm)
                const iso = new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
                setConfigDate(iso)
            }
        })

        unsubRef.current = [unsubUsers, unsubCommitments, unsubActivity, unsubPrayers, unsubOnline]
    }

    const handleDeletePrayer = async (id: string) => {
        if (!db || !confirm("Erase this burden from the Wall?")) return
        try {
            await deleteDoc(doc(db, "prayers", id))
        } catch (err) {
            console.error("Moderation failed", err)
        }
    }

    const exportToCSV = () => {
        const headers = ["Name", "Email", "Location", "Joined At"]
        const rows = users.map(u => [
            u.name,
            u.email,
            u.location,
            u.createdAt?.toDate ? u.createdAt.toDate().toISOString() : ""
        ])

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n")
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `prayer_chain_intercessors_${new Date().toISOString().split('T')[0]}.csv`)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    // Process Heatmap Data
    const getCoverage = (day: number, hour: number) => {
        return commitments.filter(c => c.dayIdx === day && parseInt(c.hourIdx) === hour).length
    }

    // Process Distribution Stats
    const getCountryStats = () => {
        const counts: Record<string, number> = {}
        users.forEach(u => {
            const country = u.location?.split(',').pop()?.trim() || "Unknown"
            counts[country] = (counts[country] || 0) + 1
        })
        return Object.entries(counts).sort((a, b) => b[1] - a[1])
    }

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-t-2 border-amber-500 rounded-full animate-spin mb-6"></div>
                <p className="text-stone-500 text-[10px] uppercase tracking-[0.4em] font-black">Scanning the Scrolls...</p>
            </div>
        )
    }

    if (!authorized) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-4">
                <div className="w-20 h-20 bg-red-900/10 rounded-full flex items-center justify-center mb-8 border border-red-900/20">
                    <svg className="w-8 h-8 text-red-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m0-6V7m0 10c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" />
                    </svg>
                </div>
                <h2 className="serif text-2xl text-stone-200 mb-4">Sanctuary Oversight Restricted</h2>
                <p className="text-stone-500 text-sm font-light leading-relaxed mb-8 italic max-w-xs">
                    This chamber is reserved for the movement leadership.
                </p>
                <button onClick={() => router.push('/')} className="px-8 py-3 bg-stone-100 text-[#050505] rounded-full uppercase text-[9px] font-black tracking-[0.2em]">Return to Altar</button>
            </div>
        )
    }

    return (
        <div className="relative min-h-screen py-12 px-4 animate-in fade-in duration-700 pb-32">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
                    <div>
                        <h2 className="serif text-4xl text-stone-100 mb-4">Command Center</h2>
                        <p className="text-stone-500 text-[10px] uppercase tracking-[0.4em] font-black italic">Movement Oversight & Coordination</p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                    <div className="glass p-6 rounded-2xl border-stone-800">
                        <span className="text-[8px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2 block">Total Intercessors</span>
                        <p className="text-2xl serif text-stone-100">{users.length}</p>
                    </div>
                    <div className="glass p-6 rounded-2xl border-stone-800">
                        <span className="text-[8px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2 block">Countries</span>
                        <p className="text-2xl serif text-stone-100">{getCountryStats().length}</p>
                    </div>
                    <div className="glass p-6 rounded-2xl border-stone-800">
                        <span className="text-[8px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2 block">Total Prayers</span>
                        <p className="text-2xl serif text-stone-100">{prayers.length}</p>
                    </div>
                    <div className="glass p-6 rounded-2xl border-stone-800">
                        <span className="text-[8px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-2 block">Slots Filled</span>
                        <p className="text-2xl serif text-stone-100">{commitments.length}/72</p>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="flex gap-4 mb-12 border-b border-white/5 pb-4 overflow-x-auto whitespace-nowrap">
                    {[
                        { id: 'heatmap', label: 'Watch Heatmap' },
                        { id: 'activity', label: 'Live Stream' },
                        { id: 'online', label: 'Online Now' },
                        { id: 'users', label: 'Intercessors' },
                        { id: 'prayers', label: 'Moderation' },
                        { id: 'settings', label: 'Settings' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-2 rounded-full uppercase text-[9px] font-black tracking-[0.2em] transition-all
                                ${activeTab === tab.id ? 'bg-amber-500 text-[#050505]' : 'hover:bg-white/5 text-stone-500'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* TAB: HEATMAP */}
                {activeTab === 'heatmap' && (
                    <div className="animate-in fade-in duration-500 space-y-12">
                        {/* Global Pulse Heatmap */}
                        <GlobalHeatmap
                            users={users}
                            onlineUids={onlineSessions.map(s => s.userId)}
                        />
                        <div className="mb-8 flex justify-between items-center">
                            <h4 className="serif text-2xl text-stone-200">72-Hour Coverage</h4>
                            <div className="flex gap-4 items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-stone-800 rounded-full" />
                                    <span className="text-[8px] uppercase text-stone-600 font-bold">Empty</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-amber-500/40 rounded-full" />
                                    <span className="text-[8px] uppercase text-stone-600 font-bold">1-2</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 bg-amber-500 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                    <span className="text-[8px] uppercase text-stone-600 font-bold">3+</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {DAYS.map((day, dIdx) => (
                                <div key={day} className="glass p-6 rounded-3xl border-stone-800">
                                    <h5 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.4em] mb-6 border-b border-white/5 pb-4">{day}</h5>
                                    <div className="space-y-2">
                                        {HOURS.map((hour, hIdx) => {
                                            const count = getCoverage(dIdx, hIdx)
                                            return (
                                                <div key={hIdx} className="flex justify-between items-center group">
                                                    <span className="text-[10px] text-stone-600 font-bold uppercase">{hour.split(' - ')[0]}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-[10px] font-black ${count === 0 ? 'text-red-900/50' : 'text-stone-300'}`}>
                                                            {count}
                                                        </span>
                                                        <div className={`w-8 h-1.5 rounded-full ${count === 0 ? 'bg-stone-900' :
                                                            count < 3 ? 'bg-amber-600/30' :
                                                                'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                                                            }`} />
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* TAB: ACTIVITY STREAM */}
                {activeTab === 'activity' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="glass rounded-3xl border-stone-800 overflow-x-auto no-scrollbar">
                            <table className="w-full text-left min-w-[600px]">
                                <thead className="bg-white/5 border-b border-white/5">
                                    <tr>
                                        <th className="p-6 text-[9px] uppercase tracking-[0.2em] text-stone-500 font-black">Time</th>
                                        <th className="p-6 text-[9px] uppercase tracking-[0.2em] text-stone-500 font-black">Watchman</th>
                                        <th className="p-6 text-[9px] uppercase tracking-[0.2em] text-stone-500 font-black">Movement</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {activities.map((act) => (
                                        <tr key={act.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="p-6 text-xs text-stone-600 font-bold uppercase">
                                                {act.timestamp?.toDate ? act.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                            </td>
                                            <td className="p-6 text-sm text-stone-200">
                                                {act.userName}
                                                {act.location && <span className="ml-2 text-[10px] text-stone-600">({act.location})</span>}
                                            </td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black tracking-widest uppercase
                                                    ${act.type === 'registration' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                    {act.type}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* TAB: ONLINE NOW */}
                {activeTab === 'online' && (
                    <div className="animate-in fade-in duration-500">
                        <div className="mb-8">
                            <h4 className="serif text-2xl text-stone-200">Watchmen at the Altar</h4>
                            <p className="text-stone-500 text-[10px] uppercase tracking-[0.2em] mt-2">Active in the last 60 seconds</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {onlineSessions.filter(s => {
                                const expiry = typeof s.expiry === 'object' && s.expiry?.toMillis ? s.expiry.toMillis() : s.expiry
                                return expiry > currentTime
                            }).length === 0 ? (
                                <div className="col-span-full py-20 border border-dashed border-stone-800 rounded-3xl text-center">
                                    <p className="text-stone-600 text-[10px] uppercase tracking-widest italic">The sanctuary is currently silent.</p>
                                </div>
                            ) : onlineSessions
                                .filter(s => {
                                    const expiry = typeof s.expiry === 'object' && s.expiry?.toMillis ? s.expiry.toMillis() : s.expiry
                                    return expiry > currentTime
                                })
                                .map((session) => {
                                    const user = users.find(u => u.id === session.userId)
                                    return (
                                        <div key={session.id} className="glass p-6 rounded-2xl border-stone-800 flex items-center gap-4 relative group hover:border-emerald-500/30 transition-all">
                                            <div className="relative">
                                                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                                                    <span className="text-emerald-500 text-xs font-black">{user?.name?.charAt(0) || '?'}</span>
                                                </div>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#050505] animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                            </div>
                                            <div className="flex-1">
                                                <h5 className="text-sm text-stone-200 font-medium">{user?.name || "Anonymous Witness"}</h5>
                                                <p className="text-[9px] text-stone-500 uppercase tracking-widest mt-1">{user?.location || "Unknown Location"}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[8px] text-emerald-500 font-black uppercase tracking-tighter block">Active Now</span>
                                                <span className="text-[7px] text-stone-600 uppercase font-medium">Altar Entry</span>
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    </div>
                )}

                {/* TAB: USERS */}
                {activeTab === 'users' && (
                    <div className="animate-in fade-in duration-500 space-y-12">
                        <div>
                            <div className="flex justify-between items-center mb-8">
                                <h4 className="serif text-2xl text-stone-200">Registered Intercessors</h4>
                                <button
                                    onClick={exportToCSV}
                                    className="px-6 py-2 glass rounded-full text-[9px] font-black tracking-widest uppercase hover:bg-stone-100 hover:text-[#050505] transition-all"
                                >
                                    Export Book of Life (CSV)
                                </button>
                            </div>
                            <div className="glass rounded-3xl border-stone-800 overflow-x-auto no-scrollbar">
                                <table className="w-full text-left min-w-[800px]">
                                    <thead className="bg-white/5 border-b border-white/5">
                                        <tr>
                                            <th className="p-6 text-[9px] uppercase tracking-[0.2em] text-stone-500 font-black">Name</th>
                                            <th className="p-6 text-[9px] uppercase tracking-[0.2em] text-stone-500 font-black">Watches</th>
                                            <th className="p-6 text-[9px] uppercase tracking-[0.2em] text-stone-500 font-black">Location</th>
                                            <th className="p-6 text-[9px] uppercase tracking-[0.2em] text-stone-500 font-black">Joined</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {users.map((u) => {
                                            const isOnline = onlineSessions.some(s => {
                                                const expiry = typeof s.expiry === 'object' && s.expiry?.toMillis ? s.expiry.toMillis() : s.expiry
                                                return s.userId === u.id && expiry > currentTime
                                            })
                                            const userWatchCount = commitments.filter(c => c.userId === u.id).length

                                            return (
                                                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-3">
                                                            {isOnline && <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
                                                            <div>
                                                                <p className="text-sm text-stone-200 font-medium">{u.name}</p>
                                                                <p className="text-[10px] text-stone-600 font-light">{u.email || 'Email not recorded'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center justify-between group/row">
                                                            <span className={`text-[10px] font-bold ${userWatchCount > 0 ? 'text-amber-500' : 'text-stone-700'}`}>
                                                                {userWatchCount} Watches
                                                            </span>
                                                            {userWatchCount > 0 && (
                                                                <button
                                                                    onClick={() => deleteUserWatches(u.id)}
                                                                    className="opacity-0 group-hover/row:opacity-100 p-1 text-red-900 hover:text-red-500 transition-all"
                                                                    title="Clear all watches"
                                                                >
                                                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-sm text-stone-400 font-light">{u.location}</td>
                                                    <td className="p-6 text-sm text-stone-600 font-bold">
                                                        {formatDate(u.createdAt)}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Distribution Stats */}
                        <div>
                            <h4 className="serif text-2xl text-stone-200 mb-8">Nations Representative</h4>
                            <div className="glass p-6 rounded-3xl border-stone-800 space-y-4">
                                {getCountryStats().map(([country, count]) => (
                                    <div key={country} className="flex justify-between items-center group">
                                        <span className="text-[10px] text-stone-400 font-black uppercase tracking-widest">{country}</span>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] text-stone-600 font-bold">{count}</span>
                                            <div
                                                className="h-1 bg-amber-500/40 rounded-full"
                                                style={{ width: `${Math.min(count * 10, 100)}px` }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {/* TAB: MODERATION */}
                {activeTab === 'prayers' && (
                    <div className="animate-in fade-in duration-500 space-y-4">
                        <h4 className="serif text-2xl text-stone-200 mb-8">Sanctuary Wall Moderation</h4>
                        {prayers.length === 0 ? (
                            <p className="text-stone-600 text-[10px] uppercase tracking-widest italic">The Wall is currently clear.</p>
                        ) : prayers.map((prayer) => (
                            <div key={prayer.id} className="p-6 glass rounded-2xl border-stone-800 flex justify-between items-center gap-6">
                                <div className="flex-1">
                                    <div className="flex gap-4 items-center mb-2">
                                        <span className="text-[10px] font-black text-amber-500/60 uppercase">{prayer.userName}</span>
                                        <span className="text-[8px] text-stone-600 uppercase font-bold">
                                            {prayer.timestamp?.toDate ? prayer.timestamp.toDate().toLocaleString() : '...'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-stone-300 italic">&ldquo;{prayer.content}&rdquo;</p>
                                </div>
                                <button
                                    onClick={() => handleDeletePrayer(prayer.id)}
                                    className="p-3 text-red-900/40 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* TAB: SETTINGS */}
                {activeTab === 'settings' && (
                    <div className="max-w-xl animate-in fade-in duration-500">
                        <h4 className="serif text-2xl text-stone-200 mb-8">Event Configuration</h4>

                        <div className="glass p-8 rounded-3xl border-stone-800 space-y-8">
                            <div>
                                <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 font-bold mb-4">
                                    Prayer Chain Start Date
                                </label>
                                <input
                                    type="datetime-local"
                                    className="w-full bg-stone-900/50 border border-stone-700 rounded-xl px-4 py-3 text-stone-200 focus:outline-none focus:border-amber-500 transition-colors"
                                    value={configDate}
                                    onChange={(e) => setConfigDate(e.target.value)}
                                />
                                <p className="text-xs text-stone-500 mt-2 italic">
                                    Changing this will update the countdown timer effectively immediately for all users.
                                </p>
                            </div>

                            <button
                                onClick={async () => {
                                    if (!db || !auth) {
                                        setSaveMsg("Error: Firebase not initialized.")
                                        return
                                    }

                                    setIsSaving(true)
                                    setSaveMsg("")
                                    try {
                                        const dateObj = new Date(configDate)
                                        await setDoc(doc(db, "config", "metadata"), {
                                            startDate: dateObj,
                                            updatedAt: serverTimestamp(),
                                            updatedBy: auth.currentUser?.email
                                        }, { merge: true })
                                        setSaveMsg("Configuration updated successfully.")
                                    } catch (err) {
                                        console.error(err)
                                        setSaveMsg("Error saving configuration.")
                                    } finally {
                                        setIsSaving(false)
                                    }
                                }}
                                disabled={isSaving}
                                className="w-full bg-stone-100 hover:bg-white text-[#050505] font-black py-4 rounded-xl uppercase tracking-[0.2em] text-[10px] transition-all disabled:opacity-50"
                            >
                                {isSaving ? "Saving..." : "Update Schedule"}
                            </button>

                            {saveMsg && (
                                <p className={`text-xs text-center ${saveMsg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {saveMsg}
                                </p>
                            )}
                        </div>

                        <div className="mt-12">
                            <PrayerPointsEditor />
                        </div>
                    </div>
                )}
                {/* DEBUG: Only visible in dev or for super-admins if needed */}
                <div className="mt-24 p-8 glass rounded-3xl border-dashed border-stone-800 opacity-30 hover:opacity-100 transition-opacity">
                    <h5 className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-4">Registry Health Status</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        <div>
                            <span className="text-[8px] text-stone-600 block mb-1 uppercase font-bold">Firestore</span>
                            <span className="text-xs text-stone-300 font-bold">{isFirebaseAvailable ? 'Connected' : 'Disconnected'}</span>
                        </div>
                        <div>
                            <span className="text-[8px] text-stone-600 block mb-1 uppercase font-bold">Users Found</span>
                            <span className="text-xs text-stone-300 font-bold">{users.length}</span>
                        </div>
                        <div>
                            <span className="text-[8px] text-stone-600 block mb-1 uppercase font-bold">Commitments</span>
                            <span className="text-xs text-stone-300 font-bold">{commitments.length}</span>
                        </div>
                        <div>
                            <span className="text-[8px] text-stone-600 block mb-1 uppercase font-bold">Prayers</span>
                            <span className="text-xs text-stone-300 font-bold">{prayers.length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
