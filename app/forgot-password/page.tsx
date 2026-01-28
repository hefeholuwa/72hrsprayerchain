'use client'

import { useState } from 'react'
import Link from 'next/link'
import { auth, sendPasswordResetEmail } from '@/lib/firebase'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!auth) {
            setError('Auth service not available')
            return
        }
        if (!email) {
            setError('Please enter your email address')
            return
        }

        setLoading(true)
        setError('')
        setMessage('')

        try {
            await sendPasswordResetEmail(auth, email)
            setMessage('A password reset link has been sent to your email address.')
            setLoading(false)
        } catch (err: any) {
            console.error("Password reset error:", err)
            setError('Failed to send reset email. Please check the address and try again.')
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-6">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full aura-glow opacity-50" />
                <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3QgZmlsdGVyPSJ1cmwoI2EpIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+PC9zdmc+')]" />
            </div>

            {/* Back Link */}
            <Link
                href="/login"
                className="fixed top-6 left-6 flex items-center gap-2 text-stone-600 hover:text-stone-400 transition-colors z-50 cursor-pointer"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-xs font-medium hidden sm:inline">Back to Login</span>
            </Link>

            <div className="relative z-10 w-full max-w-md glass-card p-8 md:p-10 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 text-center">
                <div className="mb-8">
                    <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                    </div>
                    <h1 className="font-serif text-2xl md:text-3xl text-stone-100 mb-2">Reset Password</h1>
                    <p className="text-stone-500 text-sm">Restore your watchman credentials</p>
                </div>

                {message ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-sm text-emerald-300 text-left leading-relaxed">{message}</p>
                        </div>
                        <Link
                            href="/login"
                            className="block w-full py-4 bg-stone-100 text-[#0a0a0f] rounded-xl uppercase text-xs font-bold tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-black/30 cursor-pointer"
                        >
                            Return to Login
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 text-left">
                                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleReset} className="space-y-6">
                            <div className="text-left">
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

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-stone-100 text-[#0a0a0f] py-4 rounded-xl uppercase text-xs font-bold tracking-[0.2em] hover:bg-white transition-all shadow-xl shadow-black/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Sending...
                                    </span>
                                ) : (
                                    'Send Reset Link'
                                )}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
