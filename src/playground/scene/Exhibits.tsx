import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import { useFrame, useThree, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { EXHIBIT, type Vec3 } from '../../content/exhibits'
import { useT } from '../../i18n'
import { useSim } from '../store'
import { BASE_COLOR, PALETTE } from '../colors'
import { Label } from './Labels'
import { organicMaterial, tickOrganic } from './materials'
import { MiniDuplex } from './Repair'
import { RADIUS, RISE, TWIST } from './timeline'

// Exposições do modo Explorar: modelos procedurais (primitivas + tubos), na mesma linguagem visual da cena.
// Materiais em cache por módulo: cada cor é criada uma vez.

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const rand = (seed: number) => {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}
const cache = new Map<string, THREE.Material>()
const memo = <M extends THREE.Material>(key: string, make: () => M) => (cache.get(key) ?? cache.set(key, make()).get(key)) as M
const std = (c: string, e = 0.25) => memo(`s${c}${e}`, () => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: e, roughness: 0.45 }))
const glow = (c: string, k = 2) => memo(`g${c}${k}`, () => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k), toneMapped: false }))
const org = (c: string, opacity = 0.55, irid = 0) =>
  memo(`o${c}${opacity}${irid}`, () => organicMaterial({ color: c, rim: '#ffffff', opacity, amp: 0.16, freq: 1.8, power: 1.6, irid }))
const tube = (pts: THREE.Vector3[], r: number, seg = 160) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'centripetal'), seg, r, 8, false)

const ORIGIN = V(0, 0, 0),
  UP = V(0, 1, 0)

/**
 * Posiciona a exposição com a frente (+z local) virada para o centro do núcleo — o lado por onde o
 * "voar até" chega —, anima materiais orgânicos e mostra o título quando a câmera se aproxima.
 */
function Spot({ id, children, label = 3, face = true }: { id: string; children: ReactNode; label?: number; face?: boolean }) {
  const t = useT()
  const e = EXHIBIT[id]
  const g = useRef<THREE.Group>(null!)
  const near = useRef(false)
  const camera = useThree((s) => s.camera)
  const explore = useSim((s) => s.explore)
  const pos = useMemo(() => V(...(e.pos as Vec3)), [e.pos])
  // calculado já na criação: filhos (ex.: fagos com lookAt) dependem da orientação final
  const quat = useMemo(() => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(ORIGIN, pos, UP)), [pos])
  useFrame(({ clock }) => {
    if (!useSim.getState().explore) return
    const d = camera.position.distanceTo(pos)
    near.current = d < 45 && d > (e.size ?? 2) + 3
    g.current.visible = d < 140
    if (g.current.visible) tickOrganic(g.current, clock.elapsedTime)
  })
  return (
    <group ref={g} position={pos}>
      {face ? <group quaternion={quat}>{children}</group> : children}
      {explore && (
        <Label
          tone="#d6f4ff"
          at={(o) => {
            o.set(0, (e.size ?? 2) + label - 3, 0)
            return near.current
          }}
        >
          {t.pick(e.title)}
        </Label>
      )}
    </group>
  )
}

/** Gira um grupo devagar (eixo e velocidade configuráveis). */
function Spin({ axis = 'y', speed = 0.2, children, ...rest }: { axis?: 'x' | 'y' | 'z'; speed?: number; children: ReactNode } & ThreeElements['group']) {
  const g = useRef<THREE.Group>(null!)
  useFrame((_, dt) => {
    g.current.rotation[axis] += dt * speed
  })
  return (
    <group ref={g} {...rest}>
      {children}
    </group>
  )
}

