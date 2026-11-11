import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useT } from '../i18n'
import { hasWebGL } from '../lib/hooks'
import { H, W } from './layouts'
import { buildSlides } from './slides'

const HeroHelix = lazy(() => import('../components/HeroHelix'))
const SimStage = lazy(() => import('./SimStage'))

/**
 * Modo slide: um deck próprio, sem relação com o layout ou o estado do site.
 * Cada slide é desenhado num palco de 1920×1080 escalado para a tela; os fundos 3D ficam numa
 * camada à parte (um canvas por vez) e permanecem montados entre slides do mesmo tipo.
 */
export default function Deck({ onExit }: { onExit: () => void }) {
  const t = useT()
  const slides = useMemo(() => buildSlides(t), [t])
  const [pos, setPos] = useState({ i: 0, step: 0 })
  const [idle, setIdle] = useState(false)
  const [size, setSize] = useState({ w: innerWidth, h: innerHeight })
  const root = useRef<HTMLDivElement>(null)
  const slide = slides[Math.min(pos.i, slides.length - 1)]

  // a ref guarda o estado atual para o handler de teclado, que é registrado uma vez só
  const live = useRef({ pos, slides, onExit })
  live.current = { pos, slides, onExit }

  useEffect(() => {
    const go = (dir: 1 | -1) =>
      setPos(({ i, step }) => {
        const { slides: S } = live.current
        const steps = S[i].steps ?? 1
        if (dir === 1) return step < steps - 1 ? { i, step: step + 1 } : i < S.length - 1 ? { i: i + 1, step: 0 } : { i, step }
        if (step > 0) return { i, step: step - 1 }
        return i > 0 ? { i: i - 1, step: (S[i - 1].steps ?? 1) - 1 } : { i, step }
      })
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 'arrowright' || k === 'pagedown' || k === 'enter' || (k === ' ' && !e.shiftKey)) go(1)
      else if (k === 'arrowleft' || k === 'pageup' || (k === ' ' && e.shiftKey)) go(-1)
      else if (k === 'home') setPos({ i: 0, step: 0 })
      else if (k === 'end') setPos({ i: live.current.slides.length - 1, step: 0 })
      else if (k === 'escape') live.current.onExit()
      else if (k === 'f') void (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.())
      // as demais teclas também não chegam ao site (atalhos do playground, busca etc.)
      e.stopPropagation()
      if (k !== 'tab') e.preventDefault()
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }
    let timer = 0
    const onMove = () => {
      setIdle(false)
      clearTimeout(timer)
      timer = window.setTimeout(() => setIdle(true), 3000)
    }
    const onResize = () => setSize({ w: innerWidth, h: innerHeight })
    const onFs = () => !document.fullscreenElement && live.current.onExit()
    document.addEventListener('keydown', onKey, true)
    root.current?.addEventListener('wheel', onWheel, { passive: false })
    addEventListener('mousemove', onMove)
    addEventListener('resize', onResize)
    document.addEventListener('fullscreenchange', onFs)
    onMove()
    void document.documentElement.requestFullscreen?.().catch(() => {})
    return () => {
      document.removeEventListener('keydown', onKey, true)
      removeEventListener('mousemove', onMove)
      removeEventListener('resize', onResize)
      document.removeEventListener('fullscreenchange', onFs)
      clearTimeout(timer)
      if (document.fullscreenElement) void document.exitFullscreen()
    }
  }, [])

  const k = Math.min(size.w / W, size.h / H)
  const move = (dir: 1 | -1) => document.dispatchEvent(new KeyboardEvent('keydown', { key: dir === 1 ? 'ArrowRight' : 'ArrowLeft' }))
  const wide = hasWebGL()

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={t('Modo slide', 'Slide mode')}
      className="fixed inset-0 z-[80] overflow-hidden bg-ink text-white"
      data-deck
      data-idle={idle || undefined}
    >
      {slide.bg === 'helix' && wide && (
        <>
          <Suspense fallback={null}>
            <HeroHelix active still={false} />
          </Suspense>
          <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-ink via-ink/75 to-transparent" />
        </>
      )}
      {slide.bg === 'sim' && (
        <Suspense fallback={null}>
          <SimStage step={slide.simStep ?? 0} />
        </Suspense>
      )}
      <div
        key={slide.key}
        style={{
          position: 'absolute',
          width: W,
          height: H,
          left: (size.w - W * k) / 2,
          top: (size.h - H * k) / 2,
          transform: `scale(${k})`,
          transformOrigin: 'top left',
        }}
        data-slide-key={slide.key}
      >
        {slide.render(pos.step)}
      </div>
      <div
        className={`glass absolute bottom-4 right-5 z-10 flex items-center gap-3 rounded-full px-4 py-2 text-sm transition-opacity duration-500 ${idle ? 'opacity-0 hover:opacity-100' : ''}`}
        role="status"
      >
        <button type="button" onClick={() => move(-1)} aria-label={t('Anterior', 'Previous')} className="px-2 text-mist hover:text-white">
          ←
        </button>
        <span className="font-mono text-xs text-mist">
          {pos.i + 1}/{slides.length}
        </span>
        <span>{slide.section}</span>
        <button type="button" onClick={() => move(1)} aria-label={t('Próximo', 'Next')} className="rounded-full bg-dna px-3 py-1 font-semibold text-ink">
          →
        </button>
        <button type="button" onClick={onExit} aria-label={t('Sair do modo slide', 'Exit slide mode')} className="text-mist hover:text-white">
          ✕
        </button>
      </div>
    </div>
  )
}
