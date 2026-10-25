// Os painéis 2D do playground: a sequência do locus e as quatro abas (guia, parâmetros,
// comparar e resultado). A cena 3D e os controles ficam em Playground.tsx.
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import {
  CAS,
  DELIVERY,
  FIX_RANGE,
  MAX_LOCUS,
  NAMES3,
  NEXT_BASE,
  NUCLEASE,
  clean,
  diffSegments,
  findCandidates,
  inPam,
  isSeed,
  mismatches,
  revComp,
  spacerPos,
  type AlleleOutcome,
  type Candidate,
  type CasType,
  type Consequence,
  type Delivery,
  type NucleaseId,
  type Population,
  type Repair,
} from '../lib/dna'
import { DISEASES, findDisease, targetPos, targetSpan, type Disease } from '../content/diseases'
import { useT, type T } from '../i18n'
import { bestRow, compareRows, useDerived, useParams, useSim, type CompareRow, type Proteins, type Quality, type Verdict as VerdictKind } from './store'
import { BASE_COLOR } from './colors'
import { Seg } from './ui'
import { pct } from './format'

export function SequenceView() {
  const t = useT()
  const d = useDerived()
  const locus = useSim((s) => s.locus)
  const step = useSim((s) => s.step)
  const setLocus = useSim((s) => s.setLocus)
  const edited = useSim((s) => s.step > 4 || (s.step === 4 && s.progress > 0.55))
  if (!d.cand) return null
  const c = d.cand
  const span = d.dis ? targetSpan(d.dis) : null
  return (
    <div className="font-mono text-[13px] leading-7 tracking-wider break-all">
      <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-mist/70">
        5′ → 3′ · {t('fita senso', 'sense strand')}{' '}
        {edited ? (
          t('· diff (original → editado)', '· diff (original → edited)')
        ) : (
          <>
            · {c.strand === 1 ? t('guia na fita senso', 'guide on the sense strand') : t('guia na fita antissenso', 'guide on the antisense strand')}
            {!d.dis && t(' · clique numa base para trocá-la', ' · click a base to swap it')}
          </>
        )}
      </div>
      {!edited ? (
        <div className="flex flex-wrap gap-[3px]" role="group" aria-label={t('Sequência do locus', 'Locus sequence')}>
          {[...locus].map((b, i) => {
            const onSpacer = spacerPos(c, i) >= 0
            const onPam = inPam(c, i)
            const onTarget = !!span && i >= span.start && i < span.start + span.length
            const cls = onTarget
              ? 'bg-red-500 text-white ring-1 ring-red-300'
              : onSpacer
                ? 'bg-dna/20 ring-1 ring-dna/50'
                : onPam
                  ? 'bg-cas/60 text-white'
                  : 'bg-white/5 hover:bg-white/15'
            return (
              <Fragment key={i}>
                {i === c.cut && step >= 3 && d.cuts !== 'none' && <span className="w-[3px] rounded bg-white" aria-label={t('corte', 'cut')} />}
                <button
                  type="button"
                  disabled={!!d.dis}
                  onClick={() => setLocus(locus.slice(0, i) + NEXT_BASE[b] + locus.slice(i + 1))}
                  aria-label={`${t('Posição', 'Position')} ${i + 1}: ${b}`}
                  title={
                    onTarget
                      ? d.dis!.goal === 'disrupt'
                        ? t('Motivo a destruir', 'Motif to destroy')
                        : t('Região alterada pela doença', 'Region altered by the disease')
                      : undefined
                  }
                  className={`h-8 w-[26px] rounded text-sm font-semibold transition enabled:hover:-translate-y-0.5 enabled:active:scale-90 ${cls}`}
                  style={{ color: onTarget || onPam ? undefined : BASE_COLOR[b] }}
                >
                  {b}
                </button>
              </Fragment>
            )
          })}
        </div>
      ) : (
        <p aria-label={t('Diferença entre sequência original e editada', 'Difference between original and edited sequence')}>
          {diffSegments(locus, d.ops!).map((g, i) => (
            <span
              key={i}
              className={{ same: 'text-mist/60', del: 'bg-red-500/30 text-red-300 line-through', ins: 'bg-bio/25 text-bio', sub: 'bg-rna/30 text-rna' }[g.type]}
              title={{ same: '', del: t('deletado', 'deleted'), ins: t('inserido', 'inserted'), sub: t('substituído', 'substituted') }[g.type]}
            >
              {g.text}
            </span>
          ))}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-mist/80">
        {d.dis && (
          <span>
            <i className="mr-1 inline-block h-2 w-2 bg-red-500" />
            {d.dis.goal === 'disrupt' ? t('motivo-alvo', 'target motif') : t('região da doença', 'disease region')}
          </span>
        )}
        <span>
          <i className="mr-1 inline-block h-2 w-2 bg-dna" />
          {t('protoespaçador', 'protospacer')}
        </span>
        <span>
          <i className="mr-1 inline-block h-2 w-2 bg-cas" />
          PAM
        </span>
        <span>
          <i className="mr-1 inline-block h-2 w-2 bg-red-400" />
          {t('deleção', 'deletion')}
        </span>
        <span>
          <i className="mr-1 inline-block h-2 w-2 bg-bio" />
          {t('inserção', 'insertion')}
        </span>
        <span>
          <i className="mr-1 inline-block h-2 w-2 bg-rna" />
          {t('substituição', 'substitution')}
        </span>
        {Object.entries(BASE_COLOR)
          .filter(([b]) => b !== 'U')
          .map(([b, col]) => (
            <span key={b}>
              <i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: col }} />
              {b} (3D)
            </span>
          ))}
      </div>
    </div>
  )
}

