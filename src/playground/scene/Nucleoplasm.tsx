import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useT } from '../../i18n'
import { PALETTE } from '../colors'
import { useSim, type Quality, type useDerived } from '../store'
import { Label } from './Labels'
import { glowTexture } from './materials'
import { MiniDuplex } from './Repair'
import { tip, untip } from './shared'

const rand = (seed: number) => {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/** Céu da cena: gradiente vertical com leve ruído, desenhado por dentro de uma esfera. */
function Backdrop() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { uTop: { value: new THREE.Color('#120a2a') }, uMid: { value: new THREE.Color('#04070f') }, uBot: { value: new THREE.Color('#031a1f') } },
        vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform vec3 uTop, uMid, uBot; varying vec3 vP;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      void main(){
        float y = vP.y;
        vec3 c = y > 0.0 ? mix(uMid, uTop, smoothstep(0.0, 0.9, y)) : mix(uMid, uBot, smoothstep(0.0, 0.9, -y));
        c += (h(floor(vP * 400.0)) - 0.5) * 0.012; // dithering contra banding
        gl_FragColor = vec4(c, 1.0);
      }`,
      }),
    [],
  )
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[220, 32, 16]} />
    </mesh>
  )
}

/** Partículas em suspensão (parallax e profundidade). */
function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null!)
  const geo = useMemo(() => {
    const r = rand(5)
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) pos.set([(r() - 0.5) * 120, (r() - 0.5) * 70, (r() - 0.5) * 90 - 10], i * 3)
    return new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(pos, 3))
  }, [count])
  useEffect(() => () => geo.dispose(), [geo])
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.elapsedTime * 0.006
    ref.current.position.y = Math.sin(clock.elapsedTime * 0.1) * 0.8
  })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial map={glowTexture()} size={0.35} color={'#9ff7ff'} transparent opacity={0.45} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  )
}

/** Fibras de cromatina ao fundo: "contas num colar" (DNA enrolado em nucleossomos). */
function Chromatin() {
  const ref = useRef<THREE.Group>(null!)
  const { tubes, beads } = useMemo(() => {
    const r = rand(17)
    const tubes: THREE.TubeGeometry[] = []
    const beadPos: THREE.Vector3[] = []
    for (let f = 0; f < 6; f++) {
      const pts: THREE.Vector3[] = []
      let p = new THREE.Vector3((r() - 0.5) * 120, (r() - 0.5) * 50, -55 - r() * 35)
      for (let k = 0; k < 9; k++) {
        pts.push(p.clone())
        p = p.clone().add(new THREE.Vector3((r() - 0.3) * 14, (r() - 0.5) * 12, (r() - 0.5) * 8))
      }
      const curve = new THREE.CatmullRomCurve3(pts)
      tubes.push(new THREE.TubeGeometry(curve, 160, 0.18, 6, false))
      for (let k = 0; k < 26; k++) beadPos.push(curve.getPointAt((k + 0.5) / 26))
    }
    const beads = new THREE.InstancedMesh(
      new THREE.SphereGeometry(0.9, 16, 12),
      new THREE.MeshStandardMaterial({ color: '#2c2558', emissive: '#1a1440', emissiveIntensity: 0.5, roughness: 0.7 }),
      beadPos.length,
    )
    const m = new THREE.Matrix4()
    beadPos.forEach((b, i) => beads.setMatrixAt(i, m.makeScale(1, 0.62, 1).setPosition(b)))
    return { tubes, beads }
  }, [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1f4257', emissive: '#0e2836', emissiveIntensity: 0.6, roughness: 0.7 }), [])
  useEffect(
    () => () => {
      for (const g of tubes) g.dispose()
      beads.geometry.dispose()
      ;(beads.material as THREE.Material).dispose()
      beads.dispose()
      mat.dispose()
    },
    [tubes, beads, mat],
  )
  useFrame(() => {
    ref.current.visible = useSim.getState().step !== 1
  })
  return (
    <group ref={ref}>
      {tubes.map((g, i) => (
        <mesh key={i} geometry={g} material={mat} />
      ))}
      <primitive object={beads} />
    </group>
  )
}

type Off = NonNullable<ReturnType<typeof useDerived>['offs']>[number]

/** Sítios off-target "em outros cromossomos": mini-hélices com halo proporcional ao risco. */
function OffTarget({ o, pos, protospacer, quality }: { o: Off; pos: [number, number, number]; protospacer: string; quality: Quality }) {
  const t = useT()
  const halo = useRef<THREE.Sprite>(null!)
  const g = useRef<THREE.Group>(null!)
  const mmIdx = useMemo(() => [...o.site].map((b, i) => (b !== protospacer[i] ? i : -1)).filter((i) => i >= 0), [o.site, protospacer])
  useFrame(({ clock }) => {
    const { step } = useSim.getState()
    const pulse = 0.85 + Math.sin(clock.elapsedTime * 3) * 0.15
    ;(halo.current.material as THREE.SpriteMaterial).opacity = Math.min(1, o.p * 0.9 * pulse * (step === 3 || step === 5 ? 1.6 : 1))
    g.current.visible = step !== 1
    g.current.rotation.x = clock.elapsedTime * 0.25
  })
  const label = t.pick(o.label)
  return (
    <group position={pos}>
      <group
        ref={g}
        scale={0.75}
        onPointerMove={(e) =>
          tip(
            e,
            label,
            t(
              `Sítio fictício parecido com o alvo (${mmIdx.length} mismatches, nas posições ${mmIdx.map((i) => i + 1).join(' e ')}). Probabilidade ilustrativa de corte: ${(o.p * 100).toFixed(0)}%.`,
              `Fictional site similar to the target (${mmIdx.length} mismatches, at positions ${mmIdx.map((i) => i + 1).join(' and ')}). Illustrative cleavage probability: ${(o.p * 100).toFixed(0)}%.`,
            ),
          )
        }
        onPointerOut={untip}
      >
        <MiniDuplex seq={o.site + o.pam} dim={0.75} quality={quality} />
      </group>
      <sprite ref={halo} scale={[12, 6, 1]}>
        <spriteMaterial map={glowTexture()} color={PALETTE.cas} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <Label
        tone={o.p > 0.35 ? PALETTE.cas : '#a9b8c9'}
        at={(v) => {
          v.set(0, 2.2, 0)
          return useSim.getState().step !== 1
        }}
      >
        {label.split(' · ')[0]} · {t('corte', 'cut')} ≈ {(o.p * 100).toFixed(0)}%
      </Label>
    </group>
  )
}

export default function Nucleoplasm({ offs, protospacer, quality }: { offs: Off[]; protospacer: string; quality: Quality }) {
  return (
    <>
      <Backdrop />
      <Dust count={quality === 'low' ? 250 : quality === 'medium' ? 600 : 1100} />
      {quality !== 'low' && <Chromatin />}
      {offs.map((o, i) => (
        <OffTarget key={i} o={o} protospacer={protospacer} quality={quality} pos={i === 0 ? [-12, 8, -16] : [12, 8, -16]} />
      ))}
    </>
  )
}
