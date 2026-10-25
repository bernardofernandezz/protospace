// Lógica de sequência do playground. Tudo aqui é um MODELO DIDÁTICO:
// scores e probabilidades são ilustrativos, não preditores reais.

export type CasType = 'wt' | 'nickase' | 'be' | 'abe' | 'pe'
export type Delivery = 'rnp' | 'plasmid' | 'viral'
export type Repair = 'nhej' | 'hdr'

/** Edição em coordenadas da sequência ORIGINAL: remove `del` bases em `pos` e insere `ins`. */
export interface Op {
  pos: number
  del: number
  ins: string
}

/** 1 = fita senso (a que guardamos); -1 = fita antissenso, lida de trás para frente. */
export type Strand = 1 | -1

export interface Candidate {
  start: number // índice, no locus, do 1º nt do protoespaçador à esquerda
  strand: Strand
  protospacer: string // 20 nt, 5'→3', lidos na fita do próprio guia
  pam: string // NGG, lido na fita do guia
  pamStart: number // índice, no locus, da base mais à esquerda do PAM
  cut: number // corte na fita do protoespaçador, entre cut-1 e cut
  cutFar: number // corte na fita oposta: igual a `cut` num corte cego
  gc: number
  score: number // ilustrativo
}

/** Índice, no locus, da posição `k` (0–19) do protoespaçador. */
export const spacerIndex = (c: Candidate, k: number) => (c.strand === 1 ? c.start + k : c.start + 19 - k)

/** Posição (0–19) no protoespaçador que corresponde ao índice `i` do locus; -1 se estiver fora. */
export function spacerPos(c: Candidate, i: number): number {
  const k = c.strand === 1 ? i - c.start : 19 - (i - c.start)
  return k >= 0 && k < 20 ? k : -1
}

export const inPam = (c: Candidate, i: number) => i >= c.pamStart && i < c.pamStart + c.pam.length

export const revComp = (s: string) =>
  [...s]
    .reverse()
    .map((b) => COMP[b])
    .join('')

// Sequência fictícia (não é um gene real), desenhada para conter PAMs das duas nucleases:
// vários NGG para a SpCas9 e, no trecho final rico em T, TTTV para a Cas12a.
export const DEFAULT_LOCUS = 'ATCGTTACCGATGCTAGCTCAAGGTCTGACCATGTCGACGTTCCAGTGGCTAACGATCCTGCAGTTCGAGCCAGGATCATCAAGCTTTCACGGTAGCTTTAGCATCGGATTCCAGTAGCTAACG'

export const MAX_LOCUS = 160
export const COMP: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' }

export const clean = (s: string) => s.toUpperCase().replace(/[^ACGT]/g, '')
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

/** As duas nucleases do playground. O PAM é a diferença decisiva: muda o lado e muda os alvos possíveis. */
export const NUCLEASE = {
  spcas9: {
    name: { pt: 'SpCas9', en: 'SpCas9' },
    pam: { seq: 'NGG', re: /^.GG$/, side: 3 },
    spacer: 20,
    /** Distância do corte até o PAM, em cada fita: iguais num corte cego. */
    cuts: { near: 3, far: 3 },
    note: {
      pt: 'Corte cego, 3 pb a montante do PAM. É a nuclease mais usada e a que tem mais ferramentas derivadas.',
      en: 'Blunt cut, 3 bp upstream of the PAM. The most used nuclease, and the one with the most derived tools.',
    },
  },
  cas12a: {
    name: { pt: 'Cas12a', en: 'Cas12a' },
    pam: { seq: 'TTTV', re: /^TTT[ACG]$/, side: 5 },
    spacer: 20,
    cuts: { near: 18, far: 23 },
    note: {
      pt: 'Também chamada Cpf1. PAM rico em T, do outro lado do protoespaçador, e corte escalonado: sobram pontas coesivas de 5 nt. Também processa o próprio RNA guia, dispensando o tracrRNA.',
      en: 'Also called Cpf1. T-rich PAM, on the other side of the protospacer, and a staggered cut leaving 5-nt sticky ends. It also processes its own guide RNA, with no tracrRNA needed.',
    },
  },
} as const

