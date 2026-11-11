import type { ReactNode } from 'react'
import { ETHICS } from '../content/ethics'
import { plain } from '../content/glossary'
import { PATHS } from '../content/paths'
import { QUIZ } from '../content/quiz'
import { CONCLUSION, REFERENCES } from '../content/references'
import { SCRIPT } from '../content/script'
import { SITE } from '../content/site'
import type { T } from '../i18n'
import { STEPS as SIM_STEPS, STEP_COUNT } from '../playground/store'
import { APPS } from '../sections/Applications'
import { TOOLS } from '../sections/Evolution'
import { STEPS as INTRO_STEPS, TIMELINE } from '../sections/Intro'
import { STEPS as MECH_STEPS } from '../sections/Mechanism'
import MechanismDiagram from '../sections/MechanismDiagram'
import { GROUPS } from '../sections/Practices'
import { Card, Frame, H3, P } from './layouts'

/** Um slide: o que mostrar (`render`), qual fundo 3D usar e quantos sub-passos tem (revelações). */
export interface Slide {
  key: string
  /** Nome da seção, mostrado na barra. */
  section: string
  /** Fundo 3D: a hélice do Hero ou o Scene do playground (compartilhado entre slides vizinhos). */
  bg?: 'helix' | 'sim'
  /** Etapa do playground (0 a 5) mostrada neste slide, quando `bg === 'sim'`. */
  simStep?: number
  /** Número de passos de revelação (padrão 1). */
  steps?: number
  render: (step: number) => ReactNode
}

const chunk = <V,>(a: V[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n))
const plus = (c: string) => <span style={{ color: c }}>{c === '#ff4fa3' ? '−' : '+'}</span>

