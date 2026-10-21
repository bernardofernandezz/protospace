import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { AdaptiveDpr, Html, OrbitControls, PerformanceMonitor } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { OrbitControls as OrbitImpl } from 'three-stdlib'
import { COMP, MAX_LOCUS } from '../lib/dna'
import { useDerived, useSim } from './store'
import { BASE_COLOR } from './colors'

// ---------- constantes geométricas (B-DNA estilizado: ~10,5 pb por volta) ----------
const RISE = 0.34
const RADIUS = 1
const TWIST = (2 * Math.PI) / 10.5
const STRAND1 = new THREE.Color('#3ef0d0')
const STRAND2 = new THREE.Color('#2a9df4')
const CAS = '#ff4fa3'
const RNA = '#ffb547'

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const smooth = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t) }
/** 0 antes da etapa, 1 depois, rampa suave dentro dela. */
const phase = (step: number, p: number, at: number, a = 0, b = 1) => (step > at ? 1 : step < at ? 0 : smooth(a, b, p))
const xOf = (i: number, n: number) => (i - (n - 1) / 2) * RISE

type Derived = ReturnType<typeof useDerived>

/** Estado visual derivado de (etapa, progresso) — determinístico, então voltar etapas funciona. */
function visual(d: Derived, step: number, p: number) {
  const c = d.cand!
  const n = d.applied!.seq.length
  const edited = step > 4 || (step === 4 && p > 0.55)
  const dsb = d.cuts === 'dsb'
  return {
    edited,
    rloop: phase(step, p, 2, 0.62, 1) * (1 - phase(step, p, 4, 0.2, 0.6)),
    gap: dsb ? phase(step, p, 3, 0.25, 0.7) * (1 - phase(step, p, 4, 0.15, 0.6)) : 0,
    flash: step === 3 && d.cuts !== 'none' ? Math.max(0, 1 - Math.abs(p - 0.3) * 4) : 0,
    casIn: phase(step, p, 2, 0, 0.12),
    casLeave: phase(step, p, 4, 0, 0.35),
    search: step === 2 ? smooth(0, 0.6, p) : step > 2 ? 1 : 0,
    donor: d.cuts === 'dsb' && useSim.getState().repair === 'hdr' && step === 4 ? smooth(0, 0.45, p) * (p < 0.6 ? 1 : 0) : 0,
    beGlow: d.cuts === 'none' && d.acts && useSim.getState().cas === 'be' && step === 3 ? Math.sin(p * Math.PI) : 0,
    n,
    cand: c,
  }
}

function tip(e: ThreeEvent<PointerEvent | MouseEvent>, title: string, body: string) {
  e.stopPropagation()
  useSim.getState().set({ tip: { title, body, x: e.nativeEvent.clientX, y: e.nativeEvent.clientY } })
}
const untip = () => useSim.getState().set({ tip: null })

