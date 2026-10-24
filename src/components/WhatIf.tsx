import { useT } from '../i18n'
import { openInPlayground, type Preset } from '../playground/open'

/** Pergunta curta que o leitor responde rodando o experimento, em vez de ler a resposta. */
export default function WhatIf({ question, preset }: { question: string; preset: Preset }) {
  const t = useT()
  return (
    <aside className="glass mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border-l-2 border-rna/60 p-5" data-reveal>
      <p className="max-w-2xl leading-relaxed text-white/90">
        <b className="text-rna">{t('E se…', 'What if…')}</b> {question}
      </p>
      <button type="button" onClick={() => openInPlayground(preset)}
        className="shrink-0 rounded-xl bg-white/10 px-4 py-2 text-sm transition hover:bg-white/20">
        {t('responder no playground →', 'answer it in the playground →')}
      </button>
    </aside>
  )
}
