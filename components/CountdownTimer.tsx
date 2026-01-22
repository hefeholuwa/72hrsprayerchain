'use client'

import { useEffect, useState } from "react"

interface Props {
    targetDate: Date
}

export default function CountdownTimer({ targetDate }: Props) {
    const [timeLeft, setTimeLeft] = useState<{
        days: number
        hours: number
        minutes: number
        seconds: number
    } | null>(null)

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = targetDate.getTime() - new Date().getTime()

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                })
            } else {
                setTimeLeft(null)
            }
        }

        calculateTimeLeft()
        const timer = setInterval(calculateTimeLeft, 1000)
        return () => clearInterval(timer)
    }, [targetDate])

    if (!timeLeft) return null

    return (
        <div className="flex flex-col items-center justify-center animate-in fade-in duration-1000 px-4">
            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.4em] mb-6 md:mb-8 animate-pulse text-center">Sanctuary Opens In</h4>

            <div className="flex gap-2 sm:gap-4 md:gap-12 text-center justify-center flex-wrap">
                <div className="flex flex-col items-center min-w-[50px] sm:min-w-[60px]">
                    <span className="serif text-3xl sm:text-4xl md:text-7xl text-stone-100 font-light mb-2">
                        {String(timeLeft.days).padStart(2, '0')}
                    </span>
                    <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-widest text-stone-500 font-bold">Days</span>
                </div>

                <span className="serif text-3xl sm:text-4xl md:text-7xl text-stone-600 font-thin mt-[-8px]">:</span>

                <div className="flex flex-col items-center min-w-[50px] sm:min-w-[60px]">
                    <span className="serif text-3xl sm:text-4xl md:text-7xl text-stone-100 font-light mb-2">
                        {String(timeLeft.hours).padStart(2, '0')}
                    </span>
                    <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-widest text-stone-500 font-bold">Hours</span>
                </div>

                <span className="serif text-3xl sm:text-4xl md:text-7xl text-stone-600 font-thin mt-[-8px]">:</span>

                <div className="flex flex-col items-center min-w-[50px] sm:min-w-[60px]">
                    <span className="serif text-3xl sm:text-4xl md:text-7xl text-stone-100 font-light mb-2">
                        {String(timeLeft.minutes).padStart(2, '0')}
                    </span>
                    <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-widest text-stone-500 font-bold">Minutes</span>
                </div>

                <span className="serif text-3xl sm:text-4xl md:text-7xl text-stone-600 font-thin mt-[-8px]">:</span>

                <div className="flex flex-col items-center min-w-[50px] sm:min-w-[60px]">
                    <span className="serif text-3xl sm:text-4xl md:text-7xl text-amber-500 font-light mb-2 tabular-nums">
                        {String(timeLeft.seconds).padStart(2, '0')}
                    </span>
                    <span className="text-[7px] sm:text-[8px] md:text-[10px] uppercase tracking-widest text-stone-500 font-bold">Seconds</span>
                </div>
            </div>
        </div>
    )
}