// ---------- DNA principal (instanced: esferas do esqueleto + meias-pontes coloridas) ----------
function Helix({ d }: { d: Derived }) {
  const bones = useRef<THREE.InstancedMesh>(null!)
  const rungs = useRef<THREE.InstancedMesh>(null!)
  const guide = useRef<THREE.InstancedMesh>(null!)
  const marks = useRef<THREE.Group>(null!)
  const cutRef = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const tmp = useMemo(() => ({ p1: new THREE.Vector3(), p2: new THREE.Vector3(), q1: new THREE.Vector3(), q2: new THREE.Vector3(), dv: new THREE.Vector3(), m: new THREE.Matrix4(), q: new THREE.Quaternion(), s: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), col: new THREE.Color() }), [])

  useFrame(() => {
    const { step, progress } = useSim.getState()
    const v = visual(d, step, progress)
    const c = v.cand
    const seq = v.edited ? d.applied!.seq : useSim.getState().locus
    const changed = v.edited ? d.applied!.changed : null
    const n = seq.length
    const cutIdx = c.cut
    const { p1, p2, q1, q2, dv, m, q, s, a, b, up, col } = tmp

    for (let i = 0; i < n; i++) {
      const j = i - c.start // posição no protoespaçador (0..19)
      const inTarget = !v.edited && j >= 0 && j < 20
      const inPam = !v.edited && j >= 20 && j < 23
      // R-loop se forma a partir do PAM em direção à ponta distal
      const open = inTarget ? smooth((19 - j) / 20 * 0.7, (19 - j) / 20 * 0.7 + 0.3, v.rloop) : 0
      const x = xOf(i, n) + (v.gap / 2) * (i >= cutIdx ? 1 : -1)
      const th = i * TWIST
      q1.set(x, RADIUS * Math.cos(th), RADIUS * Math.sin(th))
      q2.set(x, -RADIUS * Math.cos(th), -RADIUS * Math.sin(th))
      p1.copy(q1).add(a.set(0, open * 1.6, open * 0.4))
      p2.copy(q2).add(a.set(0, -open * 0.15, 0))

      m.makeTranslation(p1); bones.current.setMatrixAt(i, m)
      m.makeTranslation(p2); bones.current.setMatrixAt(n + i, m)
      const hl = inTarget || inPam || (changed?.[i] ?? false)
      bones.current.setColorAt(i, inPam ? col.set(CAS) : col.copy(STRAND1).multiplyScalar(hl ? 1 : 0.55))
      bones.current.setColorAt(n + i, col.copy(STRAND2).multiplyScalar(hl ? 1 : 0.55))

      // meias-pontes: da fita até o meio do par (encolhe na fita deslocada pelo R-loop)
      const half = (from: THREE.Vector3, dir: THREE.Vector3, len: number, k: number, base: string) => {
        b.copy(dir).normalize()
        q.setFromUnitVectors(up, b)
        a.copy(from).addScaledVector(b, len / 2)
        s.set(1, len, 1)
        m.compose(a, q, s)
        rungs.current.setMatrixAt(k, m)
        col.set(BASE_COLOR[base] ?? '#888')
        if (changed?.[i]) col.set('#ffffff')
        else if (!hl) col.multiplyScalar(0.38)
        rungs.current.setColorAt(k, col)
      }
      const span = RADIUS * 2
      half(p1, dv.copy(q2).sub(q1), (span / 2) * (1 - 0.65 * open), i, seq[i])
      half(p2, dv.copy(q1).sub(q2), span / 2, n + i, COMP[seq[i]])

      // sgRNA pareando com a fita-alvo dentro do R-loop
      if (inTarget) {
        const g = a.copy(q1).sub(q2).multiplyScalar(0.78).add(p2)
        s.setScalar(open)
        m.compose(g, q.identity(), s)
        guide.current.setMatrixAt(j, m)
      }
    }
    bones.current.count = rungs.current.count = n * 2
    guide.current.count = v.edited ? 0 : 20
    for (const im of [bones.current, rungs.current, guide.current]) {
      im.instanceMatrix.needsUpdate = true
      if (im.instanceColor) im.instanceColor.needsUpdate = true
    }

    // marcadores de região e sítio de corte seguem o layout
    const xs = xOf(c.start, n) - v.gap / 2
    marks.current.position.x = xs
    marks.current.visible = !v.edited && step <= 2
    const cx = (xOf(cutIdx - 1, n) + xOf(cutIdx, n)) / 2
    cutRef.current.position.x = cx
    cutRef.current.visible = step >= 3 && d.cuts !== 'none' && !v.edited
    const f = v.flash
    ring.current.scale.setScalar(0.6 + f * 2.2)
    ;(ring.current.material as THREE.MeshBasicMaterial).opacity = 0.25 + f * 0.75
  })

  const hoverBase = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const id = e.instanceId
    if (id === undefined) return
    const { step, progress, locus } = useSim.getState()
    const v = visual(d, step, progress)
    const seq = v.edited ? d.applied!.seq : locus
    const n = seq.length
    const i = id % n
    const top = id < n
    const b = top ? seq[i] : COMP[seq[i]]
    const j = i - v.cand.start
    let body = 'Fora da região-alvo.'
    if (v.edited && d.applied!.changed[i]) body = 'Base alterada pela edição.'
    else if (!v.edited && j >= 0 && j < 20) body = `Protoespaçador, posição ${j + 1}/20${j >= 8 ? ' (região seed, proximal ao PAM: mismatches aqui pesam mais)' : ' (região distal ao PAM)'}. ${top ? 'Fita não-alvo (mesma sequência do guia, com T em vez de U).' : 'Fita-alvo: pareia com o sgRNA.'}`
    else if (!v.edited && j >= 20 && j < 23) body = 'PAM (NGG): sem ele a SpCas9 não abre a dupla-fita, mesmo com guia perfeito. Fica na fita não-alvo, logo após o protoespaçador (3′).'
    tip(e, `Par ${i + 1} · ${b}${top ? ' (fita senso)' : ' (fita antissenso)'}`, body)
  }

  const step = useSim((s) => s.step)
  return (
    <group>
      <instancedMesh ref={bones} args={[undefined, undefined, MAX_LOCUS * 2]} frustumCulled={false}>
        <sphereGeometry args={[0.15, 12, 10]} />
        <meshStandardMaterial roughness={0.35} metalness={0.1} emissive={'#0b3a40'} />
      </instancedMesh>
      <instancedMesh ref={rungs} args={[undefined, undefined, MAX_LOCUS * 2]} frustumCulled={false} onPointerMove={hoverBase} onPointerOut={untip} onClick={hoverBase}>
        <cylinderGeometry args={[0.085, 0.085, 1, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={guide} args={[undefined, undefined, 20]} frustumCulled={false}
        onPointerMove={(e) => tip(e, 'sgRNA · espaçador (20 nt)', 'A porção 5′ do RNA guia pareia por complementaridade com a fita-alvo, deslocando a fita não-alvo e formando o R-loop.')} onPointerOut={untip}>
        <sphereGeometry args={[0.17, 12, 10]} />
        <meshBasicMaterial color={RNA} toneMapped={false} />
      </instancedMesh>

      <group ref={marks}>
        <mesh position={[(19 * RISE) / 2, -1.75, 0]}>
          <boxGeometry args={[20 * RISE, 0.05, 0.05]} />
          <meshBasicMaterial color={'#3ef0d0'} toneMapped={false} />
        </mesh>
        <mesh position={[21 * RISE, -1.75, 0]}
          onPointerMove={(e) => tip(e, 'PAM · 5′-NGG-3′', 'Protospacer Adjacent Motif. A SpCas9 reconhece NGG pelo domínio PI antes de testar o pareamento do guia.')} onPointerOut={untip}>
          <boxGeometry args={[3 * RISE, 0.12, 0.12]} />
          <meshBasicMaterial color={CAS} toneMapped={false} />
        </mesh>
        {step <= 2 && (
          <>
            <Html position={[(19 * RISE) / 2, -2.25, 0]} center className="pointer-events-none select-none">
              <span className="whitespace-nowrap rounded bg-black/60 px-2 py-0.5 font-mono text-[11px] text-dna">protoespaçador · 20 nt</span>
            </Html>
            <Html position={[21 * RISE, -2.25, 0]} center className="pointer-events-none select-none">
              <span className="whitespace-nowrap rounded bg-black/60 px-2 py-0.5 font-mono text-[11px] text-cas">PAM</span>
            </Html>
          </>
        )}
      </group>

      <group ref={cutRef}>
        <mesh ref={ring} rotation={[0, Math.PI / 2, 0]}
          onPointerMove={(e) => tip(e, 'Sítio de corte', 'SpCas9 corta 3 pb a montante do PAM. O domínio HNH cliva a fita-alvo e o RuvC a não-alvo, gerando extremidades predominantemente cegas.')} onPointerOut={untip}>
          <torusGeometry args={[1.5, 0.05, 8, 48]} />
          <meshBasicMaterial color={'#ffffff'} transparent toneMapped={false} />
        </mesh>
      </group>
    </group>
  )
}

// ---------- Complexo Cas9 + sgRNA (geometria procedural) ----------
function Cas9({ d }: { d: Derived }) {
  const g = useRef<THREE.Group>(null!)
  const rec = useRef<THREE.Mesh>(null!)
  const nuc = useRef<THREE.Mesh>(null!)
  const scaffold = useMemo(() => {
    const pts = [[2.2, 0.9, 0.6], [3.0, 1.9, 1.0], [2.6, 3.0, 0.3], [1.5, 2.8, -0.6], [1.9, 1.9, -0.5], [3.2, 1.3, -1.0], [3.7, 2.4, -1.4], [3.0, 3.1, -1.8]]
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 80, 0.12, 8, false)
  }, [])

  useFrame(({ clock }) => {
    const { step, progress, cas } = useSim.getState()
    const v = visual(d, step, progress)
    const n = v.n
    const xT = xOf(v.cand.start + 11, n)
    const xL = xOf(0, n) - 2
    g.current.position.set(THREE.MathUtils.lerp(xL, xT, v.search), v.casLeave * 7, 0)
    const sc = v.casIn * (1 - v.casLeave)
    g.current.scale.setScalar(Math.max(0.001, sc))
    g.current.visible = sc > 0.01
    const t = clock.elapsedTime
    rec.current.scale.set(3.4 + Math.sin(t * 1.3) * 0.05, 1.7, 1.7)
    nuc.current.scale.set(3.0, 1.45 + Math.sin(t * 1.1) * 0.05, 1.6)
    ;(nuc.current.material as THREE.MeshStandardMaterial).color.set(cas === 'be' ? '#9b6bff' : '#ff7a59')
  })

  const casTip = (e: ThreeEvent<PointerEvent>) => {
    const c = useSim.getState().cas
    tip(e, c === 'be' ? 'Editor de bases (nCas9 + desaminase)' : c === 'nickase' ? 'Cas9 nickase (D10A)' : 'SpCas9',
      c === 'be' ? 'Cas9 nickase fundida a uma desaminase de citosina: converte C→T numa janela do protoespaçador sem quebra de fita dupla.'
        : 'Lóbulo REC (reconhecimento, magenta) acomoda o heterodúplex guia:DNA; lóbulo NUC (nuclease) contém HNH e RuvC e o domínio PI, que lê o PAM.')
  }

  const step = useSim((s) => s.step)
  return (
    <group ref={g} onPointerMove={casTip} onPointerOut={untip}>
      <mesh ref={rec} position={[-0.3, 1.4, -0.4]}>
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial color={CAS} emissive={CAS} emissiveIntensity={0.35} transparent opacity={0.26} depthWrite={false} roughness={0.2} />
      </mesh>
      <mesh position={[-0.3, 1.4, -0.4]} scale={[3.45, 1.75, 1.75]}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color={CAS} wireframe transparent opacity={0.18} toneMapped={false} />
      </mesh>
      <mesh ref={nuc} position={[0.5, -1.3, 0.4]}>
        <icosahedronGeometry args={[1, 4]} />
        <meshStandardMaterial emissive={'#ff7a59'} emissiveIntensity={0.3} transparent opacity={0.24} depthWrite={false} roughness={0.2} />
      </mesh>
      <mesh position={[0.5, -1.3, 0.4]} scale={[3.05, 1.5, 1.65]}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial color={'#ff9a6b'} wireframe transparent opacity={0.16} toneMapped={false} />
      </mesh>
      {/* domínio PI (interação com o PAM) */}
      <mesh position={[3.4, -1.2, 0]}>
        <sphereGeometry args={[0.55, 24, 16]} />
        <meshBasicMaterial color={'#ff2d7a'} toneMapped={false} transparent opacity={0.75} />
      </mesh>
      <mesh geometry={scaffold}>
        <meshBasicMaterial color={RNA} toneMapped={false} />
      </mesh>
      {step >= 2 && step <= 3 && (
        <Html position={[-0.3, 3.5, 0]} center className="pointer-events-none select-none">
          <span className="whitespace-nowrap rounded bg-black/60 px-2 py-0.5 font-mono text-[11px] text-cas">Cas9 · sgRNA</span>
        </Html>
      )}
    </group>
  )
}