export type NucleaseId = keyof typeof NUCLEASE

/** Candidato a partir do índice da base mais à esquerda do protoespaçador. */
function describe(locus: string, start: number, strand: Strand, n: NucleaseId): Candidate {
  const { pam, spacer, cuts } = NUCLEASE[n]
  const raw = locus.slice(start, start + spacer)
  const protospacer = strand === 1 ? raw : revComp(raw)
  // o PAM encosta no protoespaçador do lado que a nuclease exige, já em coordenadas do locus
  const atLeft = (pam.side === 3) === (strand === -1)
  const pamStart = atLeft ? start - pam.seq.length : start + spacer
  // o corte é medido a partir do PAM, afastando-se dele
  const from = (offset: number) => (atLeft ? start + offset : start + spacer - offset)
  return {
    start,
    strand,
    protospacer,
    pam: strand === 1 ? locus.slice(pamStart, pamStart + pam.seq.length) : revComp(locus.slice(pamStart, pamStart + pam.seq.length)),
    pamStart,
    cut: from(cuts.near),
    cutFar: from(cuts.far),
    gc: gcContent(protospacer),
    score: onTargetScore(protospacer),
  }
}

/** Varre as duas fitas atrás de protoespaçadores com o PAM que a nuclease escolhida exige. */
export function findCandidates(locus: string, n: NucleaseId = 'spcas9'): Candidate[] {
  const { pam, spacer } = NUCLEASE[n]
  const len = pam.seq.length
  const out: Candidate[] = []
  const reads = (at: number, strand: Strand) => {
    if (at < 0 || at + len > locus.length) return false
    const s = locus.slice(at, at + len)
    return pam.re.test(strand === 1 ? s : revComp(s))
  }
  for (let start = 0; start + spacer <= locus.length; start++) {
    const right = start + spacer
    // fita senso: o PAM fica à direita se a nuclease o quer a 3′, à esquerda se a 5′
    if (reads(pam.side === 3 ? right : start - len, 1)) out.push(describe(locus, start, 1, n))
    if (reads(pam.side === 3 ? start - len : right, -1)) out.push(describe(locus, start, -1, n))
  }
  return out.sort((a, b) => a.start - b.start || a.strand - b.strand)
}

/** Índice do candidato com o melhor score ilustrativo: por onde faz sentido começar. */
export const bestSite = (cands: Candidate[]) => cands.reduce((best, c, i) => (c.score > cands[best].score ? i : best), 0)

/** Índice do sítio cujo corte cai mais perto de `pos` (o que um molde de HDR consegue corrigir). */
export function nearestSite(cands: Candidate[], pos: number): number {
  let best = 0
  cands.forEach((c, i) => {
    if (Math.abs(c.cut - pos) < Math.abs(cands[best].cut - pos)) best = i
  })
  return best
}

/** Próxima letra do ciclo A→C→G→T: o jeito mais simples de trocar uma base com um clique. */
export const NEXT_BASE: Record<string, string> = { A: 'C', C: 'G', G: 'T', T: 'A' }

export const withMismatches = (guide: string, at: number[]) => [...guide].map((b, i) => (at.includes(i) ? NEXT_BASE[b] : b)).join('')

export const mismatches = (guide: string, site: string) => [...guide].flatMap((b, i) => (b !== site[i] ? [i] : []))

/**
 * Posições 0–19 do guia, 5′→3′. "Seed" = trecho proximal ao PAM, onde mismatches pesam mais:
 * os 12 nt da ponta 3′ na SpCas9 (PAM a 3′) e os 8 nt da ponta 5′ na Cas12a (PAM a 5′).
 */
