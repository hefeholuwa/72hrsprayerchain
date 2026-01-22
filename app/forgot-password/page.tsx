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
        <div className="relative min-h-screen flex items-center justify-center p-4 selection:bg-amber-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] aura-glow rounded-full opacity-50" />
            </div>

            <div className="relative z-10 w-full max-w-md glass p-8 md:p-12 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 border-stone-800 text-center">
                <div className="mb-10">
                    <h1 className="serif text-3xl text-stone-100 mb-2">Reset Password</h1>
                    <p className="text-stone-500 text-[10px] uppercase tracking-[0.3em] font-bold">Restore your watchman credentials</p>
                </div>

                {message ? (
                    <div className="space-y-8">
                        <div className="p-6 bg-emerald-900/10 border border-emerald-900/20 text-emerald-400 text-sm rounded-2xl italic leading-relaxed">
                            {message}
                        </div>
                        <Link
                            href="/login"
                            className="inline-block w-full py-4 bg-stone-100 text-[#050505] rounded-2xl uppercase text-[10px] font-black tracking-[0.3em] hover:bg-white transition-all shadow-xl"
                        >
                            Return to Login
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {error && (
                            <div className="p-4 bg-red-900/10 border border-red-900/20 text-red-400 text-xs rounded-xl">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleReset} className="space-y-8">
                            <div className="text-left">
                                <label className="block text-[9px] uppercase tracking-[0.3em] text-stone-500 mb-2 font-black">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all text-stone-200 placeholder:text-stone-600 text-sm"
                                    placeholder="your@email.com"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-stone-100 text-[#050505] py-4 rounded-2xl uppercase text-[10px] font-black tracking-[0.3em] hover:bg-white transition-all shadow-2xl disabled:opacity-50"
                            >
                                {loading ? 'Sending link...' : 'Send Reset Link'}
                            </button>
                        </form>

                        <div className="pt-4">
                            <Link href="/login" className="text-[10px] uppercase tracking-widest text-stone-500 hover:text-amber-500 transition-colors font-bold">
                                ← Back to Login
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
