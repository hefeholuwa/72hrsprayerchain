'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { PRAYER_ROOM_URL, ORGANIZATION } from '@/lib/constants'
import { auth, db } from '@/lib/firebase'
import { collection, query, where, getDocs, limit } from 'firebase/firestore'
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
        // Safety timeout: if verification takes > 10s, fallback to letting them try anyway
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
                // Verify commitment
                const q = query(
                    collection(db, "commitments"),
                    where("userId", "==", user.uid),
                    limit(1)
                );
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    setStatus('unauthorized');
                    setChecking(false);
                    return;
                }

                setStatus('authorized');
                const hasAccepted = localStorage.getItem(CONFIRMATION_KEY);
                if (hasAccepted === 'true') {
                    setConfirmed(true);
                    setIsAutomated(true);
                    handleEnter(true);
                } else {
                    setChecking(false);
                }
            } catch (err) {
                console.error("Access check failed:", err);
                setStatus('authorized'); // Fallback to let them in if query fails
                setChecking(false);
            }
        }

        // 1. Check if user is already resolved
        if (auth.currentUser) {
            runCheck(auth.currentUser);
        }

        // 2. Listen for auth state changes
        const unsubscribe = auth.onAuthStateChanged(runCheck);

        return () => {
            unsubscribe();
            clearTimeout(timer);
        };
    }, [router]);

    const handleEnter = (isAuto: boolean = false) => {
        if (!confirmed && !isAuto) return
        if (!isStarted) return // Double-gate protection

        setRedirecting(true)
        if (!isAuto) {
            localStorage.setItem(CONFIRMATION_KEY, 'true')
        }

        // Mental transition delay
        setTimeout(() => {
            window.open(PRAYER_ROOM_URL, '_blank')
            setRedirecting(false)
            setHasEntered(true)
        }, 1500)
    }

    if (hasEntered) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center max-w-sm mx-auto animate-in zoom-in-95 duration-700">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-10 border border-emerald-500/20 relative">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping"></div>
                    <svg className="w-8 h-8 text-emerald-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h2 className="serif text-3xl text-stone-100 mb-4">Sanctuary Opened</h2>
                <p className="text-stone-500 text-sm font-light leading-relaxed mb-10 italic">
                    The altar room has opened in a new tab. You may now join the global intercession.
                </p>
                <div className="space-y-4 w-full">
                    <button
                        onClick={() => window.open(PRAYER_ROOM_URL, '_blank')}
                        className="w-full py-5 bg-stone-100 text-[#050505] rounded-2xl uppercase text-[10px] font-black tracking-[0.3em] hover:bg-white transition-all shadow-xl"
                    >
                        Return to Sanctuary
                    </button>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full py-4 border border-white/5 text-stone-500 rounded-2xl uppercase text-[9px] font-bold tracking-[0.2em] hover:bg-white/5 transition-all"
                    >
                        Return Home
                    </button>
                </div>
            </div>
        )
    }

    if (status === 'checking' || checking) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-700">
                <div className="w-12 h-12 border-t-2 border-amber-500 rounded-full animate-spin mb-6"></div>
                <p className="text-stone-500 text-[10px] uppercase tracking-[0.4em] font-black mb-12">Verifying Credentials...</p>

                <button
                    onClick={() => { setChecking(false); setStatus('authorized'); }}
                    className="text-[9px] text-stone-600 hover:text-amber-500/50 uppercase tracking-[0.3em] transition-all font-bold opacity-0 animate-in fade-in duration-1000 delay-500 hover:scale-105"
                    style={{ animationDelay: '3s', animationFillMode: 'forwards' }}
                >
                    Taking a while? Click to Enter Anyway
                </button>
            </div>
        )
    }

    // Restriction UI if not started
    if (!isStarted) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center max-w-lg mx-auto animate-in fade-in duration-1000">
                <div className="mb-12">
                    <div className="w-20 h-20 glass border-stone-800 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                        <div className="absolute inset-0 rounded-full bg-red-900/5 animate-pulse"></div>
                        <svg className="w-8 h-8 text-stone-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m0-6V7m0 10c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" />
                        </svg>
                    </div>
                    <h2 className="serif text-4xl text-stone-100 mb-6 font-light">The Sanctuary Gates are Closed</h2>
                    <p className="text-stone-500 text-sm font-light leading-relaxed mb-12 italic max-w-sm mx-auto">
                        The fire has not yet been kindled. The Altar Room will open once the 72-hour prayer chain officially begins.
                    </p>
                </div>

                <div className="p-10 glass rounded-3xl border-stone-800 w-full mb-12">
                    <CountdownTimer targetDate={startDate} />
                </div>

                <button
                    onClick={() => router.push('/')}
                    className="px-8 py-4 border border-white/5 text-stone-500 rounded-2xl uppercase text-[9px] font-bold tracking-[0.2em] hover:bg-white/5 transition-all"
                >
                    Return to the Gates
                </button>
            </div>
        )
    }

    if (status === 'unauthorized') {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center p-4 text-center max-w-sm mx-auto">
                <div className="w-20 h-20 bg-red-900/10 rounded-full flex items-center justify-center mb-8 border border-red-900/20">
                    <svg className="w-8 h-8 text-red-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m0-6V7m0 10c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8z" />
                    </svg>
                </div>
                <h2 className="serif text-2xl text-stone-200 mb-4">Gatekeeper Notice</h2>
                <p className="text-stone-500 text-sm font-light leading-relaxed mb-8 italic">
                    The Altar Room is reserved for active watchmen. You must register for at least one prayer watch to gain entrance.
                </p>
                <button
                    onClick={() => router.push('/schedule')}
                    className="w-full py-4 bg-stone-100 text-[#050505] rounded-2xl uppercase text-[10px] font-black tracking-[0.3em] hover:bg-white transition-all shadow-xl"
                >
                    Visit the Schedule
                </button>
            </div>
        )
    }

    return (
        <div className="relative min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 selection:bg-amber-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] aura-glow rounded-full opacity-40" />
            </div>

            <div className="relative z-10 w-full text-center max-w-lg">
                <div className="mb-12">
                    <div className="w-20 h-20 glass border-white/5 rounded-full flex items-center justify-center mx-auto mb-8 relative shadow-2xl">
                        <div className="absolute inset-0 rounded-full bg-amber-500/10 animate-pulse"></div>
                        <svg
                            className="w-8 h-8 text-amber-500 relative z-10"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 21l-8-18h16l-8 18z" />
                        </svg>
                    </div>

                    <h2 className="serif text-4xl text-stone-100 mb-6 font-light text-balance">
                        {isAutomated && redirecting ? 'Resuming Prayer' : 'Sacred Alignment'}
                    </h2>

                    <p className="text-amber-500/60 text-[10px] tracking-[0.4em] uppercase mb-6 font-black">{ORGANIZATION}</p>

                    <p className="text-stone-400 text-sm max-w-xs mx-auto font-light leading-relaxed italic">
                        {isAutomated && redirecting
                            ? 'Welcome back, intercessor. Opening the sanctuary gates...'
                            : 'You are joining a global assembly. Please enter in silence, yielding to the Presence.'}
                    </p>
                </div>

                {!isAutomated && (
                    <div className="space-y-6 max-w-sm mx-auto">
                        <button
                            onClick={() => setConfirmed(!confirmed)}
                            className={`w-full flex items-center gap-5 p-6 glass rounded-2xl transition-all text-left overflow-hidden border-stone-800
                            ${confirmed ? 'border-amber-500/30 bg-white/5' : 'hover:border-stone-700 hover:bg-white/5'}`}
                        >
                            <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all shrink-0
                            ${confirmed ? 'bg-amber-500 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]' : 'border-stone-700'}`}>
                                {confirmed && (
                                    <svg className="w-4 h-4 text-[#050505]" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                )}
                            </div>
                            <span className={`text-[11px] tracking-[0.2em] uppercase transition-colors font-bold ${confirmed ? 'text-stone-100' : 'text-stone-500'}`}>
                                I enter with a burden for revival.
                            </span>
                        </button>

                        <button
                            onClick={() => handleEnter(false)}
                            disabled={!confirmed || redirecting}
                            className={`w-full py-5 rounded-2xl tracking-[0.4em] uppercase text-[10px] font-black transition-all shadow-2xl
                            ${confirmed && !redirecting
                                    ? 'bg-stone-100 text-[#050505] hover:bg-white shadow-stone-950/50'
                                    : 'bg-white/5 text-stone-700 cursor-not-allowed border border-white/5'}`}
                        >
                            {redirecting ? 'Opening Gate...' : 'Join the Altar'}
                        </button>
                    </div>
                )}

                {isAutomated && redirecting && (
                    <div className="flex flex-col items-center gap-6 mt-8">
                        <div className="w-64 h-px bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-500 animate-progress shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                        </div>
                    </div>
                )}

                <div className="mt-16">
                    <button
                        onClick={() => {
                            localStorage.removeItem(CONFIRMATION_KEY)
                            window.location.reload()
                        }}
                        className="text-[9px] text-stone-700 hover:text-stone-400 uppercase tracking-[0.3em] transition-all font-bold"
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
          animation: progress 1.5s linear forwards;
        }
      `}</style>
        </div>
    )
}
