import { Suspense, lazy, useEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
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
import { prefersReducedMotion } from './lib/hooks'

const Playground = lazy(() => import('./playground/Playground'))

gsap.registerPlugin(ScrollTrigger)

function PlaygroundSection() {
  return (
    <section id="playground" className="section">
      <SectionHeader n="04" eyebrow="Playground 3D"
        title={<>Conduza um experimento <span className="text-gradient">do guia ao resultado</span>.</>}
        lead="Escolha o sítio-alvo, o tipo de Cas, a via de entrega e o reparo; introduza mismatches e veja o efeito no corte e nos off-targets. Use ← → para navegar pelas etapas e P para o modo apresentação." />
      <Suspense fallback={<div className="glass grid h-[72vh] place-items-center rounded-3xl text-mist">Carregando playground…</div>}>
        <Playground />
      </Suspense>
    </section>
  )
}

export default function App() {
  useEffect(() => {
    if (prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      // revelação padrão das peças marcadas com data-reveal
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          y: 40, opacity: 0, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      })
      // linha da timeline cresce conforme o scroll
      const line = document.querySelector<HTMLElement>('[data-timeline-line]')
      if (line) {
        gsap.fromTo(line, { scaleY: 0 }, {
          scaleY: 1, transformOrigin: 'top', ease: 'none',
          scrollTrigger: { trigger: '[data-timeline]', start: 'top 60%', end: 'bottom 80%', scrub: 0.5 },
        })
      }
      // parallax leve nos títulos de seção
      gsap.utils.toArray<HTMLElement>('.section > header').forEach((el) => {
        gsap.to(el, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
    })
    // o conteúdo carregado sob demanda (playground) muda a altura da página
    const t = setTimeout(() => ScrollTrigger.refresh(), 1200)
    return () => { clearTimeout(t); ctx.revert() }
  }, [])

  return (
    <>
      <a href="#o-que-e" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-dna focus:px-4 focus:py-2 focus:font-semibold focus:text-ink">
        Pular para o conteúdo
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
      </main>
      <div className="grain" aria-hidden="true" />
    </>
  )
}
