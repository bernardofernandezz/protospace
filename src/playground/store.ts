import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { useMemo } from 'react'
import {
  BASE_EDITORS, CAS, DEFAULT_LOCUS, DELIVERY, FIX_RANGE, MAX_LOCUS, PE_RANGE, applyOps, clean, consequence,
  bestSite, cutProbability, editOps, findCandidates, firstOrf, isBaseEditor, nearestSite, netLength, nhejOps,
  offTargetSites, population, repairOdds, translate, withMismatches,
  type Candidate, type CasType, type Delivery, type Fix, type NucleaseId, type Op, type Repair,
} from '../lib/dna'
import { useLang, type L } from '../i18n'
import { EXHIBIT } from '../content/exhibits'
import { MISSIONS } from '../content/missions'
import { findDisease, targetPos, type Disease } from '../content/diseases'
import type { Preset } from './open'

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
  /** Nuclease que define quais PAMs valem (src/lib/dna.ts). */
  nuclease: NucleaseId
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
  setNuclease: (n: NucleaseId) => void
  applyPreset: (p: Preset) => void
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
const PARAM_KEYS = ['locus', 'dis', 'site', 'guide', 'nuc', 'cas', 'delivery', 'repair', 'tol', 'seed'] as const

/** Via de reparo com que cada caso abre: corrigir pede molde; destruir pede justamente o indel. */
const defaultRepair = (dis?: Disease): Repair => (dis?.goal === 'fix' ? 'hdr' : 'nhej')