/** Monta o deck inteiro a partir dos dados do site (src/content e constantes das seções), no idioma atual. */
export function buildSlides(t: T): Slide[] {
  const S: Slide[] = []
  const add = (s: Slide) => S.push(s)

  // ── Abertura ────────────────────────────────────────────────────────────────
  add({
    key: 'title',
    section: t('Início', 'Home'),
    bg: 'helix',
    render: () => (
      <div className="absolute inset-0 flex flex-col justify-center px-[120px]">
        <p className="font-mono text-[24px] uppercase tracking-[0.3em] text-dna">
          {t('Seminário · Biologia molecular & bioética', 'Seminar · Molecular biology & bioethics')}
        </p>
        <h1 className="mt-8 font-display text-[168px] font-semibold leading-[0.92] tracking-tighter">
          {t('Editar o genoma.', 'Edit the genome.')}
          <br />
          <span className="text-gradient">{t('Pensar as consequências.', 'Weigh the consequences.')}</span>
        </h1>
        <P size={34} className="mt-10 max-w-[1000px]">
          {t(
            'CRISPR-Cas9: como uma defesa bacteriana virou a ferramenta mais versátil da biologia, e o que significa usá-la com rigor científico e responsabilidade ética.',
            'CRISPR-Cas9: how a bacterial defence became biology’s most versatile tool, and what it means to use it with scientific rigour and ethical responsibility.',
          )}
        </P>
        <p className="mt-12 text-[26px] text-white">
          {SITE.name} <span className="text-mist">· {SITE.author.name}</span>
        </p>
      </div>
    ),
  })

  // ── O que é ─────────────────────────────────────────────────────────────────
  add({
    key: 'intro',
    section: t('O que é', 'What it is'),
    render: () => (
      <Frame eyebrow={t('O que é', 'What it is')} title={t('Uma defesa bacteriana, em três atos', 'A bacterial defence, in three acts')}>
        <div className="grid flex-1 grid-cols-3 gap-8">
          {t.pick(INTRO_STEPS).map(([title, body, color]) => (
            <Card key={title} color={color}>
              <H3 size={46} color={color}>
                {title}
              </H3>
              <P size={32} className="mt-6">
                {plain(body)}
              </P>
            </Card>
          ))}
        </div>
      </Frame>
    ),
  })
  chunk(t.pick(TIMELINE), 4).forEach((evs, i, all) =>
    add({
      key: `timeline-${i}`,
      section: t('O que é', 'What it is'),
      render: () => (
        <Frame eyebrow={`${t('Linha do tempo', 'Timeline')} · ${i + 1}/${all.length}`} title={`${evs[0].year} → ${evs[evs.length - 1].year}`}>
          <div className="flex flex-1 flex-col justify-between">
            {evs.map((ev) => (
              <div key={ev.year + ev.title} className="grid grid-cols-[170px_1fr] items-baseline gap-8">
                <span className={`font-mono text-[34px] ${ev.accent ? 'text-cas' : 'text-dna'}`}>{ev.year}</span>
                <div>
                  <H3 size={36}>{ev.title}</H3>
                  <P size={26} className="mt-2">
                    {plain(ev.body)}
                  </P>
                </div>
              </div>
            ))}
          </div>
        </Frame>
      ),
    }),
  )

  // ── Como funciona: um passo por slide, com o diagrama ao lado ───────────────
  t.pick(MECH_STEPS).forEach((st, i, all) =>
    add({
      key: `mech-${st.k}`,
      section: t('Como funciona', 'How it works'),
      render: () => (
        <Frame eyebrow={`${t('Como funciona', 'How it works')} · ${i + 1}/${all.length}`} title={st.t}>
          <div className="grid min-h-0 flex-1 grid-cols-[760px_1fr] items-center gap-14">
            <P size={34}>{plain(st.b)}</P>
            <div className="glass rounded-[28px] p-8">
              <MechanismDiagram step={i} label={`${t('Diagrama', 'Diagram')}: ${st.t}`} />
            </div>
          </div>
        </Frame>
      ),
    }),
  )

  // ── Evolução da ferramenta: duas por slide ──────────────────────────────────
  chunk(t.pick(TOOLS), 2).forEach((tools, i, all) =>
    add({
      key: `tools-${i}`,
      section: t('Evolução', 'Evolution'),
      render: () => (
        <Frame
          eyebrow={`${t('Evolução da ferramenta', 'Tool evolution')} · ${i + 1}/${all.length}`}
          title={t('Da tesoura ao lápis e borracha', 'From scissors to pencil and eraser')}
        >
          <div className="grid flex-1 grid-cols-2 gap-8">
            {tools.map((tool) => (
              <Card key={tool.k} color={tool.color}>
                <div className="flex items-baseline justify-between gap-4">
                  <H3 size={44} color={tool.color}>
                    {tool.name}
                  </H3>
                  <span className="font-mono text-[22px] text-mist">{tool.year}</span>
                </div>
                <P size={30} className="mt-5">
                  {plain(tool.what)}
                </P>
                <ul className="mt-6 space-y-3 text-[28px] leading-[1.35] text-white">
                  {tool.pros.slice(0, 3).map((p) => (
                    <li key={p}>
                      {plus('#3ef0d0')} {plain(p)}
                    </li>
                  ))}
                  {tool.cons.slice(0, 3).map((c) => (
                    <li key={c} className="text-mist">
                      {plus('#ff4fa3')} {plain(c)}
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Frame>
      ),
    }),
  )

  // ── Playground 3D: um slide por etapa, o Scene fica montado entre eles ──────
  const script = t.pick(SCRIPT)
  const simNames = t.pick(SIM_STEPS)
  for (let i = 0; i < STEP_COUNT; i++)
    add({
      key: `sim-${i}`,
      section: t('Playground 3D', '3D Playground'),
      bg: 'sim',
      simStep: i,
      render: () => (
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-12 bg-linear-to-t from-ink via-ink/85 to-transparent px-[120px] pb-[100px] pt-40">
          <div className="max-w-[1100px]">
            <p className="font-mono text-[22px] uppercase tracking-[0.3em] text-dna">
              {t('Playground 3D', '3D Playground')} · {i + 1}/{STEP_COUNT}
            </p>
            <h2 className="mt-3 font-display text-[72px] font-semibold leading-none tracking-tight">{simNames[i]}</h2>
            <P size={30} className="mt-4 text-white/90">
              {script[i]?.tip}
            </P>
          </div>
          <p className="max-w-[560px] rounded-[24px] bg-white/8 p-6 text-[28px] font-medium leading-[1.35] text-white ring-1 ring-white/15">{script[i]?.ask}</p>
        </div>
      ),
    })

  // ── Quatro caminhos ─────────────────────────────────────────────────────────
  chunk(PATHS, 2).forEach((paths, i, all) =>
    add({
      key: `paths-${i}`,
      section: t('Quatro caminhos', 'Four paths'),
      render: () => (
        <Frame
          eyebrow={`${t('Quatro caminhos', 'Four paths')} · ${i + 1}/${all.length}`}
          title={t('Mesma doença, estratégias diferentes', 'Same disease, different strategies')}
        >
          <div className="grid flex-1 grid-cols-2 gap-8">
            {paths.map((p) => (
              <Card key={p.id} color={p.color}>
                <H3 size={42} color={p.color}>
                  {t.pick(p.name)}
                </H3>
                <P size={28} className="mt-5">
                  {plain(t.pick(p.plain))}
                </P>
                <p className="mt-6 text-[26px] leading-[1.4] text-white">{plain(t.pick(p.result))}</p>
              </Card>
            ))}
          </div>
        </Frame>
      ),
    }),
  )

  // ── Boas práticas: um grupo por slide ───────────────────────────────────────
  t.pick(GROUPS).forEach((g, i, all) =>
    add({
      key: `practice-${g.k}`,
      section: t('Boas práticas', 'Best practices'),
      render: () => (
        <Frame eyebrow={`${t('Boas práticas', 'Best practices')} · ${i + 1}/${all.length}`} title={<span style={{ color: g.color }}>{g.title}</span>}>
          <div className="grid flex-1 grid-cols-2 content-start gap-x-14 gap-y-7">
            {g.items.map(([title, body]) => (
              <div key={title}>
                <H3 size={36}>{title}</H3>
                <P size={28} className="mt-2">
                  {plain(body)}
                </P>
              </div>
            ))}
          </div>
        </Frame>
      ),
    }),
  )

  // ── Aplicações: três por slide ──────────────────────────────────────────────
  chunk(t.pick(APPS), 3).forEach((apps, i, all) =>
    add({
      key: `apps-${i}`,
      section: t('Aplicações', 'Applications'),
      render: () => (
        <Frame
          eyebrow={`${t('Aplicações', 'Applications')} · ${i + 1}/${all.length}`}
          title={t('Onde a edição já chegou', 'Where editing has already arrived')}
        >
          <div className="grid flex-1 grid-cols-3 gap-8">
            {apps.map((a) => (
              <Card key={a.t} color={a.c}>
                <p className="font-mono text-[20px] uppercase tracking-[0.2em]" style={{ color: a.c }}>
                  {a.tag}
                </p>
                <H3 size={36}>{a.t}</H3>
                <P size={27} className="mt-4">
                  {plain(a.b)}
                </P>
              </Card>
            ))}
          </div>
        </Frame>
      ),
    }),
  )

  // ── Bioética: tópicos, um slide por dilema, contexto brasileiro ─────────────
  const E = t.pick(ETHICS)
  add({
    key: 'ethics-topics',
    section: t('Bioética', 'Bioethics'),
    render: () => (
      <Frame eyebrow={E.eyebrow} title={E.title.join('')}>
        <div className="grid flex-1 grid-cols-3 gap-6">
          {E.topics.map((tp) => (
            <Card key={tp.id}>
              <H3 size={38}>{tp.title}</H3>
              <P size={28} className="mt-4">
                {tp.summary}
              </P>
            </Card>
          ))}
        </div>
      </Frame>
    ),
  })
  E.dilemmas.forEach((d, i) =>
    add({
      key: `ethics-${d.id}`,
      section: t('Bioética', 'Bioethics'),
      render: () => (
        <Frame eyebrow={`${t('Dilema', 'Dilemma')} ${i + 1}/${E.dilemmas.length}`} title={d.title}>
          <P size={28} className="max-w-[1500px]">
            {d.summary}
          </P>
          <div className="mt-8 grid flex-1 grid-cols-3 gap-6">
            {(
              [
                [t('A favor', 'For'), d.pro, '#3ef0d0'],
                [t('Depende', 'It depends'), d.depends, '#ffb547'],
                [t('Contra', 'Against'), d.con, '#ff4fa3'],
              ] as const
            ).map(([label, items, color]) => (
              <Card key={label} color={color}>
                <H3 size={34} color={color}>
                  {label}
                </H3>
                <ul className="mt-5 space-y-4 text-[30px] leading-[1.35] text-white/90">
                  {items.slice(0, 3).map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </Frame>
      ),
    }),
  )
  add({
    key: 'ethics-brazil',
    section: t('Bioética', 'Bioethics'),
    render: () => (
      <Frame eyebrow={t('Contexto brasileiro', 'Brazilian context')} title={E.brazil.title}>
        <P size={30} className="max-w-[1500px]">
          {E.brazil.summary}
        </P>
        <div className="mt-8 grid flex-1 grid-cols-3 gap-6">
          {E.brazil.items.slice(0, 3).map((it) => (
            <Card key={it.label} color="#7dff8a">
              <H3 size={38}>{it.label}</H3>
              <P size={30} className="mt-4">
                {it.text}
              </P>
            </Card>
          ))}
        </div>
      </Frame>
    ),
  })

  // ── Quiz: pergunta, depois a resposta ───────────────────────────────────────
  const Q = t.pick(QUIZ)
  Q.questions.forEach((q, i) =>
    add({
      key: `quiz-${q.id}`,
      section: 'Quiz',
      steps: 2,
      render: (step) => (
        <Frame eyebrow={`Quiz · ${i + 1}/${Q.questions.length}`} title={q.question}>
          <div className="grid grid-cols-2 gap-6">
            {q.options.map((o, k) => {
              const right = step === 1 && k === q.correct
              return (
                <div
                  key={o}
                  className={`glass flex items-center gap-5 rounded-[24px] p-7 text-[30px] leading-[1.3] transition ${right ? 'ring-4 ring-dna' : step === 1 ? 'opacity-40' : ''}`}
                >
                  <span className="font-mono text-[26px] text-dna">{'ABCD'[k]}</span>
                  {o}
                </div>
              )
            })}
          </div>
          {step === 1 && (
            <P size={28} className="mt-8 max-w-[1500px] text-white/90">
              {q.feedback}
            </P>
          )}
        </Frame>
      ),
    }),
  )

  // ── Conclusão e encerramento ────────────────────────────────────────────────
  const C = t.pick(CONCLUSION)
  add({
    key: 'conclusion',
    section: t('Conclusão', 'Conclusion'),
    render: () => (
      <Frame eyebrow={C.eyebrow} title={C.title.join('')}>
        <div className="grid flex-1 grid-cols-3 gap-8">
          {C.takeaways.map((tk, i) => (
            <Card key={tk}>
              <span className="font-display text-[96px] font-semibold leading-none text-white/15">{i + 1}</span>
              <P size={32} className="mt-4 text-white/90">
                {tk}
              </P>
            </Card>
          ))}
        </div>
      </Frame>
    ),
  })
  add({
    key: 'end',
    section: t('Referências', 'References'),
    render: () => (
      <div className="absolute inset-0 flex flex-col justify-center px-[120px]">
        <p className="font-mono text-[24px] uppercase tracking-[0.3em] text-dna">{t('Obrigado', 'Thank you')}</p>
        <h2 className="mt-6 font-display text-[120px] font-semibold leading-none tracking-tight">{SITE.name}</h2>
        <P size={36} className="mt-8">
          {t(`${REFERENCES.length} referências e o playground completo no site`, `${REFERENCES.length} references and the full playground on the site`)}
        </P>
        {/* fora da Vercel o build cai em localhost (vite.config.ts): não faz sentido projetar isso */}
        {!/localhost|127\.0\.0\.1/.test(SITE.url) && <p className="mt-4 font-mono text-[40px] text-dna">{SITE.url.replace(/^https?:\/\//, '')}</p>}
        <p className="mt-12 text-[28px] text-white">
          {SITE.author.name} <span className="text-mist">· {SITE.repo.replace('https://', '')}</span>
        </p>
      </div>
    ),
  })

  return S
}
