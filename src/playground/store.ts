import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { useMemo } from 'react'
import {
  CAS, DEFAULT_LOCUS, DELIVERY, applyOps, baseEditOps, clean, cutProbability, findCandidates, hdrOps,
  MAX_LOCUS, netLength, nhejOps, offTargetSites, type CasType, type Delivery, type Op, type Repair,
} from '../lib/dna'
import { useLang, type L } from '../i18n'
import { EXHIBIT } from '../content/exhibits'

export const STEPS: L<string[]> = {
  pt: ['Design do guia', 'Entrega', 'Busca e reconhecimento', 'Clivagem', 'Reparo', 'Resultado'],
  en: ['Guide design', 'Delivery', 'Search & recognition', 'Cleavage', 'Repair', 'Outcome'],
}
export const STEP_COUNT = 6
/** Duração de cada etapa em segundos (velocidade 1×). */
export const STEP_SECONDS = [3.5, 6, 9, 4, 7, 3.5]

export type Quality = 'low' | 'medium' | 'high'

export interface Tip { title: string; body: string; x: number; y: number }

/** Id de uma exposição do modo Explorar (src/content/exhibits.ts). */
export type ZoneId = string

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
  /** Modo cinema: percorre as 6 etapas sozinho, com câmera e legendas. */
  cinema: boolean
  quality: Quality
  /** true enquanto a qualidade é ajustada pelo monitor de desempenho. */
  qualityAuto: boolean
  camTick: number
  tip: Tip | null
  /** Modo Explorar: o usuário pilota uma sonda pelo núcleo; a timeline continua rodando. */
  explore: boolean
  zone: ZoneId | null
  /** Pedido de voo até uma zona (consumido pelo Explorer). */
  flyTo: ZoneId | null
  /** Zonas já visitadas (persistidas por navegador). */
  seen: string[]
  set: (p: Partial<SimState>) => void
  setLocus: (s: string) => void
  select: (i: number) => void
  goto: (step: number) => void
  reset: () => void
  setExplore: (on: boolean) => void
}

