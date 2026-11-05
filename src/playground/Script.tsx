import { SCRIPT } from '../content/script'
import { useT } from '../i18n'

/** Roteiro do apresentador: dica e pergunta da etapa atual (modo apresentação). */
export default function Script({ step }: { step: number }) {
  const t = useT()
  const note = t.pick(SCRIPT)[step]
  if (!note) return null
  return (
    <aside aria-label={t('Roteiro do apresentador', 'Presenter script')} className="glass mt-3 rounded-2xl p-4 text-sm leading-relaxed">
      <p className="hud-label">
        {t('Roteiro do apresentador', 'Presenter script')} · {t('etapa', 'step')} {step + 1}
      </p>
      <p className="mt-2 text-mist">{note.tip}</p>
      <p className="mt-1 font-medium text-white">{note.ask}</p>
    </aside>
  )
}
