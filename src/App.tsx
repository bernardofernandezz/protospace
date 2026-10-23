import { Suspense, lazy, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Nav from './components/Nav'
import Cursor from './components/Cursor'
import SectionHeader from './components/SectionHeader'
import Hero from './sections/Hero'
import Intro from './sections/Intro'
import Mechanism from './sections/Mechanism'
import Evolution from './sections/Evolution'
import Practices from './sections/Practices'
import Applications from './sections/Applications'
import Ethics from './sections/Ethics'
import Quiz from './sections/Quiz'
import Faq from './sections/Faq'
import Conclusion from './sections/Conclusion'
import About from './sections/About'
import { prefersReducedMotion } from './lib/hooks'
import { useMicroInteractions } from './lib/fx'
import { useT } from './i18n'

const Playground = lazy(() => import('./playground/Playground'))

gsap.registerPlugin(ScrollTrigger)

function PlaygroundSection() {
  const t = useT()
  return (
    <section id="playground" className="section">
      <SectionHeader n="04" eyebrow={t('Playground 3D', '3D Playground')}
        title={t.lang === 'en' ? <>Run an experiment <span className="text-gradient">from guide to outcome</span>.</> : <>Conduza um experimento <span className="text-gradient">do guia ao resultado</span>.</>}
        lead={t('Escolha o sítio-alvo, o tipo de Cas, a via de entrega e o reparo; introduza mismatches e veja o efeito no corte e nos off-targets. Use ← → para navegar, M para o modo cinema e P para o modo apresentação.',
          'Pick the target site, Cas type, delivery route and repair pathway; introduce mismatches and watch the effect on cutting and off-targets. Use ← → to navigate, M for cinema mode and P for presentation mode.')} />
      <Suspense fallback={<div className="glass grid h-[74vh] place-items-center rounded-3xl text-mist">{t('Carregando playground…', 'Loading playground…')}</div>}>
        <Playground />
      </Suspense>
    </section>
  )
}

export default function App() {
  const t = useT()
  useMicroInteractions()

  // pré-carregador inline (index.html): some assim que o app monta
  useEffect(() => {
    const el = document.getElementById('boot')
    if (!el) return
    el.classList.add('boot-out')
    const id = setTimeout(() => el.remove(), 700)
    return () => clearTimeout(id)
  }, [])

  // rolagem suave sincronizada com o ScrollTrigger (desligada com "reduzir movimento")
  useEffect(() => {
    if (prefersReducedMotion()) return
    const lenis = new Lenis({ autoRaf: false, anchors: { offset: -64 }, lerp: 0.12 })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    return () => { gsap.ticker.remove(tick); lenis.destroy() }
  }, [])

  // revelação ao rolar: IntersectionObserver + transição CSS (não força layout, ao contrário de
  // gatilhos de scroll por elemento) — combina com o content-visibility das seções
  useEffect(() => {
    if (prefersReducedMotion()) return
    const root = document.documentElement
    root.classList.add('motion')
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return
      e.target.classList.add('in')
      io.unobserve(e.target)
    }), { rootMargin: '0px 0px -10% 0px' })
    document.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => io.observe(el))

    // linha da timeline cresce conforme o scroll (único gatilho com scrub)
    const ctx = gsap.context(() => {
      const line = document.querySelector<HTMLElement>('[data-timeline-line]')
      if (line) {
        gsap.fromTo(line, { scaleY: 0 }, {
          scaleY: 1, transformOrigin: 'top', ease: 'none',
          scrollTrigger: { trigger: '[data-timeline]', start: 'top 60%', end: 'bottom 80%', scrub: 0.5 },
        })
      }
    })
    // alturas mudam quando o playground carrega e quando seções com content-visibility são renderizadas
    let tm: ReturnType<typeof setTimeout> | undefined
    const refresh = () => { clearTimeout(tm); tm = setTimeout(() => ScrollTrigger.refresh(), 200) }
    const id = setTimeout(refresh, 1200)
    document.addEventListener('contentvisibilityautostatechange', refresh, true)
    return () => { io.disconnect(); clearTimeout(id); clearTimeout(tm); document.removeEventListener('contentvisibilityautostatechange', refresh, true); ctx.revert() }
  }, [t.lang])

  return (
    <>
      <a href="#o-que-e" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-dna focus:px-4 focus:py-2 focus:font-semibold focus:text-ink">
        {t('Pular para o conteúdo', 'Skip to content')}
      </a>
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <Intro />
        <Mechanism />
        <Evolution />
        <PlaygroundSection />
        <Practices />
        <Applications />
        <Ethics />
        <Quiz />
        <Faq />
        <Conclusion />
        <About />
      </main>
      <div className="grain" aria-hidden="true" />
      {import.meta.env.VITE_ON_VERCEL === '1' && <><Analytics /><SpeedInsights /></>}
    </>
  )
}
