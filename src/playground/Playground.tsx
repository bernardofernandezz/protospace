import { Component, Suspense, lazy, useEffect, useRef, useState, type ReactNode } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { CAS, DELIVERY, MAX_LOCUS, clean, diffSegments, isSeed, mismatches, type CasType, type Delivery, type Repair } from '../lib/dna'
import { hasWebGL, useInView } from '../lib/hooks'
import { useT, type T } from '../i18n'
import { SEEN_KEY, SOUND_KEY, STEPS, STEP_COUNT, STEP_SECONDS, experimentUrl, useDerived, useSim, type Quality } from './store'
import { EXHIBIT, EXHIBITS, REGIONS, type Region } from '../content/exhibits'
import { input } from './scene/shared'
import { sound } from './sound'
import { BASE_COLOR } from './colors'

const Scene = lazy(() => import('./scene/Scene'))

const pct = (x: number) => `${Math.round(x * 100)}%`
const NEXT_BASE: Record<string, string> = { A: 'C', C: 'G', G: 'T', T: 'A' }

/** Legenda curta por etapa — pensada para ser lida em voz alta no modo Apresentação. */
function narration(t: T, step: number, cas: CasType, delivery: Delivery, repair: Repair, acts: boolean): string {
  switch (step) {
    case 0: return t(
      'Escolhemos um protoespaçador de 20 nt imediatamente a 5′ de um PAM NGG. O espaçador do sgRNA (acima) tem a mesma sequência, com U no lugar de T. Bases em vermelho são mismatches.',
      'We pick a 20-nt protospacer immediately 5′ of an NGG PAM. The sgRNA spacer (above) has the same sequence, with U instead of T. Red bases are mismatches.')
    case 1: return `${t('Entrega por', 'Delivery by')} ${t.pick(DELIVERY[delivery].name)}. ${t.pick(DELIVERY[delivery].note)}`
    case 2: return acts
      ? t('A Cas9 alterna difusão 3D e paradas em PAMs. Em cada NGG o domínio PI segura o DNA e o guia é testado a partir da região seed; havendo complementaridade, a dupla-fita se abre e forma o R-loop.',
        'Cas9 alternates 3D diffusion with stops at PAMs. At each NGG the PI domain grips the DNA and the guide is tested from the seed region; if it matches, the duplex unwinds and an R-loop forms.')
      : t('A Cas9 encontra o PAM, mas os mismatches impedem um pareamento estável: o R-loop começa a abrir e colapsa.',
        'Cas9 finds the PAM, but the mismatches prevent stable pairing: the R-loop starts to open and collapses.')
    case 3:
      if (!acts) return t('Sem pareamento suficiente, o HNH não gira até o DNA: não há corte.', 'Without enough pairing, HNH never docks onto the DNA: no cut.')
      if (cas === 'be') return t('Editor de bases: em vez de cortar as duas fitas, a desaminase converte C em U na janela de edição (depois lido como T).', 'Base editor: instead of cutting both strands, the deaminase converts C to U in the editing window (later read as T).')
      if (cas === 'nickase') return t('Nickase D10A: o RuvC está inativo (cinza). Só o HNH corta, e só a fita-alvo: um nick, sem quebra de fita dupla.', 'D10A nickase: RuvC is inactive (grey). Only HNH cuts, and only the target strand: a nick, no double-strand break.')
      return t('O HNH gira até a fita-alvo e, junto com o RuvC, cliva as duas fitas 3 pb a montante do PAM: quebra de fita dupla (DSB), com extremidades cegas.', 'HNH swings onto the target strand and, together with RuvC, cleaves both strands 3 bp upstream of the PAM: a double-strand break (DSB) with blunt ends.')
    case 4:
      if (!acts) return t('Nada para reparar: a sequência permanece intacta.', 'Nothing to repair: the sequence stays intact.')
      if (cas === 'be') return t('O reparo/replicação fixa a mudança: C•G vira T•A. Não há molde doador nem DSB.', 'Repair/replication fixes the change: C•G becomes T•A. No donor template and no DSB.')
      if (cas === 'nickase') return t('Nicks isolados costumam ser selados com fidelidade pela ligase. Por isso nickases são usadas em pares (guias em fitas opostas) para gerar DSB com mais especificidade.', 'Isolated nicks are usually sealed faithfully by ligase. That is why nickases are used in pairs (guides on opposite strands) to make DSBs with higher specificity.')
      return repair === 'hdr'
        ? t('HDR: um molde com braços de homologia alinha-se ao sítio e é copiado. É menos eficiente e ocorre sobretudo nas fases S/G2 do ciclo celular.', 'HDR: a template with homology arms lines up at the site and is copied. It is less efficient and happens mostly in S/G2 phases of the cell cycle.')
        : t('NHEJ: o anel Ku70/80 encaixa nas pontas, a ligase as religa — muitas vezes com pequenas inserções ou deleções (indels). Predomina na maioria das células.', 'NHEJ: the Ku70/80 ring threads onto the ends and ligase rejoins them — often with small insertions or deletions (indels). It dominates in most cells.')
    default: return t('Resultado: compare a sequência original com a editada, veja a eficiência simulada e o risco nos sítios off-target ao fundo. Em laboratório, tudo isso precisa ser validado por sequenciamento.', 'Outcome: compare the original and edited sequences, the simulated efficiency and the risk at the off-target sites in the background. In the lab, all of this must be validated by sequencing.')
  }
}