export const isSeed = (i: number, n: NucleaseId = 'spcas9') => (NUCLEASE[n].pam.side === 3 ? i >= 8 : i < 8)

/**
 * Probabilidade ilustrativa de corte num sítio. Cada mismatch pesa 2,5 na região seed
 * (proximal ao PAM) e 1 na distal; `tolerance` desloca o centro da logística, imitando
 * desde variantes de alta fidelidade (0) até excesso de enzima / exposição prolongada (3).
 */
export function cutProbability(guide: string, site: string, tolerance: number, n: NucleaseId = 'spcas9'): number {
  const w = mismatches(guide, site).reduce((a, i) => a + (isSeed(i, n) ? 2.5 : 1), 0)
  return 1 / (1 + Math.exp(2.5 * (w - (0.8 + 1.1 * tolerance))))
}

const TRANSITION: Record<string, string> = { A: 'G', G: 'A', C: 'T', T: 'C' }
const mutateAt = (s: string, idx: number[]) => [...s].map((b, i) => (idx.includes(i) ? TRANSITION[b] : b)).join('')

export interface OffTargetSite {
  label: { pt: string; en: string }
  site: string
  pam: string
}

/** Dois sítios "em outro ponto do genoma" (fictícios), parecidos com o alvo: 2 mm distais e 1 distal + 1 seed. */
export function offTargetSites(protospacer: string, n: NucleaseId = 'spcas9'): OffTargetSite[] {
  // as posições são contadas a partir da ponta distal ao PAM, que na Cas12a é a 3′
  const at = (ks: number[]) => (NUCLEASE[n].pam.side === 3 ? ks : ks.map((k) => 19 - k))
  const [pam1, pam2] = n === 'cas12a' ? ['TTTA', 'TTTC'] : ['AGG', 'TGG']
  return [
    { label: { pt: 'Sítio OT-1 · cromossomo ilustrativo 7', en: 'Site OT-1 · illustrative chromosome 7' }, site: mutateAt(protospacer, at([1, 4])), pam: pam1 },
    {
      label: { pt: 'Sítio OT-2 · cromossomo ilustrativo 12', en: 'Site OT-2 · illustrative chromosome 12' },
      site: mutateAt(protospacer, at([2, 13])),
      pam: pam2,
    },
  ]
}

export const DELIVERY = {
  rnp: {
    name: { pt: 'RNP', en: 'RNP' },
    eff: 0.9,
    offMult: 0.6,
    note: {
      pt: 'Proteína + guia prontos: ação rápida e transitória, menos off-target.',
      en: 'Pre-assembled protein + guide: fast, transient activity and fewer off-targets.',
    },
  },
  plasmid: {
    name: { pt: 'Plasmídeo', en: 'Plasmid' },
    eff: 0.7,
    offMult: 1.35,
    note: {
      pt: 'Barato, mas a expressão prolongada aumenta off-target e há risco de integração.',
      en: 'Cheap, but prolonged expression raises off-target activity and there is a risk of integration.',
    },
  },
  viral: {
    name: { pt: 'Vetor viral', en: 'Viral vector' },
    eff: 0.85,
    offMult: 1.5,
    note: {
      pt: 'Alta eficiência (inclusive in vivo); expressão persistente, imunogenicidade, limite de carga (AAV ≈ 4,7 kb).',
      en: 'High efficiency (including in vivo); persistent expression, immunogenicity, cargo limit (AAV ≈ 4.7 kb).',
    },
  },
} as const