// ---------- Genoma ----------
function Pairing() {
  return (
    <Spin speed={0.35}>
      {(
        [
          ['A', 'T', 2, 1.3],
          ['G', 'C', 3, -1.3],
        ] as const
      ).map(([a, b, h, y]) => (
        <group key={a} position={[0, y, 0]}>
          <mesh position={[-1.25, 0, 0]} material={std(BASE_COLOR[a])}>
            <boxGeometry args={[2.2, 0.55, 0.9]} />
          </mesh>
          <mesh position={[1.25, 0, 0]} material={std(BASE_COLOR[b])}>
            <boxGeometry args={[2.2, 0.55, 0.9]} />
          </mesh>
          {Array.from({ length: h }, (_, k) => (
            <mesh key={k} position={[0, 0, (k - (h - 1) / 2) * 0.3]} material={glow('#ffffff', 2.5)}>
              <sphereGeometry args={[0.07, 8, 8]} />
            </mesh>
          ))}
          <mesh position={[-2.6, 0, 0]} material={std('#a9b8c9')}>
            <cylinderGeometry args={[0.12, 0.12, 1.4, 8]} />
          </mesh>
          <mesh position={[2.6, 0, 0]} material={std('#a9b8c9')}>
            <cylinderGeometry args={[0.12, 0.12, 1.4, 8]} />
          </mesh>
        </group>
      ))}
    </Spin>
  )
}

function Nucleosomes() {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [V(-10, 2.4, -0.8)]
    for (const cx of [-5, 0, 5]) {
      for (let k = 0; k <= 28; k++) {
        const a = (k / 28) * 1.65 * 2 * Math.PI
        pts.push(V(cx + 1.75 * Math.sin(a), 1.75 * Math.cos(a), (k / 28 - 0.5) * 1.3))
      }
    }
    pts.push(V(10, -2, 1))
    return tube(pts, 0.17, 520)
  }, [])
  return (
    <Spin speed={0.12} axis="x">
      <mesh geometry={geo} material={std(PALETTE.strand1, 0.35)} />
      {[-5, 0, 5].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation-x={Math.PI / 2} material={org(PALETTE.deaminase, 0.75)}>
          <cylinderGeometry args={[1.35, 1.35, 1.25, 32]} />
        </mesh>
      ))}
    </Spin>
  )
}

const METHYL_SEQ = 'TACGTTCGACGCATCG'
function Methylation() {
  const sites = useMemo(() => [...METHYL_SEQ].flatMap((b, i) => (b === 'C' && METHYL_SEQ[i + 1] === 'G' ? [i] : [])), [])
  const n = METHYL_SEQ.length
  return (
    <Spin speed={0.25} axis="x" scale={1.5}>
      <MiniDuplex seq={METHYL_SEQ} quality="medium" />
      {sites.map((i) => {
        const phi = i * TWIST
        return (
          <mesh key={i} position={[(i - (n - 1) / 2) * RISE, RADIUS * 1.45 * Math.cos(phi), RADIUS * 1.45 * Math.sin(phi)]} material={glow('#ffe066', 2.2)}>
            <sphereGeometry args={[0.2, 12, 12]} />
          </mesh>
        )
      })}
    </Spin>
  )
}

/** Braços: [lado, ângulo a partir da vertical, para cima?]. O braço superior direito termina no telômero da zona. */
const ARMS = [
  [1, 0.25, 1],
  [-1, 0.25, 1],
  [1, 0.3, -1],
  [-1, 0.3, -1],
] as const
const ARM_LEN = 4.6
function Chromosome() {
  return (
    <Spin speed={0.15}>
      <mesh material={glow(PALETTE.cas, 1.4)}>
        <sphereGeometry args={[0.85, 20, 16]} />
      </mesh>
      {ARMS.map(([s, a, up], k) => (
        <group key={k} rotation-z={-s * a * up}>
          <group position={[0, up * (ARM_LEN / 2 + 0.4), 0]}>
            <mesh material={std('#6d4bd8', 0.2)}>
              <capsuleGeometry args={[1, ARM_LEN, 8, 20]} />
            </mesh>
            {[-0.35, -0.05, 0.25].map((f) => (
              <mesh key={f} position={[0, f * ARM_LEN * up, 0]} material={std('#2b1d66', 0.1)}>
                <cylinderGeometry args={[1.04, 1.04, 0.38, 24]} />
              </mesh>
            ))}
            <mesh position={[0, up * (ARM_LEN / 2 + 0.9), 0]} material={glow(PALETTE.rna, 1.8)}>
              <sphereGeometry args={[0.55, 16, 12]} />
            </mesh>
          </group>
        </group>
      ))}
    </Spin>
  )
}