/** O sítio na ordem em que existe no DNA: o PAM da Cas12a vem antes do protoespaçador. */
function SiteSequence({ c, side }: { c: Candidate; side: number }) {
  const spacer = <span className="text-dna">{c.protospacer}</span>
  const pam = <span className="text-cas">{c.pam}</span>
  return side === 5 ? (
    <>
      {pam}
      {spacer}
    </>
  ) : (
    <>
      {spacer}
      {pam}
    </>
  )
}

/** Cenário clínico: carrega um alvo real e explica a doença nos dois níveis. */
function Scenario() {
  const t = useT()
  const s = useSim(useShallow((s) => ({ disease: s.disease, setDisease: s.setDisease })))
  const dis = findDisease(s.disease)
  return (
    <div>
      <h3 className="hud-label">{t('Cenário', 'Scenario')}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        <Seg on={!dis} onClick={() => s.setDisease(null)} cls="bg-white/20 text-white">
          {t('Locus fictício', 'Fictional locus')}
        </Seg>
        {DISEASES.map((z) => (
          <Seg key={z.id} on={s.disease === z.id} onClick={() => s.setDisease(z.id)} cls="bg-cas/25 text-white ring-1 ring-cas/60">
            {t.pick(z.name)}
          </Seg>
        ))}
      </div>
      {dis && (
        <div className="mt-2 space-y-2 rounded-xl border border-red-400/30 bg-red-500/5 p-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-xs text-white/90">{t.pick(dis.gene)}</span>
            <span className="font-mono text-[11px] text-red-300">{dis.variant}</span>
          </div>
          <p className="text-xs leading-relaxed text-white/80">{t.pick(dis.plain)}</p>
          <details className="text-[11px] text-mist">
            <summary className="cursor-pointer hover:text-white">{t('Detalhe molecular e herança', 'Molecular detail and inheritance')}</summary>
            <p className="mt-1 leading-relaxed">{t.pick(dis.tech)}</p>
            <p className="mt-1 leading-relaxed">{t.pick(dis.inherit)}</p>
            <p className="mt-1 text-mist/70">
              {t('Sequência', 'Sequence')}: {dis.source}
            </p>
          </details>
          <p className="text-[11px] text-mist/80">
            {dis.goal === 'disrupt'
              ? t(
                  'O motivo-alvo está marcado em vermelho na sequência e na hélice 3D. Aqui o objetivo é destruí-lo: rode a simulação e veja qual ferramenta consegue.',
                  'The target motif is marked in red in the sequence and in the 3D helix. Here the goal is to destroy it: run the simulation and see which tool manages.',
                )
              : t(
                  'A região alterada está marcada em vermelho na sequência e na hélice 3D. Rode a simulação para ver o que a sua escolha de edição faz com ela.',
                  'The altered region is marked in red in the sequence and in the 3D helix. Run the simulation to see what your editing choice does to it.',
                )}
          </p>
        </div>
      )}
    </div>
  )
}

