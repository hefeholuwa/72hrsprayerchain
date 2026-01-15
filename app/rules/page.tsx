import Link from 'next/link'
import { RULES } from '@/lib/constants'

export default function RulesPage() {
    return (
        <div className="relative min-h-[80vh] py-12 px-4 selection:bg-amber-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[30%] right-0 w-[400px] h-[400px] aura-glow rounded-full opacity-30" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto animate-in fade-in duration-1000 slide-in-from-bottom-8">
                <div className="mb-12">
                    <h2 className="serif text-4xl text-stone-100 mb-6 font-light tracking-tight pb-6 border-b border-white/5">
                        Sanctuary Order
                    </h2>

                    <p className="text-stone-500 text-sm italic mb-12 tracking-wide font-light">
                        &quot;God is not the author of confusion but of peace.&quot;
                    </p>

                    <div className="space-y-16">
                        {RULES.map((rule, index) => (
                            <div key={index} className="group relative">
                                <span className="text-[9px] text-amber-500/50 font-black mb-3 block tracking-[0.4em] uppercase">RULE 0{index + 1}</span>
                                <h3 className="text-stone-100 text-xl font-light mb-4 tracking-wide group-hover:text-amber-500 transition-all duration-500 uppercase">{rule.title}</h3>
                                <p className="text-stone-400 leading-relaxed text-sm font-light italic">
                                    {rule.description}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 space-y-6">
                        <Link
                            href="/enter"
                            className="flex items-center justify-center w-full bg-stone-100 hover:bg-white text-[#050505] font-black py-5 px-8 rounded-2xl tracking-[0.3em] uppercase text-[10px] transition-all shadow-2xl shadow-stone-900/50"
                        >
                            I Understand, Continue
                        </Link>
                        <Link
                            href="/"
                            className="flex items-center justify-center w-full text-stone-600 hover:text-stone-400 text-[9px] font-bold tracking-[0.4em] uppercase transition-all"
                        >
                            Back to Altar
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