function Genome() {
  const geo = useMemo(() => {
    const r = rand(23)
    const pts: THREE.Vector3[] = []
    const p = V(0, 0, 0),
      d = V(1, 0, 0)
    for (let i = 0; i < 420; i++) {
      d.add(V(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.9)).normalize()
      p.addScaledVector(d, 0.55)
      if (p.length() > 5.5) {
        p.setLength(5.5)
        d.multiplyScalar(-1)
      }
      pts.push(p.clone())
    }
    return tube(pts, 0.07, 2400)
  }, [])
  return (
    <Spin speed={0.08}>
      <mesh geometry={geo} material={std(PALETTE.strand2, 0.7)} />
      <mesh material={org('#2a9df4', 0.12)}>
        <sphereGeometry args={[6.2, 32, 24]} />
      </mesh>
    </Spin>
  )
}

function Replication() {
  const fork = 0.42
  return (
    <Spin speed={0.1} axis="x">
      <group position={[-3.9, 0, 0]}>
        <MiniDuplex seq="GATTACAGCGTACCGGATCAGT" quality="medium" />
      </group>
      {[1, -1].map((s) => (
        <group key={s} rotation-z={s * fork}>
          <group position={[3.4, 0, 0]} scale={0.8}>
            <MiniDuplex seq="CTAGGCATTCGATCCAGT" quality="medium" hl={s < 0 ? [3, 10] : undefined} hlColor={PALETTE.rna} />
          </group>
          <mesh position={[4, 1.2, 0]} material={org(PALETTE.ligase, 0.6)} scale={[1.2, 0.9, 0.9]}>
            <sphereGeometry args={[1, 24, 16]} />
          </mesh>
        </group>
      ))}
      <Spin axis="x" speed={2}>
        <mesh rotation-y={Math.PI / 2} material={org(PALETTE.hnh, 0.8)}>
          <torusGeometry args={[1.5, 0.38, 16, 40]} />
        </mesh>
      </Spin>
    </Spin>
  )
}

// ---------- Expressão gênica ----------
/** Tubo que "cresce" ciclicamente (RNA sendo sintetizado). */
function Growing({ geo, mat, period = 6 }: { geo: THREE.TubeGeometry; mat: THREE.Material; period?: number }) {
  const total = geo.index!.count
  useFrame(({ clock }) => {
    geo.setDrawRange(0, Math.floor((((clock.elapsedTime / period) % 1) * total) / 3) * 3)
  })
  return <mesh geometry={geo} material={mat} />
}

function Transcription() {
  const rna = useMemo(
    () =>
      tube(
        Array.from({ length: 34 }, (_, k) => V(-0.4 - k * 0.22, 1.7 + k * 0.17 + Math.sin(k * 0.7) * 0.45, Math.cos(k * 0.5) * 0.7)),
        0.13,
        200,
      ),
    [],
  )
  return (
    <group>
      <MiniDuplex seq="GCTATAAAAGGCATGCCGTTAGCATCGGAT" quality="medium" hl={[3, 8]} hlColor="#ffffff" />
      <mesh position={[0.4, 0.3, 0]} scale={[2.3, 1.9, 1.9]} material={org(PALETTE.ruvc, 0.5)}>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>
      <Growing geo={rna} mat={std(PALETTE.rna, 0.6)} />
    </group>
  )
}

