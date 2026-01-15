'use client'

import { useState, useEffect } from 'react'
import { db, isFirebaseAvailable } from '@/lib/firebase'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'

interface Activity {
    userName: string
    type: string
    timestamp: any
    location?: string
}

export default function ActivityMarquee() {
    const [activities, setActivities] = useState<Activity[]>([])

    useEffect(() => {
        if (!isFirebaseAvailable || !db) return

        const q = query(
            collection(db, "activity"),
            orderBy("timestamp", "desc"),
            limit(10)
        )

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => doc.data() as Activity)
            setActivities(items)
        }, (err) => {
            console.warn("Activity fetch failed", err)
        })

        return () => unsubscribe()
    }, [])

    if (activities.length === 0) return null

    const getMessage = (activity: Activity) => {
        const name = activity.userName || "A Watchman"
        const country = activity.location ? ` from ${activity.location}` : ""

        switch (activity.type) {
            case 'registration':
                return `${name}${country} just joined the movement.`
            case 'commitment':
                return `${name} just secured a watch slot.`
            default:
                return `${name} is standing on the wall.`
        }
    }

    return (
        <div className="fixed bottom-0 left-0 w-full bg-[#050505]/80 backdrop-blur-md border-t border-white/5 h-10 flex items-center overflow-hidden z-[40] pointer-events-none">
            <div className="flex whitespace-nowrap animate-marquee">
                {/* Double the list for seamless loop */}
                {[...activities, ...activities].map((activity, i) => (
                    <div key={i} className="flex items-center mx-12">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-3 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span>
                        <span className="text-[10px] text-stone-400 font-bold uppercase tracking-[0.2em]">
                            {getMessage(activity)}
                        </span>
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
            `}</style>
        </div>
    )
}
