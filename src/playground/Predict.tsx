import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useT } from '../i18n'
import { track } from '../lib/track'
import { useDerived, useSim } from './store'

const SEARCH_STEP = 2

/** Prever antes de ver: na busca o visitante aposta se a Cas vai cortar; da etapa do corte em diante vê se acertou. */
export default function Predict() {
  const t = useT()
  const d = useDerived()
  const { step, explore, cinema } = useSim(useShallow((s) => ({ step: s.step, explore: s.explore, cinema: s.cinema })))
  const [guess, setGuess] = useState<boolean | null>(null)

  // voltar ao começo apaga o palpite; chegar à busca pausa até o visitante apostar
  useEffect(() => {
    if (step < SEARCH_STEP) setGuess(null)
    else if (step === SEARCH_STEP && guess === null && !cinema && !explore) useSim.getState().set({ playing: false })
  }, [step, guess, cinema, explore])

  if (explore || cinema || !d.cand || step < SEARCH_STEP) return null

  const answer = (g: boolean) => {
    setGuess(g)
    track('predict', { guess: g, acts: !!d.acts })
    useSim.getState().set({ playing: true })
  }

  if (guess === null) {
    if (step !== SEARCH_STEP) return null
    return (
      <div
        role="group"
        aria-label={t('Previsão', 'Prediction')}
        className="glass absolute left-1/2 top-1/2 z-10 w-[min(92%,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl p-5 text-center"
      >
        <p className="font-display text-lg">{t('Antes de ver: a Cas vai cortar o alvo?', 'Before you look: will Cas cut the target?')}</p>
        <div className="mt-4 flex justify-center gap-3">
          <button type="button" className="rounded-full bg-bio/20 px-5 py-2 text-sm ring-1 ring-bio/60 hover:bg-bio/30" onClick={() => answer(true)}>
            {t('Vai cortar', 'It will cut')}
          </button>
          <button type="button" className="rounded-full bg-cas/20 px-5 py-2 text-sm ring-1 ring-cas/60 hover:bg-cas/30" onClick={() => answer(false)}>
            {t('Não vai', 'It won’t')}
          </button>
        </div>
      </div>
    )
  }

  if (step === SEARCH_STEP) return null
  const right = guess === !!d.acts
  return (
    <p role="status" className="glass absolute right-3 top-14 z-10 rounded-full px-4 py-1.5 text-xs md:right-5 md:top-16">
      <b className={right ? 'text-bio' : 'text-cas'}>{right ? t('Você acertou', 'You got it right') : t('Dessa vez não', 'Not this time')}</b>{' '}
      <span className="text-mist">
        {t('· chance de corte', '· cut chance')} {Math.round(d.pOn * 100)}%
      </span>
    </p>
  )
}