export const CAS = {
  wt: { name: { pt: 'SpCas9 selvagem', en: 'Wild-type SpCas9' }, cuts: 'dsb' },
  nickase: { name: { pt: 'Cas9 nickase (D10A)', en: 'Cas9 nickase (D10A)' }, cuts: 'nick' },
  be: { name: { pt: 'Editor de bases (CBE)', en: 'Base editor (CBE)' }, cuts: 'none' },
  abe: { name: { pt: 'Editor de bases (ABE)', en: 'Base editor (ABE)' }, cuts: 'none' },
  pe: { name: { pt: 'Prime editor (PE2)', en: 'Prime editor (PE2)' }, cuts: 'nick' },
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

/** Até onde o molde consegue levar a correção a partir do corte (braços de homologia curtos). */
export const FIX_RANGE = 30

/** Edição que devolve o alelo saudável: uma troca, uma inserção ou uma deleção no locus doente. */
export type Fix = Op

/**
 * HDR com molde. Com um alelo a corrigir e o corte perto o bastante, o molde traz a sequência
 * saudável de volta; caso contrário insere GAATTC no corte e muta o PAM (G→C) para impedir novo corte.
 */
export function hdrOps(c: Candidate, fix?: Fix): Op[] {
  if (fix && Math.abs(fix.pos - c.cut) <= FIX_RANGE) return [fix]
  // muta o G do meio do NGG (na fita senso, o C do meio de um CCN) para a Cas9 não cortar de novo
  return [
    { pos: c.cut, del: 0, ins: HDR_INSERT },
    { pos: c.pamStart + 1, del: 1, ins: c.strand === 1 ? 'C' : 'G' },
  ]
}

/** Até onde a transcriptase reversa escreve a partir do nick, sempre no sentido 3′. */
export const PE_RANGE = 30

/**
 * Prime editing: o nick cai no mesmo ponto do corte da Cas9 e a RT copia a extensão do pegRNA
 * a partir dele. A edição só acontece se estiver adiante do nick e dentro do alcance da extensão.
 */
export function primeEditOps(c: Candidate, fix?: Fix): Op[] {
  const target = fix ?? { pos: c.cut, del: 0, ins: HDR_INSERT }
  // "adiante do nick" segue a fita cortada: num guia antissenso, isso é para a esquerda do locus
  const reach = (target.pos - c.cut) * c.strand
  return reach >= 0 && reach <= PE_RANGE ? [target] : []
}

// Código genético padrão (tabela 1). Em cada posição do códon a ordem é T, C, A, G.
const CODE = 'FFLLSSSSYY**CC*WLLLLPPPPHHQQRRRRIIIMTTTTNNKKSSRRVVVVAAAADDEEGGGG'
const NT = 'TCAG'

/** Aminoácido de um códon (1 letra); '*' = parada, '?' = códon incompleto. */
export function aminoAcid(codon: string): string {
  const i = NT.indexOf(codon[0]) * 16 + NT.indexOf(codon[1]) * 4 + NT.indexOf(codon[2])
  return codon.length === 3 && NT.indexOf(codon[0]) >= 0 && NT.indexOf(codon[1]) >= 0 && NT.indexOf(codon[2]) >= 0 ? CODE[i] : '?'
}

/** Traduz a partir de `orf` até o códon de parada (incluído) ou o fim do trecho. */
export function translate(seq: string, orf: number): string {
  let out = ''
  for (let i = orf; i + 3 <= seq.length; i += 3) {
    const a = aminoAcid(seq.slice(i, i + 3))
    out += a
    if (a === '*') break
  }
  return out
}

/** Primeiro ATG do trecho: dá um quadro de leitura mesmo ao locus fictício. -1 se não houver. */
export const firstOrf = (seq: string) => seq.indexOf('ATG')

export const NAMES3: Record<string, string> = {
  A: 'Ala',
  C: 'Cys',
  D: 'Asp',
  E: 'Glu',
  F: 'Phe',
  G: 'Gly',
  H: 'His',
  I: 'Ile',
  K: 'Lys',
  L: 'Leu',
  M: 'Met',
  N: 'Asn',
  P: 'Pro',
  Q: 'Gln',
  R: 'Arg',
  S: 'Ser',
  T: 'Thr',
  V: 'Val',
  W: 'Trp',
  Y: 'Tyr',
  '*': 'Stop',
}

/** Editores de base: trocam uma letra sem cortar o DNA. CBE faz C→T; ABE faz A→G. */
export const BASE_EDITORS = {
  be: { from: 'C', to: 'T' },
  abe: { from: 'A', to: 'G' },
} as const

export type BaseEditor = keyof typeof BASE_EDITORS

export const isBaseEditor = (cas: CasType): cas is BaseEditor => cas in BASE_EDITORS

/** Janela de edição: posições 4–8 do protoespaçador, contadas a partir da ponta distal ao PAM. */
export const BE_WINDOW = { first: 3, last: 7 } as const

/**
 * A desaminase atua na fita do protoespaçador. Num guia antissenso, um C→T lá aparece
 * como G→A aqui, porque o locus é sempre guardado na fita senso.
 */
export function baseEditOps(c: Candidate, editor: BaseEditor): Op[] {
  const { from, to } = BASE_EDITORS[editor]
  const ops: Op[] = []
  for (let k = BE_WINDOW.first; k <= BE_WINDOW.last; k++) {
    if (c.protospacer[k] !== from) continue
    ops.push({ pos: spacerIndex(c, k), del: 1, ins: c.strand === 1 ? to : COMP[to] })
  }
  return ops.sort((a, b) => a.pos - b.pos)
}

export interface Applied {
  seq: string
  changed: boolean[]
}

export function applyOps(seq: string, ops: Op[]): Applied {
  const sorted = [...ops].sort((a, b) => a.pos - b.pos)
  let out = ''
  const changed: boolean[] = []
  let i = 0
  for (const op of sorted) {
    for (; i < op.pos; i++) {
      out += seq[i]
      changed.push(false)
    }
    for (const b of op.ins) {
      out += b
      changed.push(true)
    }
    i += op.del
  }
  for (; i < seq.length; i++) {
    out += seq[i]
    changed.push(false)
  }
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
    else {
      push('del', seq.slice(op.pos, op.pos + op.del))
      push('ins', op.ins)
    }
    i = op.pos + op.del
  }
  push('same', seq.slice(i))
  return segs
}