/** Os sítios que a nuclease atual encontra no locus, com a distância até o alvo do cenário. */
function CandidateList() {
  const t = useT()
  const d = useDerived()
  const s = useSim(useShallow((s) => ({ nuclease: s.nuclease, selected: s.selected, select: s.select })))
  const pam = NUCLEASE[s.nuclease].pam

  return (
    <div>
      <h3 className="hud-label">{t(`Sítios candidatos (PAM ${pam.seq}, duas fitas)`, `Candidate sites (${pam.seq} PAM, both strands)`)}</h3>
      <div
        className="mt-2 max-h-44 space-y-1 overflow-auto pr-1"
        role="radiogroup"
        aria-label={t('Sítios candidatos', 'Candidate sites')}
        onKeyDown={(e) => {
          // padrão ARIA de radiogroup: as setas movem a seleção e o foco juntos
          const dir = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
          if (!dir) return
          e.preventDefault()
          const i = (s.selected + dir + d.candidates.length) % d.candidates.length
          s.select(i)
          ;(e.currentTarget.children[i] as HTMLElement | undefined)?.focus()
        }}
      >
        {d.candidates.map((c, i) => (
          <button
            key={c.start + c.strand}
            type="button"
            role="radio"
            aria-checked={i === s.selected}
            tabIndex={i === s.selected ? 0 : -1}
            onClick={() => s.select(i)}
            className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left font-mono text-xs transition ${i === s.selected ? 'bg-dna/15 ring-1 ring-dna/60' : 'hover:bg-white/5'}`}
          >
            <span className="truncate">
              <span className="mr-1 text-mist/60" title={c.strand === 1 ? t('fita senso', 'sense strand') : t('fita antissenso', 'antisense strand')}>
                {c.strand === 1 ? '+' : '−'}
              </span>
              <SiteSequence c={c} side={pam.side} />
            </span>
            {d.dis && (
              <span
                className={`shrink-0 ${Math.abs(c.cut - targetPos(d.dis)) <= FIX_RANGE ? 'text-bio' : 'text-mist/50'}`}
                title={t(
                  'Distância entre o corte e o alvo: molde de HDR e prime editing só alcançam o que está perto.',
                  'Distance between the cut and the target: the HDR template and prime editing only reach what is nearby.',
                )}
              >
                {Math.abs(c.cut - targetPos(d.dis))} nt
              </span>
            )}
            <span className="shrink-0 text-mist">
              GC {pct(c.gc)} · <b className="text-white">{c.score}</b>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-mist/70">
        {t(
          'Score ilustrativo (GC, poli-T, homopolímeros). Em projetos reais use ferramentas como CRISPOR ou CHOPCHOP.',
          'Illustrative score (GC, poly-T, homopolymers). For real projects use tools such as CRISPOR or CHOPCHOP.',
        )}
      </p>
    </div>
  )
}

/** Buscar um guia digitado e editar a sequência do locus à mão. */
function GuideFinder() {
  const t = useT()
  const d = useDerived()
  const s = useSim(useShallow((s) => ({ locus: s.locus, select: s.select, setLocus: s.setLocus })))
  const [typed, setTyped] = useState('')
  const [msg, setMsg] = useState('')
  const [draft, setDraft] = useState(s.locus)
  useEffect(() => setDraft(s.locus), [s.locus])

  const findTyped = () => {
    const g = clean(typed)
    if (g.length !== 20) return setMsg(t('O guia precisa ter exatamente 20 nt (A, C, G, T).', 'The guide must be exactly 20 nt (A, C, G, T).'))
    const i = d.candidates.findIndex((c) => c.protospacer === g)
    if (i >= 0) return void (s.select(i), setMsg(t('Sítio encontrado, com PAM adjacente.', 'Site found, with an adjacent PAM.')))
    setMsg(
      s.locus.includes(g) || s.locus.includes(revComp(g))
        ? t(
            'Sequência presente, mas sem PAM adjacente: a nuclease não cortaria aqui.',
            'Sequence present, but with no adjacent PAM: the nuclease would not cut here.',
          )
        : t('Sequência não encontrada neste locus, em nenhuma das duas fitas.', 'Sequence not found in this locus, on either strand.'),
    )
  }

  return (
    <>
      <div>
        <label className="hud-label" htmlFor="typed">
          {t('Ou digite um guia de 20 nt', 'Or type a 20-nt guide')}
        </label>
        <div className="mt-2 flex gap-2">
          <input
            id="typed"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && findTyped()}
            maxLength={30}
            placeholder={t('ex.: TGACCATGTCGACGTTCCAG', 'e.g. TGACCATGTCGACGTTCCAG')}
            className="min-w-0 flex-1 rounded-lg bg-white/5 px-2 py-1.5 font-mono text-xs uppercase outline-none ring-1 ring-white/10 focus:ring-dna"
          />
          <button type="button" onClick={findTyped} className="rounded-lg bg-dna/20 px-3 text-xs text-dna hover:bg-dna/30">
            {t('Buscar', 'Find')}
          </button>
        </div>
        {msg && (
          <p className="mt-1 text-[11px] text-mist" role="status">
            {msg}
          </p>
        )}
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-mist hover:text-white">
          {t('Editar a sequência do locus (fictícia)', 'Edit the locus sequence (fictional)')}
        </summary>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={4}
          aria-label={t('Sequência do locus', 'Locus sequence')}
          className="mt-2 w-full rounded-lg bg-white/5 p-2 font-mono text-[11px] uppercase outline-none ring-1 ring-white/10 focus:ring-dna"
        />
        <button
          type="button"
          className="mt-1 rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20"
          onClick={() => {
            const l = clean(draft).slice(0, MAX_LOCUS)
            setDraft(l)
            s.setLocus(l)
          }}
        >
          {t('Aplicar', 'Apply')} ({t('máx.', 'max.')} {MAX_LOCUS} nt)
        </button>
      </details>
    </>
  )
}

export function GuidePanel() {
  const t = useT()
  const d = useDerived()
  const s = useSim(useShallow((s) => ({ nuclease: s.nuclease, guide: s.guide, set: s.set })))
  const { side: pamSide } = NUCLEASE[s.nuclease].pam
  if (!d.cand)
    return (
      <div className="space-y-5">
        <Scenario />
        <NoPam />
      </div>
    )
  const mm = mismatches(s.guide, d.cand.protospacer)

  return (
    <div className="space-y-5">
      <Scenario />
      <CandidateList />

      <div>
        <h3 className="hud-label">{t('Guia (clique numa base para criar mismatch)', 'Guide (click a base to create a mismatch)')}</h3>
        <div className="mt-2 flex flex-wrap items-center gap-[3px]" role="group" aria-label={t('Bases do guia', 'Guide bases')}>
          {pamSide === 5 && <span className="mr-1 font-mono text-xs text-cas">{d.cand.pam}</span>}
          {[...s.guide].map((b, i) => {
            const isMm = mm.includes(i)
            return (
              <button
                key={i}
                type="button"
                aria-label={`${t('Posição', 'Position')} ${i + 1}: ${b}${isMm ? ', mismatch' : ''}`}
                onClick={() => s.set({ guide: s.guide.slice(0, i) + NEXT_BASE[b] + s.guide.slice(i + 1) })}
                className={`h-7 w-[22px] rounded font-mono text-xs font-semibold transition ${isMm ? 'bg-red-500/80 text-white' : 'bg-white/5 hover:bg-white/15'} ${isSeed(i, s.nuclease) ? 'border-b-2 border-rna/70' : ''}`}
                style={{ color: isMm ? undefined : BASE_COLOR[b] }}
              >
                {b}
              </button>
            )
          })}
          {pamSide === 3 && <span className="ml-1 font-mono text-xs text-cas">{d.cand.pam}</span>}
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-mist/70">
          <span>
            {pamSide === 3 ? '5′ distal' : '5′ · PAM'} ·{' '}
            <span className="text-rna">
              {pamSide === 3 ? t('sublinhado = seed (12 nt)', 'underlined = seed (12 nt)') : t('sublinhado = seed (8 nt)', 'underlined = seed (8 nt)')}
            </span>
          </span>
          <button type="button" className="underline hover:text-white" onClick={() => s.set({ guide: d.cand!.protospacer })}>
            {t('limpar mismatches', 'clear mismatches')}
          </button>
        </div>
      </div>

      <GuideFinder />
    </div>
  )
}

const QUALITY_LABEL: Record<Quality, [string, string]> = { low: ['Baixa', 'Low'], medium: ['Média', 'Medium'], high: ['Alta', 'High'] }

export function ParamsPanel() {
  const t = useT()
  const s = useSim(
    useShallow((s) => ({
      nuclease: s.nuclease,
      setNuclease: s.setNuclease,
      cas: s.cas,
      delivery: s.delivery,
      repair: s.repair,
      tolerance: s.tolerance,
      speed: s.speed,
      set: s.set,
      seed: s.seed,
      quality: s.quality,
      qualityAuto: s.qualityAuto,
    })),
  )
  const repairOff = s.cas !== 'wt'
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="hud-label">{t('Nuclease', 'Nuclease')}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(NUCLEASE) as NucleaseId[]).map((k) => (
            <Seg key={k} onClick={() => s.setNuclease(k)} on={s.nuclease === k} cls="bg-dna/20 text-white ring-1 ring-dna/60">
              {t.pick(NUCLEASE[k].name)} · {NUCLEASE[k].pam.seq}
            </Seg>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-mist/80">{t.pick(NUCLEASE[s.nuclease].note)}</p>
        {s.nuclease === 'cas12a' && (
          <p className="mt-1 text-[11px] text-rna">
            {t(
              'Nickase, editores de base e prime editing deste playground são construídos sobre a Cas9: com a Cas12a, só a nuclease selvagem.',
              'The nickase, base editors and prime editing in this playground are built on Cas9: with Cas12a, only the wild-type nuclease.',
            )}
          </p>
        )}
      </fieldset>
      <fieldset>
        <legend className="hud-label">{t('Tipo de Cas', 'Cas type')}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(CAS) as CasType[]).map((k) => (
            <Seg
              key={k}
              onClick={() => s.set({ cas: k })}
              on={s.cas === k}
              disabled={s.nuclease === 'cas12a' && k !== 'wt'}
              cls="bg-cas/25 text-white ring-1 ring-cas/60"
            >
              {t.pick(CAS[k].name)}
            </Seg>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="hud-label">{t('Entrega', 'Delivery')}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(DELIVERY) as Delivery[]).map((k) => (
            <Seg key={k} onClick={() => s.set({ delivery: k })} on={s.delivery === k} cls="bg-dna/20 text-white ring-1 ring-dna/60">
              {t.pick(DELIVERY[k].name)}
            </Seg>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-mist/80">{t.pick(DELIVERY[s.delivery].note)}</p>
      </fieldset>
      <fieldset disabled={repairOff} className={repairOff ? 'opacity-40' : ''}>
        <legend className="hud-label">
          {t('Via de reparo', 'Repair pathway')} {repairOff && t('(só com DSB)', '(DSB only)')}
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Seg onClick={() => s.set({ repair: 'nhej' })} on={s.repair === 'nhej'} cls="bg-rna/25 text-white ring-1 ring-rna/60">
            NHEJ
          </Seg>
          <Seg onClick={() => s.set({ repair: 'hdr' })} on={s.repair === 'hdr'} cls="bg-bio/20 text-white ring-1 ring-bio/60">
            {t('HDR + molde', 'HDR + template')}
          </Seg>
          {s.repair === 'nhej' && !repairOff && (
            <button type="button" className="rounded-lg px-2 text-xs text-mist underline hover:text-white" onClick={() => s.set({ seed: s.seed + 1 })}>
              {t('sortear novo indel', 'roll a new indel')}
            </button>
          )}
        </div>
      </fieldset>
      <div>
        <label htmlFor="tol" className="hud-label">
          {t('Mismatches tolerados (modelo)', 'Tolerated mismatches (model)')}: <b className="text-white">{s.tolerance.toFixed(1)}</b>
        </label>
        <input
          id="tol"
          type="range"
          min={0}
          max={3}
          step={0.5}
          value={s.tolerance}
          onChange={(e) => s.set({ tolerance: +e.target.value })}
          className="mt-2 w-full accent-cas"
        />
        <p className="text-[11px] text-mist/70">
          {t(
            'Valores baixos imitam variantes de alta fidelidade; altos, excesso de enzima ou exposição prolongada.',
            'Low values mimic high-fidelity variants; high values mimic excess enzyme or prolonged exposure.',
          )}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <span className="hud-label">{t('Velocidade', 'Speed')}</span>
          <div className="mt-2 flex gap-2">
            {[0.5, 1, 2].map((v) => (
              <Seg key={v} onClick={() => s.set({ speed: v })} on={s.speed === v} cls="bg-white/20 text-white">
                {v}×
              </Seg>
            ))}
          </div>
        </div>
        <div>
          <span className="hud-label">{t('Qualidade gráfica', 'Graphics quality')}</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Seg onClick={() => s.set({ qualityAuto: true })} on={s.qualityAuto} cls="bg-white/20 text-white">
              Auto
            </Seg>
            {(['low', 'medium', 'high'] as Quality[]).map((q) => (
              <Seg key={q} onClick={() => s.set({ quality: q, qualityAuto: false })} on={!s.qualityAuto && s.quality === q} cls="bg-white/20 text-white">
                {t(...QUALITY_LABEL[q])}
              </Seg>
            ))}
          </div>
          {s.qualityAuto && (
            <p className="mt-1 text-[11px] text-mist/70">
              {t('Atual', 'Current')}: {t(...QUALITY_LABEL[s.quality])}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

/** Efeito da edição sobre a proteína, em uma palavra. */
const effectLabel = (effect: Consequence, t: T): string =>
  ({
    none: t('sem mudança', 'no change'),
    silent: t('silenciosa', 'silent'),
    inframe: t('em quadro', 'in-frame'),
    missense: t('missense', 'missense'),
    nonsense: t('nonsense · parada', 'nonsense · stop'),
    frameshift: 'frameshift',
  })[effect]

function EffectChip({ effect }: { effect: Consequence }) {
  const t = useT()
  const tone: Record<Consequence, string> = {
    none: 'bg-white/10 text-mist',
    silent: 'bg-white/10 text-mist',
    inframe: 'bg-rna/20 text-rna',
    missense: 'bg-rna/20 text-rna',
    nonsense: 'bg-cas/20 text-cas',
    frameshift: 'bg-cas/20 text-cas',
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${tone[effect]}`}
      title={t('Efeito da edição sobre a proteína traduzida.', 'Effect of the edit on the translated protein.')}
    >
      {effectLabel(effect, t)}
    </span>
  )
}

const toolLabel = (s: { cas: CasType; repair: Repair }, t: T) => (s.cas === 'wt' ? s.repair.toUpperCase() : t.pick(CAS[s.cas].name))

/** Símbolo curto do veredito, para caber numa célula da tabela. */
const VERDICT_MARK: Record<VerdictKind, { mark: string; cls: string }> = {
  success: { mark: '✓', cls: 'text-bio' },
  unchanged: { mark: '–', cls: 'text-mist/60' },
  broken: { mark: '✗', cls: 'text-cas' },
}

/** Todas as ferramentas no mesmo sítio: cada uma acerta um tipo de alvo diferente. */
export function ComparePanel() {
  const t = useT()
  const d = useDerived()
  const p = useParams()
  const set = useSim((s) => s.set)
  const select = useSim((s) => s.select)
  const setNuclease = useSim((s) => s.setNuclease)
  const other: NucleaseId = p.nuclease === 'spcas9' ? 'cas12a' : 'spcas9'
  const otherSites = useMemo(() => findCandidates(p.locus, other), [p.locus, other])
  const rows = useMemo(() => compareRows(p, t.lang === 'en'), [p, t.lang])
  const best = bestRow(rows)

  const applyRow = (r: CompareRow) => {
    if (r.nuclease !== p.nuclease) {
      setNuclease(r.nuclease)
      select(r.selected)
    }
    set({ cas: r.cas, repair: r.repair })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="hud-label">{t('Comparar estratégias', 'Compare strategies')}</h3>
        <p className="mt-1 text-[11px] text-mist/70">
          {t(
            'As ferramentas da nuclease atual no sítio escolhido e, em laranja, a outra nuclease no melhor sítio que o PAM dela permite. Clique numa linha para adotá-la.',
            'The current nuclease’s tools at the chosen site and, in amber, the other nuclease at the best site its PAM allows. Click a row to adopt it.',
          )}
        </p>
      </div>
      <table className="w-full text-left text-xs">
        <thead className="text-[10px] uppercase tracking-wider text-mist/70">
          <tr>
            <th scope="col" className="pb-1 font-medium">
              {t('Nuclease', 'Nuclease')}
            </th>
            <th scope="col" className="pb-1 font-medium">
              {t('Ferramenta', 'Tool')}
            </th>
            <th scope="col" className="pb-1 text-right font-medium">
              {t('Efic.', 'Eff.')}
            </th>
            <th scope="col" className="pb-1 text-right font-medium">
              {t('Pior OT', 'Worst OT')}
            </th>
            <th scope="col" className="pb-1 text-right font-medium">
              {d.dis ? t('Alvo', 'Goal') : t('Efeito', 'Effect')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const current = r.nuclease === p.nuclease && p.cas === r.cas && (r.cas !== 'wt' || p.repair === r.repair)
            const worstOff = Math.max(0, ...(r.d.offs ?? []).map((o) => o.p))
            return (
              <tr key={`${r.nuclease}-${r.cas}-${r.repair}`}>
                <td colSpan={5} className="p-0">
                  <button
                    type="button"
                    onClick={() => applyRow(r)}
                    aria-current={current}
                    className={`grid w-full grid-cols-[auto_1fr_auto_auto_auto] items-center gap-1.5 rounded-lg px-2 py-1.5 text-left transition ${current ? 'bg-dna/15 ring-1 ring-dna/60' : 'hover:bg-white/5'}`}
                  >
                    <span className={r.nuclease === p.nuclease ? 'text-mist' : 'text-rna'}>{t.pick(NUCLEASE[r.nuclease].name)}</span>
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate">{toolLabel(r, t)}</span>
                      {r === best && (
                        <span className="shrink-0 rounded bg-bio/20 px-1 text-[10px] uppercase tracking-wider text-bio">{t('melhor', 'best')}</span>
                      )}
                    </span>
                    <span className="w-10 text-right font-mono text-bio">{pct(r.d.eff ?? 0)}</span>
                    <span className={`w-10 text-right font-mono ${worstOff > 0.2 ? 'text-cas' : 'text-mist/60'}`}>{pct(worstOff)}</span>
                    <span className="w-14 text-right">
                      {r.d.verdict ? (
                        <b className={VERDICT_MARK[r.d.verdict].cls}>{VERDICT_MARK[r.d.verdict].mark}</b>
                      ) : (
                        <span className="text-[10px] uppercase tracking-wider text-mist/70">{r.d.effect ? effectLabel(r.d.effect, t) : '—'}</span>
                      )}
                    </span>
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="text-xs leading-relaxed text-white/85">{rows.find((r) => r === best)?.d.kind}</p>

      {!otherSites.length && (
        <p className="text-[11px] text-rna">
          {t(
            `Não há PAM ${NUCLEASE[other].pam.seq} neste locus, então a ${t.pick(NUCLEASE[other].name)} não tem onde cortar.`,
            `There is no ${NUCLEASE[other].pam.seq} PAM in this locus, so ${t.pick(NUCLEASE[other].name)} has nowhere to cut.`,
          )}
        </p>
      )}

      <p className="text-[11px] leading-relaxed text-mist/70">
        {t(
          'A eficiência já inclui a entrega escolhida. "Pior OT" é a maior chance de corte fora do alvo entre os sítios simulados.',
          'Efficiency already includes the chosen delivery. "Worst OT" is the highest off-target cutting chance among the simulated sites.',
        )}
      </p>
    </div>
  )
}

/** Veredito do cenário: a edição alcançou o objetivo do caso? */
function Verdict({ dis, verdict, proteins, effect }: { dis: Disease; verdict: VerdictKind; proteins?: Proteins; effect?: Consequence }) {
  const t = useT()
  const disrupt = dis.goal === 'disrupt'
  const tone = { success: 'border-bio/50 bg-bio/10', unchanged: 'border-white/15 bg-white/5', broken: 'border-cas/50 bg-cas/10' }[verdict]
  const head = {
    success: disrupt ? t('Interruptor desligado', 'Switch turned off') : t('Alelo corrigido', 'Allele corrected'),
    unchanged: disrupt ? t('Motivo ainda intacto', 'Motif still intact') : t('Alelo inalterado', 'Allele unchanged'),
    broken: t('Gene inativado, não corrigido', 'Gene disrupted, not corrected'),
  }[verdict]
  const say = {
    success: disrupt
      ? t(
          'O motivo GATA1 deixou de existir neste alelo: o BCL11A não é mais ligado nos precursores eritroides e a hemoglobina fetal volta a subir. Serve qualquer edição que quebre o motivo — inclusive o indel "bagunçado" do NHEJ, que aqui é justamente o que se quer.',
          'The GATA1 motif no longer exists in this allele: BCL11A is no longer switched on in erythroid precursors and fetal haemoglobin rises again. Any edit that breaks the motif works — including the "messy" NHEJ indel, which here is exactly what you want.',
        )
      : t(
          'A proteína voltou a ser idêntica à do alelo saudável: a sequência foi restaurada e o resto ficou intacto. Como a herança é recessiva, corrigir parte das células já costuma aliviar muito os sintomas.',
          'The protein is identical to the healthy allele again: the sequence was restored and the rest is intact. Since the inheritance is recessive, correcting a share of the cells usually relieves symptoms a great deal.',
        ),
    unchanged: disrupt
      ? t(
          'O motivo continua legível, então o interruptor segue ligado. Use Cas9 selvagem com NHEJ e um guia cujo corte caia sobre o motivo — molde e editores de base não ajudam aqui.',
          'The motif is still readable, so the switch stays on. Use wild-type Cas9 with NHEJ and a guide whose cut lands on the motif — a template and base editors do not help here.',
        )
      : t(
          'A proteína continua a do alelo doente: nenhuma edição chegou ao alvo. Escolha um sítio cujo corte caia perto dele e use molde (HDR) ou prime editing.',
          'The protein is still the disease allele: no edit reached the target. Pick a site whose cut lands near it and use a template (HDR) or prime editing.',
        ),
    broken: t(
      'A proteína saiu diferente das duas: o reparo apagou ou somou bases e desalinhou o quadro de leitura. Isso desliga o gene, não conserta a sequência errada — para isso é preciso molde (HDR) ou prime editing.',
      'The protein matches neither: repair deleted or added bases and shifted the reading frame. That switches the gene off, it does not fix the wrong sequence — that needs a template (HDR) or prime editing.',
    ),
  }[verdict]

  const row = (label: string, seq: string, cls: string, reference: string) => (
    <div className="flex items-baseline gap-2">
      <span className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-mist/70">{label}</span>
      <span className="font-mono text-xs tracking-widest">
        {[...seq.slice(0, 16)].map((a, i) => (
          <span key={i} className={a !== reference[i] ? 'bg-red-500/50 text-white' : cls} title={NAMES3[a] ?? a}>
            {a}
          </span>
        ))}
        {seq.length > 16 && <span className="text-mist/50">…</span>}
      </span>
    </div>
  )

  return (
    <div className={`space-y-3 rounded-xl border p-3 ${tone}`} role="status">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <b className="font-display text-lg text-white">{head}</b>
        <span className="font-mono text-[11px] text-mist">{t.pick(dis.name)}</span>
      </div>
      {proteins?.healthy && (
        <div className="space-y-1">
          {row(t('saudável', 'healthy'), proteins.healthy, 'text-bio', proteins.healthy)}
          {row(t('doente', 'disease'), proteins.before, 'text-mist/70', proteins.healthy)}
          {row(t('editado', 'edited'), proteins.after, 'text-white', proteins.healthy)}
        </div>
      )}
      {effect && (
        <div className="flex items-center gap-2">
          <span className="hud-label">{t('Efeito', 'Effect')}</span>
          <EffectChip effect={effect} />
        </div>
      )}
      <p className="text-xs leading-relaxed text-white/85">{say}</p>
      {verdict === 'success' && !disrupt && (
        <p className="text-[11px] leading-relaxed text-mist/80">
          {t(
            'Num projeto real o molde também traria uma mutação silenciosa no PAM, para a Cas9 não voltar a cortar o alelo já corrigido.',
            'In a real design the template would also carry a silent PAM mutation, so Cas9 does not cut the corrected allele again.',
          )}
        </p>
      )}
    </div>
  )
}

const OUTCOME_COLOR: Record<AlleleOutcome, string> = {
  intended: '#7dff9b',
  indel: '#ff4fa3',
  unedited: '#3b4659',
}

/** Mapa de alelos: cada ponto é um alelo, desenhado em canvas por serem mil de uma vez. */
function AlleleMap({ pop }: { pop: Population }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const cols = 40
  const rows = Math.ceil(pop.alleles / cols)
  useEffect(() => {
    const ctx = ref.current?.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, cols, rows)
    pop.outcomes.forEach((kind, i) => {
      ctx.fillStyle = OUTCOME_COLOR[kind]
      ctx.fillRect(i % cols, Math.floor(i / cols), 1, 1)
    })
  }, [pop, rows])
  return (
    <canvas
      ref={ref}
      width={cols}
      height={rows}
      aria-hidden="true"
      className="w-full rounded-lg bg-white/5 [image-rendering:pixelated]"
      style={{ aspectRatio: `${cols} / ${rows}` }}
    />
  )
}

/** A mesma simulação em mil alelos (500 células diploides), como um sequenciamento do amplicon. */
function PopulationView() {
  const t = useT()
  const d = useDerived()
  const [round, setRound] = useState(1)
  const pop = useMemo(() => d.population?.(round), [d, round])
  if (!pop) return null

  const share = (n: number) => pct(n / pop.alleles)
  const peak = Math.max(...pop.spectrum.map((s) => s.alleles), 1)
  const legend: [AlleleOutcome, string][] = [
    ['intended', t('objetivo alcançado', 'goal reached')],
    ['indel', t('editado, sem alcançar', 'edited, goal missed')],
    ['unedited', t('intacto', 'untouched')],
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="hud-label">{t('Mil alelos, uma rodada', 'A thousand alleles, one run')}</h3>
        <button type="button" onClick={() => setRound((r) => r + 1)} className="text-[11px] text-mist underline hover:text-white">
          {t('sequenciar de novo', 'sequence again')}
        </button>
      </div>

      <AlleleMap pop={pop} />
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-mist/80">
        {legend.map(([kind, label]) => (
          <span key={kind}>
            <i className="mr-1 inline-block h-2 w-2 rounded-sm align-middle" style={{ background: OUTCOME_COLOR[kind] }} />
            {label}: <b className="text-white">{share(pop.tally[kind])}</b>
          </span>
        ))}
      </div>

      {pop.spectrum.length > 0 && (
        <div>
          <div className="hud-label">{t('Espectro de indels', 'Indel spectrum')}</div>
          <div className="mt-1 flex items-end gap-px" aria-hidden="true">
            {pop.spectrum.map((s) => (
              <div key={s.net} className="flex-1" title={`${s.net > 0 ? '+' : ''}${s.net} nt · ${s.alleles}`}>
                <div className="rounded-sm bg-dna/70" style={{ height: `${8 + (40 * s.alleles) / peak}px` }} />
                <div className="mt-0.5 text-center font-mono text-[9px] text-mist/60">{s.net > 0 ? `+${s.net}` : s.net}</div>
              </div>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-mist/70">
            {t(
              'Saldo de bases por alelo editado — é o que um sequenciamento do amplicon mostraria (ex.: CRISPResso).',
              'Net bases per edited allele — what amplicon sequencing would show (e.g. CRISPResso).',
            )}
          </p>
        </div>
      )}

      <div className="rounded-xl bg-white/5 p-3">
        <div className="hud-label">{t('Células diploides', 'Diploid cells')}</div>
        <p className="mt-1 text-xs leading-relaxed text-white/85">
          {t(
            `Dos ${pop.alleles / 2} núcleos simulados, ${pct(pop.cells.both / (pop.alleles / 2))} ficaram com os dois alelos resolvidos, ${pct(pop.cells.one / (pop.alleles / 2))} com apenas um e ${pct(pop.cells.none / (pop.alleles / 2))} com nenhum.`,
            `Of the ${pop.alleles / 2} simulated nuclei, ${pct(pop.cells.both / (pop.alleles / 2))} ended with both alleles resolved, ${pct(pop.cells.one / (pop.alleles / 2))} with only one and ${pct(pop.cells.none / (pop.alleles / 2))} with none.`,
          )}{' '}
          {d.dis?.goal === 'fix'
            ? t(
                'Numa doença recessiva, um só alelo corrigido já costuma bastar para a célula funcionar.',
                'In a recessive disease, a single corrected allele is usually enough for the cell to work.',
              )
            : t(
                'Para elevar a hemoglobina fetal não é preciso acertar todas as células: uma fração das células-tronco já muda o quadro clínico.',
                'Raising fetal haemoglobin does not require hitting every cell: a fraction of the stem cells already changes the clinical picture.',
              )}
        </p>
      </div>
    </div>
  )
}

/** Sem PAM não há sítio, e sem sítio não há experimento: dito igual na aba Guia e na Resultado. */
function NoPam() {
  const t = useT()
  const pam = useSim((s) => NUCLEASE[s.nuclease].pam.seq)
  return (
    <p className="text-sm text-red-300">
      {t(
        `Nenhum PAM ${pam} neste locus. Troque de nuclease (em Parâmetros) ou edite a sequência.`,
        `No ${pam} PAM in this locus. Switch nuclease (in Parameters) or edit the sequence.`,
      )}
    </p>
  )
}

export function ResultPanel() {
  const t = useT()
  const d = useDerived()
  if (!d.cand) return <NoPam />
  const risky = d.offs!.some((o) => o.p > 0.2)
  return (
    <div className="space-y-4">
      {d.dis && d.verdict && <Verdict dis={d.dis} verdict={d.verdict} proteins={d.proteins} effect={d.effect} />}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 p-3">
          <div className="hud-label">{t('Eficiência simulada', 'Simulated efficiency')}</div>
          <div className="font-display text-3xl text-bio">{pct(d.eff!)}</div>
        </div>
        <div className="rounded-xl bg-white/5 p-3">
          <div className="hud-label">{t('Corte no alvo', 'On-target cut')}</div>
          <div className="font-display text-3xl text-dna">{pct(d.pOn!)}</div>
        </div>
      </div>
      <p className="text-sm text-white/90">{d.kind}</p>
      <div>
        <div className="hud-label">Off-targets</div>
        {d.offs!.map((o) => (
          <div key={o.label.pt} className="mt-2">
            <div className="flex justify-between text-xs">
              <span className="text-mist">{t.pick(o.label)}</span>
              <b className={o.p > 0.2 ? 'text-cas' : 'text-mist'}>{pct(o.p)}</b>
            </div>
            <div className="mt-1 h-1.5 rounded bg-white/10">
              <div className="h-full rounded bg-cas transition-all" style={{ width: pct(o.p) }} />
            </div>
            <div className="mt-0.5 font-mono text-[10px] tracking-wider text-mist/60">
              {[...o.site].map((b, i) => (
                <span key={i} className={b !== d.cand!.protospacer[i] ? 'text-cas' : ''}>
                  {b}
                </span>
              ))}
              {o.pam}
            </div>
          </div>
        ))}
        {risky && (
          <p className="mt-3 rounded-lg border border-cas/40 bg-cas/10 p-2 text-xs text-white" role="alert">
            ⚠{' '}
            {t(
              'Risco relevante de corte off-target. Em laboratório: redesenhar o guia, usar Cas de alta fidelidade/RNP e sequenciar os sítios preditos.',
              'Relevant off-target risk. In the lab: redesign the guide, use a high-fidelity Cas/RNP and sequence the predicted sites.',
            )}
          </p>
        )}
      </div>
      <PopulationView />
      <p className="text-[11px] text-mist/60">
        {t(
          'Todos os números são ilustrativos (modelo logístico simples), não previsões experimentais.',
          'All numbers are illustrative (simple logistic model), not experimental predictions.',
        )}
      </p>
    </div>
  )
}
