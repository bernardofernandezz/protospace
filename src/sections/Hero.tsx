import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { hasWebGL, isSoftwareGL, prefersReducedMotion, useInView } from '../lib/hooks'
import { useT } from '../i18n'
import { SITE } from '../content/site'
import { bootDone, finishBoot } from '../lib/boot'

const HeroHelix = lazy(() => import('../components/HeroHelix'))

/** Número que conta até o valor final quando entra na tela. */
function Counter({ to, from = 0 }: { to: number; from?: number }) {
  const el = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (!el.current) return
    if (prefersReducedMotion()) { el.current.textContent = String(to); return }
    const o = { v: from }
    let tw: gsap.core.Tween | undefined
    let alive = true
    bootDone.then(() => {
      if (alive) tw = gsap.to(o, { v: to, duration: 1.6, ease: 'power3.out', delay: 0.5, onUpdate: () => { if (el.current) el.current.textContent = String(Math.round(o.v)) } })
    })
    return () => { alive = false; tw?.kill() }
  }, [to, from])
  return <span ref={el}>{from}</span>
}

export default function Hero() {
  const t = useT()
  const ref = useRef<HTMLElement>(null)
  const inView = useInView(ref)
  // hélice decorativa só com GPU de verdade (com WebGL por software ela travaria a página)
  const [gl] = useState(() => hasWebGL() && !isSoftwareGL())
  const [still] = useState(prefersReducedMotion)
  const [ready, setReady] = useState(false)

  // sem 3D no hero não há o que esperar: libera a tela de carregamento na hora
  useEffect(() => { if (!gl) finishBoot() }, [gl])

  // animações de entrada só depois que a tela de carregamento sai
  useEffect(() => {
    if (still) return
    let ctx: gsap.Context | undefined
    let alive = true
    bootDone.then(() => {
      if (!alive) return
      ctx = gsap.context(() => {
        gsap.from('[data-hero-word]', { yPercent: 110, duration: 1.1, ease: 'expo.out', stagger: 0.07 })
        gsap.from('[data-hero-rise]', { y: 18, duration: 0.9, ease: 'power3.out' })
        gsap.from('[data-hero-fade]', { y: 20, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.08, delay: 0.35 })
      }, ref)
    })
    return () => { alive = false; ctx?.revert() }
  }, [still, t.lang])

  const words = t.lang === 'en' ? ['Edit', 'the', 'genome.'] : ['Editar', 'o', 'genoma.']
  const stats: [number, number, string][] = [
    [2012, 1990, t('tesoura programável', 'programmable scissors')],
    [2020, 1990, t('Nobel de Química', 'Nobel Prize in Chemistry')],
    [2023, 1990, t('1ª terapia aprovada', '1st approved therapy')],
    [6, 0, t('etapas simuladas em 3D', 'steps simulated in 3D')],
  ]

  return (
    <section id="inicio" ref={ref} className="relative flex min-h-[100svh] items-center overflow-hidden">
      <div className="absolute inset-0">
        {gl && (
          <Suspense fallback={null}>
            <div className={`absolute inset-0 transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}>
              <HeroHelix active={inView} still={still} onReady={() => { setReady(true); finishBoot() }} />
            </div>
          </Suspense>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-ink via-ink/75 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-linear-to-t from-ink to-transparent" />

      <div className="relative mx-auto w-full max-w-7xl px-5 pt-24 pb-16 md:px-10">
        <p className="eyebrow" data-hero-fade>{t('Seminário · Biologia molecular & bioética', 'Seminar · Molecular biology & bioethics')}</p>
        <h1 key={t.lang} className="mt-6 font-display text-[clamp(2.9rem,9.5vw,8.6rem)] font-semibold leading-[0.9] tracking-tighter">
          {words.map((w) => (
            <span key={w}><span className="inline-block overflow-hidden pb-2 align-bottom"><span data-hero-word className="inline-block">{w}</span></span>{' '}</span>
          ))}
          <br />
          <span className="inline-block overflow-hidden pb-2 align-bottom"><span data-hero-word className="text-gradient inline-block">{t('Pensar as consequências.', 'Weigh the consequences.')}</span></span>
        </h1>
        <p className="lead mt-8" data-hero-rise>
          {t('CRISPR-Cas9: como uma defesa bacteriana virou a ferramenta mais versátil da biologia — e o que significa usá-la com rigor científico e responsabilidade ética.',
            'CRISPR-Cas9: how a bacterial defence became biology’s most versatile tool — and what it means to use it with scientific rigour and ethical responsibility.')}
        </p>
        <div className="mt-10 flex flex-wrap gap-4" data-hero-fade>
          <a href="#playground" className="magnetic group inline-flex items-center gap-3 rounded-full bg-dna px-7 py-3.5 font-display font-semibold text-ink shadow-[0_0_40px_rgba(62,240,208,0.35)] transition hover:shadow-[0_0_60px_rgba(62,240,208,0.6)]">
            {t('Explorar o playground 3D', 'Explore the 3D playground')} <span className="transition group-hover:translate-x-1">→</span>
          </a>
          <a href="#o-que-e" className="magnetic glass inline-flex items-center rounded-full px-7 py-3.5 font-display text-white/90 transition hover:bg-white/10">{t('Começar pelo básico', 'Start with the basics')}</a>
        </div>

        <dl className="mt-14 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4" data-hero-fade>
          {stats.map(([n, from, label]) => (
            <div key={label} className="flex flex-col-reverse border-l border-white/15 pl-4">
              <dt className="mt-1 text-xs leading-snug text-mist">{label}</dt>
              <dd className="font-display text-3xl font-semibold tabular-nums text-white md:text-4xl"><span aria-hidden="true"><Counter to={n} from={from} /></span><span className="sr-only">{n}</span></dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 text-sm text-mist/80" data-hero-fade>
          <span className="font-display font-semibold text-white">{SITE.name}</span> · {t('projeto de', 'a project by')} <a href="#sobre" className="text-white underline decoration-dna/50 underline-offset-4 hover:decoration-dna">{SITE.author.name}</a>
        </p>
      </div>
      <a href="#o-que-e" className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-xs text-mist md:flex" aria-label={t('Rolar para a próxima seção', 'Scroll to the next section')}>
        <span className="font-mono uppercase tracking-[0.3em]">{t('role', 'scroll')}</span>
        <span className="h-10 w-px animate-pulse bg-linear-to-b from-dna to-transparent" />
      </a>
    </section>
  )
}
