import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useT } from '../../i18n'
import { PALETTE } from '../colors'
import { useSim, type Quality } from '../store'
import { Label } from './Labels'
import { organicMaterial, tickOrganic } from './materials'
import { clamp01, smooth } from './timeline'
import { tip, untip } from './shared'

const CELL_R = 28
const NUC_R = 17
const COUNT = 14

const fib = (i: number, n: number) => {
  const y = 1 - ((i + 0.5) / n) * 2
  const r = Math.sqrt(1 - y * y)
  const t = i * Math.PI * (3 - Math.sqrt(5))
  return new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r)
}

/** Raio do portador ao longo da jornada: fora → membrana → citoplasma → poro nuclear → núcleo. */
function journey(t: number, inner: number) {
  if (t < 0.35) return THREE.MathUtils.lerp(48, CELL_R + 0.8, smooth(0, 0.35, t))
  if (t < 0.5) return THREE.MathUtils.lerp(CELL_R + 0.8, CELL_R - 2.5, smooth(0.35, 0.5, t))
  if (t < 0.8) return THREE.MathUtils.lerp(CELL_R - 2.5, NUC_R + 0.4, smooth(0.5, 0.8, t))
  return THREE.MathUtils.lerp(NUC_R + 0.4, inner, smooth(0.8, 1, t))
}

