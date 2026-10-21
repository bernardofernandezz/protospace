import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { CAS, DELIVERY, MAX_LOCUS, clean, diffSegments, isSeed, mismatches, type CasType, type Delivery, type Repair } from '../lib/dna'
import { hasWebGL, useInView } from '../lib/hooks'
import { STEPS, STEP_SECONDS, useDerived, useSim } from './store'
import { BASE_COLOR } from './colors'

const Scene = lazy(() => import('./Scene'))

const pct = (x: number) => `${Math.round(x * 100)}%`
const NEXT_BASE: Record<string, string> = { A: 'C', C: 'G', G: 'T', T: 'A' }

/** Legenda curta por etapa — pensada para ser lida em voz alta no modo Apresentação. */
function narration(step: number, cas: CasType, delivery: Delivery, repair: Repair, acts: boolean): string {
  switch (step) {
    case 0: return 'Escolhemos um protoespaçador de 20 nt imediatamente a 5′ de um PAM NGG. O espaçador do sgRNA tem a mesma sequência (com U no lugar de T).'
    case 1: return `Entrega por ${DELIVERY[delivery].name}. ${DELIVERY[delivery].note}`
    case 2: return acts
      ? 'A Cas9 varre o DNA checando PAMs. Ao reconhecer NGG, testa o pareamento a partir da região seed; havendo complementaridade, a dupla-fita se abre e forma o R-loop.'
      : 'A Cas9 encontra o PAM, mas os mismatches impedem um pareamento estável: o R-loop não se completa.'
    case 3:
      if (!acts) return 'Sem pareamento suficiente, os domínios nucleásicos não são ativados: não há corte.'
      if (cas === 'be') return 'Editor de bases: em vez de cortar as duas fitas, a desaminase converte C em U na janela de edição (depois lido como T).'
      if (cas === 'nickase') return 'Nickase D10A: só o domínio HNH está ativo, então apenas a fita-alvo é cortada (nick), sem quebra de fita dupla.'
      return 'HNH e RuvC clivam as duas fitas 3 pb a montante do PAM: quebra de fita dupla (DSB), com extremidades predominantemente cegas.'
    case 4:
      if (!acts) return 'Nada para reparar: a sequência permanece intacta.'
      if (cas === 'be') return 'O reparo/replicação fixa a mudança: C•G vira T•A. Não há molde doador nem DSB.'
      if (cas === 'nickase') return 'Nicks isolados costumam ser reparados com fidelidade. Por isso nickases são usadas em pares (guias em fitas opostas) para gerar DSB com mais especificidade.'
      return repair === 'hdr'
        ? 'HDR: um molde com braços de homologia é copiado para o sítio. É menos eficiente e ocorre sobretudo nas fases S/G2 do ciclo celular.'
        : 'NHEJ: as pontas são religadas diretamente, muitas vezes com pequenas inserções ou deleções (indels). Predomina na maioria das células.'
    default: return 'Resultado: compare a sequência original com a editada, veja a eficiência simulada e o risco de off-target. Em laboratório, tudo isso precisa ser validado por sequenciamento.'
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
}

function Seg({ children, on, cls, onClick }: { children: React.ReactNode; on: boolean; cls: string; onClick: () => void }) {
  return <button type="button" aria-pressed={on} onClick={onClick} className={`rounded-lg px-3 py-1.5 text-sm transition ${on ? cls : 'bg-white/5 text-mist hover:bg-white/10'}`}>{children}</button>
}

function SequenceView() {
  const d = useDerived()
  const locus = useSim((s) => s.locus)
  const step = useSim((s) => s.step)
  const edited = useSim((s) => s.step > 4 || (s.step === 4 && s.progress > 0.55))
  if (!d.cand) return null
  const c = d.cand
  return (
    <div className="font-mono text-[13px] leading-7 tracking-wider break-all">
      <div className="mb-1 text-[11px] uppercase tracking-[0.2em] text-mist/70">5′ → 3′ · fita senso {edited && '· diff (original → editado)'}</div>
      {!edited ? (
        <p aria-label="Sequência do locus">
          {[...locus].map((b, i) => {
            const j = i - c.start
            const cls = j >= 0 && j < 20 ? 'text-dna bg-dna/10' : j >= 20 && j < 23 ? 'text-white bg-cas/60' : 'text-mist/60'
            return (
              <span key={i} className={cls}>
                {i === c.cut && step >= 3 && d.cuts !== 'none' && <span className="mx-px font-bold text-white" aria-label="corte">|</span>}
                {b}
              </span>
            )
          })}
        </p>
      ) : (
        <p aria-label="Diferença entre sequência original e editada">
          {diffSegments(locus, d.ops!).map((g, i) => (
            <span key={i} className={{ same: 'text-mist/60', del: 'bg-red-500/30 text-red-300 line-through', ins: 'bg-bio/25 text-bio', sub: 'bg-rna/30 text-rna' }[g.type]} title={{ same: '', del: 'deletado', ins: 'inserido', sub: 'substituído' }[g.type]}>
              {g.text}
            </span>
          ))}
        </p>
      )}
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-sans text-xs text-mist/80">
        <span><i className="mr-1 inline-block h-2 w-2 bg-dna" />protoespaçador</span>
        <span><i className="mr-1 inline-block h-2 w-2 bg-cas" />PAM</span>
        <span><i className="mr-1 inline-block h-2 w-2 bg-red-400" />deleção</span>
        <span><i className="mr-1 inline-block h-2 w-2 bg-bio" />inserção</span>
        <span><i className="mr-1 inline-block h-2 w-2 bg-rna" />substituição</span>
        {Object.entries(BASE_COLOR).map(([b, col]) => <span key={b}><i className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: col }} />{b} (3D)</span>)}
      </div>
    </div>
  )
}

