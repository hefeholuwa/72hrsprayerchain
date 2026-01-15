'use client'

import { useState, useEffect } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db, auth } from '@/lib/firebase'
import { PRAYER_THEMES, PrayerTheme } from '@/lib/prayer-points'
import { usePrayerTheme } from '@/hooks/usePrayerTheme'

export default function PrayerPointsEditor() {
    const { themes: initialThemes } = usePrayerTheme()
    const [themes, setThemes] = useState<Record<number, PrayerTheme>>(initialThemes)
    const [expanded, setExpanded] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [msg, setMsg] = useState("")

    // Update local state when hook data loads (only if not already editing)
    useEffect(() => {
        if (!isSaving) {
            setThemes(initialThemes)
        }
    }, [initialThemes])

    const handleSave = async () => {
        if (!db || !auth) {
            setMsg("Error: Database connection failed.")
            return
        }

        setIsSaving(true)
        setMsg("")
        try {
            await setDoc(doc(db, "config", "prayer_points"), {
                ...themes,
                updatedAt: serverTimestamp(),
                updatedBy: auth.currentUser?.email
            }, { merge: true })
            setMsg("Prayer Points updated successfully.")
        } catch (err) {
            console.error(err)
            setMsg("Error saving changes.")
        } finally {
            setIsSaving(false)
        }
    }

    const updateField = (block: number, field: keyof PrayerTheme, value: any) => {
        setThemes(prev => ({
            ...prev,
            [block]: {
                ...prev[block],
                [field]: value
            }
        }))
    }

    const updatePoint = (block: number, index: number, value: string) => {
        const newPoints = [...themes[block].points]
        newPoints[index] = value
        updateField(block, 'points', newPoints)
    }

    const addPoint = (block: number) => {
        const newPoints = [...themes[block].points, ""]
        updateField(block, 'points', newPoints)
    }

    const removePoint = (block: number, index: number) => {
        const newPoints = themes[block].points.filter((_, i) => i !== index)
        updateField(block, 'points', newPoints)
    }

    const WATCH_LABELS: Record<number, string> = {
        0: "Midnight Watch (00:00 - 06:00)",
        6: "Morning Watch (06:00 - 12:00)",
        12: "Midday Watch (12:00 - 18:00)",
        18: "Evening Watch (18:00 - 00:00)"
    }

    return (
        <div className="space-y-6">
            <h5 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">Prayer Focus Editor</h5>

            <div className="space-y-4">
                {[0, 6, 12, 18].map((block) => {
                    const theme = themes[block] || PRAYER_THEMES[block]
                    const isExpanded = expanded === block

                    return (
                        <div key={block} className={`glass rounded-2xl border transition-all ${isExpanded ? 'border-amber-500/50 bg-stone-900/50' : 'border-stone-800'}`}>
                            <button
                                onClick={() => setExpanded(isExpanded ? null : block)}
                                className="w-full flex justify-between items-center p-4"
                            >
                                <span className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">{WATCH_LABELS[block]}</span>
                                <span className="text-xs text-stone-300 font-serif italic truncate max-w-[200px]">{theme.title}</span>
                            </button>

                            {isExpanded && (
                                <div className="p-4 pt-0 space-y-4 animate-in slide-in-from-top-2">
                                    {/* Title */}
                                    <div>
                                        <label className="text-[9px] uppercase text-stone-600 block mb-1">Theme Title</label>
                                        <input
                                            value={theme.title}
                                            onChange={(e) => updateField(block, 'title', e.target.value)}
                                            className="w-full bg-black/20 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 focus:border-amber-500/50 outline-none"
                                        />
                                    </div>

                                    {/* Scripture */}
                                    <div>
                                        <label className="text-[9px] uppercase text-stone-600 block mb-1">Scripture Anchor</label>
                                        <input
                                            value={theme.scripture}
                                            onChange={(e) => updateField(block, 'scripture', e.target.value)}
                                            className="w-full bg-black/20 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-200 focus:border-amber-500/50 outline-none font-serif italic"
                                        />
                                    </div>

                                    {/* Points */}
                                    <div>
                                        <label className="text-[9px] uppercase text-stone-600 block mb-2">Prayer Points</label>
                                        <div className="space-y-2">
                                            {theme.points.map((p, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <input
                                                        value={p}
                                                        onChange={(e) => updatePoint(block, idx, e.target.value)}
                                                        className="flex-1 bg-black/20 border border-stone-800 rounded-lg px-3 py-2 text-sm text-stone-300 focus:border-amber-500/50 outline-none"
                                                    />
                                                    <button
                                                        onClick={() => removePoint(block, idx)}
                                                        className="px-3 text-stone-600 hover:text-red-400"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => addPoint(block)}
                                                className="text-[9px] uppercase tracking-widest text-amber-500/60 hover:text-amber-500 mt-2"
                                            >
                                                + Add Point
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            <div className="border-t border-white/5 pt-6">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-stone-100 hover:bg-white text-[#050505] font-black py-4 rounded-xl uppercase tracking-[0.2em] text-[10px] transition-all disabled:opacity-50"
                >
                    {isSaving ? "Publishing Updates..." : "Publish Prayer Points"}
                </button>
                {msg && (
                    <p className={`text-xs text-center mt-3 ${msg.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
                        {msg}
                    </p>
                )}
            </div>
        </div>
    )
}
