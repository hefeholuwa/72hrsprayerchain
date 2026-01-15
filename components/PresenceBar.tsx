'use client'

import { useState, useEffect } from 'react'
import { subscribeToPresence, subscribeToActivity, isFirebaseAvailable } from '@/lib/firebase'
import { getSimulatedPresence } from '@/lib/constants'

export default function PresenceBar() {
  const [sessions, setSessions] = useState<any[]>([])
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [currentTime, setCurrentTime] = useState(Date.now())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Interval to refresh the "now" pointer for expiry filtering
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000)

    let unsubPresence = () => { }
    let unsubActivity = () => { }

    if (isFirebaseAvailable) {
      unsubPresence = subscribeToPresence((s) => setSessions(s))
      unsubActivity = subscribeToActivity((a) => setRecentActivity(a))
    }

    return () => {
      unsubPresence()
      unsubActivity()
      clearInterval(timer)
    }
  }, [])

  // Filter sessions that haven't expired yet
  const activeSessions = sessions.filter(s => {
    const expiry = typeof s.expiry === 'object' && s.expiry?.toMillis
      ? s.expiry.toMillis()
      : s.expiry
    return expiry > currentTime
  })

  // Determine the real count. If we are authenticated but have no sessions yet, 
  // assume at least 1 (the current user).
  const isFirebaseUp = isFirebaseAvailable && sessions.length > 0
  const realCount = activeSessions.length || (sessions.length > 0 ? 0 : null)

  // Final count logic: 
  // 1. If Firebase is active and has data: use current active count.
  // 2. If loading and we have no data yet: show 1 (assuming current user).
  // 3. Fallback to 0 if definitely no one else and no data.
  // SSR-safe state derivation:
  // On the server, isFirebaseAvailable is false, so isLive must be false.
  // We use the 'mounted' state to ensure the client doesn't switch to true until after hydration.
  const isLive = mounted && isFirebaseAvailable
  const displayCount = mounted ? (realCount !== null ? realCount : 1) : 0
  const hasActivity = mounted && recentActivity.length > 0

  const activityText = hasActivity
    ? `${recentActivity[0].userName || 'An intercessor'} just committed to a watch...`
    : "The cloud of witnesses is expanding..."

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-sm transition-opacity duration-500 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className="glass shadow-2xl rounded-full px-5 py-3 flex items-center justify-between gap-4 border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className={`flex h-2 w-2 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span className={`absolute inset-0 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500'} animate-ping opacity-75`}></span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-stone-100 tracking-[0.2em] uppercase leading-none">
              {displayCount} Online
            </span>
            <span className="text-[7px] text-stone-500 uppercase tracking-widest mt-1 font-bold">
              {isLive ? 'Live Altar' : 'Prayer Aura'}
            </span>
          </div>
        </div>
        <div className="h-6 w-px bg-white/5"></div>
        <div className="flex-1 overflow-hidden">
          <p className="text-[9px] text-stone-400 italic whitespace-nowrap animate-marquee">
            {activityText}
          </p>
        </div>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(10%); opacity: 0; }
          10% { transform: translateX(0); opacity: 1; }
          90% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(-10%); opacity: 0; }
        }
        .animate-marquee { animation: marquee 8s ease-in-out infinite; }
      `}</style>
    </div>
  )
}
