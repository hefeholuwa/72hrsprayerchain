'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { auth } from '@/lib/firebase'
import { APP_NAME, TAGLINE } from '@/lib/constants'

export default function Header() {
    const [user, setUser] = useState<any>(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const pathname = usePathname()

    useEffect(() => {
        return auth?.onAuthStateChanged((u) => setUser(u))
    }, [])

    const navLinks = [
        { name: 'Home', href: '/' },
        { name: 'Schedule', href: '/schedule' },
        { name: 'Community', href: '/community' },
        { name: 'Rules', href: '/rules' },
    ]

    const isActive = (path: string) => pathname === path

    return (
        <header className="p-6 md:p-12 flex flex-col md:flex-row justify-between items-center max-w-6xl mx-auto w-full gap-4 md:gap-8 relative z-50">
            <div className="flex justify-between items-center w-full md:w-auto">
                <Link href="/" className="group text-left">
                    <h1 className="text-lg md:text-2xl font-light tracking-[0.3em] text-stone-100 group-hover:text-amber-500 transition-all duration-500 uppercase">
                        {APP_NAME}
                    </h1>
                    <p className="text-[8px] md:text-[9px] tracking-[0.4em] text-stone-500 uppercase mt-1 md:mt-2 group-hover:text-amber-400/60 transition-all duration-500 font-bold">
                        {TAGLINE}
                    </p>
                </Link>

                {/* Mobile Hamburger Icon */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 text-stone-400 hover:text-stone-100 transition-colors"
                >
                    <div className="w-6 h-5 relative flex flex-col justify-between">
                        <span className={`h-px w-full bg-current transition-all duration-300 ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
                        <span className={`h-px w-full bg-current transition-opacity duration-300 ${isMenuOpen ? 'opacity-0' : ''}`} />
                        <span className={`h-px w-full bg-current transition-all duration-300 ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                    </div>
                </button>
            </div>

            {/* Navigation - Desktop & Mobile */}
            <nav className={`
                ${isMenuOpen ? 'flex' : 'hidden md:flex'} 
                flex-col md:flex-row 
                absolute md:relative 
                top-full left-0 w-full md:w-auto 
                bg-[#050505]/fb backdrop-blur-xl md:bg-transparent 
                p-8 md:p-0 
                border-b border-white/5 md:border-none
                gap-6 md:gap-12 
                text-[10px] font-black tracking-[0.3em] text-stone-500 uppercase items-center
                z-50 animate-in fade-in slide-in-from-top-4 duration-300
            `}>
                {navLinks.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setIsMenuOpen(false)}
                        className={`transition-all ${isActive(link.href) ? 'text-amber-500' : 'hover:text-stone-100'}`}
                    >
                        {link.name}
                    </Link>
                ))}
                {user ? (
                    <Link
                        href="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className={`transition-all font-black ${isActive('/profile') ? 'text-amber-500' : 'hover:text-stone-100 text-stone-500'}`}
                    >
                        Profile
                    </Link>
                ) : (
                    <Link
                        href="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className={`transition-all ${isActive('/login') ? 'text-amber-500' : 'hover:text-stone-100'}`}
                    >
                        Login
                    </Link>
                )}
            </nav>
        </header>
    )
}
