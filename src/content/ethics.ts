// Conteúdo da seção Bioética. Substitua os placeholders pelo texto final.
// O componente (src/sections/Ethics.tsx) só lê daqui: adicionar/remover itens nos arrays basta.

export interface EthicsTopic {
  id: string
  title: string
  summary: string
  /** Parágrafos exibidos ao expandir o card. */
  details: string[]
  /** Observações curtas (fontes, ressalvas, itens a verificar). */
  notes?: string[]
}

export type Stance = 'pro' | 'con' | 'depends'

export interface Dilemma {
  id: string
  title: string
  summary: string
  pro: string[]
  con: string[]
  /** Argumentos para a posição "depende" (condições, nuances). */
  depends: string[]
  notes?: string[]
}

export interface EthicsContent {
  eyebrow: string
  title: string
  lead: string
  topics: EthicsTopic[]
  dilemmas: Dilemma[]
  /** Bloco de contexto brasileiro (legislação, CTNBio etc.). */
  brazil: { title: string; summary: string; items: { label: string; text: string }[]; notes?: string[] }
}

const P = '[conteúdo a inserir]'

const topic = (id: string): EthicsTopic => ({ id, title: `${P} (${id})`, summary: P, details: [P], notes: [P] })
const dilemma = (id: string): Dilemma => ({ id, title: `${P} (${id})`, summary: P, pro: [P], con: [P], depends: [P], notes: [P] })

export const ETHICS: EthicsContent = {
  eyebrow: 'Bioética',
  title: P,
  lead: P,
  topics: ['topico-1', 'topico-2', 'topico-3', 'topico-4', 'topico-5', 'topico-6'].map(topic),
  dilemmas: ['dilema-1', 'dilema-2', 'dilema-3'].map(dilemma),
  brazil: {
    title: P,
    summary: P,
    items: [{ label: P, text: P }, { label: P, text: P }, { label: P, text: P }],
    notes: [P],
  },
}
