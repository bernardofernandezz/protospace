import { lazy, Suspense, useEffect, useState } from 'react'
import { PATHS } from '../content/paths'
import { hasWebGL } from '../lib/hooks'
import { useSimClock } from '../playground/clock'
import { useSim } from '../playground/store'

const Scene = lazy(() => import('../playground/scene/Scene'))

/** Parte do estado do playground que o deck mexe: guardada ao entrar e devolvida ao sair. */
const KEYS = [
  'locus',
  'disease',
  'nuclease',
  'selected',
  'guide',
  'cas',
  'repair',
  'tolerance',
  'seed',
  'step',
  'progress',
  'playing',
  'speed',
  'cinema',
  'explore',
  'zone',
  'flyTo',
  'tip',
] as const

/**
 * Cena 3D do playground para os slides: parte sempre do mesmo experimento (o primeiro caminho),
 * independente do que o visitante deixou no site, e devolve o estado dele ao fechar o deck.
 * Fica montada entre slides vizinhos; só a etapa (`step`) muda.
 */
export default function SimStage({ step }: { step: number }) {
  const [lost, setLost] = useState(false)
  useSimClock(true)
  useEffect(() => {
    const s = useSim.getState()
    const snap = Object.fromEntries(KEYS.map((k) => [k, s[k]])) as Partial<ReturnType<typeof useSim.getState>>
    s.set({ explore: false, cinema: false, speed: 1, tip: null, zone: null, flyTo: null })
    s.applyPreset(PATHS[0].preset)
    return () => useSim.setState(snap)
  }, [])
  useEffect(() => {
    useSim.getState().goto(step)
  }, [step])

  if (!hasWebGL() || lost) return <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_40%,#12203a,#04070f)]" />
  // isolate: os rótulos 3D (Html do drei, z-index próprio) ficam abaixo do texto do slide
  return (
    <div className="absolute inset-0 isolate">
      <Suspense fallback={null}>
        <Scene active onLost={() => setLost(true)} />
      </Suspense>
    </div>
  )
}