// ---------- Molde de HDR (doador) ----------
function Donor({ d }: { d: Derived }) {
  const g = useRef<THREE.Group>(null!)
  const pts = useMemo(() => Array.from({ length: 34 }, (_, i) => i), [])
  useFrame(() => {
    const { step, progress } = useSim.getState()
    const v = visual(d, step, progress)
    const cx = xOf(v.cand.cut, v.n)
    g.current.visible = v.donor > 0
    g.current.position.set(cx, 1.9 + (1 - v.donor) * 6, 0.9)
  })
  return (
    <group ref={g} onPointerMove={(e) => tip(e, 'Molde doador (HDR)', 'DNA com braços de homologia flanqueando a edição desejada. Aqui: inserção de GAATTC (EcoRI) e mutação do PAM, para o alelo editado não ser cortado de novo.')} onPointerOut={untip}>
      {pts.map((i) => (
        <mesh key={i} position={[(i - 16.5) * RISE, Math.sin(i * TWIST) * 0.25, Math.cos(i * TWIST) * 0.25]}>
          <sphereGeometry args={[i >= 14 && i < 20 ? 0.2 : 0.13, 10, 8]} />
          <meshBasicMaterial color={i >= 14 && i < 20 ? '#ffffff' : '#7dff9b'} toneMapped={false} />
        </mesh>
      ))}
    </group>
  )
}