export const netLength = (ops: Op[]) => ops.reduce((a, o) => a + o.ins.length - o.del, 0)

/**
 * Operações da ferramenta escolhida. Recebe uma semente porque o NHEJ sorteia um indel
 * diferente a cada alelo; as demais vias são determinísticas.
 */
export function editOps(cas: CasType, repair: Repair, locus: string, c: Candidate, fix?: Fix): (seed: number) => Op[] {
  if (isBaseEditor(cas)) return () => baseEditOps(c, cas)
  if (cas === 'pe') return () => primeEditOps(c, fix)
  if (cas === 'nickase') return () => []
  if (repair === 'hdr') return () => hdrOps(c, fix)
  return (seed) => nhejOps(locus, c.cut, seed)
}

/** Chance de um alelo reconhecido receber a edição pretendida, ou um indel indesejado do NHEJ. */
export interface Odds {
  intended: number
  indel: number
}

/**
 * Frações ilustrativas por ferramenta. A HDR é a mais ingrata: mesmo quando o corte acontece,
 * o NHEJ costuma selar a quebra antes que o molde seja copiado.
 */
export function repairOdds(cas: CasType, repair: Repair): Odds {
  if (isBaseEditor(cas)) return { intended: 0.7, indel: 0 }
  if (cas === 'pe') return { intended: 0.35, indel: 0.05 }
  if (cas === 'nickase') return { intended: 0, indel: 0.05 }
  if (repair === 'hdr') return { intended: 0.25, indel: 0.55 }
  return { intended: 0.85, indel: 0 }
}

