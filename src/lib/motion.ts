// gsap, ScrollTrigger e Lenis sob demanda: ~45 KB e boa parte da CPU inicial ficam fora da primeira pintura (LCP).
// Todas as animações já começam depois do boot ou de uma interação, então nada visível depende deles.
let motion:
  | Promise<{ gsap: typeof import('gsap').default; ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger; Lenis: typeof import('lenis').default }>
  | undefined

export const loadMotion = () =>
  (motion ??= Promise.all([import('gsap'), import('gsap/ScrollTrigger'), import('lenis')]).then(([g, st, l]) => {
    g.default.registerPlugin(st.ScrollTrigger)
    return { gsap: g.default, ScrollTrigger: st.ScrollTrigger, Lenis: l.default }
  }))
