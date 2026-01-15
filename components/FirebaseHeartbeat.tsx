'use client'

import { usePresenceHeartbeat } from '@/lib/firebase'

export default function FirebaseHeartbeat() {
    usePresenceHeartbeat()
    return null
}
