import { Suspense, lazy, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import Nav from './components/Nav'
import Cursor from './components/Cursor'
import SectionHeader from './components/SectionHeader'
import Hero from './sections/Hero'
import Intro from './sections/Intro'
import Mechanism from './sections/Mechanism'
import Evolution from './sections/Evolution'
import Paths from './sections/Paths'
import Practices from './sections/Practices'
import Applications from './sections/Applications'
import Ethics from './sections/Ethics'
import Quiz from './sections/Quiz'
import Faq from './sections/Faq'
import Conclusion from './sections/Conclusion'
import About from './sections/About'
import { prefersReducedMotion } from './lib/hooks'
import { loadMotion } from './lib/motion'
import { useMicroInteractions } from './lib/fx'
import { BOOT_TIMEOUT_MS, finishBoot } from './lib/boot'
import { useT } from './i18n'

const Playground = lazy(() => import('./playground/Playground'))

/** Por quanto tempo um link com âncora continua se reposicionando enquanto a página assenta. */
const ANCHOR_SETTLE_MS = 3000

function PlaygroundSection() {
  const t = useT()
  return (
    <section id="playground" className="section">
      <SectionHeader
        n="04"
        eyebrow={t('Playground 3D', '3D Playground')}
        title={
          t.lang === 'en' ? (
            <>
              Run an experiment <span className="text-gradient">from guide to outcome</span>.
            </>
          ) : (
            <>
              Conduza um experimento <span className="text-gradient">do guia ao resultado</span>.
            </>
          )
        }
        lead={t(
          'Escolha o sítio-alvo, o tipo de Cas, a via de entrega e o reparo; introduza mismatches e veja o efeito no corte e nos off-targets. Use ← → para navegar, M para o modo cinema e P para o modo apresentação.',
          'Pick the target site, Cas type, delivery route and repair pathway; introduce mismatches and watch the effect on cutting and off-targets. Use ← → to navigate, M for cinema mode and P for presentation mode.',
        )}
      />
      <Suspense
        fallback={<div className="glass grid h-[74vh] place-items-center rounded-3xl text-mist">{t('Carregando playground…', 'Loading playground…')}</div>}
      >
        <Playground />
      </Suspense>
    </section>
  )
}

export default function App() {
  const t = useT()
  useMicroInteractions()

  // tela de carregamento (index.html): o hero a libera quando o 3D está pronto; aqui fica o limite de segurança
  useEffect(() => {
    const id = setTimeout(finishBoot, BOOT_TIMEOUT_MS)
    return () => clearTimeout(id)
  }, [])

  // Links com âncora (ex.: /#bioetica): o conteúdo entra depois que o navegador já tentou rolar, e a
  // altura acima ainda muda (fontes, playground). Reancora enquanto isso, até alguém rolar a página.
  useEffect(() => {
    const id = decodeURIComponent(location.hash.slice(1))
    const el = id ? document.getElementById(id) : null
    if (!el) return

    let active = true
    let expected = -1
    const stop = () => {
      active = false
    }
    const anchor = () => {
      if (!active) return
      el.scrollIntoView({ behavior: 'instant' })
      expected = Math.round(scrollY)
    }
    // qualquer rolagem que não seja a nossa — do usuário ou de outro script — encerra a correção
    const onScroll = () => {
      if (Math.round(scrollY) !== expected) stop()
    }

    const ro = new ResizeObserver(anchor)
    ro.observe(document.body)
    addEventListener('scroll', onScroll, { passive: true })
    const timer = setTimeout(stop, ANCHOR_SETTLE_MS)
    requestAnimationFrame(anchor)

    return () => {
      stop()
      clearTimeout(timer)
      ro.disconnect()
      removeEventListener('scroll', onScroll)
    }
  }, [])

  // o foco acompanha a âncora clicada (o Lenis rola, mas não move o foco; ex.: "pular para o conteúdo").
  // setTimeout: espera a gaveta do menu fechar e tirar o `inert` do <main>
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const href = (e.target as Element).closest?.('a[href^="#"]')?.getAttribute('href')
      const el = href && href.length > 1 ? document.getElementById(href.slice(1)) : null
      if (!el) return
      if (!el.hasAttribute('tabindex')) {
        el.setAttribute('tabindex', '-1')
        el.dataset.anchor = ''
      }
      setTimeout(() => el.focus({ preventScroll: true }))
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  // rolagem suave sincronizada com o ScrollTrigger (desligada com "reduzir movimento")
  useEffect(() => {
    if (prefersReducedMotion()) return
    let alive = true
    let off = () => {}
    void loadMotion().then(({ gsap, ScrollTrigger, Lenis }) => {
      if (!alive) return
      const lenis = new Lenis({ autoRaf: false, anchors: { offset: -64 }, lerp: 0.12 })
      lenis.on('scroll', ScrollTrigger.update)
      const tick = (time: number) => lenis.raf(time * 1000)
      gsap.ticker.add(tick)
      gsap.ticker.lagSmoothing(0)
      off = () => {
        gsap.ticker.remove(tick)
        lenis.destroy()
      }
    })
    return () => {
      alive = false
      off()
    }
  }, [])

  // revelação ao rolar: IntersectionObserver + transição CSS (não força layout, ao contrário de
  // gatilhos de scroll por elemento) — combina com o content-visibility das seções
  useEffect(() => {
    if (prefersReducedMotion()) return
    const root = document.documentElement
    root.classList.add('motion')
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.classList.add('in')
          io.unobserve(e.target)
        }),
      { rootMargin: '0px 0px -10% 0px' },
    )
    document.querySelectorAll('[data-reveal]:not(.in)').forEach((el) => io.observe(el))

    // linha da timeline cresce conforme o scroll (único gatilho com scrub)
    let alive = true
    let ctx: { revert(): void } | undefined
    let tm: ReturnType<typeof setTimeout> | undefined
    let id: ReturnType<typeof setTimeout> | undefined
    // alturas mudam quando o playground carrega e quando seções com content-visibility são renderizadas
    let refresh = () => {}
    void loadMotion().then(({ gsap, ScrollTrigger }) => {
      if (!alive) return
      ctx = gsap.context(() => {
        const line = document.querySelector<HTMLElement>('[data-timeline-line]')
        if (line) {
          gsap.fromTo(
            line,
            { scaleY: 0 },
            {
              scaleY: 1,
              transformOrigin: 'top',
              ease: 'none',
              scrollTrigger: { trigger: '[data-timeline]', start: 'top 60%', end: 'bottom 80%', scrub: 0.5 },
            },
          )
        }
      })
      refresh = () => {
        clearTimeout(tm)
        tm = setTimeout(() => ScrollTrigger.refresh(), 200)
      }
      id = setTimeout(refresh, 1200)
    })
    const onVis = () => refresh()
    document.addEventListener('contentvisibilityautostatechange', onVis, true)
    return () => {
      alive = false
      io.disconnect()
      clearTimeout(id)
      clearTimeout(tm)
      document.removeEventListener('contentvisibilityautostatechange', onVis, true)
      ctx?.revert()
    }
  }, [t.lang])

  return (
    <>
      <a
        href="#o-que-e"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-dna focus:px-4 focus:py-2 focus:font-semibold focus:text-ink"
      >
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
        <Paths />
        <Practices />
        <Applications />
        <Ethics />
        <Quiz />
        <Faq />
        <Conclusion />
        <About />
      </main>
      <div className="grain" aria-hidden="true" />
      {import.meta.env.VITE_ON_VERCEL === '1' && (
        <>
          <Analytics />
          <SpeedInsights />
        </>
      )}
    </>
  )
}
