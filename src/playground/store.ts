import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { useMemo } from 'react'
import {
  CAS, DEFAULT_LOCUS, DELIVERY, applyOps, baseEditOps, clean, cutProbability, findCandidates, hdrOps,
  MAX_LOCUS, nearestSite, netLength, nhejOps, offTargetSites, translate, type CasType, type Delivery, type Fix, type Op, type Repair,
} from '../lib/dna'
import { useLang, type L } from '../i18n'
import { EXHIBIT } from '../content/exhibits'
import { MISSIONS } from '../content/missions'
import { findDisease } from '../content/diseases'

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
  /** Cenário clínico carregado (src/content/diseases.ts); null = locus fictício. */
  disease: string | null
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
  /** Missões concluídas (persistidas por navegador). */
  missionsDone: string[]
  /** Missão de coleta: nucleotídeos já tocados (ex.: "AG"). */
  bases: string
  /** Missão de carga: a sonda leva o molde de reparo. */
  cargo: boolean
  /** Som do modo Explorar ligado (preferência por navegador). */
  sound: boolean
  set: (p: Partial<SimState>) => void
  setLocus: (s: string) => void
  setDisease: (id: string | null) => void
  select: (i: number) => void
  goto: (step: number) => void
  reset: () => void
  setExplore: (on: boolean) => void
}

export const SEEN_KEY = 'protospace.seen'
export const SOUND_KEY = 'protospace.sound'
export const MISSIONS_KEY = 'protospace.missions'
function load(key: string, valid: (id: string) => boolean): string[] {
  try { const v = JSON.parse(localStorage.getItem(key) ?? '[]'); return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && valid(x)) : [] }
  catch { return [] }
}

const isCoarse = () => typeof matchMedia !== 'undefined' && (matchMedia('(pointer: coarse)').matches || innerWidth < 768)

// ---------- estado do experimento na URL (links compartilháveis) ----------
const PARAM_KEYS = ['locus', 'dis', 'site', 'guide', 'cas', 'delivery', 'repair', 'tol', 'seed'] as const

function fromUrl() {
  const q = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search)
  const dis = findDisease(q.get('dis'))
  const locus = clean(q.get('locus') ?? '').slice(0, MAX_LOCUS) || dis?.locus || DEFAULT_LOCUS
  const cands = findCandidates(locus)
  const fallback = dis ? nearestSite(cands, dis.pos) : locus === DEFAULT_LOCUS ? 1 : 0
  const site = Math.min(Math.max(0, Number(q.get('site') ?? fallback) || 0), Math.max(0, cands.length - 1))
  const g = clean(q.get('guide') ?? '')
  const pick = <T extends string>(v: string | null, ok: readonly T[], def: T): T => (ok.includes(v as T) ? (v as T) : def)
  return {
    locus,
    disease: dis?.id ?? null,
    selected: site,
    guide: g.length === 20 ? g : cands[site]?.protospacer ?? '',
    cas: pick(q.get('cas'), ['wt', 'nickase', 'be'] as const, 'wt'),
    delivery: pick(q.get('delivery'), ['rnp', 'plasmid', 'viral'] as const, 'rnp'),
    // num cenário clínico a via que corrige é a HDR: já abre o caso na configuração que tem chance
    repair: pick(q.get('repair'), ['nhej', 'hdr'] as const, dis ? 'hdr' : 'nhej'),
    tolerance: Math.min(3, Math.max(0, Number(q.get('tol') ?? 0.5) || 0)),
    seed: Number(q.get('seed') ?? 7) || 7,
  }
}

