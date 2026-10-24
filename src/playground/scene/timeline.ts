// Estado visual da simulação: tudo é função pura de (parâmetros, etapa, progresso),
// então voltar/avançar etapas sempre reproduz a mesma cena.
import * as THREE from 'three'
import { isBaseEditor } from '../../lib/dna'
import { useSim, type useDerived } from '../store'

// ---------- geometria do B-DNA estilizado ----------
export const RISE = 0.34 // nm por par de bases (escala da cena)
export const RADIUS = 1
export const TWIST = (2 * Math.PI) / 10.5 // ~10,5 pb por volta
/** Defasagem entre as fitas (≠ 180°): é o que cria os sulcos maior e menor. */
export const GROOVE = Math.PI * 0.78
/** Afastamento máximo das pontas após a quebra de fita dupla. */
export const GAP = 1.5
/** Dobra do DNA induzida pela Cas9 no PAM (~25°). */
export const BEND = 0.44
/** Capacidade dos buffers: locus máximo + inserção de HDR + folga. */
export const MAXN = 176

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t) }
/** 0 antes da etapa, 1 depois, rampa suave dentro dela. */
export const phase = (step: number, p: number, at: number, a = 0, b = 1) => (step > at ? 1 : step < at ? 0 : smooth(a, b, p))
/** Sobe em [a,b], desce em [c,e]. */
export const bump = (p: number, a: number, b: number, c: number, e: number) => smooth(a, b, p) * (1 - smooth(c, e, p))
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

type Derived = ReturnType<typeof useDerived>
export type Ready = Extract<Derived, { cand: object }>

// ---------- trajetória de busca da Cas9 (etapa 2) ----------
interface CasPath { idx: number; hop: number; probe: number; probeAmt: number }

/** Difusão 3D + interrogação de PAMs: visita até 2 PAMs "isca" vizinhos antes do alvo. */
function casPath(d: Ready, u: number, n: number): CasPath {
  const cands = d.candidates
  const sel = cands.indexOf(d.cand)
  const decoys = cands.map((_, i) => i).filter((i) => i !== sel)
    .sort((a, b) => Math.abs(cands[a].start - d.cand.start) - Math.abs(cands[b].start - d.cand.start))
    .slice(0, 2).sort((a, b) => cands[a].start - cands[b].start)
  const stops = [...decoys, sel]
  const center = (ci: number) => cands[ci].start + 11
  // segmentos: [viagem, pausa] por parada; o alvo não tem pausa (o R-loop vem depois)
  const segs: { kind: 'travel' | 'dwell'; from: number; to: number; w: number; ci: number; entry?: boolean }[] = []
  let at = -9
  stops.forEach((ci, k) => {
    segs.push({ kind: 'travel', from: at, to: center(ci), w: k === 0 ? 1.3 : 1, ci, entry: k === 0 })
    if (ci !== sel) segs.push({ kind: 'dwell', from: center(ci), to: center(ci), w: 0.75, ci })
    at = center(ci)
  })
  const W = segs.reduce((a, s) => a + s.w, 0)
  let x = clamp01(u) * W
  for (const s of segs) {
    if (x <= s.w || s === segs[segs.length - 1]) {
      const t = clamp01(x / s.w)
      if (s.kind === 'dwell') return { idx: s.from, hop: 0, probe: s.ci, probeAmt: Math.sin(t * Math.PI) }
      const e = easeInOut(t)
      return { idx: THREE.MathUtils.lerp(s.from, s.to, e), hop: s.entry ? 6 * (1 - e) ** 2 : Math.sin(t * Math.PI) * 1.8, probe: -1, probeAmt: 0 }
    }
    x -= s.w
  }
  return { idx: n / 2, hop: 0, probe: -1, probeAmt: 0 }
}