// ---------- Célula, núcleo e entrega ----------
const fib = (i: number, n: number) => {
  const y = 1 - ((i + 0.5) / n) * 2
  const r = Math.sqrt(1 - y * y)
  const t = i * Math.PI * (3 - Math.sqrt(5))
  return new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r)
}

function Cell() {
  const carriers = useRef<THREE.Group>(null!)
  const delivery = useSim((s) => s.delivery)
  const dirs = useMemo(() => Array.from({ length: 16 }, (_, i) => fib(i, 16)), [])
  const g = useRef<THREE.Group>(null!)
  useFrame(() => {
    const { step, progress } = useSim.getState()
    // a célula só aparece na etapa de entrega: fora dela, polui a leitura do DNA
    g.current.visible = step === 1
    if (step !== 1) return
    carriers.current.visible = true
    carriers.current.children.forEach((c, i) => {
      const t = smooth(i * 0.025, 0.6 + i * 0.025, progress)
      c.position.copy(dirs[i]).multiplyScalar(THREE.MathUtils.lerp(42, delivery === 'rnp' ? 4 : 9, t))
      c.rotation.x = progress * 4 + i
      c.rotation.y = progress * 3
    })
  })
  return (
    <group ref={g}>
      <mesh onPointerMove={(e) => tip(e, 'Membrana plasmática', 'Barreira que o sistema de entrega precisa atravessar (eletroporação, lipofecção, LNP, transdução viral…).')} onPointerOut={untip}>
        <icosahedronGeometry args={[28, 3]} />
        <meshBasicMaterial color={'#3ef0d0'} wireframe transparent opacity={0.05} />
      </mesh>
      <mesh>
        <sphereGeometry args={[18, 48, 32]} />
        <meshBasicMaterial color={'#6a4dff'} transparent opacity={0.035} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <group ref={carriers}>
        {dirs.map((_, i) => (
          <mesh key={i}>
            {delivery === 'rnp' && <sphereGeometry args={[0.7, 16, 12]} />}
            {delivery === 'plasmid' && <torusGeometry args={[0.8, 0.18, 10, 32]} />}
            {delivery === 'viral' && <icosahedronGeometry args={[1, 0]} />}
            <meshBasicMaterial color={delivery === 'rnp' ? CAS : delivery === 'plasmid' ? '#4cc9ff' : '#7dff9b'} wireframe={delivery === 'viral'} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

// ---------- Sítios off-target (mini-hélices "em outro ponto do genoma") ----------
function OffTarget({ site, label, p, pos }: { site: string; label: string; p: number; pos: [number, number, number] }) {
  const halo = useRef<THREE.Mesh>(null!)
  const seq = site + 'NGG'
  useFrame(({ clock }) => {
    const { step } = useSim.getState()
    const pulse = 0.85 + Math.sin(clock.elapsedTime * 3) * 0.15
    ;(halo.current.material as THREE.MeshBasicMaterial).opacity = p * 0.45 * pulse * (step === 3 ? 1.8 : 1)
  })
  return (
    <group position={pos} scale={0.7}
      onPointerMove={(e) => tip(e, label, `Sítio fictício parecido com o alvo. Probabilidade ilustrativa de corte: ${(p * 100).toFixed(0)}%. Ajuste mismatches do guia e a tolerância para ver o efeito.`)} onPointerOut={untip}>
      {[...seq].map((b, i) => {
        const th = i * TWIST
        const x = (i - seq.length / 2) * RISE
        return (
          <group key={i}>
            <mesh position={[x, Math.cos(th) * 0.55, Math.sin(th) * 0.55]}><sphereGeometry args={[0.12, 8, 6]} /><meshBasicMaterial color={BASE_COLOR[b] ?? '#ff4fa3'} toneMapped={false} /></mesh>
            <mesh position={[x, -Math.cos(th) * 0.55, -Math.sin(th) * 0.55]}><sphereGeometry args={[0.12, 8, 6]} /><meshBasicMaterial color={'#2a9df4'} /></mesh>
          </group>
        )
      })}
      <mesh ref={halo} scale={[6, 1.6, 1.6]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color={CAS} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      <Html position={[0, 1.9, 0]} center className="pointer-events-none select-none">
        <span className={`whitespace-nowrap rounded px-2 py-0.5 font-mono text-[11px] ${p > 0.35 ? 'bg-cas/80 text-white' : 'bg-black/60 text-mist'}`}>
          {label.split(' · ')[0]} · corte ≈ {(p * 100).toFixed(0)}%
        </span>
      </Html>
    </group>
  )
}

// ---------- Câmera: foco automático por etapa, até o usuário assumir ----------
function CameraRig({ d }: { d: Derived }) {
  const controls = useThree((s) => s.controls) as unknown as OrbitImpl | null
  const camera = useThree((s) => s.camera)
  const auto = useRef(true)
  const camTick = useSim((s) => s.camTick)
  const step = useSim((s) => s.step)
  useEffect(() => { auto.current = true }, [camTick, step])
  useEffect(() => {
    if (!controls) return
    const off = () => { auto.current = false }
    controls.addEventListener('start', off)
    return () => controls.removeEventListener('start', off)
  }, [controls])
  const goal = useMemo(() => ({ pos: new THREE.Vector3(), tgt: new THREE.Vector3() }), [])
  useFrame((_, dt) => {
    if (!auto.current || !controls) return
    const { step, progress } = useSim.getState()
    const v = visual(d, step, progress)
    const xT = xOf(v.cand.start + 11, v.n)
    const xC = xOf(v.cand.cut, v.n)
    const casX = THREE.MathUtils.lerp(xOf(0, v.n) - 2, xT, v.search)
    const presets: [number, number, number, number, number, number][] = [
      [xT + 2, 3, 12, xT, 0.3, 0],
      [0, 16, 64, 0, 0, 0],
      [casX - 2, 4, 15, casX, 0.5, 0],
      [xC + 1.5, 3, 12, xC, 0, 0],
      [xC, 4, 13, xC, 0.8, 0],
      [0, 9, 32, 0, 3, -4],
    ]
    const [px, py, pz, tx, ty, tz] = presets[step]
    goal.pos.set(px, py, pz)
    goal.tgt.set(tx, ty, tz)
    const k = 1 - Math.exp(-dt * 2.2)
    camera.position.lerp(goal.pos, k)
    controls.target.lerp(goal.tgt, k)
    controls.update()
  })
  return null
}

function World() {
  const d = useDerived()
  if (!d.cand) return null
  return (
    <>
      <Helix d={d} />
      <Cas9 d={d} />
      <Donor d={d} />
      <Cell />
      {d.offs!.map((o, i) => (
        <OffTarget key={i} site={o.site} label={o.label} p={o.p} pos={i === 0 ? [-10, 8, -14] : [10, 8, -14]} />
      ))}
      <CameraRig d={d} />
    </>
  )
}

export default function Scene({ active }: { active: boolean }) {
  const [fx, setFx] = useState(true)
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 6, 30], fov: 45, near: 0.1, far: 300 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={untip}
    >
      <color attach="background" args={['#04060b']} />
      <fog attach="fog" args={['#04060b', 30, 110]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[8, 10, 10]} intensity={120} color={'#9feaff'} />
      <pointLight position={[-10, -6, -4]} intensity={60} color={'#b06bff'} />
      <World />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} minDistance={4} maxDistance={90} />
      <AdaptiveDpr pixelated={false} />
      <PerformanceMonitor onDecline={() => setFx(false)} />
      {fx && (
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.55} luminanceSmoothing={0.2} />
        </EffectComposer>
      )}
    </Canvas>
  )
}
