import { useEffect } from 'react'

/**
 * Micro-interações globais por classe CSS (só com ponteiro fino e sem "reduzir movimento"):
 * `.tilt-card` inclina levemente e acompanha o brilho do cursor; `.magnetic` é atraído pelo cursor.
 */
export function useMicroInteractions() {
  useEffect(() => {
    if (!matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches) return
    let raf = 0
    let last: PointerEvent | null = null
    const reset = (el: HTMLElement) => { el.style.removeProperty('--rx'); el.style.removeProperty('--ry'); el.style.removeProperty('--tx'); el.style.removeProperty('--ty') }
    let hovered: HTMLElement[] = []
    const frame = () => {
      raf = 0
      const e = last
      if (!e) return
      const target = e.target as HTMLElement
      const tilt = target.closest<HTMLElement>('.tilt-card')
      const mag = target.closest<HTMLElement>('.magnetic')
      const now = [tilt, mag].filter(Boolean) as HTMLElement[]
      hovered.filter((el) => !now.includes(el)).forEach(reset)
      hovered = now
      if (tilt) {
        const r = tilt.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height
        tilt.style.setProperty('--rx', `${(0.5 - y) * 5}deg`)
        tilt.style.setProperty('--ry', `${(x - 0.5) * 7}deg`)
        tilt.style.setProperty('--mx', `${x * 100}%`)
        tilt.style.setProperty('--my', `${y * 100}%`)
      }
      if (mag) {
        const r = mag.getBoundingClientRect()
        mag.style.setProperty('--tx', `${(e.clientX - (r.left + r.width / 2)) * 0.18}px`)
        mag.style.setProperty('--ty', `${(e.clientY - (r.top + r.height / 2)) * 0.25}px`)
      }
    }
    const move = (e: PointerEvent) => { last = e; if (!raf) raf = requestAnimationFrame(frame) }
    const leave = () => { hovered.forEach(reset); hovered = [] }
    addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerleave', leave)
    return () => { removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf) }
  }, [])
}
