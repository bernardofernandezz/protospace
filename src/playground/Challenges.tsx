import { useEffect, useState } from 'react'
import { CHALLENGES } from '../content/challenges'
import { useT } from '../i18n'
import { readJSON, writeJSON } from '../lib/storage'
import { track } from '../lib/track'
import { useDerived, useSim } from './store'

const KEY = 'protospace.challenges'

/** Lista de desafios; marca (e guarda neste navegador) os que o experimento atual cumpre. */
export default function Challenges() {
  const t = useT()
  const d = useDerived()
  const [done, setDone] = useState<string[]>(() => readJSON<string[]>(KEY, []))
  const { cas, nuclease } = useSim((s) => ({ cas: s.cas, nuclease: s.nuclease }))

  useEffect(() => {
    if (!d.cand) return
    const outcome = { acts: !!d.acts, eff: d.eff ?? 0, offs: d.offs ?? [], cas, nuclease, disease: d.dis?.id ?? null, verdict: d.verdict }
    const fresh = CHALLENGES.filter((c) => !done.includes(c.id) && c.met(outcome)).map((c) => c.id)
    if (!fresh.length) return
    const next = [...done, ...fresh]
    setDone(next)
    writeJSON(KEY, next)
    fresh.forEach((id) => track('challenge_done', { id }))
  }, [d, cas, nuclease, done])

  return (
    <div className="rounded-xl bg-white/5 p-3">
      <div className="hud-label">
        {t('Desafios', 'Challenges')} · {done.length}/{CHALLENGES.length}
      </div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {CHALLENGES.map((c) => {
          const ok = done.includes(c.id)
          return (
            <li key={c.id} className={ok ? 'text-bio' : 'text-mist'}>
              <span aria-hidden="true">{ok ? '✓' : '○'}</span> <span className="sr-only">{ok ? t('cumprido: ', 'done: ') : ''}</span>
              {t.pick(c.goal)}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
