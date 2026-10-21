import { useEffect, useState } from 'react'

export const SECTIONS = [
  ['inicio', 'Início'], ['o-que-e', 'O que é'], ['como-funciona', 'Como funciona'], ['evolucao', 'Evolução'],
  ['playground', 'Playground'], ['boas-praticas', 'Boas práticas'], ['aplicacoes', 'Aplicações'],
  ['bioetica', 'Bioética'], ['quiz', 'Quiz'], ['faq', 'FAQ'], ['referencias', 'Referências'],
] as const

export default function Nav() {
  const [active, setActive] = useState('inicio')
  const [progress, setProgress] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el) })
    const onScroll = () => {
      const h = document.documentElement
      setProgress(h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => { io.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [])

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="glass border-x-0! border-t-0!">
        <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 md:px-10" aria-label="Seções">
          <a href="#inicio" className="flex items-center gap-2 font-display font-semibold tracking-tight">
            <svg viewBox="0 0 32 32" className="h-6 w-6" aria-hidden="true"><path d="M9 2c0 9 14 10 14 18s-14 9-14 10M23 2c0 9-14 10-14 18s14 9 14 10" stroke="#3ef0d0" strokeWidth="2.5" fill="none" /></svg>
            CRISPR<span className="text-cas">·</span>Cas9
          </a>
          <button type="button" className="hud-btn lg:hidden" aria-expanded={open} aria-controls="menu" onClick={() => setOpen(!open)}>
            {open ? '✕' : '☰'} <span className="sr-only">Menu</span>
          </button>
          <ul id="menu" className={`${open ? 'flex' : 'hidden'} absolute left-0 right-0 top-14 flex-col gap-1 bg-ink/95 p-4 lg:static lg:flex lg:flex-row lg:bg-transparent lg:p-0`}>
            {SECTIONS.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} onClick={() => setOpen(false)} aria-current={active === id ? 'true' : undefined}
                  className={`relative block rounded-lg px-2.5 py-1.5 text-sm transition ${active === id ? 'text-white' : 'text-mist hover:text-white'}`}>
                  {label}
                  {active === id && <span className="absolute inset-x-2.5 -bottom-0.5 h-px bg-linear-to-r from-dna to-cas" />}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="h-[2px] origin-left bg-linear-to-r from-dna via-bio to-cas" style={{ transform: `scaleX(${progress})` }} role="progressbar" aria-label="Progresso de leitura" aria-valuenow={Math.round(progress * 100)} aria-valuemin={0} aria-valuemax={100} />
    </header>
  )
}
