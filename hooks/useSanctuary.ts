'use client'

import { useState, useEffect, useCallback } from 'react'
import {
    db,
    isFirebaseAvailable,
    subscribeToPresence
} from '@/lib/firebase'
import {
    collection,
    addDoc,
    onSnapshot,
    query,
    orderBy,
    limit,
    serverTimestamp,
    Timestamp
} from 'firebase/firestore'

type EmojiType = '🔥' | '🙏' | '🙌'

interface Burst {
    id: string
    emoji: EmojiType
    x: number
    y: number
    userName?: string
}

interface Prompting {
    id: string
    text: string
    userName?: string
}

interface UseSanctuaryOptions {
    roomId?: string
    userId?: string
    userName?: string
}

export function useSanctuary(options: UseSanctuaryOptions = {}) {
    const {
        roomId = 'main-altar',
        userId = 'anon-' + Math.random().toString(36).slice(2, 8),
        userName = 'Intercessor'
    } = options

    const [connections, setConnections] = useState(0)
    const [bursts, setBursts] = useState<Burst[]>([])
    const [promptings, setPromptings] = useState<Prompting[]>([])
    const [focusedPoint, setFocusedPoint] = useState<number | null>(null)

    // Subscribe to presence (existing logic from firebase.ts)
    useEffect(() => {
        const unsub = subscribeToPresence((sessions) => {
            const now = Date.now()
            const activeSessions = sessions.filter((s: any) => s.expiry > now)
            setConnections(activeSessions.length)
        })
        return () => unsub()
    }, [])

    // Subscribe to altar interactions
    useEffect(() => {
        if (!isFirebaseAvailable || !db) return

        const q = query(
            collection(db, 'altar_interactions'),
            orderBy('timestamp', 'desc'),
            limit(50)
        )

        const unsub = onSnapshot(q, (snapshot) => {
            const now = Date.now()
            const sixtySecondsAgo = now - 60000

            const newBursts: Burst[] = []
            const newPromptings: Prompting[] = []
            let focusPointIndex: number | null = null
            let focusTs = 0

            snapshot.docs.forEach((doc) => {
                const data = doc.data()
                const ts = data.timestamp instanceof Timestamp
                    ? data.timestamp.toMillis()
                    : Date.now()

                // Ignore old interactions
                if (ts < sixtySecondsAgo) return

                if (data.type === 'BURST') {
                    newBursts.push({
                        id: doc.id,
                        emoji: data.emoji,
                        x: 20 + Math.random() * 60,
                        y: 100,
                        userName: data.userName
                    })
                } else if (data.type === 'PROMPTING') {
                    newPromptings.push({
                        id: doc.id,
                        text: data.text,
                        userName: data.userName
                    })
                } else if (data.type === 'FOCUS') {
                    if (ts > focusTs) {
                        focusPointIndex = data.pointIndex as number
                        focusTs = ts
                    }
                }
            })

            setBursts(newBursts)
            setPromptings(newPromptings)
            if (focusPointIndex !== null) {
                setFocusedPoint(focusPointIndex)
            }
        }, (error) => {
            console.warn('Altar interactions sync failed:', error)
        })

        return () => unsub()
    }, [])

    // Clear old bursts and promptings from local state periodically
    useEffect(() => {
        const interval = setInterval(() => {
            // The Firestore listener already filters by timestamp, so local cleanup is minimal
            // This just ensures UI responsiveness for animations
            setBursts((prev) => prev.slice(0, 20))
            setPromptings((prev) => prev.slice(0, 10))
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    const sendBurst = useCallback(async (emoji: EmojiType) => {
        if (!isFirebaseAvailable || !db) return

        try {
            await addDoc(collection(db, 'altar_interactions'), {
                type: 'BURST',
                emoji,
                userId,
                userName,
                timestamp: serverTimestamp()
            })
        } catch (e) {
            console.warn('Failed to send burst:', e)
        }
    }, [userId, userName])

    const sendPrompting = useCallback(async (text: string) => {
        if (!isFirebaseAvailable || !db) return
        if (text.trim().length === 0 || text.length > 100) return

        try {
            await addDoc(collection(db, 'altar_interactions'), {
                type: 'PROMPTING',
                text: text.trim(),
                userId,
                userName,
                timestamp: serverTimestamp()
            })
        } catch (e) {
            console.warn('Failed to send prompting:', e)
        }
    }, [userId, userName])

    const sendFocus = useCallback(async (pointIndex: number, isAdmin: boolean) => {
        if (!isFirebaseAvailable || !db) return
        if (!isAdmin) return // Only admins can focus

        try {
            await addDoc(collection(db, 'altar_interactions'), {
                type: 'FOCUS',
                pointIndex,
                userId,
                userName,
                timestamp: serverTimestamp()
            })
        } catch (e) {
            console.warn('Failed to send focus:', e)
        }
    }, [userId, userName])

    // Intensity based on connections only (no longer tracking reactions per minute via PartyKit)
    const intensity = Math.min(100, connections * 5)

    return {
        // State
        connections,
        reactionsPerMinute: 0, // Deprecated, kept for backward compatibility
        cursors: new Map(), // Disabled for Firebase version
        bursts,
        promptings,
        focusedPoint,
        intensity,

        // Actions
        sendBurst,
        sendMove: () => { }, // No-op for Firebase version
        sendFocus,
        sendPrompting,

        // Connection state
        isConnected: isFirebaseAvailable
    }
}