function Splicing() {
  const ex1 = useRef<THREE.Group>(null!),
    ex2 = useRef<THREE.Group>(null!),
    intron = useRef<THREE.Group>(null!)
  const geo = useMemo(
    () => ({
      exon: new THREE.CylinderGeometry(0.3, 0.3, 4.6, 16).rotateZ(Math.PI / 2),
      intron: tube([V(-1.2, 0, 0), V(-1.1, 1.4, 0), V(-1.6, 2.6, 0.2), V(-0.6, 3.6, 0), V(0.8, 3.4, -0.2), V(1.2, 2.4, 0), V(1.1, 1.2, 0), V(1.2, 0, 0)], 0.16),
    }),
    [],
  )
  const intronMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a9b8c9', roughness: 0.5, transparent: true }), [])
  useFrame(({ clock }) => {
    const u = (clock.elapsedTime / 7) % 1
    const s = THREE.MathUtils.smoothstep(u, 0.35, 0.7)
    ex1.current.position.x = -3.5 + s * 1.2
    ex2.current.position.x = 3.5 - s * 1.2
    intron.current.position.y = s * 3
    intron.current.scale.setScalar(1 - s * 0.5)
    intronMat.opacity = 1 - s
  })
  return (
    <group>
      <group ref={ex1}>
        <mesh geometry={geo.exon} material={std(PALETTE.strand1, 0.4)} />
      </group>
      <group ref={ex2}>
        <mesh geometry={geo.exon} material={std(PALETTE.ku, 0.4)} />
      </group>
      <group ref={intron}>
        <mesh geometry={geo.intron} material={intronMat} />
      </group>
      <mesh position={[0, 0.8, 0]} scale={[2.2, 1.6, 1.7]} material={org(PALETTE.deaminase, 0.4)}>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>
    </group>
  )
}

const PORES: Vec3[] = [[0, 0, 0], ...Array.from({ length: 6 }, (_, k): Vec3 => [Math.cos((k * Math.PI) / 3) * 5, 0, Math.sin((k * Math.PI) / 3) * 5])]
function NuclearPore() {
  const rings = useRef<THREE.InstancedMesh>(null!)
  const knobs = useRef<THREE.InstancedMesh>(null!)
  const mrna = useMemo(
    () =>
      tube(
        Array.from({ length: 12 }, (_, k) => V(Math.sin(k) * 0.25, -4 + k * 0.75, Math.cos(k * 1.3) * 0.25)),
        0.12,
      ),
    [],
  )
  useLayoutEffect(() => {
    const m = new THREE.Matrix4(),
      q = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI / 2),
      one = V(1, 1, 1)
    PORES.forEach((p, i) => {
      rings.current.setMatrixAt(i, m.compose(V(...p), q, one))
      for (let k = 0; k < 8; k++)
        knobs.current.setMatrixAt(i * 8 + k, m.makeTranslation(p[0] + Math.cos((k * Math.PI) / 4) * 1.5, 0, p[2] + Math.sin((k * Math.PI) / 4) * 1.5))
    })
    rings.current.instanceMatrix.needsUpdate = knobs.current.instanceMatrix.needsUpdate = true
  }, [])
  // referencial local com a normal da membrana em y; o grupo externo vira a normal para +z (de frente)
  return (
    <group rotation-x={Math.PI / 2}>
      {[-0.6, 0.6].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={org('#2a9df4', 0.18, 0.7)}>
          <cylinderGeometry args={[9, 9, 0.25, 64]} />
        </mesh>
      ))}
      <instancedMesh ref={rings} args={[undefined, std('#8a5cff', 0.45), PORES.length]}>
        <torusGeometry args={[1.1, 0.35, 12, 32]} />
      </instancedMesh>
      <instancedMesh ref={knobs} args={[undefined, std('#d8c0ff', 0.4), PORES.length * 8]}>
        <sphereGeometry args={[0.22, 10, 8]} />
      </instancedMesh>
      <Growing geo={mrna} mat={std(PALETTE.rna, 0.6)} period={4} />
    </group>
  )
}

