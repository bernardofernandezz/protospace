// i18n mínimo, sem dependências. O idioma vive num store zustand para que código
// fora do React (useFrame, lógica do playground) também consiga ler o idioma atual.
import { useMemo } from 'react'
import { create } from 'zustand'
import { readText, writeText } from '../lib/storage'

export type Lang = 'pt' | 'en'
/** Valor localizado: o mesmo dado nas duas línguas. */
export type L<T = string> = Record<Lang, T>

const KEY = 'crispr-lang'

/** Ordem: ?lang= na URL → caminho /en/ → escolha salva → português.
 * Sem palpite pelo idioma do navegador: `/` é a versão PT declarada no hreflang (inclusive para buscadores). */
function detect(): Lang {
  const q = new URLSearchParams(location.search).get('lang')
  if (q === 'pt' || q === 'en') return q
  if (/^\/en(\/|$)/.test(location.pathname)) return 'en'
  const saved = readText(KEY)
  return saved === 'en' ? 'en' : 'pt'
}

const META: L<{ title: string; description: string }> = {
  pt: {
    title: 'Protospace · CRISPR-Cas9 do guia ao reparo, em 3D',
    description:
      'Site interativo sobre CRISPR-Cas9: mecanismo, evolução da ferramenta, boas práticas, aplicações e bioética, com um playground 3D do guia ao reparo.',
  },
  en: {
    title: 'Protospace · CRISPR-Cas9 from guide to repair, in 3D',
    description:
      'Interactive site about CRISPR-Cas9: mechanism, tool evolution, lab best practices, applications and bioethics, with a 3D playground from guide design to DNA repair.',
  },
}

function apply(lang: Lang) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'
  document.title = META[lang].title
  document.querySelector('meta[name="description"]')?.setAttribute('content', META[lang].description)
}

export const useLang = create<{ lang: Lang; setLang: (l: Lang) => void }>((set) => ({
  lang: detect(),
  setLang: (lang) => {
    writeText(KEY, lang)
    // URL canônica do idioma (/ ou /en/), mantendo os demais parâmetros e o #hash
    const url = new URL(location.href)
    url.searchParams.delete('lang')
    url.pathname = lang === 'en' ? '/en/' : '/'
    history.replaceState(history.state, '', url)
    apply(lang)
    set({ lang })
  },
}))
apply(useLang.getState().lang)

export interface T {
  (pt: string, en: string): string
  lang: Lang
  /** Escolhe a versão do idioma atual de um valor localizado. */
  pick: <V>(l: L<V>) => V
}

const make = (lang: Lang): T => Object.assign((pt: string, en: string) => (lang === 'en' ? en : pt), { lang, pick: <V>(l: L<V>) => l[lang] })

/** Hook: `const t = useT(); t('Olá', 'Hello'); t.pick(CONTENT)`. */
export function useT(): T {
  const lang = useLang((s) => s.lang)
  return useMemo(() => make(lang), [lang])
}

/** Fora do React (useFrame, handlers): lê o idioma no momento da chamada. */
export const tNow = (pt: string, en: string) => (useLang.getState().lang === 'en' ? en : pt)
