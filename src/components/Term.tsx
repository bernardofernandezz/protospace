import { Fragment, useId, type ReactNode } from 'react'
import { GLOSSARY, TERM_RE } from '../content/glossary'
import { useT } from '../i18n'

// Suporte nativo a popover (Chrome 114+, Safari 17+, Firefox 125+). Sem ele, o termo
// vira um <abbr> com title — ainda informativo, só menos confortável.
const CAN_POP = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype

/**
 * Termo do glossário: mostra a palavra no meio da frase e, a um clique, a explicação em
 * linguagem comum. Quem já conhece o assunto lê direto; quem não conhece não precisa sair da página.
 */
export function Term({ k, children }: { k: string; children: ReactNode }) {
  const t = useT()
  const id = useId()
  const e = GLOSSARY[k]
  if (!e) return <>{children}</>
  const full = e.full && t.pick(e.full)
  const what = t.pick(e.what)
  if (!CAN_POP)
    return (
      <abbr className="term" title={full ? `${full}. ${what}` : what}>
        {children}
      </abbr>
    )
  return (
    <>
      <button
        type="button"
        className="term"
        popovertarget={id}
        aria-label={t(`${plainText(children)}: ver explicação`, `${plainText(children)}: see explanation`)}
      >
        {children}
      </button>
      <span popover="auto" id={id} className="term-pop glass">
        <span className="term-pop-title">{children}</span>
        {full && <span className="term-pop-full">{full}</span>}
        <span className="term-pop-body">{what}</span>
      </span>
    </>
  )
}

const plainText = (n: ReactNode): string => (typeof n === 'string' ? n : String(n ?? ''))

/**
 * Renderiza texto que pode conter marcadores [[chave|rótulo]] do glossário.
 * Permite que o conteúdo continue sendo string simples nos arquivos de src/content.
 */
export function Rich({ children }: { children: string }) {
  const parts: ReactNode[] = []
  let last = 0
  for (const m of children.matchAll(TERM_RE)) {
    if (m.index > last) parts.push(children.slice(last, m.index))
    parts.push(
      <Term key={m.index} k={m[1]}>
        {m[2] ?? m[1]}
      </Term>,
    )
    last = m.index + m[0].length
  }
  parts.push(children.slice(last))
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </>
  )
}