// ---------- estado visual derivado ----------
export function visual(d: Ready, step: number, p: number) {
  const { cas, repair } = useSim.getState()
  const acts = !!d.acts
  const dsb = d.cuts === 'dsb'
  const nick = d.cuts === 'nick'
  const be = isBaseEditor(cas) && acts
  const hdr = dsb && repair === 'hdr'
  const nhej = dsb && repair === 'nhej'
  const s4 = step === 4
  const n = d.applied.seq.length
  return {
    step, p, acts, dsb, nick, be, hdr, nhej,
    edited: step > 4 || (s4 && p > 0.55),
    design: step === 0 ? 1 : 0,
    // R-loop completo com guia bom; com mismatches demais ele abre um pouco e colapsa
    rloop: acts
      ? phase(step, p, 2, 0.62, 1) * (1 - phase(step, p, 4, 0.2, 0.6))
      : step === 2 ? 0.38 * bump(p, 0.62, 0.78, 0.86, 1) : 0,
    casIn: phase(step, p, 2, 0, 0.1),
    casLeave: phase(step, p, 4, 0, 0.4),
    search: step === 2 ? smooth(0, 0.6, p) : step > 2 ? 1 : 0,
    /** HNH girando até a fita-alvo: o "checkpoint" conformacional antes do corte. */
    hnh: dsb || nick ? phase(step, p, 3, 0, 0.3) : 0,
    flash: step === 3 && (dsb || nick) ? Math.max(0, 1 - Math.abs(p - 0.34) * 5) : 0,
    sparks: step === 3 && (dsb || nick) ? clamp01((p - 0.3) / 0.5) : 0,
    gap: dsb ? GAP * phase(step, p, 3, 0.32, 0.7) * (1 - phase(step, p, 4, 0.18, 0.55)) : 0,
    nickCut: nick ? phase(step, p, 3, 0.3, 0.45) * (1 - phase(step, p, 4, 0.35, 0.6)) : 0,
    /** Editor de bases: C→U durante a "clivagem", fixado como T no reparo. */
    deam: be ? phase(step, p, 3, 0.15, 0.75) : 0,
    donor: hdr && s4 ? bump(p, 0, 0.38, 0.62, 0.88) : 0,
    invade: hdr && s4 ? bump(p, 0.34, 0.46, 0.56, 0.66) : 0,
    kuIn: nhej && s4 ? smooth(0, 0.2, p) : 0,
    kuOut: nhej && s4 ? smooth(0.68, 0.95, p) : 0,
    ligase: (dsb || nick) && s4 ? bump(p, 0.36, 0.5, 0.6, 0.78) : 0,
    shrinkDel: s4 ? smooth(0.3, 0.55, p) : step > 4 ? 1 : 0,
    growIns: s4 ? smooth(0.55, 0.85, p) : step > 4 ? 1 : 0,
    path: casPath(d, step === 2 ? smooth(0, 0.6, p) : step > 2 ? 1 : 0, n),
    n,
    cand: d.cand,
  }
}
export type Visual = ReturnType<typeof visual>

// ---------- layout geométrico (linha central, fitas, R-loop, RNA) ----------
const v3 = () => Array.from({ length: MAXN }, () => new THREE.Vector3())
export interface Layout {
  n: number
  seq: string
  s: Float32Array
  theta: Float32Array
  center: THREE.Vector3[]
  p1: THREE.Vector3[]
  p2: THREE.Vector3[]
  /** Posição helicoidal "intocada" da fita 1 (onde o RNA pareia no R-loop). */
  h1: THREE.Vector3[]
  open: Float32Array
  rna: THREE.Vector3[]
  /** Base deletada pelo reparo (coordenadas originais). */
  deleted: Uint8Array
  changed: boolean[] | null
}
const L: Layout = {
  n: 0, seq: '', s: new Float32Array(MAXN), theta: new Float32Array(MAXN), center: v3(), p1: v3(), p2: v3(), h1: v3(),
  open: new Float32Array(MAXN), rna: Array.from({ length: 20 }, () => new THREE.Vector3()), deleted: new Uint8Array(MAXN), changed: null,
}

const _N = new THREE.Vector3(), _Z = new THREE.Vector3(0, 0, 1), _D = new THREE.Vector3(), _T = new THREE.Vector3()

/** Normal (lado do lóbulo REC) e tangente da linha central num ângulo θ. */
export const normalAt = (theta: number, out: THREE.Vector3) => out.set(-Math.sin(theta), Math.cos(theta), 0)
export const tangentAt = (theta: number, out: THREE.Vector3) => out.set(Math.cos(theta), Math.sin(theta), 0)

/** Ponto da linha central num índice fracionário (extrapola nas pontas). Retorna θ. */
export function centerAt(lay: Layout, i: number, out: THREE.Vector3): number {
  const n = lay.n
  if (i <= 0) { const th = lay.theta[0]; out.copy(lay.center[0]).addScaledVector(tangentAt(th, _T), i * RISE); return th }
  if (i >= n - 1) { const th = lay.theta[n - 1]; out.copy(lay.center[n - 1]).addScaledVector(tangentAt(th, _T), (i - n + 1) * RISE); return th }
  const k = Math.floor(i), f = i - k
  out.lerpVectors(lay.center[k], lay.center[k + 1], f)
  return THREE.MathUtils.lerp(lay.theta[k], lay.theta[k + 1], f)
}

