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

// Criar um contexto WebGL é caro (dezenas a centenas de ms quando o WebGL roda por software)
// e o resultado não muda durante a sessão: o navegador ainda limita quantos contextos ficam vivos.
let webgl: boolean | undefined
let softwareGL: boolean | undefined

export function hasWebGL() {
  if (webgl === undefined) {
    try {
      const c = document.createElement('canvas')
      webgl = !!(c.getContext('webgl2') || c.getContext('webgl'))
    } catch {
      webgl = false
    }
  }
  return webgl
}

/**
 * true quando o WebGL roda por software (SwiftShader, llvmpipe…): sem GPU de verdade,
 * animação 3D contínua trava a página — melhor não carregar efeitos decorativos.
 */
export function isSoftwareGL() {
  if (softwareGL !== undefined) return softwareGL
  try {
    const gl = document.createElement('canvas').getContext('webgl')
    if (!gl) return (softwareGL = false)
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = String(gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER))
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    softwareGL = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)
  } catch {
    softwareGL = false
  }
  return softwareGL
}
