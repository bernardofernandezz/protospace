import { useEffect, useRef, useState } from 'react'
import { useLang, useT, type L } from '../i18n'
import { SITE } from '../content/site'

type Item = [id: string, label: L]
const GROUPS: { label: L; items: Item[] }[] = [
  { label: { pt: 'Ciência', en: 'Science' }, items: [['o-que-e', { pt: 'O que é', en: 'What it is' }], ['como-funciona', { pt: 'Como funciona', en: 'How it works' }], ['evolucao', { pt: 'Evolução', en: 'Evolution' }]] },
  { label: { pt: 'Playground 3D', en: '3D Playground' }, items: [['playground', { pt: 'Playground', en: 'Playground' }]] },
  { label: { pt: 'Prática', en: 'Practice' }, items: [['boas-praticas', { pt: 'Boas práticas', en: 'Best practices' }], ['aplicacoes', { pt: 'Aplicações', en: 'Applications' }]] },
  { label: { pt: 'Sociedade', en: 'Society' }, items: [['bioetica', { pt: 'Bioética', en: 'Bioethics' }], ['quiz', { pt: 'Quiz', en: 'Quiz' }]] },
  { label: { pt: 'Recursos', en: 'Resources' }, items: [['faq', { pt: 'FAQ', en: 'FAQ' }], ['referencias', { pt: 'Referências', en: 'References' }], ['sobre', { pt: 'Sobre o projeto', en: 'About' }]] },
]
const IDS = ['inicio', ...GROUPS.flatMap((g) => g.items.map(([id]) => id))]

const GitHub = () => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-current" aria-hidden="true"><path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.62 1.58.23 2.75.11 3.04.74.8 1.18 1.83 1.18 3.08 0 4.41-2.69 5.38-5.25 5.66.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" /></svg>
)

function LangToggle() {
  const { lang, setLang } = useLang()
  return (
    <div className="flex rounded-full bg-white/5 p-0.5 text-xs font-semibold ring-1 ring-white/10" role="group" aria-label="Idioma / Language">
      {(['pt', 'en'] as const).map((l) => (
        <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l} lang={l === 'pt' ? 'pt-BR' : 'en'}
          className={`rounded-full px-2.5 py-1 uppercase transition ${lang === l ? 'bg-dna text-ink' : 'text-mist hover:text-white'}`}>{l}</button>
      ))}
    </div>
  )
}

export default function Nav() {
  const t = useT()
  const [active, setActive] = useState('inicio')
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const bar = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    IDS.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el) })
    // barra de progresso escrita direto no DOM (sem re-render a cada scroll)
    const onScroll = () => {
      const h = document.documentElement
      if (bar.current) bar.current.style.transform = `scaleX(${h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)})`
      setScrolled(h.scrollTop > 40)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [open])

  const groupOf = (id: string) => GROUPS.findIndex((g) => g.items.some(([i]) => i === id))

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className={`transition-colors duration-500 ${scrolled || open ? 'glass border-x-0! border-t-0!' : 'border-b border-transparent'}`}>
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-5 md:px-10" aria-label={t('Seções', 'Sections')}>
          <a href="#inicio" className="flex shrink-0 items-center gap-2 font-display font-semibold tracking-tight">
            <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true"><path d="M9 2c0 9 14 10 14 18s-14 9-14 10M23 2c0 9-14 10-14 18s14 9 14 10" stroke="#3ef0d0" strokeWidth="2.5" fill="none" /></svg>
            <span>Proto<span className="text-dna">space</span></span>
          </a>

          <ul className="hidden items-center gap-1 lg:flex">
            {GROUPS.map((g, gi) => {
              const on = groupOf(active) === gi
              if (g.items.length === 1) {
                const [id] = g.items[0]
                return (
                  <li key={id}>
                    <a href={`#${id}`} aria-current={on ? 'true' : undefined} className={`relative block rounded-lg px-3 py-1.5 text-sm transition ${on ? 'text-white' : 'text-mist hover:text-white'}`}>
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-cas align-middle shadow-[0_0_8px_#ff4fa3]" />{t.pick(g.label)}
                      {on && <span className="absolute inset-x-3 -bottom-0.5 h-px bg-linear-to-r from-dna to-cas" />}
                    </a>
                  </li>
                )
              }
              return (
                <li key={gi} className="group relative">
                  <button type="button" aria-haspopup="true" className={`relative flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm transition ${on ? 'text-white' : 'text-mist hover:text-white'}`}>
                    {t.pick(g.label)}
                    <svg viewBox="0 0 12 12" className="h-3 w-3 opacity-60 transition group-focus-within:rotate-180 group-hover:rotate-180" aria-hidden="true"><path d="M3 4.5 6 7.5 9 4.5" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                    {on && <span className="absolute inset-x-3 -bottom-0.5 h-px bg-linear-to-r from-dna to-cas" />}
                  </button>
                  <ul className="invisible absolute left-0 top-full min-w-48 translate-y-1 rounded-2xl border border-white/10 bg-ink/95 p-1.5 opacity-0 shadow-2xl backdrop-blur-xl transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                    {g.items.map(([id, label]) => (
                      <li key={id}>
                        <a href={`#${id}`} aria-current={active === id ? 'true' : undefined}
                          className={`block rounded-xl px-3 py-2 text-sm transition ${active === id ? 'bg-white/10 text-white' : 'text-mist hover:bg-white/5 hover:text-white'}`}>{t.pick(label)}</a>
                      </li>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center gap-2">
            <LangToggle />
            <a href={SITE.repo} target="_blank" rel="noreferrer noopener" className="hud-btn hidden text-mist hover:text-white sm:inline-flex" aria-label={t('Código no GitHub', 'Source on GitHub')}><GitHub /></a>
            <button type="button" className="hud-btn lg:hidden" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(!open)}>
              <span aria-hidden="true" className="relative block h-3 w-5">
                <span className={`absolute left-0 h-0.5 w-5 rounded bg-white transition ${open ? 'top-1.5 rotate-45' : 'top-0'}`} />
                <span className={`absolute left-0 top-1.5 h-0.5 w-5 rounded bg-white transition ${open ? 'opacity-0' : ''}`} />
                <span className={`absolute left-0 h-0.5 w-5 rounded bg-white transition ${open ? 'top-1.5 -rotate-45' : 'top-3'}`} />
              </span>
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </nav>
      </div>
      <div ref={bar} className="h-[2px] origin-left bg-linear-to-r from-dna via-bio to-cas" style={{ transform: 'scaleX(0)' }} aria-hidden="true" />

      {/* drawer mobile */}
      <div id="menu" className={`fixed inset-x-0 bottom-0 top-14 overflow-y-auto bg-ink/97 px-6 pb-10 pt-6 backdrop-blur-xl transition duration-300 lg:hidden ${open ? 'visible opacity-100' : 'invisible -translate-y-2 opacity-0'}`}>
        {GROUPS.map((g) => (
          <div key={g.label.pt} className="mb-6">
            <p className="hud-label">{t.pick(g.label)}</p>
            <ul className="mt-2">
              {g.items.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} onClick={() => setOpen(false)} aria-current={active === id ? 'true' : undefined}
                    className={`block border-b border-white/5 py-3 font-display text-2xl transition ${active === id ? 'text-dna' : 'text-white/90'}`}>{t.pick(label)}</a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <a href={SITE.repo} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-2 text-mist"><GitHub /> GitHub</a>
      </div>
    </header>
  )
}
