import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three-stdlib'
import { COMP, HDR_INSERT } from '../../lib/dna'
import { useT } from '../../i18n'
import { BASE_COLOR, PALETTE } from '../colors'
import type { Quality } from '../store'
import { Label } from './Labels'
import { glowingPhysical, organicMaterial, tickOrganic } from './materials'
import { Tube } from './tube'
import { GROOVE, RADIUS, RISE, TWIST, frame, normalAt, tangentAt, type Ready } from './timeline'
import { TUBE_RES, tip, untip } from './shared'

// fora do componente: um array novo a cada render invalidaria o useMemo do MiniDuplex
const DONOR_HL: [number, number] = [16, 22]

/** Dupla-hélice estática (molde doador, off-targets): mesma linguagem visual do DNA principal. */
export function MiniDuplex({
  seq,
  hl,
  hlColor = '#ffffff',
  strand = PALETTE.strand1,
  strand2 = PALETTE.strand2,
  dim = 1,
  quality = 'medium',
}: {
  seq: string
  hl?: [number, number]
  hlColor?: string
  strand?: string
  strand2?: string
  dim?: number
  quality?: Quality
}) {
  const [sub, radial] = TUBE_RES[quality]
  const built = useMemo(() => {
    const n = seq.length
    const p1 = [],
      p2 = []
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * RISE,
        phi = i * TWIST
      p1.push(new THREE.Vector3(x, RADIUS * Math.cos(phi), RADIUS * Math.sin(phi)))
      p2.push(new THREE.Vector3(x, RADIUS * Math.cos(phi + GROOVE), RADIUS * Math.sin(phi + GROOVE)))
    }
    const inHl = (i: number) => !!hl && i >= hl[0] && i < hl[1]
    const t1 = new Tube(n, sub, radial),
      t2 = new Tube(n, sub, radial)
    const c1 = new THREE.Color(strand),
      c2 = new THREE.Color(strand2),
      ch = new THREE.Color(hlColor)
    t1.update(
      p1,
      n,
      () => 0.1,
      (i, o) => o.copy(inHl(i) ? ch : c1).multiplyScalar(dim * (inHl(i) ? 1.6 : 1)),
    )
    t2.update(
      p2,
      n,
      () => 0.1,
      (i, o) => o.copy(inHl(i) ? ch : c2).multiplyScalar(dim * (inHl(i) ? 1.6 : 1)),
    )
    const plates = new THREE.InstancedMesh(new RoundedBoxGeometry(0.11, 1, 0.3, 2, 0.035), glowingPhysical({ roughness: 0.4, glow: 0.4 }), n * 2)
    const m = new THREE.Matrix4(),
      y = new THREE.Vector3(),
      x = new THREE.Vector3(1, 0, 0),
      z = new THREE.Vector3(),
      mid = new THREE.Vector3(),
      col = new THREE.Color()
    for (let i = 0; i < n; i++) {
      const b = seq[i] in BASE_COLOR ? seq[i] : 'G'
      for (const [k, from, to, base] of [
        [i, p1[i], p2[i], b],
        [n + i, p2[i], p1[i], COMP[b] ?? 'C'],
      ] as const) {
        y.subVectors(to, from)
        const len = y.length() * 0.5 - 0.03
        y.normalize()
        z.crossVectors(x, y)
        mid.copy(from).addScaledVector(y, len / 2)
        m.makeBasis(x, y.clone().multiplyScalar(len), z).setPosition(mid)
        plates.setMatrixAt(k, m)
        plates.setColorAt(k, col.set(inHl(i) ? hlColor : BASE_COLOR[base]).multiplyScalar(dim * (inHl(i) ? 1.8 : 1)))
      }
    }
    const mat = glowingPhysical({ vertexColors: true, roughness: 0.3, clearcoat: 1, glow: 0.35 })
    return { t1, t2, plates, mat }
  }, [seq, hl, hlColor, strand, strand2, dim, sub, radial])
  useEffect(
    () => () => {
      built.t1.dispose()
      built.t2.dispose()
      built.plates.dispose()
      built.mat.dispose()
      built.plates.geometry.dispose()
      ;(built.plates.material as THREE.Material).dispose()
    },
    [built],
  )
  return (
    <group>
      <mesh geometry={built.t1.geometry} material={built.mat} />
      <mesh geometry={built.t2.geometry} material={built.mat} />
      <primitive object={built.plates} />
    </group>
  )
}

const _a = new THREE.Vector3(),
  _N = new THREE.Vector3(),
  _T = new THREE.Vector3()
const DONOR_SEQ = 'GCTAGCTCAAGGTCTG' + HDR_INSERT + 'ACCATGTCGACGTT'

