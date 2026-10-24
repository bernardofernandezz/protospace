import { useEffect, useRef } from 'react'

/** Cursor customizado (ponto + anel com inércia). Só em ponteiros finos e sem prefers-reduced-motion. */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return
    document.documentElement.classList.add('has-cursor')
    let x = innerWidth / 2,
      y = innerHeight / 2,
      rx = x,
      ry = y,
      big = false,
      raf = 0
    const move = (e: PointerEvent) => {
      x = e.clientX
      y = e.clientY
      big = !!(e.target as HTMLElement).closest('a, button, input, textarea, select, summary, label, canvas')
    }
    const loop = () => {
      rx += (x - rx) * 0.18
      ry += (y - ry) * 0.18
      if (dot.current) dot.current.style.transform = `translate(${x}px, ${y}px)`
      if (ring.current) ring.current.style.transform = `translate(${rx}px, ${ry}px) scale(${big ? 1.7 : 1})`
      raf = requestAnimationFrame(loop)
    }
    addEventListener('pointermove', move)
    raf = requestAnimationFrame(loop)
    return () => {
      removeEventListener('pointermove', move)
      cancelAnimationFrame(raf)
      document.documentElement.classList.remove('has-cursor')
    }
  }, [])
  return (
    <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[90] hidden [@media(pointer:fine)]:block motion-reduce:hidden!">
      <div ref={dot} className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-dna mix-blend-screen" />
      <div ref={ring} className="absolute -left-5 -top-5 h-10 w-10 rounded-full border border-dna/60 transition-[scale] duration-200" />
    </div>
  )
}