function compute(d: Ready, v: Visual, locus: string): Layout {
  const c = v.cand
  const seq = v.edited ? d.applied.seq : locus
  const n = seq.length
  L.n = n
  L.seq = seq
  L.changed = v.edited ? d.applied.changed : null
  // arco ao longo do eixo, com o afastamento das pontas no corte
  for (let i = 0; i < n; i++) L.s[i] = (i - (n - 1) / 2) * RISE + (v.edited ? 0 : (i >= c.cut ? v.gap / 2 : -v.gap / 2))
  // dobra no PAM proporcional ao R-loop; integra a linha central a partir do meio do alvo
  const beta = v.edited ? 0 : BEND * v.rloop
  const sP = v.edited ? 0 : L.s[Math.min(n - 1, c.start + 20)]
  for (let i = 0; i < n; i++) L.theta[i] = beta * smooth(-1.4, 1.4, L.s[i] - sP)
  const a = v.edited ? Math.floor(n / 2) : Math.min(n - 1, c.start + 10)
  L.center[a].set(L.s[a], 0, 0)
  for (let i = a + 1; i < n; i++) {
    const th = (L.theta[i] + L.theta[i - 1]) / 2, ds = L.s[i] - L.s[i - 1]
    L.center[i].set(L.center[i - 1].x + ds * Math.cos(th), L.center[i - 1].y + ds * Math.sin(th), 0)
  }
  for (let i = a - 1; i >= 0; i--) {
    const th = (L.theta[i] + L.theta[i + 1]) / 2, ds = L.s[i + 1] - L.s[i]
    L.center[i].set(L.center[i + 1].x - ds * Math.cos(th), L.center[i + 1].y - ds * Math.sin(th), 0)
  }

  // deleções do NHEJ (em coordenadas originais), para encolher antes da troca de sequência
  L.deleted.fill(0)
  if (!v.edited) for (const op of d.ops) for (let k = op.pos; k < op.pos + op.del; k++) L.deleted[k] = 1

  for (let i = 0; i < n; i++) {
    const th = L.theta[i]
    normalAt(th, _N)
    const phi = i * TWIST
    const cc = L.center[i]
    L.h1[i].copy(cc).addScaledVector(_N, RADIUS * Math.cos(phi)).addScaledVector(_Z, RADIUS * Math.sin(phi))
    L.p2[i].copy(cc).addScaledVector(_N, RADIUS * Math.cos(phi + GROOVE)).addScaledVector(_Z, RADIUS * Math.sin(phi + GROOVE))
    // R-loop: a fita não-alvo é deslocada num arco para a frente; abre do PAM para a ponta distal
    const j = i - c.start
    const inT = !v.edited && j >= 0 && j < 20
    const o = inT ? smooth(((19 - j) / 20) * 0.7, ((19 - j) / 20) * 0.7 + 0.3, v.rloop) : 0
    L.open[i] = o
    if (o > 0) {
      const bubble = Math.sin(((j + 0.5) / 20) * Math.PI) ** 0.6
      _D.copy(_N).addScaledVector(_Z, 0.55).normalize()
      const disp = _T.copy(cc).addScaledVector(_D, RADIUS + 1.7 * bubble)
      L.p1[i].lerpVectors(L.h1[i], disp, o)
    } else L.p1[i].copy(L.h1[i])
  }
  return L
}

let cache: { d: Ready | null; step: number; p: number; locus: string; v: Visual | null } = { d: null, step: -1, p: -1, locus: '', v: null }

/** Estado do quadro atual (memoizado: vários componentes leem no mesmo frame). */
export function frame(d: Ready): { v: Visual; L: Layout } {
  const { step, progress, locus } = useSim.getState()
  if (cache.d !== d || cache.step !== step || cache.p !== progress || cache.locus !== locus || !cache.v) {
    const v = visual(d, step, progress)
    compute(d, v, locus)
    cache = { d, step, p: progress, locus, v }
  }
  return { v: cache.v!, L }
}

// ---------- posição da Cas9 e do RNA ----------
const _C = new THREE.Vector3()
export interface CasPose { pos: THREE.Vector3; theta: number; visible: boolean; scale: number }
const pose: CasPose = { pos: new THREE.Vector3(), theta: 0, visible: false, scale: 0 }

export function casPose(v: Visual, lay: Layout): CasPose {
  const { idx, hop } = v.path
  const th = centerAt(lay, idx, pose.pos)
  normalAt(th, _N)
  pose.pos.addScaledVector(_N, hop + v.casLeave * 8)
  pose.theta = th
  pose.scale = v.casIn * (1 - v.casLeave * 0.3)
  pose.visible = v.casIn > 0.01 && v.casLeave < 0.999 && !v.edited
  return pose
}

/** Espaçador do sgRNA: desenhado acima do alvo (etapa 0), guardado na Cas9 ou pareado no R-loop. */
export function rnaLayout(v: Visual, lay: Layout): boolean {
  const c = v.cand
  if (v.edited || v.step === 1) return false
  if (v.step === 0) {
    for (let j = 0; j < 20; j++) {
      const i = c.start + j
      normalAt(lay.theta[i], _N)
      lay.rna[j].copy(lay.center[i]).addScaledVector(_N, 3.1).addScaledVector(_Z, 0.4)
    }
    return true
  }
  const cp = casPose(v, lay)
  if (!cp.visible) return false
  tangentAt(cp.theta, _T)
  normalAt(cp.theta, _N)
  for (let j = 0; j < 20; j++) {
    const i = c.start + j
    _C.copy(cp.pos).addScaledVector(_T, (j - 11) * RISE).addScaledVector(_N, 1.9).addScaledVector(_Z, -0.2)
    // pareado: no lugar da fita não-alvo, levemente para dentro (heterodúplex)
    _D.copy(lay.h1[i]).lerp(lay.center[i], 0.08)
    lay.rna[j].lerpVectors(_C, _D, lay.open[i])
  }
  return true
}

/** Alvo do foco (câmera e profundidade de campo), escrito pelo CameraRig. */
export const focus = new THREE.Vector3()
