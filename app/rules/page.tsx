import Link from 'next/link'
import { RULES } from '@/lib/constants'

export default function RulesPage() {
    return (
        <div className="relative min-h-screen">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full aura-glow opacity-30" />
                <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3QgZmlsdGVyPSJ1cmwoI2EpIiBoZWlnaHQ9IjEwMCUiIHdpZHRoPSIxMDAlIi8+PC9zdmc+')]" />
            </div>

            {/* Fixed Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.04]">
                <div className="max-w-2xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-stone-500 hover:text-stone-300 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        <span className="text-xs font-medium hidden sm:inline">Back</span>
                    </Link>

                    <h1 className="font-serif text-lg md:text-xl text-stone-100 font-light">Sanctuary Order</h1>

                    <div className="w-16" />
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 pt-24 pb-16 px-4 md:px-8">
                <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Intro */}
                    <div className="text-center mb-12">
                        <p className="text-stone-500 text-sm italic">
                            &quot;God is not the author of confusion but of peace.&quot;
                        </p>
                    </div>

                    {/* Rules List */}
                    <div className="space-y-8">
                        {RULES.map((rule, index) => (
                            <div
                                key={index}
                                className="glass-card p-6 md:p-8 rounded-2xl group hover:border-amber-500/20 transition-all"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className="flex items-start gap-5">
                                    {/* Number */}
                                    <div className="w-10 h-10 shrink-0 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                        <span className="text-sm font-bold text-amber-500">
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <h3 className="text-lg text-stone-100 font-medium mb-2 group-hover:text-amber-500 transition-colors">
                                            {rule.title}
                                        </h3>
                                        <p className="text-stone-400 text-sm leading-relaxed font-light">
                                            {rule.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-12 space-y-3">
                        <Link
                            href="/enter"
                            className="flex items-center justify-center w-full bg-stone-100 hover:bg-white text-[#0a0a0f] font-bold py-4 rounded-xl tracking-[0.15em] uppercase text-xs transition-all shadow-xl shadow-black/30"
                        >
                            I Understand, Continue
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center justify-center w-full py-3 text-stone-600 hover:text-stone-400 text-xs font-medium tracking-wide transition-colors"
                        >
                            ← Return Home
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    )
}
