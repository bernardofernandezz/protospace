import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { BASE_COLOR, PALETTE } from '../playground/colors'
import { useT } from '../i18n'
import { prefersReducedMotion, useInView } from '../lib/hooks'
import { loadMotion } from '../lib/motion'

// Ilustração vetorial "2,5D" na mesma linguagem visual da cena 3D do playground: dupla-hélice
// em perspectiva (com profundidade), Cas9 orgânica e transições contínuas entre as etapas.
// Tudo é função de um parâmetro contínuo `v` (0…6) que é animado até a etapa ativa.

const W = 640, H = 400
const N = 28
const X0 = 30, DX = (W - 2 * X0) / (N - 1)
const CY = 214, A = 50
const TWIST = 0.62, GROOVE = 2.45
const T0 = 9, T1 = 18 // protoespaçador (estilizado)
const P0 = 19, P1 = 21 // PAM
const CUT = 15 // corte entre 15 e 16 (3 pb antes do PAM)
// 9 + 10 (alvo) + NGG + 6
const SEQ = 'ATGCGTACC' + 'TGACGTTCAG' + 'CGG' + 'ATCCAG'
const COMP: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' }
const PURINE = new Set(['A', 'G'])

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t) }
const bump = (x: number, a: number, b: number, c: number, d: number) => smooth(a, b, x) * (1 - smooth(c, d, x))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const xAt = (i: number) => X0 + i * DX
const XT = xAt((T0 + T1) / 2) // centro do alvo
const XCUT = (xAt(CUT) + xAt(CUT + 1)) / 2

/** Contorno orgânico fechado (Catmull-Rom → Bézier) com raio "respirando". */
function blob(cx: number, cy: number, rx: number, ry: number, seed: number, t: number, k = 10) {
  const pts = Array.from({ length: k }, (_, i) => {
    const a = (i / k) * Math.PI * 2
    const r = 1 + 0.07 * Math.sin(a * 3 + seed + t * 0.9) + 0.05 * Math.sin(a * 5 - seed * 1.7 + t * 0.6)
    return [cx + Math.cos(a) * rx * r, cy + Math.sin(a) * ry * r]
  })
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < k; i++) {
    const p0 = pts[(i - 1 + k) % k], p1 = pts[i], p2 = pts[(i + 1) % k], p3 = pts[(i + 2) % k]
    const c1x = p1[0] + (p2[0] - p0[0]) / 6, c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6, c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += `C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d + 'Z'
}

const smoothPath = (pts: [number, number][]) => {
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`
  }
  return d
}

type Item = { z: number; el: ReactNode }

/** Prefixo único por instância: várias cópias do diagrama na página não podem compartilhar IDs de SVG. */
const Uid = createContext('d')

