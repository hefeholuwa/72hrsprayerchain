'use client'

// Firebase configuration and helpers for client-side usage

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import {
  getAuth,
  Auth,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth'
import {
  getFirestore,
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
  Firestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore'
import { useEffect } from 'react'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Safety check to prevent app crashes on invalid keys
export const isConfigValid = !!firebaseConfig.apiKey && firebaseConfig.apiKey !== "AIzaSyDummyKey" && !firebaseConfig.apiKey.includes("Dummy")

let app: FirebaseApp | undefined
let auth: Auth | undefined
let db: Firestore | undefined
let isFirebaseAvailable = false

if (typeof window !== 'undefined') {
  try {
    if (isConfigValid) {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
      auth = getAuth(app)
      db = getFirestore(app)
      isFirebaseAvailable = true
    }
  } catch (error) {
    console.warn("Firebase initialization failed. Falling back to simulated mode.", error)
  }
}

export {
  auth,
  db,
  isFirebaseAvailable,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  firebaseOnAuthStateChanged as onAuthStateChanged
}

// Helper for real-time presence count with error handling
// Refactored: Fetch all active sessions and allow client to filter by expiry for true real-time reactivity
export const subscribeToPresence = (callback: (sessions: any[]) => void) => {
  if (!isFirebaseAvailable || !db) return () => { }

  const q = collection(db, "active_sessions")
  return onSnapshot(q,
    (snapshot) => callback(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))),
    (error) => console.warn("Presence sync failed.", error)
  )
}

// Helper for recent activity with error handling
export const subscribeToActivity = (callback: (activity: any[]) => void) => {
  if (!isFirebaseAvailable || !db) return () => { }

  const q = query(collection(db, "activity"), orderBy("timestamp", "desc"), limit(1))
  return onSnapshot(q,
    (snapshot) => callback(snapshot.docs.map(d => d.data())),
    (error) => console.warn("Activity sync failed.", error)
  )
}

// Global presence heartbeat hook
export const usePresenceHeartbeat = () => {
  useEffect(() => {
    if (!isFirebaseAvailable || !db || !auth) return

    let interval: NodeJS.Timeout

    const updateHeartbeat = async () => {
      const user = auth?.currentUser
      if (!user || !db) return

      try {
        const docRef = doc(db, "active_sessions", user.uid)
        // Sessions expire in 60 seconds
        const expiry = Date.now() + 60000
        await setDoc(docRef, {
          userId: user.uid,
          expiry: expiry, // Store as number for easier client-side comparison
          lastSeen: serverTimestamp()
        })
      } catch (e) {
        console.warn("Heartbeat update failed", e)
      }
    }

    // Initial and periodic updates
    const authUnsub = auth.onAuthStateChanged((u) => {
      if (u) {
        updateHeartbeat()
        if (interval) clearInterval(interval)
        interval = setInterval(updateHeartbeat, 30000)
      } else {
        if (interval) clearInterval(interval)
      }
    })

    // Immediate trigger on mount if already authed
    if (auth.currentUser) {
      updateHeartbeat()
    }

    return () => {
      authUnsub()
      if (interval) clearInterval(interval)

      // Cleanup on unmount
      const user = auth?.currentUser
      if (user && db) {
        const docRef = doc(db, "active_sessions", user.uid)
        deleteDoc(docRef).catch(() => { })
      }
    }
  }, [])
}
