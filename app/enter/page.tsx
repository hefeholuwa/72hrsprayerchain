'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PRAYER_ROOM_URL, ORGANIZATION } from '@/lib/constants'
import { auth, db } from '@/lib/firebase'
import { useEventTiming } from '@/hooks/useEventTiming'
import CountdownTimer from '@/components/CountdownTimer'

const CONFIRMATION_KEY = 'prayer_rules_accepted'

export default function EnterPage() {
    const [confirmed, setConfirmed] = useState(false)
    const [redirecting, setRedirecting] = useState(false)
    const [isAutomated, setIsAutomated] = useState(false)
    const [checking, setChecking] = useState(true)
    const [status, setStatus] = useState<'checking' | 'authorized' | 'unauthorized' | 'not-logged-in'>('checking')
    const [hasEntered, setHasEntered] = useState(false)
    const router = useRouter()
    const { isStarted, startDate } = useEventTiming()

    useEffect(() => {
        const timer = setTimeout(() => {
            if (checking && !hasEntered) {
                console.warn("Access verification timed out. Falling back to manual entry.");
                setChecking(false);
                if (status === 'checking') setStatus('authorized');
            }
        }, 10000);

        if (!auth) {
            console.warn("Auth service not found. Proceeding with caution.");
            setChecking(false);
            setStatus('authorized');
            return;
        }

        const runCheck = async (user: any) => {
            if (!user) {
                setStatus('not-logged-in');
                router.push('/login?redirect=/enter');
                return;
            }

            if (!db) {
                setStatus('authorized');
                setChecking(false);
                return;
            }

            try {
                setStatus('authorized');
                setChecking(false);
                const hasAccepted = localStorage.getItem(CONFIRMATION_KEY);
                if (hasAccepted === 'true') {
                    setConfirmed(true);
                    setIsAutomated(true);
                    handleEnter(true);
                }
            } catch (err) {
                console.error("Access check failed:", err);
                setStatus('authorized');
                setChecking(false);
            }
        }

        if (auth.currentUser) {
            runCheck(auth.currentUser);
        }

        const unsubscribe = auth.onAuthStateChanged(runCheck);

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [router]);

    const handleEnter = (isAuto: boolean = false) => {
        if (!confirmed && !isAuto) return

        setRedirecting(true)
        if (!isAuto) {
            localStorage.setItem(CONFIRMATION_KEY, 'true')
        }

        setTimeout(() => {
            router.push('/altar')
        }, 1500)
    }

    // Success state - already entered
    if (hasEntered) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[150px]" />
                </div>

                <div className="relative z-10 text-center max-w-sm animate-in zoom-in-95 fade-in duration-700">
                    <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative">
                        <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                        <svg className="w-8 h-8 text-emerald-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h2 className="font-serif text-3xl text-stone-100 mb-4">Sanctuary Opened</h2>
                    <p className="text-stone-500 text-sm font-light leading-relaxed mb-10">
                        The altar room has opened. You may now join the global intercession.
                    </p>

                    <div className="space-y-3">
                        <button
                            onClick={() => window.open(PRAYER_ROOM_URL, '_blank')}
                            className="w-full py-4 bg-stone-100 text-[#0a0a0f] rounded-2xl uppercase text-xs font-bold tracking-[0.2em] hover:bg-white transition-all shadow-xl cursor-pointer"
                        >
                            Return to Sanctuary
                        </button>
                        <Link
                            href="/"
                            className="block w-full py-4 rounded-2xl border border-white/[0.06] text-stone-500 uppercase text-xs font-medium tracking-[0.2em] hover:bg-white/[0.03] transition-all cursor-pointer text-center"
                        >
                            Return Home
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    // Loading state
    if (status === 'checking' || checking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full aura-glow opacity-40" />
                </div>

                <div className="relative z-10 text-center animate-in fade-in duration-700">
                    <div className="w-16 h-16 mx-auto mb-8 rounded-full border-2 border-amber-500/20 border-t-amber-500 animate-spin" />
                    <p className="text-stone-500 text-xs uppercase tracking-[0.4em] font-bold mb-8">
                        Verifying Credentials...
                    </p>

                    <button
                        onClick={() => { setChecking(false); setStatus('authorized'); }}
                        className="text-[10px] text-stone-600 hover:text-amber-500 uppercase tracking-[0.2em] font-medium transition-all opacity-0 animate-in fade-in delay-[3000ms] duration-1000 cursor-pointer"
                        style={{ animationFillMode: 'forwards' }}
                    >
                        Taking too long? Click to continue
                    </button>
                </div>
            </div>
        )
    }

    // Unauthorized state
    if (status === 'unauthorized') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-red-500/5 blur-[150px]" />
                </div>

                <div className="relative z-10 text-center max-w-sm">
                    <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-500/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>

                    <h2 className="font-serif text-2xl text-stone-200 mb-4">Gatekeeper Notice</h2>
                    <p className="text-stone-500 text-sm font-light leading-relaxed mb-8">
                        The Altar Room is reserved for active watchmen. Register for at least one prayer watch first.
                    </p>

                    <Link
                        href="/schedule"
                        className="block w-full py-4 bg-stone-100 text-[#0a0a0f] rounded-2xl uppercase text-xs font-bold tracking-[0.2em] hover:bg-white transition-all shadow-xl cursor-pointer text-center"
                    >
                        Visit the Schedule
                    </Link>
                </div>
            </div>
        )
    }

    // Main enter state
    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center p-6">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full aura-glow opacity-50" />
                <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3QgZmlsdGVyPSJ1cmwoI2EpIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+PC9zdmc+')]" />
            </div>

            {/* Back Link */}
            <Link
                href="/"
                className="fixed top-6 left-6 flex items-center gap-2 text-stone-600 hover:text-stone-400 transition-colors z-50 cursor-pointer"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-xs font-medium hidden sm:inline">Back</span>
            </Link>

            <div className="relative z-10 w-full max-w-md text-center">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-8 rounded-full glass-card flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse" />
                    <svg className="w-8 h-8 text-amber-500 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                    </svg>
                </div>

                {/* Title */}
                <h2 className="font-serif text-3xl md:text-4xl text-stone-100 mb-4 font-light">
                    {isAutomated && redirecting ? 'Resuming Prayer' : 'Sacred Alignment'}
                </h2>

                <p className="text-amber-500/70 text-[10px] tracking-[0.4em] uppercase font-bold mb-6">
                    {ORGANIZATION}
                </p>

                <p className="text-stone-400 text-sm max-w-xs mx-auto font-light leading-relaxed mb-10">
                    {isAutomated && redirecting
                        ? 'Welcome back, intercessor. Opening the sanctuary gates...'
                        : 'You are joining a global assembly. Enter in silence, yielding to the Presence.'}
                </p>

                {/* Confirmation Form */}
                {!isAutomated && (
                    <div className="space-y-4">
                        <button
                            onClick={() => setConfirmed(!confirmed)}
                            className={`w-full flex items-center gap-4 p-5 md:p-6 rounded-2xl transition-all text-left cursor-pointer
                                ${confirmed
                                    ? 'bg-amber-500/10 border border-amber-500/30'
                                    : 'glass-card hover:border-white/[0.12]'
                                }`}
                        >
                            <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all
                                ${confirmed
                                    ? 'bg-amber-500 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                                    : 'border-stone-700'
                                }`}
                            >
                                {confirmed && (
                                    <svg className="w-4 h-4 text-[#0a0a0f]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <span className={`text-sm font-medium transition-colors ${confirmed ? 'text-stone-100' : 'text-stone-400'}`}>
                                I enter with a burden for revival.
                            </span>
                        </button>

                        <button
                            onClick={() => handleEnter(false)}
                            disabled={!confirmed || redirecting}
                            className={`w-full py-4 md:py-5 rounded-2xl tracking-[0.2em] uppercase text-xs font-bold transition-all cursor-pointer
                                ${confirmed && !redirecting
                                    ? 'bg-stone-100 text-[#0a0a0f] hover:bg-white shadow-xl shadow-black/30'
                                    : 'bg-white/[0.03] text-stone-700 cursor-not-allowed border border-white/[0.06]'
                                }`}
                        >
                            {redirecting ? 'Opening Gate...' : 'Join the Altar'}
                        </button>
                    </div>
                )}

                {/* Progress indicator for automated redirect */}
                {isAutomated && redirecting && (
                    <div className="flex flex-col items-center gap-6 mt-8">
                        <div className="w-full max-w-xs h-1 bg-white/[0.06] rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 animate-progress rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                        </div>
                    </div>
                )}

                {/* Reset link */}
                <div className="mt-16">
                    <button
                        onClick={() => {
                            localStorage.removeItem(CONFIRMATION_KEY)
                            window.location.reload()
                        }}
                        className="text-[10px] text-stone-700 hover:text-stone-400 uppercase tracking-[0.2em] transition-all font-medium cursor-pointer"
                    >
                        Reset Sanctuary Access
                    </button>
                </div>
            </div>

            <style jsx>{`
                @keyframes progress {
                    0% { width: 0%; }
                    100% { width: 100%; }
                }
                .animate-progress {
                    animation: progress 1.5s ease-out forwards;
                }
            `}</style>
        </div>
    )
}