/** Rótulo HTML com linha-guia (mesmo estilo dos rótulos 3D), posicionado em coordenadas do viewBox. */
function Tag({ x, y, on, tone, children }: { x: number; y: number; on: boolean; tone: string; children: ReactNode }) {
  return (
    <div className="label3d" data-on={on ? '1' : '0'} style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%`, ['--tone' as string]: tone }} aria-hidden="true">
      <span className="label3d-text">{children}</span>
      <span className="label3d-line" />
      <span className="label3d-dot" />
    </div>
  )
}

function Frame({ v, time }: { v: number; time: number }) {
  const t = useT()
  const uid = useContext(Uid)
  const I = (n: string) => `${n}-${uid}`
  const U = (n: string) => `url(#${n}-${uid})`
  const spin = time * 0.35
  // parâmetros contínuos de cada fenômeno
  const design = 1 - smooth(0.45, 0.9, v)
  const hl = smooth(0.4, 1, v) // destaque de alvo/PAM
  const casIn = smooth(1.3, 2.05, v)
  const casOut = smooth(4.4, 4.95, v)
  const cas = casIn * (1 - casOut)
  const probe = bump(v, 1.85, 2.05, 2.25, 2.5)
  const open = smooth(2.3, 2.95, v) * (1 - smooth(4.45, 5, v))
  const hnh = smooth(3.1, 3.45, v)
  const gap = smooth(3.35, 3.85, v) * (1 - smooth(4.75, 5.45, v))
  const spark = bump(v, 3.4, 3.55, 3.75, 4.1)
  const ku = bump(v, 4.45, 4.85, 5.3, 5.6)
  const indel = bump(v, 4.95, 5.2, 5.45, 5.65)
  const donor = smooth(5.45, 5.95, v)
  const copied = smooth(5.75, 6, v)

  const casDx = lerp(-300, 0, casIn)
  const casDy = -150 * casOut
  const items: Item[] = []

  // ---------- pontos das fitas e do RNA ----------
  const s1: [number, number, number][] = [], s2: [number, number, number][] = [], rna: [number, number][] = []
  for (let i = 0; i < N; i++) {
    const x = xAt(i) + (i <= CUT ? -gap * 15 : gap * 15)
    const phi = i * TWIST + spin
    let y1 = CY - A * Math.cos(phi), z1 = Math.sin(phi)
    let y2 = CY - A * Math.cos(phi + GROOVE), z2 = Math.sin(phi + GROOVE)
    const inT = i >= T0 && i <= T1
    // R-loop: a fita não-alvo sobe num arco; a fita-alvo se alinha para parear com o RNA
    const k = inT ? (i === T0 || i === T1 ? 0.55 : 1) * open : 0
    const arc = Math.sin(((i - T0 + 1) / (T1 - T0 + 2)) * Math.PI)
    y1 = lerp(y1, CY - A - 8 - 50 * arc, k); z1 = lerp(z1, 1, k)
    y2 = lerp(y2, CY + 26, k); z2 = lerp(z2, 0.3, k)
    s1.push([x, y1, z1]); s2.push([x, y2, z2])
    if (inT) {
      const stowed = CY - 92 + casDy
      const yR = design > 0.01 ? lerp(stowed, CY - 100, design) : stowed
      rna.push([x + casDx * (1 - k) * (1 - design), lerp(yR, CY - 4, k)])
    }
  }

  // ---------- backbone (segmentos ordenados por profundidade) ----------
  const seg = (pts: [number, number, number][], tone: string, key: string) => {
    for (let i = 0; i < N - 1; i++) {
      if (gap > 0.02 && i === CUT) continue // quebra
      const [x1, y1, z1] = pts[i], [x2, y2, z2] = pts[i + 1]
      const z = (z1 + z2) / 2
      items.push({ z, el: <line key={`${key}${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={tone} strokeWidth={6.5 + 2.5 * z} strokeLinecap="round" opacity={0.5 + 0.5 * (z + 1) / 2} /> })
    }
  }
  seg(s1, U('bb1'), 'a')
  seg(s2, U('bb2'), 'b')

  // ---------- bases e fosfatos ----------
  const dimOf = (i: number) => (i >= T0 && i <= P1 ? 1 : lerp(1, 0.5, hl))
  for (let i = 0; i < N; i++) {
    const b1 = SEQ[i], b2 = COMP[b1]
    const [x1, y1, z1] = s1[i], [x2, y2, z2] = s2[i]
    const inT = i >= T0 && i <= T1
    const k = inT ? open : 0
    const f = PURINE.has(b1) ? 0.55 : 0.45
    const isIns = (i === CUT || i === CUT + 1)
    const insertTone = copied > 0 && isIns ? '#ffffff' : null
    const c1 = insertTone ?? BASE_COLOR[b1], c2 = insertTone ?? BASE_COLOR[b2]
    const op = dimOf(i)
    const z = (z1 + z2) / 2
    if (k < 0.5) {
      const mx = lerp(x1, x2, f), my = lerp(y1, y2, f)
      items.push({ z: z - 0.01, el: <g key={`p${i}`} opacity={op * (1 - k * 2 * 0.6)}>
        <line x1={x1} y1={y1} x2={mx} y2={my - 1.2} stroke={c1} strokeWidth={5.5} strokeLinecap="round" />
        <line x1={x2} y1={y2} x2={mx} y2={my + 1.2} stroke={c2} strokeWidth={5.5} strokeLinecap="round" />
      </g> })
    }
    if (k > 0.02) {
      // fita não-alvo: bases soltas apontando para baixo; fita-alvo: pareada com o RNA
      const r = rna[i - T0]
      items.push({ z: 1.2, el: <g key={`o${i}`} opacity={clamp01(k * 1.5)}>
        <line x1={x1} y1={y1} x2={x1} y2={y1 + 14} stroke={c1} strokeWidth={5} strokeLinecap="round" opacity={0.8} />
        <line x1={x2} y1={y2} x2={x2} y2={lerp(y2, r[1], 0.5) + 1.5} stroke={c2} strokeWidth={5.5} strokeLinecap="round" />
        <line x1={r[0]} y1={r[1]} x2={r[0]} y2={lerp(y2, r[1], 0.5) - 1.5} stroke={BASE_COLOR[b1 === 'T' ? 'U' : b1]} strokeWidth={5.5} strokeLinecap="round" />
      </g> })
    }
    const pam = i >= P0 && i <= P1
    const glowPam = pam ? hl * 0.6 + probe + open * 0.5 : 0
    items.push({ z: z1 + 0.02, el: <circle key={`q${i}`} cx={x1} cy={y1} r={4.6 + 1.6 * (z1 + 1) / 2} fill={pam && hl > 0.3 ? U('beadPam') : U('bead1')} opacity={0.55 + 0.45 * (z1 + 1) / 2} filter={glowPam > 0.6 ? U('glow') : undefined} /> })
    items.push({ z: z2 + 0.02, el: <circle key={`r${i}`} cx={x2} cy={y2} r={4.6 + 1.6 * (z2 + 1) / 2} fill={U('bead2')} opacity={0.55 + 0.45 * (z2 + 1) / 2} /> })
    // indel do NHEJ e cópia do HDR
    if (indel > 0.01 && i === CUT) {
      items.push({ z: 2, el: <rect key="indel" x={XCUT - 7} y={CY - 46} width={14} height={92} rx={7} fill={PALETTE.mismatch} fillOpacity={0.18 * indel} stroke={PALETTE.mismatch} strokeOpacity={indel} strokeWidth={1.5} /> })
    }
    if (copied > 0.01 && i === CUT) {
      items.push({ z: 2, el: <rect key="copy" x={xAt(CUT) - 9} y={CY - 48} width={DX + 18} height={96} rx={10} fill={PALETTE.donor} fillOpacity={0.12 * copied} stroke={PALETTE.donor} strokeOpacity={copied} strokeWidth={1.5} filter={U('glow')} /> })
    }
  }
  items.sort((a, b) => a.z - b.z)

  // ---------- RNA guia ----------
  const rnaVis = Math.max(design, cas)
  const rnaPath = rna.length ? smoothPath(rna) : ''
  const r3 = rna[rna.length - 1]
  const scaffold = r3 ? smoothPath([
    [r3[0], r3[1]], [r3[0] + 16, r3[1] - 14], [r3[0] + 8, r3[1] - 38], [r3[0] + 26, r3[1] - 52], [r3[0] + 40, r3[1] - 34],
    [r3[0] + 30, r3[1] - 18], [r3[0] + 52, r3[1] - 12], [r3[0] + 66, r3[1] - 36], [r3[0] + 82, r3[1] - 26], [r3[0] + 74, r3[1] - 6],
  ]) : ''

  // ---------- Cas9 ----------
  const cx = XT + 18 + casDx, cy = CY - 6 + casDy
  const hnhX = lerp(cx - 70, XCUT + 4 + casDx, hnh), hnhY = lerp(cy - 70, CY + 8 + casDy, hnh) - Math.sin(hnh * Math.PI) * 30

  // ---------- Ku70/80 e molde doador ----------
  const kuSlide = (1 - smooth(4.45, 4.85, v)) * 60
  const donorY = lerp(CY - 220, CY - 96, donor)
  const sparks = Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + 0.3
    const r0 = 6 + 40 * (1 - (1 - spark) ** 2), r1 = r0 + 10
    return <line key={i} x1={XCUT + Math.cos(a) * r0} y1={CY + Math.sin(a) * r0} x2={XCUT + Math.cos(a) * r1} y2={CY + Math.sin(a) * r1} stroke="#fff3c4" strokeWidth={2} strokeLinecap="round" />
  })

  const step = Math.round(v)
  return (
    <>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-hidden="true">
        <defs>
          <radialGradient id={I('bead1')} cx="35%" cy="30%" r="70%"><stop offset="0" stopColor="#d9fff8" /><stop offset=".45" stopColor={PALETTE.strand1} /><stop offset="1" stopColor="#0b6a5d" /></radialGradient>
          <radialGradient id={I('bead2')} cx="35%" cy="30%" r="70%"><stop offset="0" stopColor="#e1f1ff" /><stop offset=".45" stopColor={PALETTE.strand2} /><stop offset="1" stopColor="#0c3866" /></radialGradient>
          <radialGradient id={I('beadPam')} cx="35%" cy="30%" r="70%"><stop offset="0" stopColor="#ffe1f0" /><stop offset=".45" stopColor={PALETTE.cas} /><stop offset="1" stopColor="#7a1450" /></radialGradient>
          <linearGradient id={I('bb1')} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={CY - A - 10} y2={CY + A + 10}><stop offset="0" stopColor="#a8fff0" /><stop offset="1" stopColor="#1fa892" /></linearGradient>
          <linearGradient id={I('bb2')} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={CY - A - 10} y2={CY + A + 10}><stop offset="0" stopColor="#9fd3ff" /><stop offset="1" stopColor="#1a64b0" /></linearGradient>
          <linearGradient id={I('rnaG')} gradientUnits="userSpaceOnUse" x1={X0} x2={W - X0} y1="0" y2="0"><stop offset="0" stopColor="#ffd48a" /><stop offset="1" stopColor={PALETTE.rna} /></linearGradient>
          <radialGradient id={I('recG')} cx="45%" cy="40%" r="65%"><stop offset="0" stopColor={PALETTE.cas} stopOpacity=".05" /><stop offset=".75" stopColor={PALETTE.cas} stopOpacity=".2" /><stop offset="1" stopColor="#ff8fd0" stopOpacity=".55" /></radialGradient>
          <radialGradient id={I('nucG')} cx="50%" cy="55%" r="65%"><stop offset="0" stopColor="#ff6f7d" stopOpacity=".05" /><stop offset=".75" stopColor="#ff6f7d" stopOpacity=".2" /><stop offset="1" stopColor="#ffb0a0" stopOpacity=".55" /></radialGradient>
          <radialGradient id={I('hnhG')} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#fff4cf" /><stop offset=".6" stopColor={PALETTE.hnh} stopOpacity=".85" /><stop offset="1" stopColor="#b8862a" stopOpacity=".7" /></radialGradient>
          <radialGradient id={I('piG')} cx="40%" cy="35%" r="70%"><stop offset="0" stopColor="#ffd0e4" /><stop offset=".6" stopColor={PALETTE.pi} stopOpacity=".85" /><stop offset="1" stopColor="#8a0f45" stopOpacity=".7" /></radialGradient>
          <radialGradient id={I('kuG')} cx="50%" cy="50%" r="60%"><stop offset=".55" stopColor={PALETTE.ku} stopOpacity="0" /><stop offset=".8" stopColor={PALETTE.ku} stopOpacity=".7" /><stop offset="1" stopColor="#b8ecff" stopOpacity=".9" /></radialGradient>
          <radialGradient id={I('bgGlow')} cx="50%" cy="55%" r="60%"><stop offset="0" stopColor="#3ef0d0" stopOpacity=".08" /><stop offset=".6" stopColor="#6a4dff" stopOpacity=".05" /><stop offset="1" stopColor="#04060b" stopOpacity="0" /></radialGradient>
          <pattern id={I('dots')} width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="#a9b8c9" fillOpacity=".12" /></pattern>
          <filter id={I('glow')} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id={I('soft')} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.5" /></filter>
        </defs>

        <rect width={W} height={H} fill={U('dots')} />
        <rect width={W} height={H} fill={U('bgGlow')} />

        {/* molde doador (HDR): desce e se alinha ao sítio de corte */}
        {donor > 0.01 && (
          <g opacity={donor}>
            <line x1={xAt(6)} x2={xAt(25)} y1={donorY} y2={donorY} stroke={PALETTE.donor} strokeWidth={7} strokeLinecap="round" opacity={0.75} />
            <line x1={xAt(6)} x2={xAt(25)} y1={donorY + 12} y2={donorY + 12} stroke="#3fbf6a" strokeWidth={7} strokeLinecap="round" opacity={0.6} />
            <rect x={xAt(CUT) - 4} y={donorY - 6} width={DX + 8} height={24} rx={8} fill="#ffffff" filter={U('glow')} />
            <line x1={XCUT} x2={XCUT} y1={donorY + 22} y2={CY - 50} stroke="#ffffff" strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="4 5" />
          </g>
        )}

        {/* lóbulos da Cas9 atrás do DNA */}
        {cas > 0.01 && (
          <g opacity={cas}>
            <path d={blob(cx - 10, cy - 52 + 10 * open, 138, 62, 1, time)} fill={U('recG')} stroke="#ff8fd0" strokeOpacity=".55" strokeWidth={1.5} />
            <path d={blob(cx + 14, cy + 50, 128, 52, 4, time)} fill={U('nucG')} stroke="#ffb0a0" strokeOpacity=".5" strokeWidth={1.5} />
          </g>
        )}

        {items.map((it) => it.el)}

        {/* RNA guia */}
        {rnaVis > 0.04 && rna.length > 0 && (
          <g opacity={rnaVis} filter={U('glow')}>
            <path d={rnaPath} stroke={U('rnaG')} strokeWidth={7} strokeLinecap="round" fill="none" />
            <path d={scaffold} stroke={U('rnaG')} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.9} />
            {design > 0.01 && rna.map(([x, y], i) => (
              <line key={i} x1={x} y1={y} x2={x} y2={y + 14} stroke={BASE_COLOR[SEQ[T0 + i] === 'T' ? 'U' : SEQ[T0 + i]]} strokeWidth={5} strokeLinecap="round" opacity={design} />
            ))}
          </g>
        )}

        {/* domínios da Cas9 na frente: HNH (gira até a fita-alvo) e PI (lê o PAM) */}
        {cas > 0.01 && (
          <g opacity={cas}>
            <path d={blob(hnhX, hnhY, 26, 20, 7, time, 8)} fill={U('hnhG')} stroke="#fff0b0" strokeOpacity=".6" />
            <path d={blob(xAt(20) + casDx, CY + 34 + casDy, 20, 16, 9, time, 8)} fill={U('piG')} stroke="#ff9ac0" strokeOpacity={0.5 + 0.5 * probe} filter={probe > 0.2 ? U('glow') : undefined} />
          </g>
        )}

        {/* Ku70/80: anéis que se encaixam nas pontas */}
        {ku > 0.01 && (
          <g opacity={ku}>
            <ellipse cx={xAt(CUT) - 8 - kuSlide} cy={CY} rx={15} ry={54} fill={U('kuG')} stroke={PALETTE.ku} strokeOpacity=".8" strokeWidth={2} />
            <ellipse cx={xAt(CUT + 1) + 8 + kuSlide} cy={CY} rx={15} ry={54} fill={U('kuG')} stroke="#2a9df4" strokeOpacity=".8" strokeWidth={2} />
          </g>
        )}

        {/* linha do corte: visível enquanto as pontas estão separadas */}
        {gap > 0.05 && <line x1={XCUT} x2={XCUT} y1={CY - A - 24} y2={CY + A + 24} stroke="#ffffff" strokeOpacity={0.8 * gap} strokeWidth={2} strokeDasharray="5 6" filter={U('glow')} />}
        {spark > 0.01 && <g opacity={1 - spark * 0.6} filter={U('glow')}>{sparks}</g>}

        <text x={X0 - 18} y={CY - A - 4} fill="#a9b8c9" fontSize="11" fontFamily="JetBrains Mono Variable">5′</text>
        <text x={W - X0 + 8} y={CY - A - 4} fill="#a9b8c9" fontSize="11" fontFamily="JetBrains Mono Variable">3′</text>
        <text x={X0 - 18} y={CY + A + 12} fill="#a9b8c9" fontSize="11" fontFamily="JetBrains Mono Variable">3′</text>
        <text x={W - X0 + 8} y={CY + A + 12} fill="#a9b8c9" fontSize="11" fontFamily="JetBrains Mono Variable">5′</text>
      </svg>

      {/* rótulos */}
      <Tag x={rna[0]?.[0] ?? XT} y={(rna[0]?.[1] ?? CY) - 6} on={step === 0} tone={PALETTE.rna}>{t('espaçador do sgRNA · 20 nt', 'sgRNA spacer · 20 nt')}</Tag>
      <Tag x={(r3?.[0] ?? XT) + 84} y={(r3?.[1] ?? CY) - 28} on={step === 0} tone={PALETTE.rna}>scaffold</Tag>
      <Tag x={XT - 20} y={CY + A + 44} on={step === 1} tone={PALETTE.strand1}>{t('protoespaçador · 20 nt', 'protospacer · 20 nt')}</Tag>
      <Tag x={xAt(20) + 10} y={CY - A - 22} on={step === 1} tone={PALETTE.cas}>PAM · NGG</Tag>
      <Tag x={cx - 40} y={cy - 116} on={step === 2} tone={PALETTE.cas}>Cas9 · {t('lóbulo REC', 'REC lobe')}</Tag>
      <Tag x={xAt(20) + casDx} y={CY + 52 + casDy} on={step === 2} tone={PALETTE.pi}>{t('PI · lê o PAM', 'PI · reads the PAM')}</Tag>
      <Tag x={XT - 30} y={CY - A - 58} on={step === 3} tone={PALETTE.strand1}>{t('fita deslocada · R-loop', 'displaced strand · R-loop')}</Tag>
      <Tag x={XT + 56} y={CY - 8} on={step === 3} tone={PALETTE.rna}>{t('RNA : DNA', 'RNA : DNA')}</Tag>
      <Tag x={XCUT} y={CY + A + 44} on={step === 4} tone="#ffffff">{t('quebra de fita dupla · 3 pb do PAM', 'double-strand break · 3 bp from PAM')}</Tag>
      <Tag x={hnhX - 34} y={hnhY - 14} on={step === 4} tone={PALETTE.hnh}>HNH</Tag>
      <Tag x={xAt(CUT + 1) + 8} y={CY - 58} on={step === 5} tone={PALETTE.ku}>Ku70/80</Tag>
      <Tag x={XCUT} y={CY + A + 44} on={step === 5} tone={PALETTE.mismatch}>{t('indel → frameshift?', 'indel → frameshift?')}</Tag>
      <Tag x={xAt(9)} y={donorY - 8} on={step === 6} tone={PALETTE.donor}>{t('molde doador · braços de homologia', 'donor template · homology arms')}</Tag>
      <Tag x={XCUT} y={CY + A + 44} on={step === 6} tone={PALETTE.donor}>{t('sequência copiada do molde', 'sequence copied from the template')}</Tag>
    </>
  )
}

/** Diagrama animado: interpola suavemente até `step` e gira a hélice enquanto visível. */
export default function MechanismDiagram({ step, label }: { step: number; label: string }) {
  const box = useRef<HTMLDivElement>(null)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const inView = useInView(box)
  const [still] = useState(prefersReducedMotion)
  const state = useRef({ v: step })
  const [v, setV] = useState(step)
  const [time, setTime] = useState(0)

  useEffect(() => {
    if (still) { state.current.v = step; setV(step); return }
    let tw: { kill(): void } | undefined
    let alive = true
    void loadMotion().then(({ gsap }) => {
      if (alive) tw = gsap.to(state.current, { v: step, duration: 0.6 + 0.35 * Math.min(3, Math.abs(step - state.current.v)), ease: 'power2.inOut', onUpdate: () => setV(state.current.v) })
    })
    return () => { alive = false; tw?.kill() }
  }, [step, still])

  useEffect(() => {
    if (still || !inView) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      setTime((x) => x + dt)
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [inView, still])

  return (
    <div ref={box} className="mech-diagram relative aspect-[8/5] w-full overflow-hidden rounded-2xl bg-ink/60 ring-1 ring-white/5" role="img" aria-label={label}>
      <Uid.Provider value={uid}>
        <Frame v={v} time={time} />
      </Uid.Provider>
    </div>
  )
}