function Ribosome() {
  const beads = useRef<THREE.InstancedMesh>(null!)
  const mrna = useMemo(
    () =>
      tube(
        Array.from({ length: 16 }, (_, k) => V(-7 + k * 0.95, -0.15 + Math.sin(k * 0.8) * 0.2, 0)),
        0.12,
      ),
    [],
  )
  useLayoutEffect(() => {
    const path = new THREE.CatmullRomCurve3([V(0, 2.4, 0), V(0.6, 3.4, 0.4), V(1.6, 4, -0.2), V(2.2, 5, 0.6), V(3.2, 5.6, 0)])
    const cols = Object.values(PALETTE),
      m = new THREE.Matrix4(),
      c = new THREE.Color()
    for (let i = 0; i < 15; i++) {
      beads.current.setMatrixAt(i, m.makeTranslation(path.getPointAt(i / 14)))
      beads.current.setColorAt(i, c.set(cols[i % cols.length]))
    }
  }, [])
  useFrame(({ clock }) => {
    beads.current.count = Math.floor(clock.elapsedTime * 1.5) % 16
  })
  return (
    <group>
      <mesh position={[0, 0.9, 0]} scale={[2.4, 1.6, 2]} material={org(PALETTE.ku, 0.55)}>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>
      <mesh position={[0, -1, 0]} scale={[1.8, 0.85, 1.5]} material={org(PALETTE.deaminase, 0.6)}>
        <sphereGeometry args={[1, 32, 24]} />
      </mesh>
      <mesh geometry={mrna} material={std(PALETTE.rna, 0.6)} />
      <instancedMesh
        ref={beads}
        args={[undefined, memo('bead', () => new THREE.MeshStandardMaterial({ roughness: 0.45, emissive: '#ffffff', emissiveIntensity: 0.2 })), 15]}
      >
        <sphereGeometry args={[0.26, 12, 10]} />
      </instancedMesh>
    </group>
  )
}

const RNA_BASES = ['U', 'C', 'A', 'G']
const STOPS = new Set(['UAA', 'UAG', 'UGA'])
/** Junta segmentos de anel numa geometria só, com a cor de cada um nos vértices. */
function ringSegments(segs: { r: [number, number]; a: number; len: number; color: string }[], k = 1) {
  const c = new THREE.Color()
  return mergeGeometries(
    segs.map((s) => {
      const g = new THREE.RingGeometry(s.r[0], s.r[1], 6, 1, s.a + s.len * 0.03, s.len * 0.94)
      c.set(s.color).multiplyScalar(k)
      const n = g.attributes.position.count
      const col = new Float32Array(n * 3)
      for (let v = 0; v < n; v++) col.set([c.r, c.g, c.b], v * 3)
      return g.setAttribute('color', new THREE.BufferAttribute(col, 3))
    }),
  )
}

function Codons() {
  const geo = useMemo(() => {
    const segs: { r: [number, number]; a: number; len: number; color: string; hot?: boolean }[] = []
    RNA_BASES.forEach((b1, i) => {
      segs.push({ r: [0.6, 1.8], a: (i * Math.PI) / 2, len: Math.PI / 2, color: BASE_COLOR[b1] })
      RNA_BASES.forEach((b2, j) => {
        segs.push({ r: [1.9, 3.1], a: ((i * 4 + j) * Math.PI) / 8, len: Math.PI / 8, color: BASE_COLOR[b2] })
        RNA_BASES.forEach((b3, k) => {
          const c = b1 + b2 + b3
          const hot = STOPS.has(c) ? PALETTE.mismatch : c === 'AUG' ? '#ffffff' : undefined
          segs.push({ r: [3.2, 4.6], a: ((i * 16 + j * 4 + k) * Math.PI) / 32, len: Math.PI / 32, color: hot ?? BASE_COLOR[b3], hot: !!hot })
        })
      })
    })
    return {
      base: ringSegments(segs.filter((s) => !s.hot)),
      hot: ringSegments(
        segs.filter((s) => s.hot),
        2.2,
      ),
    }
  }, [])
  return (
    <Spin axis="z" speed={0.04}>
      <mesh geometry={geo.base} material={memo('wheel', () => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }))} />
      <mesh
        geometry={geo.hot}
        material={memo('wheelHot', () => new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, toneMapped: false }))}
      />
    </Spin>
  )
}