/** URL que reproduz o experimento atual (mantém idioma e demais parâmetros da página). */
export function experimentUrl() {
  const s = useSim.getState()
  const url = new URL(location.href)
  PARAM_KEYS.forEach((k) => url.searchParams.delete(k))
  const dis = findDisease(s.disease)
  if (dis) url.searchParams.set('dis', dis.id)
  if (s.locus !== DEFAULT_LOCUS && s.locus !== dis?.locus) url.searchParams.set('locus', s.locus)
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
  seen: load(SEEN_KEY, (x) => x in EXHIBIT),
  bases: '',
  cargo: false,
  missionsDone: load(MISSIONS_KEY, (x) => MISSIONS.some((m) => m.id === x)),
  sound: (() => { try { return localStorage.getItem(SOUND_KEY) !== 'off' } catch { return true } })(),
  set: (p) => set(p),
  setLocus: (locus) => {
    const c = findCandidates(locus)
    const prev = findCandidates(get().locus)[get().selected]
    // mantém o sítio mais próximo do anterior: trocar uma base não deve pular a seleção
    const i = prev ? nearestSite(c, prev.cut) : 0
    // editar a sequência à mão invalida o alelo marcado pelo cenário
    set({ locus, disease: null, selected: i, guide: c[i]?.protospacer ?? '', step: 0, progress: 0, playing: false })
  },
  setDisease: (id) => {
    const dis = findDisease(id)
    const locus = dis?.locus ?? DEFAULT_LOCUS
    const c = findCandidates(locus)
    const i = dis ? nearestSite(c, dis.pos) : 1
    set({
      disease: dis?.id ?? null, locus, selected: i, guide: c[i]?.protospacer ?? '',
      // o caso começa na única configuração capaz de corrigir uma troca de base: DSB + molde
      ...(dis ? { cas: 'wt' as const, repair: 'hdr' as const } : {}),
      step: 0, progress: 0, playing: false, camTick: get().camTick + 1,
    })
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
  const { locus, disease, selected, guide, delivery, cas, repair, tolerance, seed } = useSim(
    useShallow((s) => ({ locus: s.locus, disease: s.disease, selected: s.selected, guide: s.guide, delivery: s.delivery, cas: s.cas, repair: s.repair, tolerance: s.tolerance, seed: s.seed })),
  )
  const lang = useLang((s) => s.lang)
  return useMemo(() => {
    const en = lang === 'en'
    const candidates = findCandidates(locus)
    const cand = candidates[selected] ?? candidates[0]
    const dis = findDisease(disease)
    const fix: Fix | undefined = dis && locus[dis.pos] !== dis.wt ? { pos: dis.pos, wt: dis.wt } : undefined
    if (!cand) return { candidates, cand: undefined, dis } as const
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
      ops = hdrOps(cand, fix)
      const corrects = !!fix && ops[0]?.pos === fix.pos
      kind = corrects
        ? en ? `HDR with template: the healthy base is restored at position ${fix!.pos + 1} (${locus[fix!.pos]}→${fix!.wt}).` : `HDR com molde: a base saudável volta na posição ${fix!.pos + 1} (${locus[fix!.pos]}→${fix!.wt}).`
        : fix
          ? en ? `HDR with template, but the cut is ${Math.abs(fix.pos - cand.cut)} nt from the mutation: too far for these homology arms, so the template only leaves its GAATTC tag. Choose a site closer to the mutation.` : `HDR com molde, mas o corte está a ${Math.abs(fix.pos - cand.cut)} nt da mutação: longe demais para estes braços de homologia, e o molde só deixa a marca GAATTC. Escolha um sítio mais perto da mutação.`
          : en ? 'HDR with template: GAATTC (EcoRI site) inserted + PAM mutated.' : 'HDR com molde: inserção de GAATTC (sítio EcoRI) + mutação do PAM.'
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
    // veredito do alelo: comparar a PROTEÍNA, e não a sequência, é o que distingue
    // corrigir de inativar o gene (um indel perto da mutação também "muda" o DNA)
    let protein
    if (dis) {
      const healthy = translate(locus.slice(0, dis.pos) + dis.wt + locus.slice(dis.pos + 1), dis.orf)
      const before = translate(locus, dis.orf)
      const after = translate(applied.seq, dis.orf)
      protein = { healthy, before, after, allele: after === healthy ? 'healthy' : after === before ? 'unchanged' : 'broken' } as const
    }
    return { candidates, cand, pOn, offs, ops, kind, eff, applied, acts, dis, fix, protein, cuts: acts ? CAS[cas].cuts : 'none' } as const
  }, [locus, disease, selected, guide, delivery, cas, repair, tolerance, seed, lang])
}

// depuração/testes automatizados (somente em desenvolvimento)
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __sim: typeof useSim }).__sim = useSim
