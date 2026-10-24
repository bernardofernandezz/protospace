// Quais linhas a tabela de comparação mostra. Só a escolha das linhas mora aqui: o
// resultado de cada uma é calculado em store.ts, que junta este plano com `derive`.
import { bestSite, findCandidates, nearestSite, type CasType, type NucleaseId, type Repair } from './dna.ts'
import { findDisease, targetPos } from '../content/diseases.ts'

export const STRATEGIES: { cas: CasType; repair: Repair }[] = [
  { cas: 'wt', repair: 'nhej' },
  { cas: 'wt', repair: 'hdr' },
  { cas: 'nickase', repair: 'nhej' },
  { cas: 'be', repair: 'nhej' },
  { cas: 'abe', repair: 'nhej' },
  { cas: 'pe', repair: 'nhej' },
]

export interface RowPlan {
  cas: CasType
  repair: Repair
  nuclease: NucleaseId
  /** Índice do sítio: o escolhido pelo usuário, ou o melhor que o PAM da outra enzima permite. */
  selected: number
  guide: string
}

export const otherNuclease = (n: NucleaseId): NucleaseId => (n === 'spcas9' ? 'cas12a' : 'spcas9')

/**
 * A nuclease atual entra no sítio e no guia do usuário; a outra, no melhor sítio dela.
 * Nickase, editores de base e prime editing só existem sobre a Cas9.
 */
export function comparePlan(p: { locus: string; disease: string | null; nuclease: NucleaseId; selected: number; guide: string }): RowPlan[] {
  const rows = (nuclease: NucleaseId, selected: number, guide: string) =>
    STRATEGIES
      .filter((s) => nuclease === 'spcas9' || s.cas === 'wt')
      .map((s) => ({ ...s, nuclease, selected, guide }))

  const other = otherNuclease(p.nuclease)
  const sites = findCandidates(p.locus, other)
  const dis = findDisease(p.disease)
  const i = sites.length ? (dis ? nearestSite(sites, targetPos(dis)) : bestSite(sites)) : -1

  return [
    ...rows(p.nuclease, p.selected, p.guide),
    ...(i >= 0 ? rows(other, i, sites[i].protospacer) : []),
  ]
}

/** Alcançar o objetivo do cenário pesa mais que a eficiência bruta. */
export const rank = (r: { verdict?: string; eff?: number }) => (r.verdict === 'success' ? 10 : 0) + (r.eff ?? 0)
