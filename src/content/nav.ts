import type { L } from '../i18n'

// Seções navegáveis, agrupadas como no menu (e usadas também pela busca).
export type Item = [id: string, label: L]
export const GROUPS: { label: L; items: Item[] }[] = [
  {
    label: { pt: 'Ciência', en: 'Science' },
    items: [
      ['o-que-e', { pt: 'O que é', en: 'What it is' }],
      ['como-funciona', { pt: 'Como funciona', en: 'How it works' }],
      ['evolucao', { pt: 'Evolução', en: 'Evolution' }],
    ],
  },
  {
    label: { pt: 'Playground 3D', en: '3D Playground' },
    items: [
      ['playground', { pt: 'Playground', en: 'Playground' }],
      ['caminhos', { pt: 'Quatro caminhos', en: 'Four paths' }],
    ],
  },
  {
    label: { pt: 'Prática', en: 'Practice' },
    items: [
      ['boas-praticas', { pt: 'Boas práticas', en: 'Best practices' }],
      ['aplicacoes', { pt: 'Aplicações', en: 'Applications' }],
    ],
  },
  {
    label: { pt: 'Sociedade', en: 'Society' },
    items: [
      ['bioetica', { pt: 'Bioética', en: 'Bioethics' }],
      ['quiz', { pt: 'Quiz', en: 'Quiz' }],
    ],
  },
  {
    label: { pt: 'Recursos', en: 'Resources' },
    items: [
      ['faq', { pt: 'FAQ', en: 'FAQ' }],
      ['referencias', { pt: 'Referências', en: 'References' }],
      ['sobre', { pt: 'Sobre o projeto', en: 'About' }],
    ],
  },
]
