import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import FirebaseHeartbeat from '@/components/FirebaseHeartbeat'

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
})

const playfair = Playfair_Display({
    subsets: ['latin'],
    variable: '--font-playfair',
})

export const metadata: Metadata = {
    title: '72 Hours Prayer & Fasting Chain | Until Revival Comes',
    description: 'Prophetic monthly intercession for the Church and the Nation of Nigeria, hosted by Youth for Christ Movement.',
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" data-scroll-behavior="smooth">
            <body className={`${inter.variable} ${playfair.variable} font-sans min-h-screen bg-[#0a0a0f] text-stone-100 selection:bg-amber-500/30 selection:text-stone-100`}>
                <FirebaseHeartbeat />
                {children}
            </body>
        </html>
    )
}
