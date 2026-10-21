// Referências e conclusão. Substitua os placeholders pelas fontes reais
// (artigos seminais, diretrizes, legislação). Use `note: '[verificar]'` enquanto
// não tiver certeza de DOI, data ou detalhe.

export interface Reference {
  id: string
  /** Categoria usada para agrupar: ex. 'Artigos seminais', 'Diretrizes', 'Legislação'. */
  group: string
  authors: string
  year: string
  title: string
  /** Revista, órgão ou veículo. */
  source: string
  /** DOI ou URL, se houver certeza. */
  link?: string
  note?: string
}

const P = '[conteúdo a inserir]'

const ref = (id: string, group: string): Reference => ({
  id, group, authors: P, year: P, title: P, source: P, note: '[verificar]',
})

export const CONCLUSION = { eyebrow: 'Conclusão', title: P, lead: P, takeaways: [P, P, P] }

export const REFERENCES: Reference[] = [
  ref('r1', 'Artigos seminais'),
  ref('r2', 'Artigos seminais'),
  ref('r3', 'Artigos seminais'),
  ref('r4', 'Diretrizes e relatórios'),
  ref('r5', 'Diretrizes e relatórios'),
  ref('r6', 'Legislação (Brasil)'),
  ref('r7', 'Legislação (Brasil)'),
]