function fromUrl() {
  const q = typeof location === 'undefined' ? new URLSearchParams() : new URLSearchParams(location.search)
  const dis = findDisease(q.get('dis'))
  const locus = clean(q.get('locus') ?? '').slice(0, MAX_LOCUS) || dis?.locus || DEFAULT_LOCUS
  const pickNuclease = (v: string | null): NucleaseId => (v === 'cas12a' ? 'cas12a' : 'spcas9')
  const nuclease = pickNuclease(q.get('nuc'))
  const cands = findCandidates(locus, nuclease)
  const fallback = dis ? nearestSite(cands, targetPos(dis)) : bestSite(cands)
  const site = Math.min(Math.max(0, Number(q.get('site') ?? fallback) || 0), Math.max(0, cands.length - 1))
  const g = clean(q.get('guide') ?? '')
  const pick = <T extends string>(v: string | null, ok: readonly T[], def: T): T => (ok.includes(v as T) ? (v as T) : def)
  return {
    locus,
    disease: dis?.id ?? null,
    nuclease,
    selected: site,
    guide: g.length === 20 ? g : cands[site]?.protospacer ?? '',
    cas: pick(q.get('cas'), ['wt', 'nickase', 'be', 'abe', 'pe'] as const, 'wt'),
    delivery: pick(q.get('delivery'), ['rnp', 'plasmid', 'viral'] as const, 'rnp'),
    repair: pick(q.get('repair'), ['nhej', 'hdr'] as const, defaultRepair(dis)),
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
  const cand = findCandidates(s.locus, s.nuclease)[s.selected]
  url.searchParams.set('site', String(s.selected))
  if (s.nuclease !== 'spcas9') url.searchParams.set('nuc', s.nuclease)
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
    const { nuclease } = get()
    const c = findCandidates(locus, nuclease)
    const prev = findCandidates(get().locus, nuclease)[get().selected]
    // mantém o sítio mais próximo do anterior: trocar uma base não deve pular a seleção
    const i = prev ? nearestSite(c, prev.cut) : 0
    // editar a sequência à mão invalida o alelo marcado pelo cenário
    set({ locus, disease: null, selected: i, guide: c[i]?.protospacer ?? '', step: 0, progress: 0, playing: false })
  },
  setNuclease: (nuclease) => {
    const { locus, selected, disease } = get()
    const prev = findCandidates(locus, get().nuclease)[selected]
    const c = findCandidates(locus, nuclease)
    const dis = findDisease(disease)
    // mantém o sítio mais próximo do anterior; sem candidato antigo, volta para o alvo do cenário
    const anchor = prev?.cut ?? (dis ? targetPos(dis) : 0)
    const i = c.length ? nearestSite(c, anchor) : 0
    set({ nuclease, selected: i, guide: c[i]?.protospacer ?? '', step: 0, progress: 0, playing: false })
  },
  applyPreset: ({ disease = null, nuclease = 'spcas9', cas = 'wt', repair, mismatches = [] }) => {
    get().setDisease(disease)
    get().setNuclease(nuclease)
    set({ cas, repair: repair ?? defaultRepair(findDisease(disease)) })
    if (mismatches.length) set({ guide: withMismatches(get().guide, mismatches) })
  },
  setDisease: (id) => {
    const dis = findDisease(id)
    const locus = dis?.locus ?? DEFAULT_LOCUS
    const c = findCandidates(locus, get().nuclease)
    const i = dis ? nearestSite(c, targetPos(dis)) : bestSite(c)
    set({
      disease: dis?.id ?? null, locus, selected: i, guide: c[i]?.protospacer ?? '',
      ...(dis ? { cas: 'wt' as const, repair: defaultRepair(dis) } : {}),
      step: 0, progress: 0, playing: false, camTick: get().camTick + 1,
    })
  },
  select: (i) => {
    const c = findCandidates(get().locus, get().nuclease)[i]
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

/** O conjunto de parâmetros que define um experimento. */
export interface Params {
  locus: string
  disease: string | null
  nuclease: NucleaseId
  selected: number
  guide: string
  delivery: Delivery
  cas: CasType
  repair: Repair
  tolerance: number
  seed: number
}

const params = (s: SimState): Params => ({
  locus: s.locus, disease: s.disease, nuclease: s.nuclease, selected: s.selected, guide: s.guide,
  delivery: s.delivery, cas: s.cas, repair: s.repair, tolerance: s.tolerance, seed: s.seed,
})

/** Proteína traduzida antes e depois da edição; `healthy` existe quando há um alelo de referência. */
export interface Proteins { before: string; after: string; healthy?: string }

/** Sucesso = o cenário atingiu seu objetivo; inalterado = nada mudou; quebrado = mudou para pior. */
export type Verdict = 'success' | 'unchanged' | 'broken'

/** Descreve a correção em palavras, seja ela uma troca, uma inserção ou uma deleção. */
function fixText(locus: string, fix: Fix, en: boolean): string {
  const at = `${en ? 'position' : 'posição'} ${fix.pos + 1}`
  if (!fix.del) return en ? `${fix.ins} inserted at ${at}` : `inserção de ${fix.ins} na ${at}`
  if (!fix.ins) return en ? `${fix.del} nt removed at ${at}` : `remoção de ${fix.del} nt na ${at}`
  return `${at} (${locus.slice(fix.pos, fix.pos + fix.del)}→${fix.ins})`
}

/** A frase que explica o desfecho da edição para o usuário. */
function outcomeText(p: Params, c: Candidate, ops: Op[], fix: Fix | undefined, en: boolean): string {
  if (isBaseEditor(p.cas)) {
    const { from, to } = BASE_EDITORS[p.cas]
    const k = ops.length
    if (!k) {
      return en
        ? `No ${from} in the editing window (positions 4–8): the base editor has nothing to convert.`
        : `Nenhum ${from} na janela de edição (posições 4–8): o editor de bases não atua.`
    }
    return en
      ? `${from}→${to} base edit (${k} position${k > 1 ? 's' : ''} in window 4–8), no double-strand break.`
      : `Edição de base ${from}→${to} (${k} ${k > 1 ? 'posições' : 'posição'} na janela 4–8), sem quebra de fita dupla.`
  }

  if (p.cas === 'pe') {
    if (ops.length) {
      const reach = ops[0].pos - c.cut
      return en
        ? `Prime editing: the reverse transcriptase writes the edit ${reach} nt downstream of the nick — no double-strand break and no donor template.`
        : `Prime editing: a transcriptase reversa escreve a edição ${reach} nt adiante do nick — sem quebra de fita dupla e sem molde doador.`
    }
    const behind = fix ? c.cut - fix.pos : 0
    return en
      ? `The pegRNA extension only writes forward, up to ${PE_RANGE} nt from the nick, and the target sits ${behind > 0 ? `${behind} nt behind it` : 'too far ahead'}. Pick a site whose nick falls just before the target.`
      : `A extensão do pegRNA só escreve para a frente, até ${PE_RANGE} nt do nick, e o alvo está ${behind > 0 ? `${behind} nt atrás dele` : 'longe demais à frente'}. Escolha um sítio cujo nick caia logo antes do alvo.`
  }

  if (p.cas === 'nickase') {
    return en
      ? 'Single-strand nick: usually repaired without error. For a DSB, use a pair of nickases with opposite guides.'
      : 'Nick em uma única fita: geralmente reparado sem erro. Para DSB, use um par de nickases com guias opostos.'
  }

  if (p.repair === 'hdr') {
    if (fix && Math.abs(fix.pos - c.cut) <= FIX_RANGE) {
      return en
        ? `HDR with template: the healthy allele comes back — ${fixText(p.locus, fix, en)}.`
        : `HDR com molde: o alelo saudável volta — ${fixText(p.locus, fix, en)}.`
    }
    if (fix) {
      return en
        ? `HDR with template, but the cut is ${Math.abs(fix.pos - c.cut)} nt from the mutation: too far for these homology arms, so the template only leaves its GAATTC tag. Choose a site closer to the mutation.`
        : `HDR com molde, mas o corte está a ${Math.abs(fix.pos - c.cut)} nt da mutação: longe demais para estes braços de homologia, e o molde só deixa a marca GAATTC. Escolha um sítio mais perto da mutação.`
    }
    return en
      ? 'HDR with template: GAATTC (EcoRI site) inserted + PAM mutated.'
      : 'HDR com molde: inserção de GAATTC (sítio EcoRI) + mutação do PAM.'
  }

  const n = netLength(ops)
  return en
    ? `NHEJ: ${n > 0 ? `${n}-nt insertion` : `${-n}-nt deletion`}${n % 3 ? ' → frameshift (likely knockout if in a coding exon)' : ' → in-frame (may not inactivate the gene)'}.`
    : `NHEJ: ${n > 0 ? `inserção de ${n} nt` : `deleção de ${-n} nt`}${n % 3 ? ' → frameshift (provável knockout, se em éxon codificante)' : ' → in-frame (pode não inativar o gene)'}.`
}

/** Compara a PROTEÍNA, não a sequência: é isso que distingue corrigir de inativar o gene. */
function verdictOf(dis: Disease, seq: string, prot?: Proteins): Verdict {
  if (dis.goal === 'disrupt') return seq.includes(dis.motif!) ? 'unchanged' : 'success'
  if (!prot?.healthy) return seq === applyOps(dis.locus, [dis.fix!]).seq ? 'success' : 'unchanged'
  if (prot.after === prot.healthy) return 'success'
  return prot.after === prot.before ? 'unchanged' : 'broken'
}

/** Tudo que deriva dos parâmetros: candidatos, probabilidades, resultado da edição. */
export function derive(p: Params, en: boolean) {
  const candidates = findCandidates(p.locus, p.nuclease)
  const cand = candidates[p.selected] ?? candidates[0]
  const dis = findDisease(p.disease)
  if (!cand) return { candidates, cand: undefined, dis } as const

  // o cenário só vale enquanto o locus é o dele: editar a sequência desfaz o alelo marcado
  const fix = dis?.goal === 'fix' && p.locus === dis.locus ? dis.fix : undefined
  const delivery = DELIVERY[p.delivery]
  const pOn = cutProbability(p.guide, cand.protospacer, p.tolerance)
  const offs = offTargetSites(cand.protospacer).map((o) => ({
    ...o,
    p: Math.min(0.99, cutProbability(p.guide, o.site, p.tolerance) * delivery.offMult),
  }))
  const acts = pOn >= 0.3

  const build = editOps(p.cas, p.repair, p.locus, cand, fix)
  const unwanted = (seed: number) => nhejOps(p.locus, cand.cut, seed)
  // destruir um elemento regulador não é garantido: um indel pode deixar o motivo legível
  const succeeded = dis?.goal === 'disrupt'
    ? (ops: Op[]) => !applyOps(p.locus, ops).seq.includes(dis.motif!)
    : (ops: Op[]) => ops.length > 0
  const ops = acts ? build(p.seed) : []
  const odds = repairOdds(p.cas, p.repair)
  const pEngage = pOn * delivery.eff
  const eff = ops.length ? pEngage * odds.intended : 0
  const kind = acts
    ? outcomeText(p, cand, ops, fix, en)
    : en ? 'No edit: the guide does not recognise the target well (too many mismatches).'
      : 'Sem edição: o guia não reconhece bem o alvo (mismatches demais).'

  const applied = applyOps(p.locus, ops)
  // sem cenário, o primeiro ATG dá um quadro de leitura ao locus fictício; num cenário
  // não codificante (um enhancer) não há proteína nenhuma para comparar
  const orf = dis ? dis.orf ?? -1 : firstOrf(p.locus)
  const proteins: Proteins | undefined = orf >= 0
    ? {
        before: translate(p.locus, orf),
        after: translate(applied.seq, orf),
        healthy: dis?.fix ? translate(applyOps(dis.locus, [dis.fix]).seq, orf) : undefined,
      }
    : undefined

  return {
    candidates, cand, pOn, offs, ops, kind, eff, applied, acts, dis, fix, odds, pEngage,
    proteins,
    effect: proteins && consequence(proteins.before, proteins.after, ops),
    verdict: dis ? verdictOf(dis, applied.seq, proteins) : undefined,
    cuts: acts ? CAS[p.cas].cuts : 'none',
    population: (seed: number, alleles?: number) =>
      population({ pEngage, odds, intended: build, unwanted, succeeded, seed, alleles }),
  } as const
}

export const useParams = () => useSim(useShallow(params))

export function useDerived() {
  const p = useParams()
  const en = useLang((s) => s.lang === 'en')
  return useMemo(() => derive(p, en), [p, en])
}

// depuração/testes automatizados (somente em desenvolvimento)
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __sim: typeof useSim }).__sim = useSim
