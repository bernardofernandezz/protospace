import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { hasWebGL, prefersReducedMotion, useInView } from '../lib/hooks'

const HeroHelix = lazy(() => import('../components/HeroHelix'))

export default function Hero() {
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref)
  const [gl] = useState(hasWebGL)
  const [still] = useState(prefersReducedMotion)

  useEffect(() => {
    if (still) return
    const ctx = gsap.context(() => {
      gsap.from('[data-hero-word]', { yPercent: 110, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.08, delay: 0.15 })
      gsap.from('[data-hero-fade]', { y: 24, opacity: 0, duration: 1, ease: 'power3.out', stagger: 0.12, delay: 0.7 })
    }, ref)
    return () => ctx.revert()
  }, [still])

  return (
    <section id="inicio" ref={ref} className="relative flex min-h-[100svh] items-center overflow-hidden">
      <div className="absolute inset-0">
        {gl && (
          <Suspense fallback={null}>
            <HeroHelix active={inView} still={still} />
          </Suspense>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-ink via-ink/70 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-linear-to-t from-ink to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pt-20 md:px-10">
        <p className="eyebrow" data-hero-fade>Seminário · Biologia molecular &amp; bioética</p>
        <h1 className="mt-6 font-display text-[clamp(3rem,10vw,9rem)] font-semibold leading-[0.9] tracking-tighter">
          {['Editar', 'o', 'genoma.'].map((w) => (
            <span key={w} className="mr-[0.22em] inline-block overflow-hidden pb-2 align-bottom"><span data-hero-word className="inline-block">{w}</span></span>
          ))}
          <br />
          <span className="inline-block overflow-hidden pb-2 align-bottom"><span data-hero-word className="text-gradient inline-block">Pensar as consequências.</span></span>
        </h1>
        <p className="lead mt-8" data-hero-fade>
          CRISPR-Cas9: como uma defesa bacteriana virou a ferramenta mais versátil da biologia — e o que significa usá-la com rigor científico e responsabilidade ética.
        </p>
        <div className="mt-10 flex flex-wrap gap-4" data-hero-fade>
          <a href="#playground" className="group inline-flex items-center gap-3 rounded-full bg-dna px-7 py-3.5 font-display font-semibold text-ink shadow-[0_0_40px_rgba(62,240,208,0.35)] transition hover:shadow-[0_0_60px_rgba(62,240,208,0.6)]">
            Explorar o playground <span className="transition group-hover:translate-x-1">→</span>
          </a>
          <a href="#o-que-e" className="glass inline-flex items-center rounded-full px-7 py-3.5 font-display text-white/90 transition hover:bg-white/10">Começar pelo básico</a>
        </div>
      </div>
      <a href="#o-que-e" className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-mist md:flex" aria-label="Rolar para a próxima seção">
        <span className="font-mono uppercase tracking-[0.3em]">role</span>
        <span className="h-10 w-px animate-pulse bg-linear-to-b from-dna to-transparent" />
      </a>
    </section>
  )
}