export default function Delivery({ quality }: { quality: Quality }) {
  const t = useT()
  const g = useRef<THREE.Group>(null!)
  const carriers = useRef<THREE.Group>(null!)
  const nucleus = useRef<THREE.Mesh>(null!)
  const delivery = useSim((s) => s.delivery)
  const dirs = useMemo(() => Array.from({ length: COUNT }, (_, i) => fib(i, COUNT)), [])
  const seg = quality === 'low' ? 18 : quality === 'medium' ? 28 : 40
  const mats = useMemo(
    () => ({
      membrane: organicMaterial({ color: '#3ef0d0', rim: '#9ffff0', opacity: 0.32, amp: 0.9, freq: 0.07, speed: 0.08, power: 2.6, irid: 0.65 }),
      nucleus: organicMaterial({ color: '#6a4dff', rim: '#b9a8ff', opacity: 0.38, amp: 0.55, freq: 0.1, speed: 0.06, power: 2.2, irid: 0.25 }),
      organelle: organicMaterial({ color: '#ff9a6b', rim: '#ffd0b0', opacity: 0.35, amp: 0.25, freq: 0.6, power: 1.8 }),
      rnp: organicMaterial({ color: PALETTE.cas, rim: '#ffc0e0', opacity: 0.85, amp: 0.15, freq: 1.4, power: 1.5 }),
      vesicle: organicMaterial({ color: '#ffe9a8', rim: '#fff6d6', opacity: 0.4, amp: 0.08, freq: 1.0, power: 2.4, irid: 0.5 }),
      plasmid: new THREE.MeshPhysicalMaterial({ color: '#4cc9ff', emissive: '#4cc9ff', emissiveIntensity: 0.6, roughness: 0.3, clearcoat: 1 }),
      capsid: new THREE.MeshPhysicalMaterial({
        color: '#7dff9b',
        emissive: '#2a8f4a',
        emissiveIntensity: 0.5,
        roughness: 0.35,
        metalness: 0.1,
        clearcoat: 1,
        flatShading: true,
      }),
      pore: new THREE.MeshStandardMaterial({ color: '#b9a8ff', emissive: '#6a4dff', emissiveIntensity: 0.8, roughness: 0.5 }),
    }),
    [],
  )
  const geo = useMemo(
    () => ({
      cell: new THREE.IcosahedronGeometry(CELL_R, seg),
      nucleus: new THREE.IcosahedronGeometry(NUC_R, seg),
      organelle: new THREE.CapsuleGeometry(0.9, 2.6, 6, 14),
      blob: new THREE.IcosahedronGeometry(1, 8),
      plasmid: new THREE.TorusKnotGeometry(0.75, 0.09, 140, 8, 2, 7),
      capsid: new THREE.IcosahedronGeometry(1.15, 1),
      pore: new THREE.TorusGeometry(0.5, 0.17, 8, 20),
    }),
    [seg],
  )
  // poros nucleares distribuídos na superfície do núcleo
  const pores = useMemo(() => {
    const im = new THREE.InstancedMesh(geo.pore, mats.pore, 70)
    const m = new THREE.Matrix4(),
      q = new THREE.Quaternion(),
      z = new THREE.Vector3(0, 0, 1)
    for (let i = 0; i < 70; i++) {
      const d = fib(i, 70)
      q.setFromUnitVectors(z, d)
      im.setMatrixAt(i, m.compose(d.clone().multiplyScalar(NUC_R + 0.15), q, new THREE.Vector3(1, 1, 1)))
    }
    return im
  }, [geo.pore, mats.pore])
  const organelles = useMemo(() => {
    let s = 3
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647
    return Array.from({ length: 16 }, () => {
      const d = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).normalize()
      return { pos: d.multiplyScalar(NUC_R + 3 + r() * 5), rot: [r() * 6, r() * 6, r() * 6] as [number, number, number], s: 0.7 + r() * 0.6 }
    })
  }, [])

  useFrame(({ clock }) => {
    const { step, progress } = useSim.getState()
    // a célula só aparece na etapa de entrega: fora dela, polui a leitura do DNA
    g.current.visible = step === 1
    if (step !== 1) return
    tickOrganic(g.current, clock.elapsedTime)
    // o núcleo se dissolve no fim, quando a câmera mergulha até o DNA
    mats.nucleus.uniforms.uOpacity.value = 0.38 * (1 - smooth(0.82, 1, progress))
    mats.membrane.uniforms.uOpacity.value = 0.32 * (1 - smooth(0.85, 1, progress) * 0.7)
    const inner = delivery === 'rnp' ? 5 : 8
    carriers.current.children.forEach((c, i) => {
      const tt = clamp01((progress - i * 0.018) / 0.75)
      const r = journey(tt, inner)
      // trajetória levemente curva no citoplasma
      const wob = Math.sin(tt * Math.PI) * 2.2
      c.position
        .copy(dirs[i])
        .multiplyScalar(r)
        .add(_w.set(Math.sin(i * 1.7) * wob, Math.cos(i * 2.3) * wob, 0))
      c.rotation.set(progress * 3 + i, progress * 2.4, 0)
      // vesícula (endossomo) envolve o portador na entrada e se rompe no "escape endossomal"
      const ves = c.children[1] as THREE.Mesh | undefined
      if (ves) {
        const k = smooth(0.38, 0.5, tt) * (1 - smooth(0.62, 0.7, tt))
        ves.visible = delivery !== 'rnp' && k > 0.01
        ves.scale.setScalar(0.6 + k * 1.2)
      }
      c.visible = tt < 0.999 || delivery !== 'rnp'
    })
  })

  return (
    <group ref={g}>
      <mesh
        geometry={geo.cell}
        material={mats.membrane}
        renderOrder={1}
        onPointerMove={(e) =>
          tip(
            e,
            t('Membrana plasmática', 'Plasma membrane'),
            t(
              'Barreira que o sistema de entrega precisa atravessar (eletroporação, lipofecção, LNP, transdução viral…).',
              'The barrier any delivery system must cross (electroporation, lipofection, LNPs, viral transduction…).',
            ),
          )
        }
        onPointerOut={untip}
      />
      <mesh
        ref={nucleus}
        geometry={geo.nucleus}
        material={mats.nucleus}
        renderOrder={2}
        onPointerMove={(e) =>
          tip(
            e,
            t('Núcleo', 'Nucleus'),
            t(
              'O alvo está no genoma, dentro do núcleo: o complexo precisa entrar pelos poros nucleares (ou durante a divisão celular).',
              'The target sits in the genome, inside the nucleus: the complex must get in through nuclear pores (or during cell division).',
            ),
          )
        }
        onPointerOut={untip}
      />
      <primitive object={pores} />
      {organelles.map((o, i) => (
        <mesh key={i} geometry={geo.organelle} material={mats.organelle} position={o.pos} rotation={o.rot} scale={o.s} renderOrder={2} />
      ))}
      <group ref={carriers}>
        {dirs.map((_, i) => (
          <group key={`${delivery}-${i}`}>
            {delivery === 'rnp' && <mesh geometry={geo.blob} material={mats.rnp} scale={0.9} renderOrder={5} />}
            {delivery === 'plasmid' && <mesh geometry={geo.plasmid} material={mats.plasmid} />}
            {delivery === 'viral' && <mesh geometry={geo.capsid} material={mats.capsid} />}
            {delivery !== 'rnp' && <mesh geometry={geo.blob} material={mats.vesicle} renderOrder={5} />}
          </group>
        ))}
      </group>
      <Label
        tone={PALETTE.strand1}
        at={(o) => {
          o.set(0, CELL_R + 2, 0)
          const s = useSim.getState()
          return s.step === 1 && s.progress < 0.5
        }}
      >
        {t('membrana plasmática', 'plasma membrane')}
      </Label>
      <Label
        tone="#b9a8ff"
        at={(o) => {
          o.set(NUC_R * 0.7, NUC_R * 0.75, 0)
          const s = useSim.getState()
          return s.step === 1 && s.progress > 0.45 && s.progress < 0.85
        }}
      >
        {t('núcleo · poros nucleares', 'nucleus · nuclear pores')}
      </Label>
      <Label
        tone={delivery === 'rnp' ? PALETTE.cas : delivery === 'plasmid' ? '#4cc9ff' : PALETTE.donor}
        at={(o) => {
          const c = carriers.current?.children[2]
          if (!c) return false
          o.copy(c.position).y += 1.6
          const s = useSim.getState()
          return s.step === 1 && s.progress < 0.42
        }}
      >
        {delivery === 'rnp'
          ? t('RNP · Cas9 + sgRNA prontos', 'RNP · pre-assembled Cas9 + sgRNA')
          : delivery === 'plasmid'
            ? t('plasmídeo em lipoplexo', 'plasmid in a lipoplex')
            : t('capsídeo de AAV', 'AAV capsid')}
      </Label>
    </group>
  )
}

const _w = new THREE.Vector3()