export default function Repair({ d, quality }: { d: Ready; quality: Quality }) {
  const t = useT()
  const donor = useRef<THREE.Group>(null!)
  const kuL = useRef<THREE.Group>(null!)
  const kuR = useRef<THREE.Group>(null!)
  const lig = useRef<THREE.Mesh>(null!)
  const mats = useMemo(
    () => ({
      ku: organicMaterial({ color: PALETTE.ku, rim: '#b8ecff', opacity: 0.7, amp: 0.12, freq: 1.8, power: 1.8 }),
      ku2: organicMaterial({ color: '#2a9df4', rim: '#9fd8ff', opacity: 0.7, amp: 0.12, freq: 1.9, power: 1.8 }),
      lig: organicMaterial({ color: PALETTE.ligase, rim: '#efffc0', opacity: 0.8, amp: 0.15, freq: 2.0, power: 1.6 }),
    }),
    [],
  )
  const geo = useMemo(() => ({ ring: new THREE.TorusGeometry(1.5, 0.45, 24, 64, Math.PI * 1.15), ico: new THREE.IcosahedronGeometry(1, 14) }), [])
  const root = useRef<THREE.Group>(null!)

  useFrame(({ clock }) => {
    const { v, L } = frame(d)
    const c = v.cand
    tickOrganic(root.current, clock.elapsedTime)
    // molde doador do HDR: desce, alinha (invasão de fita) e sai
    donor.current.visible = v.donor > 0.001
    if (donor.current.visible) {
      const i = Math.min(L.n - 1, c.cut)
      const th = L.theta[i]
      normalAt(th, _N)
      donor.current.position
        .copy(L.center[i])
        .addScaledVector(_N, 2.5 + (1 - v.donor) * 9 - v.invade * 0.6)
        .add(_a.set(0, 0, 0.6))
      donor.current.rotation.set(0, 0, th)
      donor.current.scale.setScalar(0.85 * Math.min(1, v.donor * 1.4))
    }
    // Ku70/80 encaixa nas duas pontas, a ligase sela, Ku sai
    const kuOn = v.kuIn > 0 && v.kuOut < 1
    kuL.current.visible = kuR.current.visible = kuOn
    if (kuOn) {
      const slide = (1 - v.kuIn) * 6 + v.kuOut * 7
      for (const [g, i, sgn] of [
        [kuL.current, Math.max(0, c.cut - 2), -1],
        [kuR.current, Math.min(L.n - 1, c.cut + 1), 1],
      ] as const) {
        const th = L.theta[i]
        tangentAt(th, _T)
        g.position.copy(L.center[i]).addScaledVector(_T, sgn * (0.4 + slide))
        g.rotation.set(0, 0, th)
        g.scale.setScalar(Math.max(0.001, 1 - v.kuOut * 0.6))
      }
    }
    lig.current.visible = v.ligase > 0.001
    if (lig.current.visible) {
      const i = Math.min(L.n - 1, c.cut)
      normalAt(L.theta[i], _N)
      lig.current.position
        .lerpVectors(L.center[Math.max(0, i - 1)], L.center[i], 0.5)
        .addScaledVector(_N, 1.7 + (1 - v.ligase) * 5)
        .add(_a.set(0, 0, 0.9))
      lig.current.scale.setScalar(0.95 * v.ligase)
      mats.lig.uniforms.uGlow.value = v.ligase > 0.9 ? 1 : 0.2
    }
  })

  const tipOf = (title: string, body: string) => (e: ThreeEvent<PointerEvent>) => tip(e, title, body)
  const at = (ref: React.RefObject<THREE.Object3D>, dy: number) => (o: THREE.Vector3) => {
    const obj = ref.current
    if (!obj?.visible) return false
    o.copy(obj.position).add(_a.set(0, dy, 0))
    return true
  }

  return (
    <group ref={root}>
      <group
        ref={donor}
        onPointerMove={tipOf(
          t('Molde doador (HDR)', 'Donor template (HDR)'),
          t(
            'DNA com braços de homologia flanqueando a edição desejada. Aqui: inserção de GAATTC (EcoRI) e mutação do PAM, para o alelo editado não ser cortado de novo.',
            'DNA with homology arms flanking the desired edit. Here: a GAATTC insertion (EcoRI) plus a PAM mutation, so the edited allele is not cut again.',
          ),
        )}
        onPointerOut={untip}
      >
        <MiniDuplex seq={DONOR_SEQ} hl={DONOR_HL} strand={PALETTE.donor} strand2={'#3fbf6a'} quality={quality} />
      </group>
      {[kuL, kuR].map((r, k) => (
        <group
          key={k}
          ref={r}
          onPointerMove={tipOf(
            'Ku70/Ku80',
            t(
              'Heterodímero em anel que se encaixa nas pontas da quebra, protege-as e recruta a maquinaria do NHEJ.',
              'Ring-shaped heterodimer that threads onto the broken ends, protects them and recruits the NHEJ machinery.',
            ),
          )}
          onPointerOut={untip}
        >
          <mesh geometry={geo.ring} material={mats.ku} rotation={[0, Math.PI / 2, 0]} renderOrder={4} />
          <mesh geometry={geo.ring} material={mats.ku2} rotation={[Math.PI, Math.PI / 2, 0]} scale={0.92} renderOrder={4} />
        </group>
      ))}
      <mesh
        ref={lig}
        geometry={geo.ico}
        material={mats.lig}
        renderOrder={4}
        onPointerMove={tipOf(
          t('DNA ligase', 'DNA ligase'),
          t(
            'Sela a ligação fosfodiéster entre as pontas. No NHEJ é a ligase IV (com XRCC4); pequenas inserções ou deleções podem ficar no caminho.',
            'Seals the phosphodiester bond between the ends. In NHEJ this is ligase IV (with XRCC4); small insertions or deletions may be left behind.',
          ),
        )}
        onPointerOut={untip}
      />

      <Label tone={PALETTE.donor} at={at(donor, 1.6)}>
        {t('molde doador · braços de homologia', 'donor template · homology arms')}
      </Label>
      <Label tone={PALETTE.ku} at={at(kuR, 2.2)}>
        Ku70/80
      </Label>
      <Label tone={PALETTE.ligase} at={at(lig, 1.2)}>
        {t('ligase', 'ligase')}
      </Label>
    </group>
  )
}
