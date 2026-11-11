import { useEffect, useRef, useState } from 'react'
import { GROUPS } from '../content/nav'
import { useT } from '../i18n'
import { track } from '../lib/track'
import { STEP_COUNT, useSim } from '../playground/store'

const IDS = ['inicio', ...GROUPS.flatMap((g) => g.items.map(([id]) => id))]
const LABEL = new Map([['inicio', { pt: 'Início', en: 'Home' }], ...GROUPS.flatMap((g) => g.items)])
const SMOOTH = () => (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth') as ScrollBehavior

const el = (i: number) => document.getElementById(IDS[i])
/** Seção atual = a última cujo topo já passou de 40% da tela. */
const current = () => {
  let c = 0
  IDS.forEach((_, i) => {
    const r = el(i)?.getBoundingClientRect()
    if (r && r.top <= innerHeight * 0.4) c = i
  })
  return c
}
const page = (dy: number) => scrollBy({ top: dy * innerHeight * 0.85, behavior: SMOOTH() })

/** Avança (+1) ou volta (-1): passos do 3D, depois "páginas" da seção, depois a próxima seção. */
function move(dir: 1 | -1) {
  const i = current()
  const r = el(i)!.getBoundingClientRect()
  const sim = useSim.getState()
  if (IDS[i] === 'playground' && r.top < innerHeight / 2 && r.bottom > innerHeight / 2) {
    const next = sim.step + dir
    if (next >= 0 && next < STEP_COUNT) return sim.goto(next)
  }
  if (dir === 1) {
    if (r.bottom > innerHeight * 1.15) page(1)
    else el(i + 1)?.scrollIntoView({ behavior: SMOOTH() })
  } else if (r.top < -10) page(-1)
  else if (i > 0) {
    const p = el(i - 1)!
    scrollTo({ top: p.offsetTop + p.offsetHeight - innerHeight, behavior: SMOOTH() })
  }
}

/** Modo slide: o botão do Hero (ou a tecla S) dispara `start-slides`; ←/→ percorrem o site inteiro, 3D incluso. */
export default function Slides() {
  const t = useT()
  const [on, setOn] = useState(false)
  const [idx, setIdx] = useState(0)
  const [idle, setIdle] = useState(false)
  const timer = useRef(0)

  const exit = () => {
    setOn(false)
    if (document.fullscreenElement) void document.exitFullscreen()
  }

  useEffect(() => {
    const start = () => {
      track('slides_start')
      setOn(true)
      el(0)?.scrollIntoView({ behavior: 'instant' })
      void document.documentElement.requestFullscreen?.().catch(() => {})
    }
    const onS = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey && !e.altKey && !(e.target as HTMLElement).closest('input, textarea, select')) start()
    }
    addEventListener('start-slides', start)
    addEventListener('keydown', onS)
    return () => {
      removeEventListener('start-slides', start)
      removeEventListener('keydown', onS)
    }
  }, [])

  useEffect(() => {
    if (!on) return
    document.documentElement.classList.add('slides')
    useSim.getState().set({ presentation: true })
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest('input, textarea, select')) return
      const k = e.key.toLowerCase()
      if (k === 'arrowright' || k === 'pagedown' || (k === ' ' && !e.shiftKey)) move(1)
      else if (k === 'arrowleft' || k === 'pageup' || (k === ' ' && e.shiftKey)) move(-1)
      else if (k === 'home') el(0)?.scrollIntoView({ behavior: SMOOTH() })
      else if (k === 'end') el(IDS.length - 1)?.scrollIntoView({ behavior: SMOOTH() })
      else if (k === 'escape') exit()
      else if (k === 'f') void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())
      else return
      e.preventDefault()
      e.stopPropagation() // captura: o atalho do playground (← → espaço F) não roda junto
    }
    const onScroll = () => setIdx(current())
    const onMove = () => {
      setIdle(false)
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setIdle(true), 3000)
    }
    const onFs = () => !document.fullscreenElement && setOn(false)
    onMove()
    onScroll()
    document.addEventListener('keydown', onKey, true)
    addEventListener('scroll', onScroll, { passive: true })
    addEventListener('mousemove', onMove)
    document.addEventListener('fullscreenchange', onFs)
    return () => {
      document.documentElement.classList.remove('slides')
      useSim.getState().set({ presentation: false })
      document.removeEventListener('keydown', onKey, true)
      removeEventListener('scroll', onScroll)
      removeEventListener('mousemove', onMove)
      document.removeEventListener('fullscreenchange', onFs)
      clearTimeout(timer.current)
    }
  }, [on])

  if (!on) return null
  return (
    <div
      role="status"
      className={`glass fixed bottom-4 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2 text-sm transition-opacity duration-500 ${idle ? 'opacity-0 hover:opacity-100' : ''}`}
    >
      <button type="button" onClick={() => move(-1)} aria-label={t('Anterior', 'Previous')} className="px-2 text-mist hover:text-white">
        ←
      </button>
      <span className="font-mono text-xs text-mist">
        {idx + 1}/{IDS.length}
      </span>
      <span>{t.pick(LABEL.get(IDS[idx])!)}</span>
      <button type="button" onClick={() => move(1)} aria-label={t('Próximo', 'Next')} className="rounded-full bg-dna px-3 py-1 font-semibold text-ink">
        →
      </button>
      <button type="button" onClick={exit} aria-label={t('Sair do modo slide', 'Exit slide mode')} className="text-mist hover:text-white">
        ✕
      </button>
    </div>
  )
}
