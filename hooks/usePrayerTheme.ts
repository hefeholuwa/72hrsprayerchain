'use client'

import { useState, useEffect } from 'react'
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { PRAYER_THEMES, PrayerTheme } from "@/lib/prayer-points"

export function usePrayerTheme() {
    // 0, 6, 12, 18
    const [currentHourBlock, setCurrentHourBlock] = useState(0)
    const [themes, setThemes] = useState<Record<number, PrayerTheme>>(PRAYER_THEMES)
    const [activeTheme, setActiveTheme] = useState<PrayerTheme>(PRAYER_THEMES[0])

    useEffect(() => {
        // Sync time block every minute
        const updateBlock = () => {
            const hour = new Date().getHours()
            let block = 0
            if (hour >= 6 && hour < 12) block = 6
            if (hour >= 12 && hour < 18) block = 12
            if (hour >= 18) block = 18
            setCurrentHourBlock(block)
        }

        updateBlock()
        const timer = setInterval(updateBlock, 60000)
        return () => clearInterval(timer)
    }, [])

    // Sync Data
    useEffect(() => {
        if (!db) return

        const unsub = onSnapshot(doc(db, "config", "prayer_points"), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as Record<number, Partial<PrayerTheme>>
                // Merge Firebase data with defaults, preserving colorScheme if not in Firebase
                setThemes(prev => {
                    const merged: Record<number, PrayerTheme> = { ...prev }
                    for (const key of Object.keys(data)) {
                        const k = parseInt(key)
                        if (prev[k]) {
                            merged[k] = {
                                ...prev[k],
                                ...data[k],
                                colorScheme: data[k]?.colorScheme || prev[k].colorScheme
                            }
                        }
                    }
                    return merged
                })
            }
        }, (err) => {
            console.warn("Using default prayer themes (offline):", err)
        })

        return () => unsub()
    }, [])

    // Update active theme when block or data changes
    useEffect(() => {
        if (themes[currentHourBlock]) {
            setActiveTheme(themes[currentHourBlock])
        }
    }, [currentHourBlock, themes])

    return {
        activeTheme,
        themes,
        currentHourBlock
    }
}
