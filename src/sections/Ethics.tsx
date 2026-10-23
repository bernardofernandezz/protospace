import { useEffect, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import { ETHICS, type Dilemma, type EthicsTopic, type Stance } from '../content/ethics'
import { useT } from '../i18n'

const ACCENTS = ['#ff4fa3', '#ffb547', '#7dff9b', '#4cc9ff', '#b98cff', '#ff7a59', '#3ef0d0']
const STANCES: { k: Stance; label: [string, string]; color: string }[] = [
  { k: 'pro', label: ['A favor', 'For'], color: '#7dff9b' },
  { k: 'con', label: ['Contra', 'Against'], color: '#ff4fa3' },
  { k: 'depends', label: ['Depende', 'It depends'], color: '#ffb547' },
]

type Tally = Record<Stance, number>
interface VoteState { mine: Record<string, Stance>; tally: Record<string, Tally> }
const KEY = 'crispr-votes'
const EMPTY: Tally = { pro: 0, con: 0, depends: 0 }
const load = (): VoteState => { try { return { mine: {}, tally: {}, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') } } catch { return { mine: {}, tally: {} } } }

function TopicCard({ t, color }: { t: EthicsTopic; color: string }) {
  return (
    <details className="glass group rounded-3xl p-6 transition open:ring-1" style={{ ['--tw-ring-color' as string]: color }} data-reveal>
      <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
        <span>
          <span className="mb-3 block h-1 w-10 rounded-full" style={{ background: color }} />
          <span className="block font-display text-xl font-semibold">{t.title}</span>
          <span className="mt-2 block text-sm leading-relaxed text-mist">{t.summary}</span>
        </span>
        <span className="mt-4 text-xl text-mist transition group-open:rotate-45" aria-hidden="true">+</span>
      </summary>
      <div className="mt-4 space-y-3 border-t border-white/10 pt-4 leading-relaxed text-mist">
        {t.details.map((p, i) => <p key={i}>{p}</p>)}
        {t.notes?.length ? <ul className="space-y-1 text-xs text-mist/70">{t.notes.map((n, i) => <li key={i}>※ {n}</li>)}</ul> : null}
      </div>
    </details>
  )
}

function DilemmaCard({ d, n, votes, onVote, crowd }: { d: Dilemma; n: number; votes: VoteState; onVote: (id: string, s: Stance) => void; crowd: boolean }) {
  const t = useT()
  const mine = votes.mine[d.id]
  const tally = votes.tally[d.id] ?? EMPTY
  const total = tally.pro + tally.con + tally.depends
  const revealed = !!mine || total > 0
  const cols: { k: Stance; title: string; args: string[]; color: string }[] = [
    { k: 'pro', title: t('Argumentos a favor', 'Arguments for'), args: d.pro, color: '#7dff9b' },
    { k: 'con', title: t('Argumentos contra', 'Arguments against'), args: d.con, color: '#ff4fa3' },
    { k: 'depends', title: t('Depende de…', 'It depends on…'), args: d.depends, color: '#ffb547' },
  ]
  return (
    <article className="glass rounded-3xl p-6 md:p-8" data-reveal>
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-cas">{t('Dilema', 'Dilemma')} {String(n).padStart(2, '0')}</p>
      <h4 className="mt-3 text-2xl font-semibold md:text-3xl">{d.title}</h4>
      <p className="mt-3 max-w-3xl leading-relaxed text-mist">{d.summary}</p>

      <div className="mt-6 flex flex-wrap gap-3" role="group" aria-label={t('Sua posição', 'Your position')}>
        {STANCES.map((s) => (
          <button key={s.k} type="button" aria-pressed={mine === s.k} onClick={() => onVote(d.id, s.k)}
            className="rounded-full px-5 py-2.5 font-display text-sm font-semibold transition hover:scale-[1.03]"
            style={mine === s.k ? { background: s.color, color: '#04060b' } : { background: s.color + '1f', color: s.color }}>
            {t(...s.label)}{crowd && <span className="ml-2 opacity-70">+1</span>}
          </button>
        ))}
      </div>

      {revealed && (
        <>
          <div className="mt-6" aria-live="polite">
            <div className="flex h-3 overflow-hidden rounded-full bg-white/10" role="img"
              aria-label={STANCES.map((s) => `${t(...s.label)}: ${tally[s.k]}`).join(', ')}>
              {STANCES.map((s) => <div key={s.k} style={{ width: `${total ? (tally[s.k] / total) * 100 : 0}%`, background: s.color }} className="transition-all duration-500" />)}
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-xs text-mist">
              {STANCES.map((s) => (
                <span key={s.k}><b style={{ color: s.color }}>{total ? Math.round((tally[s.k] / total) * 100) : 0}%</b> {t(...s.label).toLowerCase()} ({tally[s.k]})</span>
              ))}
              <span className="text-mist/60">· {total} {t(total === 1 ? 'voto' : 'votos', total === 1 ? 'vote' : 'votes')} {t('neste dispositivo', 'on this device')}</span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {cols.map((c) => (
              <div key={c.k} className={`rounded-2xl border p-5 transition ${mine === c.k ? 'bg-white/[0.06]' : 'border-white/10'}`} style={mine === c.k ? { borderColor: c.color } : undefined}>
                <h5 className="hud-label" style={{ color: c.color }}>{c.title}{mine === c.k && t(' · sua posição', ' · your position')}</h5>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-mist">{c.args.map((a, i) => <li key={i} className="flex gap-2"><span style={{ color: c.color }}>•</span>{a}</li>)}</ul>
              </div>
            ))}
          </div>
          {d.notes?.length ? <ul className="mt-4 space-y-1 text-xs text-mist/70">{d.notes.map((x, i) => <li key={i}>※ {x}</li>)}</ul> : null}
        </>
      )}
    </article>
  )
}

export default function Ethics() {
  const t = useT()
  const E = t.pick(ETHICS)
  const [votes, setVotes] = useState<VoteState>(load)
  const [crowd, setCrowd] = useState(false)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(votes)) } catch { /* armazenamento indisponível */ } }, [votes])

  // Modo normal: um voto por dispositivo (pode trocar). Modo plateia: cada clique soma +1 (contagem ao vivo no telão).
  const vote = (id: string, s: Stance) => setVotes((v) => {
    const t = { ...(v.tally[id] ?? EMPTY) }
    const prev = v.mine[id]
    if (!crowd && prev) t[prev] = Math.max(0, t[prev] - 1)
    t[s] += 1
    return { mine: { ...v.mine, [id]: s }, tally: { ...v.tally, [id]: t } }
  })

  const { brazil } = E
  return (
    <section id="bioetica" className="section">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full bg-linear-to-b from-transparent via-violet-deep/40 to-transparent" />
      <SectionHeader n="07" eyebrow={E.eyebrow} title={<>{E.title[0]}<span className="text-gradient">{E.title[1]}</span>{E.title[2]}</>} lead={E.lead} />

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {E.topics.map((tp, i) => <TopicCard key={tp.id} t={tp} color={ACCENTS[i % ACCENTS.length]} />)}
      </div>

      <div className="mt-24">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4" data-reveal>
          <h3 className="text-3xl font-semibold md:text-4xl">{t('Dilemas', 'Dilemmas')}</h3>
          <div className="flex items-center gap-4 text-sm text-mist">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={crowd} onChange={(e) => setCrowd(e.target.checked)} className="h-4 w-4 accent-[#ff4fa3]" />
              {t('Modo plateia (cada clique = +1 voto)', 'Audience mode (each click = +1 vote)')}
            </label>
            <button type="button" onClick={() => setVotes({ mine: {}, tally: {} })} className="underline hover:text-white">{t('zerar votos', 'reset votes')}</button>
          </div>
        </div>
        <div className="space-y-6">
          {E.dilemmas.map((d, i) => <DilemmaCard key={d.id} d={d} n={i + 1} votes={votes} onVote={vote} crowd={crowd} />)}
        </div>
      </div>

      <aside className="relative mt-24 overflow-hidden rounded-3xl border border-bio/30 bg-linear-to-br from-[#0b2a1d] via-abyss to-[#1a2a0b] p-8 md:p-12" data-reveal>
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-bio/20 blur-3xl" />
        <p className="eyebrow text-bio!">{t('Contexto brasileiro', 'Brazilian context')}</p>
        <h3 className="mt-3 text-3xl font-semibold md:text-4xl">{brazil.title}</h3>
        <p className="mt-4 max-w-3xl leading-relaxed text-mist">{brazil.summary}</p>
        <dl className="mt-8 grid gap-5 md:grid-cols-3">
          {brazil.items.map((it, i) => (
            <div key={i} className="glass rounded-2xl p-5">
              <dt className="font-display font-semibold text-bio">{it.label}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-mist">{it.text}</dd>
            </div>
          ))}
        </dl>
        {brazil.notes?.length ? <ul className="mt-6 space-y-1 text-xs text-mist/70">{brazil.notes.map((x, i) => <li key={i}>※ {x}</li>)}</ul> : null}
      </aside>
    </section>
  )
}
