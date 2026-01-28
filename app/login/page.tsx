'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { auth, signInWithEmailAndPassword } from '@/lib/firebase'

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirectTo = searchParams.get('redirect') || '/'

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!auth) {
            setError('Auth service not available')
            return
        }
        if (!email || !password) {
            setError('Please fill in all fields')
            return
        }

        setLoading(true)
        setError('')

        const timeout = setTimeout(() => {
            if (loading) {
                setLoading(false)
                setError('Login is taking longer than expected. Please check your connection.')
            }
        }, 15000)

        try {
            await signInWithEmailAndPassword(auth, email, password)
            clearTimeout(timeout)
            router.push(redirectTo)
        } catch (err: any) {
            clearTimeout(timeout)
            console.error("Login error:", err)
            setError('Invalid email or password')
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
                <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2.5 font-bold">
                        Email Address
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all text-stone-200 placeholder:text-stone-600 text-sm"
                        placeholder="your@email.com"
                        required
                        autoComplete="email"
                    />
                </div>

                <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] text-stone-500 mb-2.5 font-bold">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-4 pr-12 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all text-stone-200 placeholder:text-stone-600 text-sm"
                            placeholder="••••••••"
                            required
                            autoComplete="current-password"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-400 transition-colors cursor-pointer"
                        >
                            {showPassword ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </button>
                    </div>
                    <div className="flex justify-end mt-2">
                        <Link
                            href="/forgot-password"
                            className="text-xs text-amber-500/70 hover:text-amber-500 transition-colors cursor-pointer"
                        >
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-stone-100 text-[#0a0a0f] py-4 rounded-xl uppercase text-xs font-bold tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-black/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Signing in...
                        </span>
                    ) : (
                        'Sign In'
                    )}
                </button>
            </form>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="relative min-h-screen flex items-center justify-center p-6">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full aura-glow opacity-50" />
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
                <span className="text-xs font-medium hidden sm:inline">Home</span>
            </Link>

            <div className="relative z-10 w-full max-w-md glass-card p-8 md:p-10 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="text-center mb-8">
                    <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                        </svg>
                    </div>
                    <h1 className="font-serif text-2xl md:text-3xl text-stone-100 mb-2">Welcome Back</h1>
                    <p className="text-stone-500 text-sm">Sign in to your watchman profile</p>
                </div>

                <Suspense fallback={
                    <div className="flex items-center justify-center py-12">
                        <div className="w-8 h-8 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
                    </div>
                }>
                    <LoginForm />
                </Suspense>

                <div className="mt-8 pt-6 border-t border-white/[0.06] text-center">
                    <p className="text-sm text-stone-500">
                        New here?{' '}
                        <Link href="/signup" className="text-amber-500 font-medium hover:text-amber-400 transition-colors cursor-pointer">
                            Register as Watchman
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
