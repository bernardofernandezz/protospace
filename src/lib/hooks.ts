import { useEffect, useState, type RefObject } from 'react'

/** true enquanto o elemento estiver (perto de estar) visível — usado para pausar o render 3D fora da tela. */
export function useInView(ref: RefObject<Element>, rootMargin = '100px') {
  const [inView, setInView] = useState(false)
  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [ref, rootMargin])
  return inView
}

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
