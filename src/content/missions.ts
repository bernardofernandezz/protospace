// Missões do modo Explorar (PT/EN): uma trilha em ordem pelas exposições de src/content/exhibits.ts.
// A missão termina ao entrar na zona; com `step`, só quando aquela etapa da simulação toca até o fim ali dentro.
import type { L } from '../i18n'

export interface Mission { id: string; zone: string; step?: number; goal: L }

export const MISSIONS: Mission[] = [
  { id: 'find-guide', zone: 'guide', goal: { pt: 'Encontre o RNA guia no DNA', en: 'Find the guide RNA on the DNA' } },
  { id: 'find-pam', zone: 'pam', goal: { pt: 'Ache o PAM, a senha que libera o corte', en: 'Find the PAM, the password that unlocks the cut' } },
  { id: 'find-decoy', zone: 'decoy', goal: { pt: 'Visite um PAM isca, onde a Cas9 desiste', en: 'Visit a decoy PAM, where Cas9 gives up' } },
  { id: 'watch-search', zone: 'cas9', step: 2, goal: { pt: 'Junto da Cas9, toque “Ver etapa 3” e assista à busca', en: 'Next to Cas9, tap “Play step 3” and watch the search' } },
  { id: 'watch-cut', zone: 'cut', step: 3, goal: { pt: 'No sítio de corte, assista à clivagem (etapa 4)', en: 'At the cut site, watch the cleavage (step 4)' } },
  { id: 'find-off', zone: 'off0', goal: { pt: 'Investigue um off-target, o corte no lugar errado', en: 'Inspect an off-target, a cut in the wrong place' } },
  { id: 'find-nucleosome', zone: 'nucleosome', goal: { pt: 'Descubra como o DNA se enrola nas histonas', en: 'See how DNA wraps around histones' } },
  { id: 'find-phage', zone: 'phage', goal: { pt: 'Encontre o vírus que inspirou o CRISPR', en: 'Find the virus that inspired CRISPR' } },
  { id: 'find-sickle', zone: 'sickle', goal: { pt: 'Termine na clínica: anemia falciforme', en: 'Finish at the clinic: sickle cell disease' } },
]

/** Próxima missão da trilha (a primeira não concluída), ou undefined quando tudo está feito. */
export const currentMission = (done: readonly string[]) => MISSIONS.find((m) => !done.includes(m.id))

/** A missão está cumprida neste estado da simulação? */
export const accomplished = (m: Mission, s: { zone: string | null; step: number; progress: number }) =>
  s.zone === m.zone && (m.step === undefined || (s.step === m.step && s.progress >= 1))
