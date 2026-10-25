import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import { Bloom, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three-stdlib'
import { BASE_COLOR, PALETTE } from '../playground/colors'
import { Tube } from '../playground/scene/tube'
import { glowTexture, glowingPhysical } from '../playground/scene/materials'
import { GROOVE, RISE, TWIST, smooth } from '../playground/scene/timeline'

const N = 64
/** Telas de toque: resolução de render menor (carrega mais rápido, poupa bateria). */
const COARSE = typeof matchMedia !== 'undefined' && matchMedia('(pointer: coarse)').matches
const R = 1.3
const SEQ = 'ATGGCTAGCAAGGTCTGACCATGTCGACGTTCCAGTGGCTAACGATCCTGCAGTTCGAGCCAGGAT'
const COMP: Record<string, string> = { A: 'T', T: 'A', C: 'G', G: 'C' }

/** Lê o progresso de rolagem do hero (0 no topo, 1 quando ele sai da tela). */
const heroScroll = () => Math.min(1, Math.max(0, scrollY / Math.max(1, innerHeight)))

// temporários reutilizados (sem alocação por quadro durante a rolagem)
const _m = new THREE.Matrix4(),
  _y = new THREE.Vector3(),
  _ys = new THREE.Vector3(),
  _x = new THREE.Vector3(0, 1, 0),
  _z = new THREE.Vector3(),
  _mid = new THREE.Vector3(),
  _col = new THREE.Color()

/** Placa de base k, de `from` em direção a `to`, encolhendo conforme a fita abre. */
function plate(im: THREE.InstancedMesh, k: number, from: THREE.Vector3, to: THREE.Vector3, base: string, open: number) {
  _y.subVectors(to, from)
  const len = (_y.length() * 0.5 - 0.04) * (1 - open * 0.85)
  _y.normalize()
  _z.crossVectors(_x, _y)
  _mid.copy(from).addScaledVector(_y, len / 2)
  _m.makeBasis(_x, _ys.copy(_y).multiplyScalar(Math.max(0.01, len)), _z).setPosition(_mid)
  im.setMatrixAt(k, _m)
  im.setColorAt(k, _col.set(BASE_COLOR[base]).multiplyScalar(1 + open * 0.8))
}

function Helix({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null!)
  const plates = useRef<THREE.InstancedMesh>(null!)
  const phos = useRef<THREE.InstancedMesh>(null!)
  const tubes = useMemo(() => ({ a: new Tube(N, 4, 12), b: new Tube(N, 4, 12) }), [])
  useEffect(
    () => () => {
      tubes.a.dispose()
      tubes.b.dispose()
    },
    [tubes],
  )
  const mats = useMemo(
    () => ({
      bb: glowingPhysical({ vertexColors: true, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15, glow: 0.4 }),
      plate: glowingPhysical({ roughness: 0.35, clearcoat: 0.5, glow: 0.42 }),
      phos: glowingPhysical({ roughness: 0.2, clearcoat: 1, glow: 0.3 }),
    }),
    [],
  )
  const geo = useMemo(() => ({ plate: new RoundedBoxGeometry(0.13, 1, 0.36, 2, 0.04), phos: new THREE.SphereGeometry(0.17, 16, 12) }), [])
  useEffect(
    () => () => {
      for (const m of Object.values(mats)) m.dispose()
      geo.plate.dispose()
      geo.phos.dispose()
    },
    [mats, geo],
  )
  const pts = useMemo(() => ({ a: Array.from({ length: N }, () => new THREE.Vector3()), b: Array.from({ length: N }, () => new THREE.Vector3()) }), [])
  const state = useRef({ u: -1 })
  const c1 = useMemo(() => new THREE.Color(PALETTE.strand1), [])
  const c2 = useMemo(() => new THREE.Color(PALETTE.strand2), [])

  useFrame(({ pointer, clock }, dt) => {
    const g = group.current
    if (!still) g.rotation.y += dt * 0.22
    g.rotation.x = THREE.MathUtils.lerp(g.rotation.x, -pointer.y * 0.3, 0.05)
    g.rotation.z = THREE.MathUtils.lerp(g.rotation.z, 0.5 - pointer.x * 0.25, 0.05)
    g.position.y = still ? 0 : Math.sin(clock.elapsedTime * 0.6) * 0.15

    // ao rolar, a dupla-fita "abre o zíper" de cima para baixo
    const target = still ? 0 : heroScroll()
    const s = state.current
    const u = s.u < 0 ? target : THREE.MathUtils.lerp(s.u, target, 0.12)
    if (Math.abs(u - s.u) < 1e-4) return
    s.u = u
    for (let i = 0; i < N; i++) {
      const open = smooth(0, 1, u * 2.2 - (1 - i / N) * 1.1)
      const yy = (i - N / 2) * RISE * 1.12
      const phi = i * TWIST
      const r = R * (1 + 1.4 * open)
      pts.a[i].set(Math.cos(phi) * r, yy, Math.sin(phi) * r)
      pts.b[i].set(Math.cos(phi + GROOVE) * r, yy, Math.sin(phi + GROOVE) * r)
      const b1 = SEQ[i % SEQ.length]
      plate(plates.current, i, pts.a[i], pts.b[i], b1, open)
      plate(plates.current, N + i, pts.b[i], pts.a[i], COMP[b1], open)
      phos.current.setMatrixAt(i, _m.makeTranslation(pts.a[i]))
      phos.current.setMatrixAt(N + i, _m.makeTranslation(pts.b[i]))
      phos.current.setColorAt(i, c1)
      phos.current.setColorAt(N + i, c2)
    }
    tubes.a.update(
      pts.a,
      N,
      () => 0.12,
      (_, o) => o.copy(c1),
    )
    tubes.b.update(
      pts.b,
      N,
      () => 0.12,
      (_, o) => o.copy(c2),
    )
    for (const im of [plates.current, phos.current]) {
      im.instanceMatrix.needsUpdate = true
      if (im.instanceColor) im.instanceColor.needsUpdate = true
    }
  })
  return (
    <group ref={group} rotation={[0, 0, 0.5]}>
      <mesh geometry={tubes.a.geometry} material={mats.bb} frustumCulled={false} />
      <mesh geometry={tubes.b.geometry} material={mats.bb} frustumCulled={false} />
      <instancedMesh ref={plates} args={[geo.plate, mats.plate, N * 2]} frustumCulled={false} />
      <instancedMesh ref={phos} args={[geo.phos, mats.phos, N * 2]} frustumCulled={false} />
    </group>
  )
}

function Particles({ still }: { still: boolean }) {
  const ref = useRef<THREE.Points>(null!)
  const geo = useMemo(() => {
    let s = 9
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647
    const pos = new Float32Array(1200 * 3)
    for (let i = 0; i < pos.length; i++) pos[i] = (r() - 0.5) * (i % 3 === 2 ? 30 : 50)
    return new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3))
  }, [])
  useEffect(() => () => geo.dispose(), [geo])
  useFrame(({ pointer }, dt) => {
    if (still) return
    ref.current.rotation.y += dt * 0.02
    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, pointer.x * 0.8, 0.03)
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial map={glowTexture()} size={0.18} color={'#9ff7ff'} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

/** Enquadramento responsivo: à direita no desktop; menor e mais ao fundo em telas retrato. */
function Placement({ children }: { children: React.ReactNode }) {
  const aspect = useThree((s) => s.size.width / s.size.height)
  const portrait = aspect < 1
  return (
    <group position={portrait ? [1.8, -3.2, -5] : [3.4, 0, 0]} scale={portrait ? 0.8 : 1}>
      {children}
    </group>
  )
}

/** Avisa "pronto" só depois de alguns quadros realmente desenhados (shaders compilados, ambiente gerado). */
function ReadySignal({ onReady }: { onReady?: () => void }) {
  const frames = useRef(0)
  useFrame(({ invalidate }) => {
    frames.current += 1
    if (frames.current < 4) invalidate() // no frameloop 'demand' os quadros iniciais precisam ser pedidos
    if (frames.current === 4) onReady?.()
  })
  return null
}

export default function HeroHelix({ active, still, onReady }: { active: boolean; still: boolean; onReady?: () => void }) {
  return (
    <Canvas
      frameloop={!active ? 'never' : still ? 'demand' : 'always'}
      camera={{ position: [0, 0, 16], fov: 45 }}
      dpr={COARSE ? [1, 1.25] : [1, 1.75]}
      gl={{ antialias: false, stencil: false }}
      aria-hidden="true"
    >
      <ReadySignal onReady={onReady} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[6, 8, 8]} intensity={2} color={'#d6f4ff'} />
      <pointLight position={[-8, -4, 2]} intensity={90} color={'#c46bff'} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#9feaff" position={[0, 6, -8]} scale={[12, 5, 1]} />
        <Lightformer form="ring" intensity={3} color="#ff4fa3" position={[-6, 2, 5]} scale={4} />
        <Lightformer form="rect" intensity={1.6} color="#b06bff" position={[9, -2, 2]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
      </Environment>
      <Placement>
        <Helix still={still} />
      </Placement>
      <Particles still={still} />
      <EffectComposer multisampling={0} enableNormalPass={false}>
        <Bloom mipmapBlur intensity={1} luminanceThreshold={0.55} radius={0.75} />
        <Vignette offset={0.3} darkness={0.6} />
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      </EffectComposer>
    </Canvas>
  )
}