// ---------- Origem do CRISPR ----------
let phageBody: THREE.BufferGeometry | null = null
/** Cauda + placa + 6 pernas do fago numa geometria só (compartilhada por todos os fagos). */
function phageGeometry() {
  if (phageBody) return phageBody
  const parts = [
    new THREE.CylinderGeometry(0.2, 0.2, 2.4, 10).translate(0, 0.5, 0),
    new THREE.CylinderGeometry(0.55, 0.55, 0.16, 12).translate(0, 1.75, 0),
    ...Array.from({ length: 6 }, (_, k) =>
      new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6)
        .rotateZ(-0.9)
        .translate(0.7, 2.25, 0)
        .rotateY((k * Math.PI) / 3),
    ),
  ]
  phageBody = mergeGeometries(parts)
  return phageBody
}

/** Fago T4 estilizado, cauda apontando para +z (use lookAt para mirar). */
function Phage({ scale = 1 }: { scale?: number }) {
  return (
    <group scale={scale}>
      <group rotation-x={Math.PI / 2}>
        <mesh
          position={[0, -1.7, 0]}
          material={memo(
            'phage',
            () =>
              new THREE.MeshStandardMaterial({
                color: '#c7d2e0',
                metalness: 0.6,
                roughness: 0.3,
                flatShading: true,
                emissive: '#3a4a66',
                emissiveIntensity: 0.4,
              }),
          )}
        >
          <icosahedronGeometry args={[1.1, 0]} />
        </mesh>
        <mesh geometry={phageGeometry()} material={std('#a9b8c9')} />
      </group>
    </group>
  )
}

function Bacterium() {
  const spacers = useMemo(() => {
    const r = rand(3)
    return Array.from({ length: 8 }, () => 'ACGT'[Math.floor(r() * 4)])
  }, [])
  const flag = useMemo(
    () =>
      tube(
        Array.from({ length: 14 }, (_, k) => V(5.6 + k * 0.6, Math.sin(k * 0.9) * 0.6, Math.cos(k * 0.9) * 0.3)),
        0.06,
      ),
    [],
  )
  return (
    <group>
      <mesh rotation-z={Math.PI / 2} material={org(PALETTE.donor, 0.3, 0.5)}>
        <capsuleGeometry args={[2.6, 6, 12, 32]} />
      </mesh>
      <mesh rotation-x={1.1} position={[-1.5, -0.6, 0]} material={std(PALETTE.strand2, 0.5)}>
        <torusGeometry args={[1.4, 0.06, 8, 64]} />
      </mesh>
      {spacers.map((b, i) => (
        <group key={i} position={[-2.8 + i * 0.75, 0.7, 0]}>
          <mesh position={[-0.37, 0, 0]} material={glow('#ffffff', 1.6)}>
            <octahedronGeometry args={[0.16]} />
          </mesh>
          <mesh material={std(BASE_COLOR[b], 0.6)}>
            <boxGeometry args={[0.45, 0.24, 0.24]} />
          </mesh>
        </group>
      ))}
      <mesh position={[1.4, -1, 0.6]} scale={[0.8, 0.6, 0.6]} material={org(PALETTE.cas, 0.7)}>
        <sphereGeometry args={[1, 20, 16]} />
      </mesh>
      <mesh geometry={flag} material={std('#a9b8c9')} />
      {/* fago acoplado à membrana, injetando DNA */}
      <group position={[0.5, 4.4, 0]} rotation-x={Math.PI / 2}>
        <Phage scale={0.5} />
      </group>
    </group>
  )
}

const PHAGES: Vec3[] = [
  [0, 0, 0],
  [2.6, 1.8, -1.2],
  [-2.4, 1.2, 1.6],
]
function Phages() {
  const g = useRef<THREE.Group>(null!)
  useLayoutEffect(() => {
    const target = V(...(EXHIBIT.bacterium.pos as Vec3))
    g.current.updateWorldMatrix(true, true)
    g.current.children.forEach((c) => c.lookAt(target))
  }, [])
  return (
    <group ref={g}>
      {PHAGES.map((p, i) => (
        <group key={i} position={p}>
          <Phage />
        </group>
      ))}
    </group>
  )
}

