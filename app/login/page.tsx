'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { auth, signInWithEmailAndPassword } from '@/lib/firebase'

function LoginForm() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
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
                <div className="p-4 bg-red-900/20 border border-red-900/30 text-red-400 text-xs rounded-xl animate-in fade-in duration-300">
                    {error}
                </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
                <div>
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

                <div>
                    <label className="block text-[9px] uppercase tracking-[0.3em] text-stone-500 mb-2 font-black">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all text-stone-200 placeholder:text-stone-600 text-sm"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-stone-100 text-[#050505] py-4 rounded-2xl uppercase text-[10px] font-black tracking-[0.3em] hover:bg-white transition-all shadow-2xl shadow-stone-900/50 disabled:opacity-50"
                >
                    {loading ? 'Logging in...' : 'Sign In'}
                </button>
            </form>
        </div>
    )
}

export default function LoginPage() {
    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 selection:bg-amber-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] aura-glow rounded-full opacity-50" />
            </div>

            <div className="relative z-10 w-full max-w-md glass p-8 md:p-12 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 border-stone-800">
                <div className="text-center mb-10">
                    <h1 className="serif text-3xl text-stone-100 mb-2">Welcome Back</h1>
                    <p className="text-stone-500 text-[10px] uppercase tracking-[0.3em] font-bold">Log in to your watchman profile</p>
                </div>

                <Suspense fallback={<div className="text-stone-500 text-center py-8 font-light italic tracking-widest uppercase text-[10px]">Preparing Light...</div>}>
                    <LoginForm />
                </Suspense>

                <div className="mt-10 text-center">
                    <p className="text-xs text-stone-500 font-light">
                        New here? {' '}
                        <Link href="/signup" className="text-amber-500 font-bold hover:underline underline-offset-8 transition-all">
                            Register as Watchman
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
