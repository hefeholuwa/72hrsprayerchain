'use client'

import { useEffect, useRef, useState } from 'react'

interface GlobalFireProps {
    className?: string
}

export default function GlobalFire({ className = '' }: GlobalFireProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const [mounted, setMounted] = useState(false)

    // Simple local intensity simulation (works without PartyKit)
    const [intensity, setIntensity] = useState(30)

    useEffect(() => {
        setMounted(true)

        // Simulate gentle intensity fluctuation
        const interval = setInterval(() => {
            setIntensity(prev => {
                const change = (Math.random() - 0.5) * 10
                return Math.max(20, Math.min(80, prev + change))
            })
        }, 2000)

        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (!mounted) return

        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animationId: number
        let particles: Array<{
            x: number
            y: number
            size: number
            speedY: number
            opacity: number
            hue: number
        }> = []

        const resize = () => {
            const rect = canvas.getBoundingClientRect()
            canvas.width = rect.width * window.devicePixelRatio
            canvas.height = rect.height * window.devicePixelRatio
            ctx.setTransform(1, 0, 0, 1, 0, 0)
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }

        resize()
        window.addEventListener('resize', resize)

        const createParticle = () => {
            const rect = canvas.getBoundingClientRect()
            const centerX = rect.width / 2
            return {
                x: centerX + (Math.random() - 0.5) * 80,
                y: rect.height,
                size: 2 + Math.random() * 5,
                speedY: 0.8 + Math.random() * 1.5,
                opacity: 0.5 + Math.random() * 0.5,
                hue: 25 + Math.random() * 25 // Orange-amber range
            }
        }

        const animate = () => {
            const rect = canvas.getBoundingClientRect()
            ctx.clearRect(0, 0, rect.width, rect.height)

            // Add new particles based on intensity
            const particleRate = Math.max(1, Math.floor(intensity / 15))
            for (let i = 0; i < particleRate; i++) {
                if (Math.random() < 0.4) {
                    particles.push(createParticle())
                }
            }

            // Update and draw particles
            particles = particles.filter(p => {
                p.y -= p.speedY
                p.opacity -= 0.006
                p.x += (Math.random() - 0.5) * 1.5

                if (p.opacity <= 0 || p.y < 0) return false

                // Core particle
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = `hsla(${p.hue}, 85%, 55%, ${p.opacity})`
                ctx.fill()

                // Glow effect
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2)
                ctx.fillStyle = `hsla(${p.hue}, 85%, 55%, ${p.opacity * 0.25})`
                ctx.fill()

                return true
            })

            // Draw core glow at bottom center
            const glowIntensity = intensity / 100
            const gradient = ctx.createRadialGradient(
                rect.width / 2, rect.height + 20,
                0,
                rect.width / 2, rect.height + 20,
                120 + glowIntensity * 80
            )
            gradient.addColorStop(0, `rgba(245, 158, 11, ${0.4 * glowIntensity})`)
            gradient.addColorStop(0.4, `rgba(180, 83, 9, ${0.2 * glowIntensity})`)
            gradient.addColorStop(1, 'transparent')

            ctx.fillStyle = gradient
            ctx.fillRect(0, 0, rect.width, rect.height)

            animationId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            cancelAnimationFrame(animationId)
            window.removeEventListener('resize', resize)
        }
    }, [mounted, intensity])

    if (!mounted) {
        return (
            <div className={`relative ${className}`}>
                <div className="w-full h-48 md:h-64 bg-gradient-to-t from-amber-900/20 to-transparent" />
            </div>
        )
    }

    return (
        <div className={`relative ${className}`}>
            <canvas
                ref={canvasRef}
                className="w-full h-48 md:h-64"
                style={{ display: 'block' }}
            />
        </div>
    )
}
