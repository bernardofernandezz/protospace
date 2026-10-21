import { useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import { QUIZ } from '../content/quiz'

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F']

export default function Quiz() {
  const qs = QUIZ.questions
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const answered = Object.keys(answers).length
  const score = qs.filter((q) => answers[q.id] === q.correct).length

  return (
    <section id="quiz" className="section">
      <SectionHeader n="08" eyebrow={QUIZ.eyebrow} title={QUIZ.title} lead={QUIZ.lead} />

      <div className="grid gap-5 md:grid-cols-2">
        {qs.map((q, qi) => {
          const chosen = answers[q.id]
          const done = chosen !== undefined
          return (
            <fieldset key={q.id} className="glass rounded-3xl p-6" data-reveal>
              <legend className="sr-only">Pergunta {qi + 1}</legend>
              <p className="font-mono text-xs text-dna">{String(qi + 1).padStart(2, '0')} / {qs.length}</p>
              <h3 className="mt-2 text-xl font-semibold">{q.question}</h3>
              <div className="mt-4 grid gap-2" role="radiogroup" aria-label={q.question}>
                {q.options.map((o, oi) => {
                  const isCorrect = oi === q.correct
                  const picked = chosen === oi
                  const cls = !done
                    ? 'border-white/10 hover:border-dna/50 hover:bg-white/5'
                    : isCorrect
                      ? 'border-bio bg-bio/15 text-white'
                      : picked
                        ? 'border-cas bg-cas/15 text-white'
                        : 'border-white/5 text-mist/50'
                  return (
                    <button key={oi} type="button" role="radio" aria-checked={picked} disabled={done}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-left text-sm transition disabled:cursor-default ${cls}`}>
                      <span className="font-mono text-xs opacity-70">{LETTERS[oi]}</span>
                      <span className="flex-1">{o}</span>
                      {done && isCorrect && <span className="text-bio" aria-label="correta">✓</span>}
                      {done && picked && !isCorrect && <span className="text-cas" aria-label="incorreta">✕</span>}
                    </button>
                  )
                })}
              </div>
              {done && (
                <p className="mt-4 rounded-xl border-l-2 border-dna bg-white/5 p-3 text-sm leading-relaxed text-mist" role="status">
                  <b className={chosen === q.correct ? 'text-bio' : 'text-cas'}>{chosen === q.correct ? 'Correto. ' : 'Não é essa. '}</b>
                  {q.feedback}
                </p>
              )}
            </fieldset>
          )
        })}
      </div>

      <div className="glass mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl p-6" aria-live="polite" data-reveal>
        <p className="font-display text-2xl">
          {answered === 0 ? 'Responda para ver o placar' : <>Acertos: <span className="text-gradient font-semibold">{score}</span> de {answered} respondida{answered === 1 ? '' : 's'}</>}
        </p>
        <div className="flex items-center gap-4">
          <div className="h-2 w-40 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-linear-to-r from-dna to-bio transition-all duration-500" style={{ width: `${(score / qs.length) * 100}%` }} />
          </div>
          <button type="button" onClick={() => setAnswers({})} className="rounded-full bg-white/10 px-5 py-2 text-sm transition hover:bg-white/20">Recomeçar</button>
        </div>
      </div>
    </section>
  )
}
