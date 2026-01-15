'use client'

import { useState, useEffect } from 'react'
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { EVENT_START_DATE, TOTAL_HOURS, HOURS } from "@/lib/constants"

export function useEventTiming() {
    const [startDate, setStartDate] = useState<Date>(EVENT_START_DATE)
    const [now, setNow] = useState<Date>(new Date())

    useEffect(() => {
        // Sync clock every second
        const timer = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    useEffect(() => {
        if (!db) return

        // Listen for dynamic start date from Firestore
        const unsub = onSnapshot(doc(db, "config", "metadata"), (doc) => {
            if (doc.exists() && doc.data().startDate) {
                // Parse ISO string or Timestamp
                const data = doc.data()
                const date = data.startDate.toDate ? data.startDate.toDate() : new Date(data.startDate)
                setStartDate(date)
            }
        }, (err) => {
            console.warn("Using default start date (offline):", err)
        })

        return () => unsub()
    }, [])

    // Calculations
    const start = startDate.getTime()
    const current = now.getTime()
    const end = start + (TOTAL_HOURS * 60 * 60 * 1000)

    const isStarted = current >= start
    const isEnded = current > end

    // Progress (0 - 100)
    let progress = 0
    if (isStarted && !isEnded) {
        progress = Math.floor(((current - start) / (end - start)) * 100)
    } else if (isEnded) {
        progress = 100
    }

    // Watch Details
    const diffTime = Math.abs(current - start)
    const hourDiff = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Safety check for array access
    const absoluteHourIdx = hourDiff
    const currentHourIdx = now.getHours() // Clock hour

    // For "Current Watch" Logic (0-72h relative)
    const effectiveDayIdx = isStarted ? Math.min(Math.floor(hourDiff / 24), 2) : 0

    // Countdown String
    let countdownString = ""
    if (!isStarted) {
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diffTime % (1000 * 60)) / 1000)
        countdownString = `${days}d ${hours}h ${minutes}m ${seconds}s`
    }

    return {
        startDate,
        now,
        isStarted,
        isEnded,
        progress,
        countdownString,
        currentWatch: {
            dayIdx: effectiveDayIdx,
            hourLabel: HOURS[currentHourIdx],
            totalHoursElapsed: hourDiff
        }
    }
}
