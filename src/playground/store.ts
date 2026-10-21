import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { useMemo } from 'react'
import {
  CAS, DEFAULT_LOCUS, DELIVERY, applyOps, baseEditOps, cutProbability, findCandidates, hdrOps,
  netLength, nhejOps, offTargetSites, type CasType, type Delivery, type Op, type Repair,
} from '../lib/dna'

export const STEPS = ['Design do guia', 'Entrega', 'Busca e reconhecimento', 'Clivagem', 'Reparo', 'Resultado'] as const
/** Duração de cada etapa em segundos (velocidade 1×). */
export const STEP_SECONDS = [3, 4.5, 8, 3, 5.5, 3]

export interface Tip { title: string; body: string; x: number; y: number }

interface SimState {
  locus: string
  selected: number
  guide: string
  delivery: Delivery
  cas: CasType
  repair: Repair
  tolerance: number
  seed: number
  step: number
  progress: number
  playing: boolean
  speed: number
  presentation: boolean
  camTick: number
  tip: Tip | null
  set: (p: Partial<SimState>) => void
  setLocus: (s: string) => void
  select: (i: number) => void
  goto: (step: number) => void
  reset: () => void
}

const initialCands = findCandidates(DEFAULT_LOCUS)
const INITIAL = 1

export const useSim = create<SimState>((set, get) => ({
  locus: DEFAULT_LOCUS,
  selected: INITIAL,
  guide: initialCands[INITIAL].protospacer,
  delivery: 'rnp',
  cas: 'wt',
  repair: 'nhej',
  tolerance: 0.5,
  seed: 7,
  step: 0,
  progress: 0,
  playing: false,
  speed: 1,
  presentation: false,
  camTick: 0,
  tip: null,
  set: (p) => set(p),
  setLocus: (locus) => {
    const c = findCandidates(locus)
    set({ locus, selected: 0, guide: c[0]?.protospacer ?? '', step: 0, progress: 0, playing: false })
  },
  select: (i) => {
    const c = findCandidates(get().locus)[i]
    if (c) set({ selected: i, guide: c.protospacer, step: 0, progress: 0, playing: false })
  },
  goto: (step) => set({ step: Math.max(0, Math.min(STEPS.length - 1, step)), progress: 0, playing: true, camTick: get().camTick + 1 }),
  reset: () => set({ step: 0, progress: 0, playing: false, camTick: get().camTick + 1, seed: get().seed + 1 }),
}))

/** Tudo que deriva dos parâmetros: candidatos, probabilidades, resultado da edição. */
export function useDerived() {
  const { locus, selected, guide, delivery, cas, repair, tolerance, seed } = useSim(
    useShallow((s) => ({ locus: s.locus, selected: s.selected, guide: s.guide, delivery: s.delivery, cas: s.cas, repair: s.repair, tolerance: s.tolerance, seed: s.seed })),
  )
  return useMemo(() => {
    const candidates = findCandidates(locus)
    const cand = candidates[selected] ?? candidates[0]
    if (!cand) return { candidates, cand: undefined } as const
    const d = DELIVERY[delivery]
    const pOn = cutProbability(guide, cand.protospacer, tolerance)
    const offs = offTargetSites(cand.protospacer).map((o) => ({
      ...o,
      p: Math.min(0.99, cutProbability(guide, o.site, tolerance) * d.offMult),
    }))
    const acts = pOn >= 0.3
    let ops: Op[] = []
    let kind = ''
    let eff = 0
    if (!acts) kind = 'Sem edição: o guia não reconhece bem o alvo (mismatches demais).'
    else if (cas === 'be') {
      ops = baseEditOps(cand)
      kind = ops.length ? `Edição de base C→T (${ops.length} posição${ops.length > 1 ? 'ões' : ''} na janela 4–8), sem quebra de fita dupla.` : 'Nenhum C na janela de edição (posições 4–8): editor de bases não atua.'
      eff = ops.length ? pOn * d.eff * 0.6 : 0
    } else if (cas === 'nickase') {
      kind = 'Nick em uma única fita: geralmente reparado sem erro. Para DSB, use um par de nickases com guias opostos.'
      eff = pOn * d.eff * 0.05
    } else if (repair === 'hdr') {
      ops = hdrOps(cand)
      kind = `HDR com molde: inserção de GAATTC (sítio EcoRI) + mutação do PAM.`
      eff = pOn * d.eff * 0.22
    } else {
      ops = nhejOps(locus, cand.cut, seed)
      const n = netLength(ops)
      kind = `NHEJ: ${n > 0 ? `inserção de ${n} nt` : `deleção de ${-n} nt`}${n % 3 ? ' → frameshift (provável knockout, se em éxon codificante)' : ' → in-frame (pode não inativar o gene)'}.`
      eff = pOn * d.eff * 0.75
    }
    const applied = applyOps(locus, ops)
    return { candidates, cand, pOn, offs, ops, kind, eff, applied, acts, cuts: acts ? CAS[cas].cuts : 'none' } as const
  }, [locus, selected, guide, delivery, cas, repair, tolerance, seed])
}