function CasFamily() {
  const t = useT()
  const camera = useThree((s) => s.camera)
  const home = useMemo(() => V(...(EXHIBIT.casfamily.pos as Vec3)), [])
  const rna = useMemo(() => tube([V(-1.4, -1.6, 0.8), V(-0.4, -1.1, 1.4), V(0.6, -1.8, 1), V(1.6, -1.2, 0.6)], 0.09), [])
  const peg = useMemo(() => tube([V(0.6, 1.2, 0.6), V(1.6, 2.1, 0.3), V(2.6, 1.6, -0.4), V(3.2, 2.4, 0)], 0.09), [])
  const explore = useSim((s) => s.explore)
  const near = (o: THREE.Vector3, x: number) => {
    o.set(x, 2.6, 0)
    return camera.position.distanceTo(home) < 22
  }
  return (
    <group>
      <group position={[-5, 0, 0]}>
        <mesh scale={[1.7, 1.3, 1.3]} material={org(PALETTE.ku, 0.6)}>
          <sphereGeometry args={[1, 32, 24]} />
        </mesh>
        <group position={[0, -1.4, 0]} scale={0.55}>
          <MiniDuplex seq="TTTACGGATCC" quality="low" />
        </group>
      </group>
      <group position={[0, 0, 0]}>
        <mesh scale={[1.5, 1.4, 1.3]} material={org(PALETTE.ligase, 0.6)}>
          <sphereGeometry args={[1, 32, 24]} />
        </mesh>
        <mesh geometry={rna} material={std(PALETTE.rna, 0.6)} />
      </group>
      <group position={[5, 0, 0]}>
        <mesh scale={[1.6, 1.3, 1.3]} material={org(PALETTE.cas, 0.55)}>
          <sphereGeometry args={[1, 32, 24]} />
        </mesh>
        <mesh position={[1.7, -0.6, 0.4]} scale={0.85} material={org(PALETTE.rna, 0.7)}>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        <group position={[-1.6, 0, 0]}>
          <mesh geometry={peg} material={std(PALETTE.rna, 0.6)} />
        </group>
      </group>
      {explore && (
        <>
          <Label tone={PALETTE.ku} at={(o) => near(o, -5)}>
            Cas12a · DNA
          </Label>
          <Label tone={PALETTE.ligase} at={(o) => near(o, 0)}>
            Cas13 · RNA
          </Label>
          <Label tone={PALETTE.cas} at={(o) => near(o, 5)}>
            {t('Prime editor', 'Prime editor')}
          </Label>
        </>
      )}
    </group>
  )
}

// ---------- Clínica e variação ----------
function Sickle() {
  const cells = useMemo(() => {
    const r = rand(41)
    return Array.from({ length: 9 }, (_, i) => ({
      pos: [(r() - 0.5) * 9, (r() - 0.5) * 6, (r() - 0.5) * 6] as Vec3,
      rot: [r() * 6, r() * 6, r() * 6] as Vec3,
      sickle: i % 3 === 0,
      spin: 0.2 + r() * 0.4,
    }))
  }, [])
  const red = std('#d7263d', 0.35)
  return (
    <>
      {cells.map((c, i) => (
        <Spin key={i} axis={(['x', 'y', 'z'] as const)[i % 3]} speed={c.spin} position={c.pos} rotation={c.rot}>
          {c.sickle ? (
            <mesh material={red}>
              <torusGeometry args={[1.3, 0.36, 12, 32, 2.6]} />
            </mesh>
          ) : (
            <>
              <mesh material={red}>
                <torusGeometry args={[0.9, 0.48, 16, 32]} />
              </mesh>
              <mesh rotation-x={Math.PI / 2} material={red}>
                <cylinderGeometry args={[0.9, 0.9, 0.3, 24]} />
              </mesh>
            </>
          )}
        </Spin>
      ))}
    </>
  )
}

