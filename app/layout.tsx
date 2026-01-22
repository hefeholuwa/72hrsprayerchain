import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
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
            <body className={`${inter.variable} ${playfair.variable} font-sans min-h-screen flex flex-col selection:bg-amber-500/30 selection:text-stone-100 pb-24 border-stone-900/50`}>
                <FirebaseHeartbeat />
                <Header />
                <main className="flex-1 flex flex-col items-center px-6 pb-20">
                    <div className="max-w-4xl w-full">
                        {children}
                    </div>
                </main>

                <Footer />
            </body>
        </html>
    )
}
