// Lógica de sequência do playground. Tudo aqui é um MODELO DIDÁTICO:
// scores e probabilidades são ilustrativos, não preditores reais.

export type CasType = 'wt' | 'nickase' | 'be'
export type Delivery = 'rnp' | 'plasmid' | 'viral'
export type Repair = 'nhej' | 'hdr'

/** Edição em coordenadas da sequência ORIGINAL: remove `del` bases em `pos` e insere `ins`. */
export interface Op { pos: number; del: number; ins: string }

export interface Candidate {
  start: number // índice do 1º nt do protoespaçador
  protospacer: string // 20 nt, 5'→3', fita senso
  pam: string // NGG
  cut: number // corte entre cut-1 e cut (3 pb a montante do PAM)
  gc: number
  score: number // ilustrativo
}

// Sequência fictícia (não é um gene real), desenhada para conter vários PAMs NGG.
export const DEFAULT_LOCUS =
  'ATCGTTACCGATGCTAGCTCAAGGTCTGACCATGTCGACGTTCCAGTGGCTAACGATCCTGCAGTTCGAGCCAGGATCATCAAGCTTTCACGGTA'

export const MAX_LOCUS = 160
export const COMP: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' }

export const clean = (s: string) => s.toUpperCase().replace(/[^ACGT]/g, '')
export const complement = (s: string) => [...s].map((b) => COMP[b] ?? 'N').join('')
export const gcContent = (s: string) => (s.match(/[GC]/g)?.length ?? 0) / Math.max(1, s.length)

/** Score ilustrativo de on-target: penaliza GC fora de 40–70 %, TTTT (terminador do promotor U6) e homopolímeros. */
export function onTargetScore(p: string): number {
  const gc = gcContent(p)
  let s = 92
  if (gc < 0.4) s -= (0.4 - gc) * 160
  if (gc > 0.7) s -= (gc - 0.7) * 160
  if (/TTTT/.test(p)) s -= 35
  if (/(AAAAA|CCCCC|GGGGG|TTTTT)/.test(p)) s -= 12
  if (p[19] === 'G') s += 6
  if (p[19] === 'T') s -= 6
  return Math.round(Math.max(0, Math.min(100, s)))
}

/** Varre a fita senso por protoespaçadores de 20 nt seguidos de NGG (SpCas9). */
export function findCandidates(locus: string): Candidate[] {
  const out: Candidate[] = []
  for (let i = 20; i + 3 <= locus.length; i++) {
    if (locus[i + 1] === 'G' && locus[i + 2] === 'G') {
      const protospacer = locus.slice(i - 20, i)
      out.push({
        start: i - 20,
        protospacer,
        pam: locus.slice(i, i + 3),
        cut: i - 3,
        gc: gcContent(protospacer),
        score: onTargetScore(protospacer),
      })
    }
  }
  return out
}

export const mismatches = (guide: string, site: string) =>
  [...guide].flatMap((b, i) => (b !== site[i] ? [i] : []))

/** Posições 0–19 (19 = adjacente ao PAM). "Seed" = 12 nt proximais ao PAM, onde mismatches pesam mais. */
export const isSeed = (i: number) => i >= 8

/**
 * Probabilidade ilustrativa de corte num sítio. Cada mismatch pesa 2,5 na região seed
 * (proximal ao PAM) e 1 na distal; `tolerance` desloca o centro da logística, imitando
 * desde variantes de alta fidelidade (0) até excesso de enzima / exposição prolongada (3).
 */
export function cutProbability(guide: string, site: string, tolerance: number): number {
  const w = mismatches(guide, site).reduce((a, i) => a + (isSeed(i) ? 2.5 : 1), 0)
  return 1 / (1 + Math.exp(2.5 * (w - (0.8 + 1.1 * tolerance))))
}

const TRANSITION: Record<string, string> = { A: 'G', G: 'A', C: 'T', T: 'C' }
const mutateAt = (s: string, idx: number[]) =>
  [...s].map((b, i) => (idx.includes(i) ? TRANSITION[b] : b)).join('')

export interface OffTargetSite { label: { pt: string; en: string }; site: string; pam: string }

/** Dois sítios "em outro ponto do genoma" (fictícios), parecidos com o alvo: 2 mm distais e 1 distal + 1 seed. */
export function offTargetSites(protospacer: string): OffTargetSite[] {
  return [
    { label: { pt: 'Sítio OT-1 · cromossomo ilustrativo 7', en: 'Site OT-1 · illustrative chromosome 7' }, site: mutateAt(protospacer, [1, 4]), pam: 'AGG' },
    { label: { pt: 'Sítio OT-2 · cromossomo ilustrativo 12', en: 'Site OT-2 · illustrative chromosome 12' }, site: mutateAt(protospacer, [2, 13]), pam: 'TGG' },
  ]
}