function GuidePanel() {
  const d = useDerived()
  const s = useSim(useShallow((s) => ({ locus: s.locus, selected: s.selected, guide: s.guide, set: s.set, select: s.select, setLocus: s.setLocus })))
  const [typed, setTyped] = useState('')
  const [msg, setMsg] = useState('')
  const [locusDraft, setLocusDraft] = useState(s.locus)
  if (!d.cand) return <p className="text-sm text-red-300">Nenhum PAM NGG encontrado no locus. Edite a sequência.</p>
  const mm = mismatches(s.guide, d.cand.protospacer)

  const findTyped = () => {
    const g = clean(typed)
    if (g.length !== 20) return setMsg('O guia precisa ter exatamente 20 nt (A, C, G, T).')
    const i = d.candidates.findIndex((c) => c.protospacer === g)
    if (i >= 0) { s.select(i); setMsg('Sítio encontrado, com PAM NGG adjacente.') }
    else setMsg(s.locus.includes(g) ? 'Sequência presente, mas sem PAM NGG adjacente: a SpCas9 não cortaria aqui.' : 'Sequência não encontrada neste locus (fita senso).')
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="hud-label">Sítios candidatos (PAM NGG, fita senso)</h4>
        <ul className="mt-2 max-h-44 space-y-1 overflow-auto pr-1" role="radiogroup" aria-label="Sítios candidatos">
          {d.candidates.map((c, i) => (
            <li key={c.start}>
              <button type="button" role="radio" aria-checked={i === s.selected} onClick={() => s.select(i)}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left font-mono text-xs transition ${i === s.selected ? 'bg-dna/15 ring-1 ring-dna/60' : 'hover:bg-white/5'}`}>
                <span className="truncate"><span className="text-dna">{c.protospacer}</span><span className="text-cas">{c.pam}</span></span>
                <span className="shrink-0 text-mist">GC {pct(c.gc)} · <b className="text-white">{c.score}</b></span>
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-1 text-[11px] text-mist/70">Score <em>ilustrativo</em> (GC, poli-T, homopolímeros). Em projetos reais use ferramentas como CRISPOR ou CHOPCHOP.</p>
      </div>

      <div>
        <h4 className="hud-label">Guia (clique numa base para criar mismatch)</h4>
        <div className="mt-2 flex flex-wrap gap-[3px]" role="group" aria-label="Bases do guia">
          {[...s.guide].map((b, i) => {
            const isMm = mm.includes(i)
            return (
              <button key={i} type="button" aria-label={`Posição ${i + 1}: ${b}${isMm ? ', mismatch' : ''}`}
                onClick={() => s.set({ guide: s.guide.slice(0, i) + NEXT_BASE[b] + s.guide.slice(i + 1) })}
                className={`h-7 w-[22px] rounded font-mono text-xs font-semibold transition ${isMm ? 'bg-red-500/80 text-white' : 'bg-white/5 hover:bg-white/15'} ${isSeed(i) ? 'border-b-2 border-rna/70' : ''}`}
                style={{ color: isMm ? undefined : BASE_COLOR[b] }}>{b}</button>
            )
          })}
          <span className="ml-1 self-center font-mono text-xs text-cas">{d.cand.pam}</span>
        </div>
        <div className="mt-1 flex justify-between text-[11px] text-mist/70">
          <span>5′ distal · <span className="text-rna">sublinhado = seed (12 nt)</span></span>
          <button type="button" className="underline hover:text-white" onClick={() => s.set({ guide: d.cand!.protospacer })}>limpar mismatches</button>
        </div>
      </div>

      <div>
        <label className="hud-label" htmlFor="typed">Ou digite um guia de 20 nt</label>
        <div className="mt-2 flex gap-2">
          <input id="typed" value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && findTyped()} maxLength={30} placeholder="ex.: TGACCATGTCGACGTTCCAG"
            className="min-w-0 flex-1 rounded-lg bg-white/5 px-2 py-1.5 font-mono text-xs uppercase outline-none ring-1 ring-white/10 focus:ring-dna" />
          <button type="button" onClick={findTyped} className="rounded-lg bg-dna/20 px-3 text-xs text-dna hover:bg-dna/30">Buscar</button>
        </div>
        {msg && <p className="mt-1 text-[11px] text-mist" role="status">{msg}</p>}
      </div>

      <details className="text-xs">
        <summary className="cursor-pointer text-mist hover:text-white">Editar a sequência do locus (fictícia)</summary>
        <textarea value={locusDraft} onChange={(e) => setLocusDraft(e.target.value)} rows={4} aria-label="Sequência do locus"
          className="mt-2 w-full rounded-lg bg-white/5 p-2 font-mono text-[11px] uppercase outline-none ring-1 ring-white/10 focus:ring-dna" />
        <button type="button" className="mt-1 rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20"
          onClick={() => { const l = clean(locusDraft).slice(0, MAX_LOCUS); setLocusDraft(l); s.setLocus(l) }}>Aplicar (máx. {MAX_LOCUS} nt)</button>
      </details>
    </div>
  )
}

function ParamsPanel() {
  const s = useSim(useShallow((s) => ({ cas: s.cas, delivery: s.delivery, repair: s.repair, tolerance: s.tolerance, speed: s.speed, set: s.set, seed: s.seed })))
  const repairOff = s.cas !== 'wt'
  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="hud-label">Tipo de Cas</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(CAS) as CasType[]).map((k) => (
            <Seg key={k} onClick={() => s.set({ cas: k })} on={s.cas === k} cls="bg-cas/25 text-white ring-1 ring-cas/60">{CAS[k].name}</Seg>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="hud-label">Entrega</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {(Object.keys(DELIVERY) as Delivery[]).map((k) => (
            <Seg key={k} onClick={() => s.set({ delivery: k })} on={s.delivery === k} cls="bg-dna/20 text-white ring-1 ring-dna/60">{DELIVERY[k].name}</Seg>
          ))}
        </div>
        <p className="mt-1 text-[11px] text-mist/80">{DELIVERY[s.delivery].note}</p>
      </fieldset>
      <fieldset disabled={repairOff} className={repairOff ? 'opacity-40' : ''}>
        <legend className="hud-label">Via de reparo {repairOff && '(só com DSB)'}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          <Seg onClick={() => s.set({ repair: 'nhej' })} on={s.repair === 'nhej'} cls="bg-rna/25 text-white ring-1 ring-rna/60">NHEJ</Seg>
          <Seg onClick={() => s.set({ repair: 'hdr' })} on={s.repair === 'hdr'} cls="bg-bio/20 text-white ring-1 ring-bio/60">HDR + molde</Seg>
          {s.repair === 'nhej' && !repairOff && (
            <button type="button" className="rounded-lg px-2 text-xs text-mist underline hover:text-white" onClick={() => s.set({ seed: s.seed + 1 })}>sortear novo indel</button>
          )}
        </div>
      </fieldset>
      <div>
        <label htmlFor="tol" className="hud-label">Mismatches tolerados (modelo): <b className="text-white">{s.tolerance.toFixed(1)}</b></label>
        <input id="tol" type="range" min={0} max={3} step={0.5} value={s.tolerance} onChange={(e) => s.set({ tolerance: +e.target.value })} className="mt-2 w-full accent-cas" />
        <p className="text-[11px] text-mist/70">Valores baixos imitam variantes de alta fidelidade; altos, excesso de enzima ou exposição prolongada.</p>
      </div>
      <div>
        <span className="hud-label">Velocidade</span>
        <div className="mt-2 flex gap-2">
          {[0.5, 1, 2].map((v) => <Seg key={v} onClick={() => s.set({ speed: v })} on={s.speed === v} cls="bg-white/20 text-white">{v}×</Seg>)}
        </div>
      </div>
    </div>
  )
}

function ResultPanel() {
  const d = useDerived()
  if (!d.cand) return null
  const risky = d.offs!.some((o) => o.p > 0.2)
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/5 p-3"><div className="hud-label">Eficiência simulada</div><div className="font-display text-3xl text-bio">{pct(d.eff!)}</div></div>
        <div className="rounded-xl bg-white/5 p-3"><div className="hud-label">Corte no alvo</div><div className="font-display text-3xl text-dna">{pct(d.pOn!)}</div></div>
      </div>
      <p className="text-sm text-white/90">{d.kind}</p>
      <div>
        <div className="hud-label">Off-targets (modo off-target)</div>
        {d.offs!.map((o) => (
          <div key={o.label} className="mt-2">
            <div className="flex justify-between text-xs"><span className="text-mist">{o.label}</span><b className={o.p > 0.2 ? 'text-cas' : 'text-mist'}>{pct(o.p)}</b></div>
            <div className="mt-1 h-1.5 rounded bg-white/10"><div className="h-full rounded bg-cas transition-all" style={{ width: pct(o.p) }} /></div>
            <div className="mt-0.5 font-mono text-[10px] tracking-wider text-mist/60">
              {[...o.site].map((b, i) => <span key={i} className={b !== d.cand!.protospacer[i] ? 'text-cas' : ''}>{b}</span>)}{o.pam}
            </div>
          </div>
        ))}
        {risky && <p className="mt-3 rounded-lg border border-cas/40 bg-cas/10 p-2 text-xs text-white" role="alert">⚠ Risco relevante de corte off-target. Em laboratório: redesenhar o guia, usar Cas de alta fidelidade/RNP e sequenciar os sítios preditos.</p>}
      </div>
      <p className="text-[11px] text-mist/60">Todos os números são ilustrativos (modelo logístico simples), não previsões experimentais.</p>
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
  return (
    <div role="tooltip" className="glass pointer-events-none fixed z-[80] w-72 rounded-xl p-3 text-sm" style={{ left, top: tip.y + 16 }}>
      <div className="font-display font-semibold text-white">{tip.title}</div>
      <p className="mt-1 text-xs leading-relaxed text-mist">{tip.body}</p>
    </div>
  )
}

function Fallback() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <svg viewBox="0 0 120 60" className="w-48" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => <line key={i} x1={8 + i * 9.5} x2={8 + i * 9.5} y1={30 - 18 * Math.sin(i * 0.6)} y2={30 + 18 * Math.sin(i * 0.6)} stroke={['#3ee6a0', '#ff5c8a', '#4cc9ff', '#ffc24b'][i % 4]} strokeWidth="2" />)}
      </svg>
      <p className="font-display text-lg">WebGL indisponível neste navegador</p>
      <p className="max-w-md text-sm text-mist">A visualização 3D foi desativada, mas todo o experimento (guia, parâmetros, etapas, diff e análise) continua funcionando nos painéis.</p>
    </div>
  )
}

export default function Playground() {
  const wrap = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const inView = useInView(wrap)
  const [webgl] = useState(hasWebGL)
  const [tab, setTab] = useState<'guia' | 'params' | 'resultado'>('guia')
  const sim = useSim(useShallow((s) => ({ step: s.step, playing: s.playing, presentation: s.presentation, cas: s.cas, delivery: s.delivery, repair: s.repair })))
  const d = useDerived()
  const acts = !!d.acts

  const togglePlay = () => {
    const st = useSim.getState()
    if (st.playing) st.set({ playing: false })
    else if (st.progress >= 1) st.step < STEPS.length - 1 && st.goto(st.step + 1)
    else st.set({ playing: true })
  }
  const fullscreen = () => (document.fullscreenElement ? document.exitFullscreen() : stage.current?.requestFullscreen())

  // relógio da simulação: avança o progresso da etapa atual (pausado fora da viewport)
  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const st = useSim.getState()
      if (st.playing && (inView || st.presentation)) {
        const p = Math.min(1, st.progress + (dt * st.speed) / STEP_SECONDS[st.step])
        st.set({ progress: p, playing: p < 1 })
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView])

  useEffect(() => { if (sim.step === 5) setTab('resultado') }, [sim.step])

  // atalhos: ← → etapas, espaço play/pausa, R reset, C câmera, P apresentação, F tela cheia
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useSim.getState()
      if (!inView && !st.presentation) return
      if ((e.target as HTMLElement).closest('input, textarea, select')) return
      const k = e.key.toLowerCase()
      if (k === 'arrowright') st.goto(st.step + 1)
      else if (k === 'arrowleft') st.goto(st.step - 1)
      else if (k === ' ') { if ((e.target as HTMLElement).closest('button')) return; togglePlay() }
      else if (k === 'r') st.reset()
      else if (k === 'c') st.set({ camTick: st.camTick + 1 })
      else if (k === 'p') st.set({ presentation: !st.presentation })
      else if (k === 'f') fullscreen()
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [inView])

  const st = useSim.getState()
  const caption = narration(sim.step, sim.cas, sim.delivery, sim.repair, acts)

  return (
    <div ref={wrap} className="relative">
      <div ref={stage} className={`relative overflow-hidden rounded-3xl border border-white/10 bg-ink ${sim.presentation ? 'h-[88vh]' : 'h-[72vh] min-h-[520px]'} stage`}>
        {webgl ? (
          <Suspense fallback={<div className="grid h-full place-items-center text-mist">Carregando cena 3D…</div>}>
            <Scene active={inView} />
          </Suspense>
        ) : <Fallback />}

        {/* indicador de etapas */}
        <ol className="absolute left-3 right-3 top-3 flex flex-wrap gap-1.5 md:left-5 md:top-5" aria-label="Etapas do experimento">
          {STEPS.map((name, i) => (
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
        <div className={`pointer-events-none absolute left-1/2 w-[min(92%,900px)] -translate-x-1/2 text-center ${sim.presentation ? 'bottom-24' : 'bottom-20'}`} aria-live="polite">
          <p className={`inline rounded-xl bg-black/55 box-decoration-clone px-3 py-1 leading-relaxed text-white ${sim.presentation ? 'text-xl md:text-2xl' : 'text-sm md:text-base'}`}>{caption}</p>
        </div>

        {/* HUD de controle */}
        <div className="glass absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1 rounded-2xl p-1.5" role="toolbar" aria-label="Controles da simulação">
          <button type="button" className="hud-btn" onClick={() => st.goto(sim.step - 1)} aria-label="Etapa anterior" title="Etapa anterior (←)"><Icon d={ICONS.prev} /></button>
          <button type="button" className="hud-btn w-12 text-dna" onClick={togglePlay} aria-label={sim.playing ? 'Pausar' : 'Reproduzir'} title="Play/pausa (espaço)"><Icon d={sim.playing ? ICONS.pause : ICONS.play} /></button>
          <button type="button" className="hud-btn" onClick={() => st.goto(sim.step + 1)} aria-label="Próxima etapa" title="Próxima etapa (→)"><Icon d={ICONS.next} /></button>
          <span className="mx-1 h-6 w-px bg-white/15" />
          <button type="button" className="hud-btn" onClick={() => st.reset()} title="Resetar experimento (R)">↺ <span className="hidden sm:inline">Reset</span></button>
          <button type="button" className="hud-btn" onClick={() => st.set({ camTick: st.camTick + 1 })} title="Resetar câmera (C)">◎ <span className="hidden sm:inline">Câmera</span></button>
          <button type="button" className={`hud-btn ${sim.presentation ? 'text-rna' : ''}`} aria-pressed={sim.presentation} onClick={() => st.set({ presentation: !sim.presentation })} title="Modo apresentação (P)">▣ <span className="hidden sm:inline">Apresentação</span></button>
          <button type="button" className="hud-btn" onClick={fullscreen} title="Tela cheia (F)" aria-label="Tela cheia"><Icon d={ICONS.full} /></button>
        </div>

        <p className="absolute bottom-3 right-4 hidden max-w-[220px] text-right text-[10px] leading-tight text-mist/60 lg:block">Simulação didática simplificada; não representa um protocolo experimental real.</p>
        {sim.presentation && <p className="absolute right-4 top-14 hidden text-[11px] text-mist/70 md:block">← → etapas · espaço play/pausa · R reset · C câmera · F tela cheia · P sair</p>}
      </div>

      <p className="mt-2 text-center text-xs text-mist/70 lg:hidden">Simulação didática simplificada; não representa um protocolo experimental real.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px] lg:items-start">
        <div className="glass rounded-3xl p-5 md:p-6"><SequenceView /></div>
        <div className="glass rounded-3xl p-5 md:p-6">
          <div className="mb-4 flex gap-1 rounded-xl bg-white/5 p-1" role="tablist" aria-label="Painéis do experimento">
            {([['guia', 'Guia'], ['params', 'Parâmetros'], ['resultado', 'Resultado']] as const).map(([k, label]) => (
              <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
                className={`flex-1 rounded-lg py-1.5 text-sm transition ${tab === k ? 'bg-white/15 text-white' : 'text-mist hover:text-white'}`}>{label}</button>
            ))}
          </div>
          <div role="tabpanel">{tab === 'guia' ? <GuidePanel /> : tab === 'params' ? <ParamsPanel /> : <ResultPanel />}</div>
        </div>
      </div>
      <Tooltip />
    </div>
  )
}
