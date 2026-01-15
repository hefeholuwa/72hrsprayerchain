export const PRAYER_ROOM_URL = process.env.NEXT_PUBLIC_PRAYER_ROOM_URL || 'https://meet.jit.si/72HPrayerChainNigeria'
export const COORDINATION_WA = '2348000000000'
export const APP_NAME = "72H Prayer Chain"
export const TAGLINE = "Until Revival comes."
export const ORGANIZATION = "Youth for Christ Movement"
export const ADMIN_EMAILS = ['admin@yfcm.org', 'leadership@yfcm.org', 'ajogbejei@gmail.com']

export const RULES = [
    { title: "Mic Discipline", description: "Keep your microphone muted at all times unless leading a prayer." },
    { title: "Spiritual Focus", description: "Our mandate is the Church and Nigeria. Avoid personal diversions." },
    { title: "Orderly Intercession", description: "Keep prayers sharp, concise, and scriptural." },
    { title: "Solemn Assembly", description: "Maintain a heart of reverence. No teaching, no debate." }
]

export const DAYS = ["Day 1", "Day 2", "Day 3"]
export const HOURS = Array.from({ length: 24 }, (_, i) => {
    const hour = i % 12 || 12
    const ampm = i < 12 ? 'AM' : 'PM'
    const nextHour = (i + 1) % 12 || 12
    const nextAmpm = (i + 1) < 12 || (i + 1) === 24 ? 'AM' : 'PM'
    return `${hour}:00 ${ampm} - ${nextHour}:00 ${nextAmpm}`
})

/**
 * DETERMINISTIC REAL-TIME SIMULATION (DRS)
 * Used when Firebase is unavailable or permissions are denied.
 */
export const getSimulatedPresence = () => {
    const now = new Date()
    const minuteSeed = Math.floor(now.getTime() / 60000)
    const hour = now.getHours()
    const isPeak = (hour >= 3 && hour <= 6) || (hour >= 21)
    const base = isPeak ? 42 : 18
    return base + (minuteSeed % 12)
}

export const getSimulatedOccupancy = (dayIdx: number, hourIdx: number) => {
    const val = (dayIdx + hourIdx + 3) % 7
    if (val > 5) return 12 // High
    if (val > 3) return 5  // Medium
    return 2              // Low
}

// Set this to the actual start date of your 72h prayer chain
export const EVENT_START_DATE = new Date('2026-01-29T00:00:00')
export const TOTAL_HOURS = 72

export const getEventProgress = () => {
    const now = new Date()
    const start = EVENT_START_DATE.getTime()
    const end = start + (TOTAL_HOURS * 60 * 60 * 1000)

    if (now.getTime() < start) return 0
    if (now.getTime() > end) return 100

    const elapsed = now.getTime() - start
    const total = end - start
    return Math.floor((elapsed / total) * 100)
}

export const getCurrentWatch = () => {
    const now = new Date()
    const currentHour = now.getHours()

    // Calculate days elapsed since start
    const diffTime = Math.abs(now.getTime() - EVENT_START_DATE.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    // Ensure we stay within the 3-day window (0, 1, 2)
    const dayIdx = Math.min(Math.max(0, diffDays), 2)

    return {
        dayIdx,
        hourIdx: currentHour,
        hourLabel: HOURS[currentHour]
    }
}
