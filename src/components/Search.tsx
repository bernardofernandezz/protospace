import { useEffect, useMemo, useRef, useState } from 'react'
import { FAQ } from '../content/faq'
import { GROUPS } from '../content/nav'
import { useT } from '../i18n'

type Hit = { key: string; label: string; hint: string; go: () => void }

/** Busca por seção e pergunta do FAQ. Abre com `/` ou Ctrl/⌘+K; `<dialog>` nativo cuida de foco e Esc. */
export default function Search() {
  const t = useT()
  const ref = useRef<HTMLDialogElement>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    const open = () => {
      setQ('')
      ref.current?.showModal()
    }
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as Element).closest?.('input, textarea, [contenteditable]')
      if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault()
        open()
      }
    }
    addEventListener('keydown', onKey)
    addEventListener('open-search', open)
    return () => {
      removeEventListener('keydown', onKey)
      removeEventListener('open-search', open)
    }
  }, [])

  const hits = useMemo<Hit[]>(() => {
    const all: Hit[] = [
      ...GROUPS.flatMap((g) => g.items.map(([id, l]) => ({ key: id, label: t.pick(l), hint: t('Seção', 'Section'), go: () => (location.hash = id) }))),
      ...t.pick(FAQ).flatMap((g) =>
        g.items.map((i) => ({
          key: `faq-${i.id}`,
          label: i.q,
          hint: 'FAQ',
          go: () => {
            location.hash = 'faq'
            dispatchEvent(new CustomEvent('faq-open', { detail: i.id }))
          },
        })),
      ),
    ]
    const n = q.trim().toLowerCase()
    return (n ? all.filter((h) => h.label.toLowerCase().includes(n)) : all.slice(0, 8)).slice(0, 8)
  }, [q, t])

  const pick = (h: Hit) => {
    ref.current?.close()
    h.go()
  }

  return (
    <dialog
      ref={ref}
      aria-label={t('Buscar', 'Search')}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(32rem,92vw)] rounded-2xl border border-white/10 bg-ink/95 p-4 text-white backdrop:bg-black/60 backdrop:backdrop-blur-sm"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && hits[0] && pick(hits[0])}
        placeholder={t('Buscar seção ou pergunta…', 'Search a section or question…')}
        aria-label={t('Buscar', 'Search')}
        className="w-full rounded-xl bg-white/5 px-4 py-3 outline-none ring-1 ring-white/10 focus:ring-dna"
      />
      <ul className="mt-3 max-h-80 overflow-y-auto">
        {hits.map((h) => (
          <li key={h.key}>
            <button type="button" onClick={() => pick(h)} className="flex w-full justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-white/10">
              <span>{h.label}</span>
              <span className="shrink-0 font-mono text-xs text-mist">{h.hint}</span>
            </button>
          </li>
        ))}
        {hits.length === 0 && <li className="px-3 py-2 text-mist">{t('Nada encontrado.', 'Nothing found.')}</li>}
      </ul>
    </dialog>
  )
}