export interface PopulationArgs {
  /** Entrega × reconhecimento: a chance de a ferramenta chegar e engatar no alelo. */
  pEngage: number
  odds: Odds
  intended: (seed: number) => Op[]
  /** Indel do NHEJ, quando ele vence a edição pretendida. */
  unwanted: (seed: number) => Op[]
  /** Se as operações cumpriram mesmo o objetivo — um indel nem sempre destrói o alvo. */
  succeeded: (ops: Op[]) => boolean
  seed: number
  alleles?: number
}

/** Desfecho de um alelo: objetivo alcançado, editado sem alcançá-lo, ou intacto. */
export type AlleleOutcome = 'intended' | 'indel' | 'unedited'

export interface Population {
  alleles: number
  /** Desfecho de cada alelo, na ordem sorteada. */
  outcomes: AlleleOutcome[]
  /** Contagem de alelos em cada desfecho (soma `alleles`). */
  tally: Record<AlleleOutcome, number>
  /** Saldo de bases → alelos, como num sequenciamento do amplicon. Ordenado por saldo. */
  spectrum: { net: number; alleles: number }[]
  /** Células diploides por quantidade de alelos com a edição pretendida. */
  cells: { none: number; one: number; both: number }
}

/**
 * Aplica as regras de uma rodada a muitos alelos: o resultado de um experimento é uma
 * distribuição, não um desfecho único. Alelos aos pares formam as células diploides.
 */
export function population(a: PopulationArgs): Population {
  const alleles = a.alleles ?? 1000
  const r = rng(a.seed)
  const outcomes: AlleleOutcome[] = []
  const tally = { intended: 0, indel: 0, unedited: 0 }
  const byNet = new Map<number, number>()
  const cells = { none: 0, one: 0, both: 0 }
  let fixedInPair = 0

  for (let i = 0; i < alleles; i++) {
    const engaged = r() < a.pEngage
    const draw = r()
    const seed = 1 + Math.floor(r() * 0xffffff)

    let ops: Op[] = []
    if (engaged && draw < a.odds.intended) ops = a.intended(seed)
    else if (engaged && draw < a.odds.intended + a.odds.indel) ops = a.unwanted(seed)

    // o que decide é o resultado, não o caminho: um indel do NHEJ pode destruir o alvo, e a
    // ferramenta pode engatar sem resolver (sem C na janela, alvo fora de alcance, motivo intacto)
    const kind: AlleleOutcome = !ops.length ? 'unedited' : a.succeeded(ops) ? 'intended' : 'indel'
    tally[kind]++
    outcomes.push(kind)

    if (ops.length) {
      const net = netLength(ops)
      byNet.set(net, (byNet.get(net) ?? 0) + 1)
    }
    if (kind === 'intended') fixedInPair++
    if (i % 2 === 1) {
      cells[fixedInPair === 2 ? 'both' : fixedInPair === 1 ? 'one' : 'none']++
      fixedInPair = 0
    }
  }

  const spectrum = [...byNet].map(([net, n]) => ({ net, alleles: n })).sort((x, y) => x.net - y.net)
  return { alleles, outcomes, tally, spectrum, cells }
}

/** Efeito da edição sobre a proteína, do mais inofensivo ao mais grave. */
export type Consequence = 'none' | 'silent' | 'inframe' | 'missense' | 'nonsense' | 'frameshift'

/**
 * Classifica a edição comparando as proteínas traduzidas antes e depois.
 * `ops` entra porque o deslocamento de quadro depende do saldo de bases, não do texto da proteína.
 */
export function consequence(before: string, after: string, ops: Op[]): Consequence {
  if (!ops.length) return 'none'
  // proteína igual = a edição caiu fora do trecho codificante (ou foi sinônima), mesmo com saldo fora de múltiplo de 3
  if (after === before) return 'silent'
  if (netLength(ops) % 3) return 'frameshift'
  if (after.endsWith('*') && !before.endsWith('*')) return 'nonsense'
  if (after.length !== before.length) return 'inframe'
  return 'missense'
}
