// Conteúdo do quiz. Substitua os placeholders pelas perguntas finais.
// `correct` é o índice (base 0) da alternativa correta em `options`.

export interface Question {
  id: string
  question: string
  options: string[]
  correct: number
  /** Explicação mostrada após a resposta. */
  feedback: string
}

const P = '[conteúdo a inserir]'

const question = (id: string): Question => ({
  id,
  question: `${P} (${id})`,
  options: [`${P} A`, `${P} B`, `${P} C`, `${P} D`],
  correct: 0,
  feedback: P,
})

export const QUIZ: { eyebrow: string; title: string; lead: string; questions: Question[] } = {
  eyebrow: 'Quiz rápido',
  title: P,
  lead: P,
  questions: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].map(question),
}
