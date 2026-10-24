import { useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import { PATHS, type Path } from '../content/paths'
import { useT } from '../i18n'
import { openInPlayground } from '../playground/open'

export default function Paths() {
  const t = useT()
  const [busy, setBusy] = useState<string | null>(null)

  const open = async (p: Path) => {
    setBusy(p.id)
    try {
      await openInPlayground(p.preset)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section id="caminhos" className="section">
      <SectionHeader
        n="05"
        eyebrow={t('Quatro caminhos', 'Four paths')}
        title={
          t.lang === 'en' ? (
            <>
              One disease, <span className="text-gradient">four ways</span> to edit it.
            </>
          ) : (
            <>
              Uma doença, <span className="text-gradient">quatro maneiras</span> de editá-la.
            </>
          )
        }
        lead={t(
          'A anemia falciforme é uma única letra trocada, e ainda assim há mais de um jeito de resolvê-la — inclusive um que nem toca no gene defeituoso. Cada cartão abre o playground já configurado: teste e compare o que acontece.',
          'Sickle cell disease is a single swapped letter, and even so there is more than one way to deal with it — including one that never touches the faulty gene. Each card opens the playground ready to run: try it and compare what happens.',
        )}
      />

      <ol className="grid gap-5 md:grid-cols-2" data-reveal>
        {PATHS.map((p, i) => (
          <li key={p.id} className="glass flex flex-col rounded-3xl p-6 transition hover:-translate-y-1">
            <span className="font-mono text-sm" style={{ color: p.color }}>
              0{i + 1}
            </span>
            <h3 className="mt-2 text-xl font-semibold">{t.pick(p.name)}</h3>
            <p className="mt-3 leading-relaxed text-mist">{t.pick(p.plain)}</p>
            <p className="mt-3 rounded-xl border-l-2 bg-white/5 p-3 text-sm leading-relaxed text-white/85" style={{ borderColor: p.color }}>
              {t.pick(p.result)}
            </p>
            <button
              type="button"
              onClick={() => open(p)}
              disabled={busy === p.id}
              className="mt-4 self-start rounded-xl bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20 disabled:opacity-50"
            >
              {busy === p.id ? t('abrindo…', 'opening…') : t('testar no playground →', 'try it in the playground →')}
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}