/** Ícones inline: glifos como ⏮/⛶ não existem em muitas fontes e viram caixas vazias. */
const Icon = ({ d, label }: { d: string; label?: string }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" role={label ? 'img' : 'presentation'} aria-label={label}>
    <path d={d} />
  </svg>
)
const ICONS = {
  prev: 'M7 5h2v14H7zM19 5v14l-9-7z',
  next: 'M15 5h2v14h-2zM5 5l9 7-9 7z',
  play: 'M7 4l12 8-12 8z',
  pause: 'M6 4h4v16H6zM14 4h4v16h-4z',
  full: 'M4 9V4h5v2H6v3zm11-5h5v5h-2V6h-3zM6 15v3h3v2H4v-5zm12 0h2v5h-5v-2h3z',
  reset: 'M12 5V2L7 6l5 4V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z',
  cam: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0-6v3m0 14v3M2 12h3m14 0h3',
  film: 'M4 4h16v16H4zM7 4v16M17 4v16M4 8h3m10 0h3M4 12h3m10 0h3M4 16h3m10 0h3',
  screen: 'M3 4h18v12H3zM8 20h8M12 16v4',
  link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1m2 2.7a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1',
  shot: 'M4 7h3l2-3h6l2 3h3v13H4zM12 10a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  explore: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zm3.5 5.5-2 5-5 2 2-5z',
  soundOn: 'M4 9h4l5-4v14l-5-4H4zM16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12',
  soundOff: 'M4 9h4l5-4v14l-5-4H4zM17 9l5 6m0-6-5 6',
}
const Stroke = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>
)

function Seg({ children, on, cls, onClick }: { children: ReactNode; on: boolean; cls: string; onClick: () => void }) {
  return <button type="button" aria-pressed={on} onClick={onClick} className={`rounded-lg px-3 py-1.5 text-sm transition ${on ? cls : 'bg-white/5 text-mist hover:bg-white/10'}`}>{children}</button>
}

function SequenceView() {
  const t = useT()
  const d = useDerived()
  const locus = useSim((s) => s.locus)
  const step = useSim((s) => s.step)
  const edited = useSim((s) => s.step > 4 || (s.step === 4 && s.progress > 0.55))
  if (!d.cand) return null
  const c = d.cand
  return (
    <div className="font-mono text-[13px] leading-7 tracking-wider break-all">
      <div className="mb-1 text-[11px] uppercase tracking-[0.2em] text-mist/70">5′ → 3′ · {t('fita senso', 'sense strand')} {edited && t('· diff (original → editado)', '· diff (original → edited)')}</div>
      {!edited ? (
        <p aria-label={t('Sequência do locus', 'Locus sequence')}>
          {[...locus].map((b, i) => {
            const j = i - c.start
            const cls = j >= 0 && j < 20 ? 'text-dna bg-dna/10' : j >= 20 && j < 23 ? 'text-white bg-cas/60' : 'text-mist/60'
            return (
              <span key={i} className={cls}>
                {i === c.cut && step >= 3 && d.cuts !== 'none' && <span className="mx-px font-bold text-white" aria-label={t('corte', 'cut')}>|</span>}
                {b}
              </span>
            )
          })}
        </p>
      ) : (
        <p aria-label={t('Diferença entre sequência original e editada', 'Difference between original and edited sequence')}>
          {diffSegments(locus, d.ops!).map((g, i) => (
            <span key={i} className={{ same: 'text-mist/60', del: 'bg-red-500/30 text-red-300 line-through', ins: 'bg-bio/25 text-bio', sub: 'bg-rna/30 text-rna' }[g.type]}
              title={{ same: '', del: t('deletado', 'deleted'), ins: t('inserido', 'inserted'), sub: t('substituído', 'substituted') }[g.type]}>
              {g.text}
            </span>
          ))}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-mist/80">
        <span><i className="mr-1 inline-block h-2 w-2 bg-dna" />{t('protoespaçador', 'protospacer')}</span>
        <span><i className="mr-1 inline-block h-2 w-2 bg-cas" />PAM</span>
        <span><i className="mr-1 inline-block h-2 w-2 bg-red-400" />{t('deleção', 'deletion')}</span>
        <span><i className="mr-1 inline-block h-2 w-2 bg-bio" />{t('inserção', 'insertion')}</span>
        <span><i className="mr-1 inline-block h-2 w-2 bg-rna" />{t('substituição', 'substitution')}</span>
        {Object.entries(BASE_COLOR).filter(([b]) => b !== 'U').map(([b, col]) => <span key={b}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: col }} />{b} (3D)</span>)}
      </div>
    </div>
  )
}

