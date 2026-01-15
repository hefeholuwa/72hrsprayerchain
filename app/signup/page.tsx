'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { auth, db, createUserWithEmailAndPassword } from '@/lib/firebase'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { APP_NAME } from '@/lib/constants'

export default function SignupPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [country, setCountry] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!auth) {
            setError('Auth service not available')
            return
        }
        if (!name || !email || !password || !country) {
            setError('Please fill in all fields')
            return
        }

        setLoading(true)
        setError('')

        // Add a safety timeout to prevent infinite "REGISTERING..." state
        const timeout = setTimeout(() => {
            if (loading) {
                setLoading(false)
                setError('Registration is taking longer than expected. Please check your connection or try again.')
            }
        }, 15000)

        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const user = userCredential.user

            // Set display name in Auth profile
            const { updateProfile } = await import('firebase/auth')
            await updateProfile(user, { displayName: name })

            // 2. Save additional details to Firestore
            if (db) {
                try {
                    await setDoc(doc(db, "users", user.uid), {
                        uid: user.uid,
                        name,
                        email: user.email,
                        location: country,
                        createdAt: serverTimestamp(),
                        lastLogin: serverTimestamp()
                    })

                    // Log activity
                    const { addDoc, collection } = await import('firebase/firestore')
                    await addDoc(collection(db, "activity"), {
                        userName: name,
                        type: "registration",
                        timestamp: serverTimestamp(),
                        location: country
                    })
                } catch (firestoreErr: any) {
                    console.error("Firestore persistence failed:", firestoreErr)
                }
            }

            clearTimeout(timeout)
            // 3. Redirect to landing page
            router.push('/')
        } catch (err: any) {
            clearTimeout(timeout)
            console.error("Signup error:", err)
            let msg = 'Failed to create account'
            if (err.code === 'auth/email-already-in-use') msg = 'This email is already registered.'
            if (err.code === 'auth/weak-password') msg = 'Password should be at least 6 characters.'
            setError(err.message || msg)
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex items-center justify-center p-4 selection:bg-amber-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] aura-glow rounded-full opacity-50" />
            </div>

            <div className="relative z-10 w-full max-w-md glass p-8 md:p-12 rounded-3xl animate-in fade-in slide-in-from-bottom-4 duration-700 border-stone-800">
                <div className="text-center mb-10">
                    <h1 className="serif text-3xl text-stone-100 mb-2">Join the Wall</h1>
                    <p className="text-stone-500 text-[10px] uppercase tracking-[0.3em] font-bold">Create your watchman profile</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-900/20 border border-red-900/30 text-red-400 text-xs rounded-xl">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSignup} className="space-y-6">
                    <div>
                        <label className="block text-[9px] uppercase tracking-[0.3em] text-stone-500 mb-2 font-black">Full Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all text-stone-200 placeholder:text-stone-600 text-sm"
                            placeholder="e.g. Ifeanyi Chuka"
                            required
                        />
                    </div>

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
                        <label className="block text-[9px] uppercase tracking-[0.3em] text-stone-500 mb-2 font-black">Country / Location</label>
                        <input
                            type="text"
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="w-full p-4 bg-white/5 border border-white/5 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500/50 transition-all text-stone-200 placeholder:text-stone-600 text-sm"
                            placeholder="e.g. Nigeria"
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
                        {loading ? 'Registering...' : 'Register as Watchman'}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-xs text-stone-500 font-light">
                        Already registered? {' '}
                        <Link href="/login" className="text-amber-500 font-bold hover:underline underline-offset-8 transition-all">
                            Log In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