export const DELIVERY = {
  rnp: {
    name: { pt: 'RNP', en: 'RNP' }, eff: 0.9, offMult: 0.6,
    note: { pt: 'Proteína + guia prontos: ação rápida e transitória, menos off-target.', en: 'Pre-assembled protein + guide: fast, transient activity and fewer off-targets.' },
  },
  plasmid: {
    name: { pt: 'Plasmídeo', en: 'Plasmid' }, eff: 0.7, offMult: 1.35,
    note: { pt: 'Barato, mas a expressão prolongada aumenta off-target e há risco de integração.', en: 'Cheap, but prolonged expression raises off-target activity and there is a risk of integration.' },
  },
  viral: {
    name: { pt: 'Vetor viral', en: 'Viral vector' }, eff: 0.85, offMult: 1.5,
    note: { pt: 'Alta eficiência (inclusive in vivo); expressão persistente, imunogenicidade, limite de carga (AAV ≈ 4,7 kb).', en: 'High efficiency (including in vivo); persistent expression, immunogenicity, cargo limit (AAV ≈ 4.7 kb).' },
  },
} as const

export const CAS = {
  wt: { name: { pt: 'SpCas9 selvagem', en: 'Wild-type SpCas9' }, cuts: 'dsb' },
  nickase: { name: { pt: 'Cas9 nickase (D10A)', en: 'Cas9 nickase (D10A)' }, cuts: 'nick' },
  be: { name: { pt: 'Editor de bases (CBE)', en: 'Base editor (CBE)' }, cuts: 'none' },
} as const

/** PRNG determinístico (mulberry32) para que cada "rodada" seja reproduzível. */
export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** NHEJ: +1 inserção (frequente em SpCas9) ou deleção pequena em torno do corte. */
export function nhejOps(locus: string, cut: number, seed: number): Op[] {
  const r = rng(seed)
  if (r() < 0.4) return [{ pos: cut, del: 0, ins: locus[cut - 1] }]
  const len = 1 + Math.floor(r() ** 2 * 9) // viés para deleções curtas
  const pos = Math.max(0, Math.min(locus.length - len, cut - Math.floor(r() * len)))
  return [{ pos, del: len, ins: '' }]
}

export const HDR_INSERT = 'GAATTC' // sítio EcoRI: facilita triagem por digestão

/** HDR com molde: insere GAATTC no corte e muta o PAM (G→C) para impedir novo corte do alelo editado. */
export function hdrOps(c: Candidate): Op[] {
  const pamG = c.start + 21
  return [
    { pos: c.cut, del: 0, ins: HDR_INSERT },
    { pos: pamG, del: 1, ins: 'C' },
  ]
}

/** Editor de bases de citosina: C→T nas posições 4–8 do protoespaçador (contadas a partir da ponta distal ao PAM). */
export function baseEditOps(c: Candidate): Op[] {
  const ops: Op[] = []
  for (let k = 3; k <= 7; k++) if (c.protospacer[k] === 'C') ops.push({ pos: c.start + k, del: 1, ins: 'T' })
  return ops
}

export interface Applied { seq: string; changed: boolean[] }

export function applyOps(seq: string, ops: Op[]): Applied {
  const sorted = [...ops].sort((a, b) => a.pos - b.pos)
  let out = ''
  const changed: boolean[] = []
  let i = 0
  for (const op of sorted) {
    for (; i < op.pos; i++) { out += seq[i]; changed.push(false) }
    for (const b of op.ins) { out += b; changed.push(true) }
    i += op.del
  }
  for (; i < seq.length; i++) { out += seq[i]; changed.push(false) }
  return { seq: out, changed }
}

export type Seg = { type: 'same' | 'del' | 'ins' | 'sub'; text: string }

/** Diff legível entre original e editado, construído direto das operações (não precisa de alinhamento). */
export function diffSegments(seq: string, ops: Op[]): Seg[] {
  const segs: Seg[] = []
  const push = (type: Seg['type'], text: string) => {
    if (!text) return
    const last = segs[segs.length - 1]
    if (last?.type === type) last.text += text
    else segs.push({ type, text })
  }
  let i = 0
  for (const op of [...ops].sort((a, b) => a.pos - b.pos)) {
    push('same', seq.slice(i, op.pos))
    if (op.del && op.del === op.ins.length) push('sub', op.ins)
    else { push('del', seq.slice(op.pos, op.pos + op.del)); push('ins', op.ins) }
    i = op.pos + op.del
  }
  push('same', seq.slice(i))
  return segs
}

export const netLength = (ops: Op[]) => ops.reduce((a, o) => a + o.ins.length - o.del, 0)
