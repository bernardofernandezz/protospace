// Desafios do playground (PT/EN): metas que o visitante cumpre ajustando guia, Cas, entrega e reparo.
// Cada `met` é uma função pura sobre o resultado calculado (derive em src/playground/store.ts).
import type { L } from '../i18n'

/** O que os desafios leem do resultado de `derive`. */
export interface Outcome {
  acts: boolean
  eff: number
  offs: { p: number }[]
  cas: string
  nuclease: string
  disease: string | null
  verdict?: 'success' | 'unchanged' | 'broken'
}

export interface Challenge {
  id: string
  goal: L
  met: (o: Outcome) => boolean
}

export const CHALLENGES: Challenge[] = [
  {
    id: 'clean-cut',
    goal: { pt: 'Corte limpo: eficiência acima de 60% e nenhum off-target acima de 3%', en: 'Clean cut: efficiency above 60% and no off-target above 3%' },
    met: (o) => o.acts && o.eff > 0.6 && o.offs.every((s) => s.p < 0.03),
  },
  {
    id: 'precision',
    goal: { pt: 'Edite sem quebrar a dupla fita: use editor de base ou prime editing', en: 'Edit without breaking both strands: use a base or prime editor' },
    met: (o) => o.acts && ['be', 'abe', 'pe'].includes(o.cas),
  },
  {
    id: 'cas12a',
    goal: { pt: 'Faça a Cas12a cortar o alvo', en: 'Make Cas12a cut the target' },
    met: (o) => o.acts && o.nuclease === 'cas12a',
  },
  {
    id: 'fix-sickle',
    goal: { pt: 'Corrija o alelo da anemia falciforme', en: 'Correct the sickle cell allele' },
    met: (o) => o.disease === 'sickle' && o.verdict === 'success',
  },
]
