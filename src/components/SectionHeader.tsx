import { useState, type ReactNode } from 'react'
import { useT } from '../i18n'

export default function SectionHeader({ n, eyebrow, title, lead }: { n: string; eyebrow: string; title: ReactNode; lead?: ReactNode }) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  // link direto para a seção: a âncora é o id do <section> que contém este cabeçalho
  const copy = (el: HTMLElement) => {
    const id = el.closest('section')?.id
    if (!id) return
    const url = `${location.origin}${location.pathname}#${id}`
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      },
      () => {},
    )
  }
  return (
    <header className="mb-14 md:mb-20" data-reveal>
      <p className="eyebrow">
        <span className="text-mist/60">{n} ·</span> {eyebrow}
        <button
          type="button"
          onClick={(e) => copy(e.currentTarget)}
          className="ml-3 rounded-full px-2 py-0.5 text-xs normal-case tracking-normal text-mist/70 transition hover:bg-white/10 hover:text-white"
        >
          {copied ? t('Link copiado ✓', 'Link copied ✓') : t('Copiar link', 'Copy link')}
        </button>
      </p>
      <h2 className="h2 mt-4 max-w-4xl">{title}</h2>
      {lead && <p className="lead mt-6">{lead}</p>}
    </header>
  )
}