export const SEEN_KEY = 'protospace.seen'
function loadSeen(): string[] {
  try { const v = JSON.parse(localStorage.getItem(SEEN_KEY) ?? '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x in EXHIBIT) : [] }
  catch { return [] }
}

const isCoarse = () => typeof matchMedia !== 'undefined' && (matchMedia('(pointer: coarse)').matches || innerWidth < 768)

// ---------- estado do experimento na URL (links compartilháveis) ----------
const PARAM_KEYS = ['locus', 'site', 'guide', 'cas', 'delivery', 'repair', 'tol', 'seed'] as const

function fromUrl() {
  const q = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search)
  const locus = clean(q.get('locus') ?? '').slice(0, MAX_LOCUS) || DEFAULT_LOCUS
  const cands = findCandidates(locus)
  const site = Math.min(Math.max(0, Number(q.get('site') ?? (locus === DEFAULT_LOCUS ? 1 : 0)) || 0), Math.max(0, cands.length - 1))
  const g = clean(q.get('guide') ?? '')
  const pick = <T extends string>(v: string | null, ok: readonly T[], def: T): T => (ok.includes(v as T) ? (v as T) : def)
  return {
    locus,
    selected: site,
    guide: g.length === 20 ? g : cands[site]?.protospacer ?? '',
    cas: pick(q.get('cas'), ['wt', 'nickase', 'be'] as const, 'wt'),
    delivery: pick(q.get('delivery'), ['rnp', 'plasmid', 'viral'] as const, 'rnp'),
    repair: pick(q.get('repair'), ['nhej', 'hdr'] as const, 'nhej'),
    tolerance: Math.min(3, Math.max(0, Number(q.get('tol') ?? 0.5) || 0)),
    seed: Number(q.get('seed') ?? 7) || 7,
  }
}

/** URL que reproduz o experimento atual (mantém idioma e demais parâmetros da página). */
export function experimentUrl() {
  const s = useSim.getState()
  const url = new URL(location.href)
  PARAM_KEYS.forEach((k) => url.searchParams.delete(k))
  if (s.locus !== DEFAULT_LOCUS) url.searchParams.set('locus', s.locus)
  const cand = findCandidates(s.locus)[s.selected]
  url.searchParams.set('site', String(s.selected))
  if (cand && s.guide !== cand.protospacer) url.searchParams.set('guide', s.guide)
  url.searchParams.set('cas', s.cas)
  url.searchParams.set('delivery', s.delivery)
  url.searchParams.set('repair', s.repair)
  url.searchParams.set('tol', String(s.tolerance))
  url.searchParams.set('seed', String(s.seed))
  url.hash = 'playground'
  return url.toString()
}

export const useSim = create<SimState>((set, get) => ({
  ...fromUrl(),
  step: 0,
  progress: 0,
  playing: false,
  speed: 1,
  presentation: false,
  cinema: false,
  quality: isCoarse() ? 'medium' : 'high',
  qualityAuto: true,
  camTick: 0,
  tip: null,
  explore: false,
  zone: null,
  flyTo: null,
  seen: loadSeen(),
  set: (p) => set(p),
  setLocus: (locus) => {
    const c = findCandidates(locus)
    set({ locus, selected: 0, guide: c[0]?.protospacer ?? '', step: 0, progress: 0, playing: false })
  },
  select: (i) => {
    const c = findCandidates(get().locus)[i]
    if (c) set({ selected: i, guide: c.protospacer, step: 0, progress: 0, playing: false })
  },
  goto: (step) => set({ step: Math.max(0, Math.min(STEP_COUNT - 1, step)), progress: 0, playing: true, camTick: get().camTick + 1 }),
  reset: () => set({ step: 0, progress: 0, playing: false, cinema: false, camTick: get().camTick + 1, seed: get().seed + 1 }),
  setExplore: (on) => {
    const s = get()
    set({ explore: on, cinema: false, zone: null, flyTo: null, camTick: s.camTick + 1 })
    // a etapa de entrega é outra escala (a célula inteira): no mundo aberto começamos no locus
    if (on && s.step === 1) s.goto(0)
  },
}))

/** Tudo que deriva dos parâmetros: candidatos, probabilidades, resultado da edição. */
export function useDerived() {
  const { locus, selected, guide, delivery, cas, repair, tolerance, seed } = useSim(
    useShallow((s) => ({ locus: s.locus, selected: s.selected, guide: s.guide, delivery: s.delivery, cas: s.cas, repair: s.repair, tolerance: s.tolerance, seed: s.seed })),
  )
  const lang = useLang((s) => s.lang)
  return useMemo(() => {
    const en = lang === 'en'
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
    let kind: string
    let eff = 0
    if (!acts) kind = en ? 'No edit: the guide does not recognise the target well (too many mismatches).' : 'Sem edição: o guia não reconhece bem o alvo (mismatches demais).'
    else if (cas === 'be') {
      ops = baseEditOps(cand)
      const k = ops.length
      kind = k
        ? en ? `C→T base edit (${k} position${k > 1 ? 's' : ''} in window 4–8), no double-strand break.` : `Edição de base C→T (${k} posição${k > 1 ? 'ões' : ''} na janela 4–8), sem quebra de fita dupla.`
        : en ? 'No C in the editing window (positions 4–8): the base editor has nothing to convert.' : 'Nenhum C na janela de edição (posições 4–8): editor de bases não atua.'
      eff = k ? pOn * d.eff * 0.6 : 0
    } else if (cas === 'nickase') {
      kind = en
        ? 'Single-strand nick: usually repaired without error. For a DSB, use a pair of nickases with opposite guides.'
        : 'Nick em uma única fita: geralmente reparado sem erro. Para DSB, use um par de nickases com guias opostos.'
      eff = pOn * d.eff * 0.05
    } else if (repair === 'hdr') {
      ops = hdrOps(cand)
      kind = en ? 'HDR with template: GAATTC (EcoRI site) inserted + PAM mutated.' : 'HDR com molde: inserção de GAATTC (sítio EcoRI) + mutação do PAM.'
      eff = pOn * d.eff * 0.22
    } else {
      ops = nhejOps(locus, cand.cut, seed)
      const n = netLength(ops)
      kind = en
        ? `NHEJ: ${n > 0 ? `${n}-nt insertion` : `${-n}-nt deletion`}${n % 3 ? ' → frameshift (likely knockout if in a coding exon)' : ' → in-frame (may not inactivate the gene)'}.`
        : `NHEJ: ${n > 0 ? `inserção de ${n} nt` : `deleção de ${-n} nt`}${n % 3 ? ' → frameshift (provável knockout, se em éxon codificante)' : ' → in-frame (pode não inativar o gene)'}.`
      eff = pOn * d.eff * 0.75
    }
    const applied = applyOps(locus, ops)
    return { candidates, cand, pOn, offs, ops, kind, eff, applied, acts, cuts: acts ? CAS[cas].cuts : 'none' } as const
  }, [locus, selected, guide, delivery, cas, repair, tolerance, seed, lang])
}

// depuração/testes automatizados (somente em desenvolvimento)
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __sim: typeof useSim }).__sim = useSim
