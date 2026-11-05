import { useEffect, useState } from 'react'
import { GROUPS } from '../content/nav'
import { useT } from '../i18n'
import { track } from '../lib/track'

/** Paradas do tour de 5 minutos: mecanismo, playground, ética e quiz (rótulos do próprio menu). */
const STOPS = ['como-funciona', 'playground', 'bioetica', 'quiz']
const LABEL = new Map(GROUPS.flatMap((g) => g.items))

/** Tour guiado: o botão do Hero dispara `start-tour`; a pílula leva de parada em parada. */
export default function Tour() {
  const t = useT()
  const [i, setI] = useState<number | null>(null)

  const go = (n: number) => {
    setI(n)
    document.getElementById(STOPS[n])?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  useEffect(() => {
    const start = () => {
      track('tour_start')
      go(0)
    }
    addEventListener('start-tour', start)
    return () => removeEventListener('start-tour', start)
  }, [])

  if (i === null) return null
  const last = i === STOPS.length - 1
  return (
    <div role="status" className="glass fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full px-4 py-2 text-sm">
      <span className="font-mono text-xs text-mist">
        {t('Tour', 'Tour')} {i + 1}/{STOPS.length}
      </span>
      <span>{t.pick(LABEL.get(STOPS[i])!)}</span>
      <button type="button" onClick={() => (last ? setI(null) : go(i + 1))} className="rounded-full bg-dna px-3 py-1 font-semibold text-ink">
        {last ? t('Concluir', 'Finish') : t('Próxima parada →', 'Next stop →')}
      </button>
      {!last && (
        <button type="button" onClick={() => setI(null)} aria-label={t('Sair do tour', 'Exit tour')} className="text-mist hover:text-white">
          ✕
        </button>
      )}
    </div>
  )
}
