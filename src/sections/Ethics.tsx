import { useEffect, useRef, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import { Rich } from '../components/Term'
import { ETHICS, type Dilemma, type EthicsTopic, type Stance } from '../content/ethics'
import { useT } from '../i18n'
import { useInView } from '../lib/hooks'
import { EMPTY, castVote, fetchTallies, isNetworkError, subscribeTallies, type Tallies, type Tally } from '../lib/votes'

const ACCENTS = ['#ff4fa3', '#ffb547', '#7dff9b', '#4cc9ff', '#b98cff', '#ff7a59', '#3ef0d0']
const STANCES: { k: Stance; label: [string, string]; color: string }[] = [
  { k: 'pro', label: ['A favor', 'For'], color: '#7dff9b' },
  { k: 'con', label: ['Contra', 'Against'], color: '#ff4fa3' },
  { k: 'depends', label: ['Depende', 'It depends'], color: '#ffb547' },
]

type Status = 'loading' | 'live' | 'offline'
type Mine = Record<string, Stance>
// meu voto por dilema (para destacar a escolha) e votos que falharam por falta de rede (reenviados depois)
const MINE_KEY = 'protospace-my-votes'
const PENDING_KEY = 'protospace-pending-votes'
const read = (k: string): Mine => { try { return JSON.parse(localStorage.getItem(k) ?? '{}') } catch { return {} } }
const write = (k: string, v: Mine) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* armazenamento indisponível */ } }

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
        {t.details.map((p, i) => <p key={i}><Rich>{p}</Rich></p>)}
        {t.notes?.length ? <ul className="space-y-1 text-xs text-mist/70">{t.notes.map((n, i) => <li key={i}>※ {n}</li>)}</ul> : null}
      </div>
    </details>
  )
}

function DilemmaCard({ d, n, mine, tally, status, onVote }: { d: Dilemma; n: number; mine?: Stance; tally: Tally; status: Status; onVote: (id: string, s: Stance) => void }) {
  const t = useT()
  const total = tally.pro + tally.con + tally.depends
  const people = (k: number) => t(k === 1 ? '1 pessoa votou' : `${k} pessoas votaram`, k === 1 ? '1 person voted' : `${k} people voted`)
  // resultados só depois de escolher: evita que a maioria influencie o voto
  const revealed = !!mine
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
            {t(...s.label)}
          </button>
        ))}
      </div>
      {!revealed && (
        <p className="mt-3 text-xs text-mist/80">
          {total > 0 && <b className="text-white">{people(total)} · </b>}
          {t('Escolha uma posição para ver o resultado da votação.', 'Pick a position to see the poll results.')}
        </p>
      )}

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
              <span className="font-semibold text-white">· {people(total)}</span>
              {status === 'live' && <span className="inline-flex items-center gap-1.5 text-bio"><i className="h-1.5 w-1.5 animate-pulse rounded-full bg-bio" />{t('ao vivo', 'live')}</span>}
              {status === 'offline' && <span className="text-rna">{t('sem conexão — seu voto será enviado quando a rede voltar', 'offline — your vote will be sent when you reconnect')}</span>}
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
  const area = useRef<HTMLDivElement>(null)
  const near = useInView(area, '800px')
  const [armed, setArmed] = useState(false)
  const [mine, setMine] = useState<Mine>(() => read(MINE_KEY))
  const [tallies, setTallies] = useState<Tallies>({})
  const [status, setStatus] = useState<Status>('loading')
  useEffect(() => { if (near) setArmed(true) }, [near])
  useEffect(() => write(MINE_KEY, mine), [mine])

  // conecta ao banco quando os dilemas se aproximam da tela: reenvia pendências, lê totais e assina o tempo real.
  // Repete quando a rede volta.
  useEffect(() => {
    if (!armed) return
    let alive = true
    let sub: Promise<() => void> | undefined
    const sync = async () => {
      // uma a uma: recusadas pelo banco são descartadas, as que falharam por rede ficam para a próxima
      const pending = read(PENDING_KEY)
      for (const [id, st] of Object.entries(pending)) {
        try { await castVote(id, st); delete pending[id] }
        catch (e) { if (!isNetworkError(e)) delete pending[id] }
      }
      write(PENDING_KEY, pending)
      try {
        const all = await fetchTallies()
        if (!alive) return
        setTallies(all)
        sub ??= subscribeTallies((id, st, v) => setTallies((x) => ({ ...x, [id]: { ...(x[id] ?? EMPTY), [st]: v } })))
          .catch((e) => { sub = undefined; throw e })
        await sub
        if (alive) setStatus(Object.keys(pending).length ? 'offline' : 'live')
      } catch {
        if (alive) setStatus('offline')
      }
    }
    void sync()
    addEventListener('online', sync)
    return () => { alive = false; removeEventListener('online', sync); void sub?.then((off) => off(), () => {}) }
  }, [armed])

  // 1 voto por pessoa e por dilema (pode trocar); atualização otimista, confirmada pelo banco.
  // `seq` descarta respostas de votos já substituídos por um clique mais recente.
  const seq = useRef<Record<string, number>>({})
  const vote = async (id: string, st: Stance) => {
    const prev = mine[id]
    if (prev === st) return
    const n = (seq.current[id] = (seq.current[id] ?? 0) + 1)
    setMine((m) => ({ ...m, [id]: st }))
    setTallies((x) => {
      const t = { ...(x[id] ?? EMPTY) }
      if (prev) t[prev] = Math.max(0, t[prev] - 1)
      t[st] += 1
      return { ...x, [id]: t }
    })
    try {
      const fresh = await castVote(id, st)
      if (seq.current[id] !== n) return
      const pending = read(PENDING_KEY)
      delete pending[id]
      write(PENDING_KEY, pending)
      setTallies((x) => ({ ...x, [id]: fresh }))
      setStatus('live')
    } catch (e) {
      if (seq.current[id] !== n) return
      if (isNetworkError(e)) {
        write(PENDING_KEY, { ...read(PENDING_KEY), [id]: st })
        setStatus('offline')
        return
      }
      // recusado pelo banco (ex.: limite de taxa): desfaz a escolha e relê os totais
      setMine((m) => {
        const r = { ...m }
        if (prev) r[id] = prev
        else delete r[id]
        return r
      })
      fetchTallies().then(setTallies, () => {})
    }
  }

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
          <p className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-mist ring-1 ring-white/10">
            <i className={`h-2 w-2 rounded-full ${status === 'live' ? 'animate-pulse bg-bio' : status === 'offline' ? 'bg-rna' : 'bg-mist/50'}`} />
            {t('Votação aberta a todos os visitantes', 'Open to every visitor')} · {status === 'live' ? t('resultados ao vivo', 'live results') : status === 'offline' ? t('sem conexão', 'offline') : t('conectando…', 'connecting…')}
          </p>
        </div>
        <div ref={area} className="space-y-6">
          {E.dilemmas.map((d, i) => <DilemmaCard key={d.id} d={d} n={i + 1} mine={mine[d.id]} tally={tallies[d.id] ?? EMPTY} status={status} onVote={vote} />)}
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
