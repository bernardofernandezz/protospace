import type { CasType, NucleaseId, Repair } from '../lib/dna'

/** Configuração pronta do playground, usada pelos links do conteúdo. */
export interface Preset {
  disease?: string | null
  nuclease?: NucleaseId
  cas?: CasType
  repair?: Repair
  /** Posições do guia (0–19) a estragar, para mostrar o efeito de um mismatch. */
  mismatches?: number[]
}

/** Abre o playground já configurado. O store entra sob demanda, fora do pacote inicial. */
export async function openInPlayground(preset: Preset) {
  const { useSim } = await import('./store')
  useSim.getState().applyPreset(preset)
  document.getElementById('playground')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
