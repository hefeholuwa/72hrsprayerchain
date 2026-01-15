'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { APP_NAME, TAGLINE } from '@/lib/constants'

export default function Header() {
    const [user, setUser] = useState<any>(null)

    useEffect(() => {
        return auth?.onAuthStateChanged((u) => setUser(u))
    }, [])

    return (
        <header className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto w-full gap-8 relative z-20">
            <Link href="/" className="group text-center md:text-left">
                <h1 className="text-xl md:text-2xl font-light tracking-[0.3em] text-stone-100 group-hover:text-amber-500 transition-all duration-500 uppercase">
                    {APP_NAME}
                </h1>
                <p className="text-[9px] tracking-[0.4em] text-stone-500 uppercase mt-2 group-hover:text-amber-400/60 transition-all duration-500 font-bold">
                    {TAGLINE}
                </p>
            </Link>
            <nav className="flex gap-8 md:gap-12 text-[10px] font-black tracking-[0.3em] text-stone-500 uppercase items-center">
                <Link href="/" className="hover:text-stone-100 transition-all">Home</Link>
                <Link href="/schedule" className="hover:text-stone-100 transition-all">Schedule</Link>
                <Link href="/community" className="hover:text-stone-100 transition-all">Community</Link>
                {user ? (
                    <Link href="/profile" className="text-amber-500 hover:text-amber-400 transition-all font-black">Profile</Link>
                ) : (
                    <Link href="/login" className="hover:text-stone-100 transition-all">Login</Link>
                )}
                <Link href="/rules" className="hover:text-stone-100 transition-all">Rules</Link>
            </nav>
        </header>
    )
}