function Snp() {
  return (
    <Spin axis="x" speed={0.3} scale={1.25}>
      <group position={[0, 1.6, 0]}>
        <MiniDuplex seq="GACTTCGAGCATGGAC" quality="medium" hl={[7, 8]} hlColor="#ffffff" />
      </group>
      <group position={[0, -1.6, 0]}>
        <MiniDuplex seq="GACTTCGAACATGGAC" quality="medium" hl={[7, 8]} hlColor={PALETTE.mismatch} />
      </group>
    </Spin>
  )
}

/**
 * Monta oculto (ver Scene.tsx): pré-compila os shaders em paralelo, sem desenhar, e só aparece no
 * modo Explorar — entrar no modo deixa de travar a cena.
 */
export default function Exhibits() {
  const root = useRef<THREE.Group>(null!)
  const ready = useRef(false)
  const gl = useThree((s) => s.gl)
  const camera = useThree((s) => s.camera)
  const scene = useThree((s) => s.scene)
  useEffect(() => {
    let alive = true
    const r = root.current
    // compile() percorre só objetos visíveis: liga, dispara (a travessia é síncrona) e desliga
    r.visible = true
    const mats = gl.compile(r, camera, scene)
    r.visible = false
    const done = () => {
      if (alive) ready.current = true
    }
    // espera própria em vez de gl.compileAsync: a dele lança num timer (impossível de capturar) se um programa
    // for liberado antes de ficar pronto
    const isReady = (m: THREE.Material) => (gl.properties.get(m) as { currentProgram?: { isReady(): boolean } }).currentProgram?.isReady() ?? true
    const compiled = new Promise<void>((res) => {
      const poll = () => (!alive || [...mats].every(isReady) ? res() : setTimeout(poll, 10))
      poll()
    })
    compiled.then(() => {
      if (!alive || gl.extensions.has('KHR_parallel_shader_compile')) return done()
      // sem compilação paralela, a ligação dos programas (e o envio da geometria) só acontece no 1º desenho:
      // força-o agora, num alvo 1×1 e com uma câmera que vê o mundo todo, em vez de travar ao entrar no modo
      const rt = new THREE.WebGLRenderTarget(1, 1)
      const eye = new THREE.PerspectiveCamera(70, 1, 1, 600)
      eye.position.set(0, 0, 260)
      const prev = gl.getRenderTarget()
      r.visible = true
      gl.setRenderTarget(rt)
      gl.render(scene, eye)
      gl.setRenderTarget(prev)
      r.visible = false
      rt.dispose()
      done()
    }, done)
    return () => {
      alive = false
    }
  }, [gl, camera, scene])
  useFrame(() => {
    root.current.visible = ready.current && useSim.getState().explore
  })
  return (
    <group ref={root} visible={false}>
      <Spot id="pairing">
        <Pairing />
      </Spot>
      <Spot id="nucleosome">
        <Nucleosomes />
      </Spot>
      <Spot id="methyl">
        <Methylation />
      </Spot>
      {/* sem virar: o telômero da zona fica numa posição fixa em relação ao cromossomo */}
      <Spot id="chromosome" label={4} face={false}>
        <Chromosome />
      </Spot>
      <Spot id="genome">
        <Genome />
      </Spot>
      <Spot id="replication">
        <Replication />
      </Spot>
      <Spot id="transcription">
        <Transcription />
      </Spot>
      <Spot id="splicing" label={5}>
        <Splicing />
      </Spot>
      <Spot id="pore" label={6}>
        <NuclearPore />
      </Spot>
      <Spot id="ribosome" label={5}>
        <Ribosome />
      </Spot>
      <Spot id="codons">
        <Codons />
      </Spot>
      <Spot id="bacterium">
        <Bacterium />
      </Spot>
      <Spot id="phage">
        <Phages />
      </Spot>
      <Spot id="casfamily">
        <CasFamily />
      </Spot>
      <Spot id="sickle">
        <Sickle />
      </Spot>
      <Spot id="snp">
        <Snp />
      </Spot>
    </group>
  )
}