function GuidePanel() {
  const t = useT()
  const d = useDerived()
  const s = useSim(useShallow((s) => ({ locus: s.locus, selected: s.selected, guide: s.guide, set: s.set, select: s.select, setLocus: s.setLocus })))
  const [typed, setTyped] = useState('')
  const [msg, setMsg] = useState('')
  const [locusDraft, setLocusDraft] = useState(s.locus)
  if (!d.cand) return <p className="text-sm text-red-300">{t('Nenhum PAM NGG encontrado no locus. Edite a sequência.', 'No NGG PAM found in the locus. Edit the sequence.')}</p>
  const mm = mismatches(s.guide, d.cand.protospacer)

  const findTyped = () => {
    const g = clean(typed)
    if (g.length !== 20) return setMsg(t('O guia precisa ter exatamente 20 nt (A, C, G, T).', 'The guide must be exactly 20 nt (A, C, G, T).'))
    const i = d.candidates.findIndex((c) => c.protospacer === g)
    if (i >= 0) { s.select(i); setMsg(t('Sítio encontrado, com PAM NGG adjacente.', 'Site found, with an adjacent NGG PAM.')) }
    else setMsg(s.locus.includes(g)
      ? t('Sequência presente, mas sem PAM NGG adjacente: a SpCas9 não cortaria aqui.', 'Sequence present, but with no adjacent NGG PAM: SpCas9 would not cut here.')
      : t('Sequência não encontrada neste locus (fita senso).', 'Sequence not found in this locus (sense strand).'))
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="hud-label">{t('Sítios candidatos (PAM NGG, fita senso)', 'Candidate sites (NGG PAM, sense strand)')}</h3>
        <div className="mt-2 max-h-44 space-y-1 overflow-auto pr-1" role="radiogroup" aria-label={t('Sítios candidatos', 'Candidate sites')}>
          {d.candidates.map((c, i) => (
            <div key={c.start}>
              <button type="button" role="radio" aria-checked={i === s.selected} onClick={() => s.select(i)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left font-mono text-xs transition ${i === s.selected ? 'bg-dna/15 ring-1 ring-dna/60' : 'hover:bg-white/5'}`}>
                <span className="truncate"><span className="text-dna">{c.protospacer}</span><span className="text-cas">{c.pam}</span></span>
                <span className="shrink-0 text-mist">GC {pct(c.gc)} · <b className="text-white">{c.score}</b></span>
              </button>
            </div>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-mist/70">{t('Score ilustrativo (GC, poli-T, homopolímeros). Em projetos reais use ferramentas como CRISPOR ou CHOPCHOP.', 'Illustrative score (GC, poly-T, homopolymers). For real projects use tools such as CRISPOR or CHOPCHOP.')}</p>
      </div>

      <div>
        <h3 className="hud-label">{t('Guia (clique numa base para criar mismatch)', 'Guide (click a base to create a mismatch)')}</h3>
        <div className="mt-2 flex flex-wrap gap-[3px]" role="group" aria-label={t('Bases do guia', 'Guide bases')}>
          {[...s.guide].map((b, i) => {
            const isMm = mm.includes(i)
            return (
              <button key={i} type="button" aria-label={`${t('Posição', 'Position')} ${i + 1}: ${b}${isMm ? ', mismatch' : ''}`}
                onClick={() => s.set({ guide: s.guide.slice(0, i) + NEXT_BASE[b] + s.guide.slice(i + 1) })}
                className={`h-7 w-[22px] rounded font-mono text-xs font-semibold transition ${isMm ? 'bg-red-500/80 text-white' : 'bg-white/5 hover:bg-white/15'} ${isSeed(i) ? 'border-b-2 border-rna/70' : ''}`}
                style={{ color: isMm ? undefined : BASE_COLOR[b] }}>{b}</button>
            )
          })}
          <span className="ml-1 self-center font-mono text-xs text-cas">{d.cand.pam}</span>
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-mist/70">
          <span>5′ distal · <span className="text-rna">{t('sublinhado = seed (12 nt)', 'underlined = seed (12 nt)')}</span></span>
          <button type="button" className="underline hover:text-white" onClick={() => s.set({ guide: d.cand!.protospacer })}>{t('limpar mismatches', 'clear mismatches')}</button>
        </div>
      </div>

      <div>
        <label className="hud-label" htmlFor="typed">{t('Ou digite um guia de 20 nt', 'Or type a 20-nt guide')}</label>
        <div className="mt-2 flex gap-2">
          <input id="typed" value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && findTyped()} maxLength={30} placeholder={t('ex.: TGACCATGTCGACGTTCCAG', 'e.g. TGACCATGTCGACGTTCCAG')}
            className="min-w-0 flex-1 rounded-lg bg-white/5 px-2 py-1.5 font-mono text-xs uppercase outline-none ring-1 ring-white/10 focus:ring-dna" />
          <button type="button" onClick={findTyped} className="rounded-lg bg-dna/20 px-3 text-xs text-dna hover:bg-dna/30">{t('Buscar', 'Find')}</button>
        </div>
        {msg && <p className="mt-1 text-[11px] text-mist" role="status">{msg}</p>}
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-mist hover:text-white">{t('Editar a sequência do locus (fictícia)', 'Edit the locus sequence (fictional)')}</summary>
        <textarea value={locusDraft} onChange={(e) => setLocusDraft(e.target.value)} rows={4} aria-label={t('Sequência do locus', 'Locus sequence')}
          className="mt-2 w-full rounded-lg bg-white/5 p-2 font-mono text-[11px] uppercase outline-none ring-1 ring-white/10 focus:ring-dna" />
        <button type="button" className="mt-1 rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20"
          onClick={() => { const l = clean(locusDraft).slice(0, MAX_LOCUS); setLocusDraft(l); s.setLocus(l) }}>{t('Aplicar', 'Apply')} ({t('máx.', 'max.')} {MAX_LOCUS} nt)</button>
      </details>
    </div>
  )
}

const QUALITY_LABEL: Record<Quality, [string, string]> = { low: ['Baixa', 'Low'], medium: ['Média', 'Medium'], high: ['Alta', 'High'] }

function ParamsPanel() {
  const t = useT()
  const s = useSim(useShallow((s) => ({ cas: s.cas, delivery: s.delivery, repair: s.repair, tolerance: s.tolerance, speed: s.speed, set: s.set, seed: s.seed, quality: s.quality, qualityAuto: s.qualityAuto })))
  const repairOff = s.cas !== 'wt'
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="hud-label">{t('Tipo de Cas', 'Cas type')}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(CAS) as CasType[]).map((k) => (
            <Seg key={k} onClick={() => s.set({ cas: k })} on={s.cas === k} cls="bg-cas/25 text-white ring-1 ring-cas/60">{t.pick(CAS[k].name)}</Seg>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="hud-label">{t('Entrega', 'Delivery')}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(DELIVERY) as Delivery[]).map((k) => (
            <Seg key={k} onClick={() => s.set({ delivery: k })} on={s.delivery === k} cls="bg-dna/20 text-white ring-1 ring-dna/60">{t.pick(DELIVERY[k].name)}</Seg>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-mist/80">{t.pick(DELIVERY[s.delivery].note)}</p>
      </fieldset>
      <fieldset disabled={repairOff} className={repairOff ? 'opacity-40' : ''}>
        <legend className="hud-label">{t('Via de reparo', 'Repair pathway')} {repairOff && t('(só com DSB)', '(DSB only)')}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Seg onClick={() => s.set({ repair: 'nhej' })} on={s.repair === 'nhej'} cls="bg-rna/25 text-white ring-1 ring-rna/60">NHEJ</Seg>
          <Seg onClick={() => s.set({ repair: 'hdr' })} on={s.repair === 'hdr'} cls="bg-bio/20 text-white ring-1 ring-bio/60">{t('HDR + molde', 'HDR + template')}</Seg>
          {s.repair === 'nhej' && !repairOff && (
            <button type="button" className="rounded-lg px-2 text-xs text-mist underline hover:text-white" onClick={() => s.set({ seed: s.seed + 1 })}>{t('sortear novo indel', 'roll a new indel')}</button>
          )}
        </div>
      </fieldset>
      <div>
        <label htmlFor="tol" className="hud-label">{t('Mismatches tolerados (modelo)', 'Tolerated mismatches (model)')}: <b className="text-white">{s.tolerance.toFixed(1)}</b></label>
        <input id="tol" type="range" min={0} max={3} step={0.5} value={s.tolerance} onChange={(e) => s.set({ tolerance: +e.target.value })} className="mt-2 w-full accent-cas" />
        <p className="text-[11px] text-mist/70">{t('Valores baixos imitam variantes de alta fidelidade; altos, excesso de enzima ou exposição prolongada.', 'Low values mimic high-fidelity variants; high values mimic excess enzyme or prolonged exposure.')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="hud-label">{t('Velocidade', 'Speed')}</span>
          <div className="mt-2 flex gap-2">
            {[0.5, 1, 2].map((v) => <Seg key={v} onClick={() => s.set({ speed: v })} on={s.speed === v} cls="bg-white/20 text-white">{v}×</Seg>)}
          </div>
        </div>
        <div>
          <span className="hud-label">{t('Qualidade gráfica', 'Graphics quality')}</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Seg onClick={() => s.set({ qualityAuto: true })} on={s.qualityAuto} cls="bg-white/20 text-white">Auto</Seg>
            {(['low', 'medium', 'high'] as Quality[]).map((q) => (
              <Seg key={q} onClick={() => s.set({ quality: q, qualityAuto: false })} on={!s.qualityAuto && s.quality === q} cls="bg-white/20 text-white">{t(...QUALITY_LABEL[q])}</Seg>
            ))}
          </div>
          {s.qualityAuto && <p className="mt-1 text-[11px] text-mist/70">{t('Atual', 'Current')}: {t(...QUALITY_LABEL[s.quality])}</p>}
        </div>
      </div>
    </div>
  )
}

function ResultPanel() {
  const t = useT()
  const d = useDerived()
  if (!d.cand) return null
  const risky = d.offs!.some((o) => o.p > 0.2)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 p-3"><div className="hud-label">{t('Eficiência simulada', 'Simulated efficiency')}</div><div className="font-display text-3xl text-bio">{pct(d.eff!)}</div></div>
        <div className="rounded-xl bg-white/5 p-3"><div className="hud-label">{t('Corte no alvo', 'On-target cut')}</div><div className="font-display text-3xl text-dna">{pct(d.pOn!)}</div></div>
      </div>
      <p className="text-sm text-white/90">{d.kind}</p>
      <div>
        <div className="hud-label">Off-targets</div>
        {d.offs!.map((o) => (
          <div key={o.label.pt} className="mt-2">
            <div className="flex justify-between text-xs"><span className="text-mist">{t.pick(o.label)}</span><b className={o.p > 0.2 ? 'text-cas' : 'text-mist'}>{pct(o.p)}</b></div>
            <div className="mt-1 h-1.5 rounded bg-white/10"><div className="h-full rounded bg-cas transition-all" style={{ width: pct(o.p) }} /></div>
            <div className="mt-0.5 font-mono text-[10px] tracking-wider text-mist/60">
              {[...o.site].map((b, i) => <span key={i} className={b !== d.cand!.protospacer[i] ? 'text-cas' : ''}>{b}</span>)}{o.pam}
            </div>
          </div>
        ))}
        {risky && <p className="mt-3 rounded-lg border border-cas/40 bg-cas/10 p-2 text-xs text-white" role="alert">⚠ {t('Risco relevante de corte off-target. Em laboratório: redesenhar o guia, usar Cas de alta fidelidade/RNP e sequenciar os sítios preditos.', 'Relevant off-target risk. In the lab: redesign the guide, use a high-fidelity Cas/RNP and sequence the predicted sites.')}</p>}
      </div>
      <p className="text-[11px] text-mist/60">{t('Todos os números são ilustrativos (modelo logístico simples), não previsões experimentais.', 'All numbers are illustrative (simple logistic model), not experimental predictions.')}</p>
    </div>
  )
}

function StepFill() {
  const p = useSim((s) => s.progress)
  return <span className="absolute inset-y-0 left-0 bg-dna/20" style={{ width: pct(p) }} aria-hidden="true" />
}

function Tooltip() {
  const tip = useSim((s) => s.tip)
  if (!tip) return null
  const left = Math.min(tip.x + 16, window.innerWidth - 300)
  const top = Math.min(tip.y + 16, window.innerHeight - 160)
  return (
    <div role="tooltip" className="glass pointer-events-none fixed z-[80] w-72 rounded-xl p-3 text-sm shadow-2xl" style={{ left, top }}>
      <div className="font-display font-semibold text-white">{tip.title}</div>
      <p className="mt-1 text-xs leading-relaxed text-mist">{tip.body}</p>
    </div>
  )
}

/** Joystick de toque: escreve direto na entrada do Explorer. */
function Joystick() {
  const base = useRef<HTMLDivElement>(null)
  const [k, setK] = useState({ x: 0, y: 0 })
  const move = (e: React.PointerEvent) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    const r = base.current!.getBoundingClientRect()
    let x = (e.clientX - r.left) / (r.width / 2) - 1
    let y = (e.clientY - r.top) / (r.height / 2) - 1
    const l = Math.hypot(x, y)
    if (l > 1) { x /= l; y /= l }
    input.x = x
    input.z = -y
    setK({ x, y })
  }
  const end = () => { input.x = input.z = 0; setK({ x: 0, y: 0 }) }
  return (
    <div ref={base} aria-hidden="true" className="glass absolute bottom-20 left-4 hidden h-28 w-28 touch-none rounded-full pointer-coarse:block"
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); useSim.getState().set({ flyTo: null }); move(e) }}
      onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
      <span className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-dna/40 ring-1 ring-dna" style={{ transform: `translate(calc(-50% + ${k.x * 32}px), calc(-50% + ${k.y * 32}px))` }} />
    </div>
  )
}

/** HUD do modo Explorar: cartão da zona atual, "voar até" por região (caminho por teclado/leitor de tela) e dicas. */
function ExplorePanel() {
  const t = useT()
  const zone = useSim((s) => s.zone)
  const seen = useSim((s) => s.seen)
  const e = zone ? EXHIBIT[zone] : undefined
  return (
    <>
      {e && (
        <div key={e.id} className="glass caption-in absolute left-3 top-14 max-h-[calc(100%-10rem)] w-[min(20rem,calc(100%-13rem))] overflow-auto rounded-2xl p-4 md:left-5" role="status">
          <div className="hud-label">{t.pick(REGIONS[e.region])}</div>
          <div className="font-display text-lg leading-tight text-white">{t.pick(e.title)}</div>
          <p className="mt-1.5 text-xs leading-relaxed text-mist">{t.pick(e.body)}</p>
          <p className="mt-2 rounded-lg bg-white/5 p-2 text-[11px] leading-relaxed text-white/85"><b className="text-rna">{t('Você sabia?', 'Did you know?')}</b> {t.pick(e.fact)}</p>
          {e.steps && (
            <div className="mt-3 flex flex-wrap gap-2">
              {e.steps.map((i) => (
                <button key={i} type="button" onClick={() => useSim.getState().goto(i)} className="rounded-lg bg-dna/20 px-3 py-1 text-xs text-dna hover:bg-dna/30">
                  ▶ {t('Ver etapa', 'Play step')} {i + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="glass absolute right-3 top-14 max-h-[calc(100%-10rem)] w-44 overflow-auto rounded-2xl p-2 text-xs md:right-5">
        <div className="hud-label px-1">{t('Voar até', 'Fly to')} · <span className="text-dna">{seen.length}/{EXHIBITS.length}</span></div>
        <div role="group" aria-label={t('Voar até', 'Fly to')} className="mt-1 space-y-2">
          {(Object.keys(REGIONS) as Region[]).map((r) => (
            <div key={r}>
              <div className="px-1 text-[10px] uppercase tracking-wider text-mist/60">{t.pick(REGIONS[r])}</div>
              {EXHIBITS.filter((x) => x.region === r).map((x) => (
                <button key={x.id} type="button" aria-pressed={zone === x.id} onClick={() => useSim.getState().set({ flyTo: x.id })}
                  className={`flex w-full items-center justify-between rounded-lg px-2 py-1 text-left transition ${zone === x.id ? 'bg-dna/15 text-white ring-1 ring-dna/60' : 'text-mist hover:bg-white/5 hover:text-white'}`}>
                  {t.pick(x.short)}
                  {seen.includes(x.id) && <><span aria-hidden="true" className="text-dna">✓</span><span className="sr-only">, {t('visitado', 'visited')}</span></>}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
      <p className="pointer-events-none absolute bottom-3 left-4 hidden max-w-[220px] text-[10px] leading-tight text-mist/70 xl:pointer-fine:block">
        WASD {t('nadar', 'swim')} · Q/E {t('descer/subir', 'down/up')} · Shift turbo · {t('arraste para olhar', 'drag to look')} · X {t('sair', 'exit')}
      </p>
      <Joystick />
    </>
  )
}

function Fallback({ reason }: { reason: 'nogl' | 'lost' }) {
  const t = useT()
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <svg viewBox="0 0 120 60" className="w-48" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => <line key={i} x1={8 + i * 9.5} x2={8 + i * 9.5} y1={30 - 18 * Math.sin(i * 0.6)} y2={30 + 18 * Math.sin(i * 0.6)} stroke={['#3ee6a0', '#ff5c8a', '#4cc9ff', '#ffc24b'][i % 4]} strokeWidth="2" />)}
      </svg>
      <p className="font-display text-lg">{reason === 'lost' ? t('A visualização 3D foi interrompida', 'The 3D view was interrupted') : t('WebGL indisponível neste navegador', 'WebGL is not available in this browser')}</p>
      <p className="max-w-md text-sm text-mist">{t('Todo o experimento (guia, parâmetros, etapas, diff e análise) continua funcionando nos painéis.', 'The whole experiment (guide, parameters, steps, diff and analysis) still works in the panels.')}</p>
      {reason === 'lost' && <button type="button" onClick={() => location.reload()} className="rounded-full bg-white/10 px-4 py-1.5 text-sm hover:bg-white/20">{t('Recarregar', 'Reload')}</button>}
    </div>
  )
}

/** Isola falhas do 3D: o resto do playground continua funcionando. */
class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

/** QR code do site (modo apresentação): a plateia abre no celular. Renderizado como imagem (sem injeção de HTML). */
function Qr() {
  const t = useT()
  const [src, setSrc] = useState('')
  useEffect(() => {
    const url = new URL(t.lang === 'en' ? '/en/' : '/', location.origin)
    import('qrcode').then((q) => q.toDataURL(url.toString(), { margin: 1, width: 240, color: { dark: '#04060bff', light: '#ffffffff' } })).then(setSrc).catch(() => setSrc(''))
  }, [t.lang])
  if (!src) return null
  return (
    <div className="absolute right-4 top-24 hidden w-28 rounded-xl bg-white p-1.5 text-center shadow-2xl md:block">
      <img src={src} alt={t('QR code para abrir o site', 'QR code to open the site')} className="h-auto w-full" />
      <p className="pb-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink">{t('abra no celular', 'open on your phone')}</p>
    </div>
  )
}

export default function Playground() {
  const t = useT()
  const wrap = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const inView = useInView(wrap)
  // a cena (e o three.js) só é carregada quando o playground se aproxima da tela
  const near = useInView(wrap, '900px')
  const [armed, setArmed] = useState(false)
  useEffect(() => { if (near) setArmed(true) }, [near])
  const [webgl] = useState(hasWebGL)
  const [lost, setLost] = useState(false)
  const [toast, setToast] = useState('')
  const [tab, setTab] = useState<'guia' | 'params' | 'resultado'>('guia')
  const sim = useSim(useShallow((s) => ({ step: s.step, playing: s.playing, presentation: s.presentation, cinema: s.cinema, explore: s.explore, sound: s.sound, cas: s.cas, delivery: s.delivery, repair: s.repair })))
  const d = useDerived()
  const acts = !!d.acts
  const steps = t.pick(STEPS)

  const toggleSound = () => {
    const on = !useSim.getState().sound
    sound.unlock()
    useSim.getState().set({ sound: on })
    try { localStorage.setItem(SOUND_KEY, on ? 'on' : 'off') } catch { /* sem armazenamento: vale só nesta visita */ }
  }
  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200) }
  const togglePlay = () => {
    const st = useSim.getState()
    if (st.playing) st.set({ playing: false })
    else if (st.progress >= 1) { if (st.step < STEP_COUNT - 1) st.goto(st.step + 1) }
    else st.set({ playing: true })
  }
  const fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : stage.current?.requestFullscreen())
  const cinema = () => {
    const st = useSim.getState()
    if (st.cinema) return st.set({ cinema: false, playing: false })
    st.set({ cinema: true, presentation: true, explore: false })
    st.goto(0)
  }
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(experimentUrl()); flash(t('Link do experimento copiado', 'Experiment link copied')) }
    catch { flash(t('Não foi possível copiar', 'Could not copy')) }
  }
  const capture = async () => {
    const { requestCapture } = await import('./scene/shared')
    const url = await requestCapture()
    const a = document.createElement('a')
    a.href = url
    a.download = `crispr-${useSim.getState().step + 1}.png`
    a.click()
    flash(t('Imagem salva', 'Image saved'))
  }

  // relógio da simulação: avança o progresso da etapa atual (pausado fora da viewport)
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    let hold = 0
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const st = useSim.getState()
      if (st.playing && (inView || st.presentation)) {
        const p = Math.min(1, st.progress + (dt * st.speed) / STEP_SECONDS[st.step])
        st.set({ progress: p, playing: p < 1 })
      } else if (st.cinema && st.progress >= 1) {
        // modo cinema: segura o quadro final um instante e segue para a próxima etapa
        hold += dt
        if (hold > 1.4) {
          hold = 0
          if (st.step < STEP_COUNT - 1) st.goto(st.step + 1)
          else st.set({ cinema: false })
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView])

  useEffect(() => { if (sim.step === 5) setTab('resultado') }, [sim.step])

  // som só no modo Explorar, com a preferência ligada e o playground à vista
  useEffect(() => { sound.setOn(sim.explore && sim.sound && (inView || sim.presentation)) }, [sim.explore, sim.sound, inView, sim.presentation])
  useEffect(() => () => sound.setOn(false), [])

  // modo Explorar: cada zona visitada pela primeira vez conta como descoberta (guardada neste navegador)
  useEffect(() => useSim.subscribe((s, prev) => {
    if (!s.zone || s.zone === prev.zone) return
    const fresh = !s.seen.includes(s.zone)
    sound.chime(fresh)
    if (!fresh) return
    const seen = [...s.seen, s.zone]
    s.set({ seen })
    try { localStorage.setItem(SEEN_KEY, JSON.stringify(seen)) } catch { /* sem armazenamento: vale só nesta visita */ }
    setToast(`✦ ${t('Nova descoberta', 'New discovery')} · ${seen.length}/${EXHIBITS.length}`)
    setTimeout(() => setToast(''), 2200)
  }), [t])

  // atalhos: ← → etapas, espaço play/pausa, R reset, C câmera, P apresentação, M cinema, F tela cheia, X explorar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useSim.getState()
      if (!inView && !st.presentation) return
      if ((e.target as HTMLElement).closest('input, textarea, select, [role="tab"]')) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 'arrowright') st.goto(st.step + 1)
      else if (k === 'arrowleft') st.goto(st.step - 1)
      else if (k === ' ') { if ((e.target as HTMLElement).closest('button')) return; togglePlay() }
      else if (k === 'r') st.reset()
      else if (k === 'c') st.set({ camTick: st.camTick + 1 })
      else if (k === 'p') st.set({ presentation: !st.presentation })
      else if (k === 'm') cinema()
      else if (k === 'f') fullscreen()
      else if (k === 'x' && webgl && !lost) { sound.unlock(); st.setExplore(!st.explore) }
      else if (k === 'escape' && st.explore) st.setExplore(false)
      else if (k === 'escape' && st.presentation && !document.fullscreenElement) st.set({ presentation: false, cinema: false })
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inView, webgl, lost])

  const st = useSim.getState()
  const caption = narration(t, sim.step, sim.cas, sim.delivery, sim.repair, acts)
  // no Explorar, a narração das etapas só aparece nas zonas do locus (as outras têm o próprio cartão)
  const zone = useSim((s) => s.zone)
  const showCaption = !sim.explore || !!(zone && EXHIBIT[zone].steps)
  const TABS = [['guia', t('Guia', 'Guide')], ['params', t('Parâmetros', 'Parameters')], ['resultado', t('Resultado', 'Outcome')]] as const
  const onTabKey = (e: React.KeyboardEvent, i: number) => {
    const n = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!n) return
    e.preventDefault()
    const next = TABS[(i + n + TABS.length) % TABS.length][0]
    setTab(next)
    document.getElementById(`tab-${next}`)?.focus()
  }
  const big = sim.presentation

  return (
    <div ref={wrap} className="relative">
      <div ref={stage} data-lenis-prevent className={`stage relative overflow-hidden rounded-3xl border border-white/10 bg-ink shadow-[0_40px_120px_-40px_rgba(62,240,208,0.25)] ${big ? 'h-[88vh]' : 'h-[74vh] min-h-[540px]'}`}>
        {webgl && !lost ? (armed &&
          <SceneBoundary fallback={<Fallback reason="lost" />}>
            <Suspense fallback={<div className="grid h-full place-items-center text-mist"><span className="animate-pulse">{t('Carregando cena 3D…', 'Loading 3D scene…')}</span></div>}>
              <Scene active={inView || sim.presentation} onLost={() => setLost(true)} />
            </Suspense>
          </SceneBoundary>
        ) : <Fallback reason={lost ? 'lost' : 'nogl'} />}

        {/* indicador de etapas */}
        <ol className="absolute left-3 right-3 top-3 flex flex-wrap gap-1.5 md:left-5 md:top-5" aria-label={t('Etapas do experimento', 'Experiment steps')}>
          {steps.map((name, i) => (
            <li key={name}>
              <button type="button" onClick={() => st.goto(i)} aria-current={i === sim.step ? 'step' : undefined}
                className={`glass relative overflow-hidden rounded-full px-3 py-1 text-xs transition ${i === sim.step ? 'text-white ring-1 ring-dna/70' : i < sim.step ? 'text-dna' : 'text-mist'}`}>
                {i === sim.step && <StepFill />}
                <span className="relative">{i + 1}. {name}</span>
              </button>
            </li>
          ))}
        </ol>

        {/* legenda / narração */}
        <div className={`pointer-events-none absolute left-1/2 w-[min(92%,920px)] -translate-x-1/2 text-center ${big ? 'bottom-24' : 'bottom-20'}`} aria-live="polite">
          {showCaption && <p key={caption} className={`caption-in inline rounded-xl bg-black/60 box-decoration-clone px-3 py-1 leading-relaxed text-white backdrop-blur-sm ${big ? 'text-xl md:text-2xl' : 'text-sm md:text-base'}`}>{caption}</p>}
        </div>

        {/* HUD de controle */}
        <div className="glass absolute bottom-3 left-1/2 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 items-center gap-1 overflow-x-auto rounded-2xl p-1.5" role="toolbar" aria-label={t('Controles da simulação', 'Simulation controls')}>
          <button type="button" className="hud-btn" onClick={() => st.goto(sim.step - 1)} aria-label={t('Etapa anterior', 'Previous step')} title={`${t('Etapa anterior', 'Previous step')} (←)`}><Icon d={ICONS.prev} /></button>
          <button type="button" className="hud-btn w-12 text-dna" onClick={togglePlay} aria-label={sim.playing ? t('Pausar', 'Pause') : t('Reproduzir', 'Play')} title={`Play/${t('pausa', 'pause')} (${t('espaço', 'space')})`}><Icon d={sim.playing ? ICONS.pause : ICONS.play} /></button>
          <button type="button" className="hud-btn" onClick={() => st.goto(sim.step + 1)} aria-label={t('Próxima etapa', 'Next step')} title={`${t('Próxima etapa', 'Next step')} (→)`}><Icon d={ICONS.next} /></button>
          <span className="mx-1 h-6 w-px shrink-0 bg-white/15" />
          <button type="button" className={`hud-btn gap-1.5 ${sim.cinema ? 'text-rna' : ''}`} aria-pressed={sim.cinema} onClick={cinema} title={`${t('Modo cinema: toca as 6 etapas', 'Cinema mode: plays all 6 steps')} (M)`}><Stroke d={ICONS.film} /><span className="hidden sm:inline">{t('Cinema', 'Cinema')}</span></button>
          {webgl && !lost && <button type="button" className={`hud-btn gap-1.5 ${sim.explore ? 'text-dna' : ''}`} aria-pressed={sim.explore} onClick={() => { sound.unlock(); st.setExplore(!sim.explore) }} title={`${t('Explorar o núcleo livremente', 'Explore the nucleus freely')} (X)`}><Stroke d={ICONS.explore} /><span className="hidden sm:inline">{t('Explorar', 'Explore')}</span></button>}
          {sim.explore && <button type="button" className="hud-btn" aria-pressed={sim.sound} onClick={toggleSound} aria-label={t('Som', 'Sound')} title={sim.sound ? t('Silenciar', 'Mute') : t('Ligar som', 'Unmute')}><Stroke d={sim.sound ? ICONS.soundOn : ICONS.soundOff} /></button>}
          <button type="button" className="hud-btn" onClick={() => st.reset()} aria-label={t('Resetar experimento', 'Reset experiment')} title={`${t('Resetar experimento', 'Reset experiment')} (R)`}><Icon d={ICONS.reset} /></button>
          <button type="button" className="hud-btn" onClick={() => st.set({ camTick: st.camTick + 1 })} aria-label={t('Recentralizar câmera', 'Recenter camera')} title={`${t('Recentralizar câmera', 'Recenter camera')} (C)`}><Stroke d={ICONS.cam} /></button>
          <button type="button" className={`hud-btn gap-1.5 ${big ? 'text-rna' : ''}`} aria-pressed={big} onClick={() => st.set({ presentation: !big })} title={`${t('Modo apresentação', 'Presentation mode')} (P)`}><Stroke d={ICONS.screen} /><span className="hidden lg:inline">{t('Apresentação', 'Present')}</span></button>
          <button type="button" className="hud-btn" onClick={copyLink} aria-label={t('Copiar link do experimento', 'Copy experiment link')} title={t('Copiar link do experimento', 'Copy experiment link')}><Stroke d={ICONS.link} /></button>
          {webgl && !lost && <button type="button" className="hud-btn" onClick={capture} aria-label={t('Salvar imagem da cena', 'Save scene image')} title={t('Salvar imagem da cena (PNG)', 'Save scene image (PNG)')}><Stroke d={ICONS.shot} /></button>}
          <button type="button" className="hud-btn" onClick={fullscreen} title={`${t('Tela cheia', 'Fullscreen')} (F)`} aria-label={t('Tela cheia', 'Fullscreen')}><Icon d={ICONS.full} /></button>
        </div>

        {sim.explore && <ExplorePanel />}

        {toast && <p className="glass absolute left-1/2 top-16 -translate-x-1/2 rounded-full px-4 py-1.5 text-sm text-white" role="status">{toast}</p>}
        <p className="absolute bottom-3 right-4 hidden max-w-[220px] text-right text-[10px] leading-tight text-mist/60 xl:block">{t('Simulação didática simplificada; não representa um protocolo experimental real.', 'Simplified teaching simulation; not a real experimental protocol.')}</p>
        {big && !sim.explore && <p className="absolute right-4 top-14 hidden text-[11px] text-mist/70 md:block">← → {t('etapas', 'steps')} · {t('espaço', 'space')} play · M {t('cinema', 'cinema')} · R reset · C {t('câmera', 'camera')} · F {t('tela cheia', 'fullscreen')} · P {t('sair', 'exit')}</p>}
        {big && !sim.explore && <Qr />}
      </div>

      <p className="mt-2 text-center text-xs text-mist/70 xl:hidden">{t('Simulação didática simplificada; não representa um protocolo experimental real.', 'Simplified teaching simulation; not a real experimental protocol.')}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_440px] lg:items-start">
        <div className="glass rounded-3xl p-5 md:p-6"><SequenceView /></div>
        <div className="glass rounded-3xl p-5 md:p-6">
          <div className="mb-4 flex gap-1 rounded-xl bg-white/5 p-1" role="tablist" aria-label={t('Painéis do experimento', 'Experiment panels')}>
            {TABS.map(([k, label], i) => (
              <button key={k} id={`tab-${k}`} type="button" role="tab" aria-selected={tab === k} aria-controls="pg-panel" tabIndex={tab === k ? 0 : -1}
                onClick={() => setTab(k)} onKeyDown={(e) => onTabKey(e, i)}
                className={`flex-1 rounded-lg py-1.5 text-sm transition ${tab === k ? 'bg-white/15 text-white' : 'text-mist hover:text-white'}`}>{label}</button>
            ))}
          </div>
          <div id="pg-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>{tab === 'guia' ? <GuidePanel /> : tab === 'params' ? <ParamsPanel /> : <ResultPanel />}</div>
        </div>
      </div>
      <Tooltip />
    </div>
  )
}
