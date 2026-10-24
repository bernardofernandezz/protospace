import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { BASE_EDITORS, isBaseEditor } from '../../lib/dna'
import { useT } from '../../i18n'
import { PALETTE } from '../colors'
import { useSim, type Quality } from '../store'
import { Label } from './Labels'
import { organicMaterial, tickOrganic } from './materials'
import { casPose, frame, type Ready } from './timeline'
import { tip, untip } from './shared'

// posições no referencial da proteína: x ao longo do DNA, y para o lóbulo REC, z para a câmera
const HNH_OFF = new THREE.Vector3(-0.7, 1.0, 2.1)
const HNH_ON = new THREE.Vector3(2.0, -0.15, 1.25)
const HNH_MID = new THREE.Vector3(0.9, 0.9, 2.9)

/** Caminho do scaffold do sgRNA com três hairpins (stem-loops), ancorado na proteína. */
function scaffoldCurve() {
  const pts = [
    [2.9, 1.0, 0.25], [3.3, 1.8, -0.2], [3.0, 2.6, -0.75], [3.45, 3.25, -1.0], [3.85, 2.7, -0.9], [3.5, 2.0, -0.6],
    [2.6, 1.9, -1.3], [1.85, 2.8, -1.6], [1.3, 3.35, -1.25], [1.0, 2.75, -1.75], [1.5, 2.1, -1.85],
    [0.4, 1.6, -2.0], [-0.4, 2.4, -2.2], [-0.95, 2.05, -2.5], [-0.5, 1.45, -2.4], [-1.2, 1.0, -2.1],
  ]
  return new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal')
}

export default function Cas9({ d, quality }: { d: Ready; quality: Quality }) {
  const t = useT()
  const g = useRef<THREE.Group>(null!)
  const rec = useRef<THREE.Mesh>(null!)
  const hnh = useRef<THREE.Mesh>(null!)
  const deam = useRef<THREE.Group>(null!)
  // no three r169 o detail do icosaedro é linear (subdivisões por aresta)
  const detail = quality === 'low' ? 10 : quality === 'medium' ? 16 : 24
  const geo = useMemo(() => ({ ico: new THREE.IcosahedronGeometry(1, detail), scaffold: new THREE.TubeGeometry(scaffoldCurve(), 160, 0.1, 10, false) }), [detail])
  const mat = useMemo(() => ({
    rec: organicMaterial({ color: PALETTE.cas, rim: '#ff8fd0', opacity: 0.36, amp: 0.2, freq: 1.35 }),
    nuc: organicMaterial({ color: '#ff6f7d', rim: '#ffb0a0', opacity: 0.34, amp: 0.2, freq: 1.45 }),
    hnh: organicMaterial({ color: PALETTE.hnh, rim: '#fff0b0', opacity: 0.85, amp: 0.14, freq: 2.2, power: 1.6 }),
    ruvc: organicMaterial({ color: PALETTE.ruvc, rim: '#ffc0a0', opacity: 0.8, amp: 0.14, freq: 2.0, power: 1.6 }),
    pi: organicMaterial({ color: PALETTE.pi, rim: '#ff9ac0', opacity: 0.85, amp: 0.12, freq: 2.4, power: 1.6 }),
    deam: organicMaterial({ color: PALETTE.deaminase, rim: '#d8c0ff', opacity: 0.8, amp: 0.15, freq: 2.0, power: 1.6 }),
    scaffold: new THREE.MeshPhysicalMaterial({ color: PALETTE.rna, emissive: PALETTE.rna, emissiveIntensity: 0.45, roughness: 0.35, clearcoat: 0.6 }),
  }), [])
  useEffect(() => () => { geo.ico.dispose(); geo.scaffold.dispose() }, [geo])
  useEffect(() => () => { for (const m of Object.values(mat)) m.dispose() }, [mat])

  useFrame(({ clock }) => {
    const { v, L } = frame(d)
    const pose = casPose(v, L)
    g.current.visible = pose.visible
    if (!pose.visible) return
    const { cas } = useSim.getState()
    g.current.position.copy(pose.pos)
    g.current.rotation.set(0, 0, pose.theta)
    g.current.scale.setScalar(Math.max(0.001, pose.scale))
    const time = clock.elapsedTime
    tickOrganic(g.current, time)
    // REC fecha sobre o heterodúplex à medida que o R-loop se forma
    rec.current.position.set(-0.4, 2.2 - 0.5 * v.rloop, -0.35)
    rec.current.scale.set(3.3 + Math.sin(time * 1.2) * 0.04, 1.5, 1.75)
    // HNH: arco da posição inativa até a fita-alvo (checkpoint antes do corte)
    const h = v.hnh
    const a = 1 - h
    hnh.current.position.set(
      a * a * HNH_OFF.x + 2 * a * h * HNH_MID.x + h * h * HNH_ON.x,
      a * a * HNH_OFF.y + 2 * a * h * HNH_MID.y + h * h * HNH_ON.y,
      a * a * HNH_OFF.z + 2 * a * h * HNH_MID.z + h * h * HNH_ON.z,
    )
    hnh.current.rotation.set(h * Math.PI, h * 0.6, 0)
    mat.hnh.uniforms.uGlow.value = v.flash + 0.15 * h
    mat.ruvc.uniforms.uGlow.value = cas === 'wt' ? v.flash : 0
    mat.ruvc.uniforms.uColor.value.set(cas === 'wt' ? PALETTE.ruvc : '#5b6170')
    mat.ruvc.uniforms.uRim.value.set(cas === 'wt' ? '#ffc0a0' : '#9aa3b5')
    mat.pi.uniforms.uGlow.value = v.path.probeAmt + 0.6 * v.rloop
    mat.rec.uniforms.uGlow.value = 0.25 * v.rloop
    deam.current.visible = isBaseEditor(cas) || cas === 'pe'
    mat.deam.uniforms.uGlow.value = v.deam > 0 && v.deam < 1 ? 0.8 : 0.1
  })

  const casTip = (e: ThreeEvent<PointerEvent>) => {
    const c = useSim.getState().cas
    tip(e,
      c === 'be' ? t('Editor de bases (nCas9 + desaminase de citosina)', 'Base editor (nCas9 + cytidine deaminase)')
        : c === 'abe' ? t('Editor de bases (nCas9 + desaminase de adenina)', 'Base editor (nCas9 + adenine deaminase)')
        : c === 'pe' ? t('Prime editor (nCas9 + transcriptase reversa)', 'Prime editor (nCas9 + reverse transcriptase)')
        : c === 'nickase' ? t('Cas9 nickase (D10A)', 'Cas9 nickase (D10A)') : 'SpCas9',
      isBaseEditor(c)
        ? t(`Cas9 nickase fundida a uma desaminase: converte ${BASE_EDITORS[c].from}→${BASE_EDITORS[c].to} numa janela do protoespaçador, sem quebra de fita dupla.`, `Cas9 nickase fused to a deaminase: converts ${BASE_EDITORS[c].from}→${BASE_EDITORS[c].to} within a window of the protospacer, with no double-strand break.`)
        : c === 'pe'
        ? t('Cas9 nickase fundida a uma transcriptase reversa: corta uma fita e escreve ali a sequência ditada pela extensão do pegRNA.', 'Cas9 nickase fused to a reverse transcriptase: it nicks one strand and writes there the sequence dictated by the pegRNA extension.')
        : t('Lóbulo REC (reconhecimento, magenta) acomoda o heterodúplex guia:DNA; lóbulo NUC (nuclease) contém HNH, RuvC e o domínio PI, que lê o PAM.', 'The REC lobe (recognition, magenta) holds the guide:DNA heteroduplex; the NUC lobe (nuclease) carries HNH, RuvC and the PI domain, which reads the PAM.'))
  }
  const domTip = (title: string, body: string) => (e: ThreeEvent<PointerEvent>) => tip(e, title, body)

  const visible = (fn: (step: number, p: number) => boolean) => (o: THREE.Vector3, local: THREE.Vector3) => {
    const { v } = frame(d)
    if (!g.current?.visible) return false
    o.copy(local)
    return fn(v.step, v.p)
  }
  const cas = useSim((s) => s.cas)

  return (
    <group ref={g}>
      <mesh ref={rec} geometry={geo.ico} material={mat.rec} renderOrder={3} onPointerMove={casTip} onPointerOut={untip} />
      <mesh geometry={geo.ico} material={mat.nuc} position={[0.7, -1.5, 0.15]} scale={[3.0, 1.3, 1.6]} renderOrder={3} onPointerMove={casTip} onPointerOut={untip} />
      <mesh ref={hnh} geometry={geo.ico} material={mat.hnh} scale={[0.8, 0.65, 0.7]} renderOrder={4}
        onPointerMove={domTip('HNH', t('Domínio nuclease que cliva a fita-alvo. Ele gira ~180° até o DNA só quando o pareamento está completo — um "checkpoint" que reduz cortes indevidos.', 'Nuclease domain that cleaves the target strand. It swings ~180° onto the DNA only once pairing is complete — a checkpoint that limits spurious cuts.'))} onPointerOut={untip} />
      <mesh geometry={geo.ico} material={mat.ruvc} position={[1.5, -1.3, 1.1]} scale={[0.95, 0.75, 0.8]} renderOrder={4}
        onPointerMove={domTip('RuvC', cas === 'wt'
          ? t('Domínio nuclease que cliva a fita não-alvo.', 'Nuclease domain that cleaves the non-target strand.')
          : t('Inativado pela mutação D10A (cinza): só o HNH corta, gerando um nick.', 'Inactivated by the D10A mutation (grey): only HNH cuts, producing a nick.'))} onPointerOut={untip} />
      <mesh geometry={geo.ico} material={mat.pi} position={[3.4, -0.95, 0.1]} scale={0.62} renderOrder={4}
        onPointerMove={domTip(t('Domínio PI', 'PI domain'), t('PAM-interacting: reconhece o NGG antes de qualquer teste do guia.', 'PAM-interacting: recognises NGG before the guide is tested at all.'))} onPointerOut={untip} />
      <group ref={deam}>
        <mesh geometry={geo.ico} material={mat.deam} position={[-1.9, 0.4, 2.05]} scale={[1.05, 0.85, 0.9]} renderOrder={4}
          onPointerMove={domTip(t('Desaminase de citosina', 'Cytidine deaminase'), t('Converte C em U na fita não-alvo exposta pelo R-loop (janela 4–8); a célula depois lê U como T.', 'Converts C to U on the non-target strand exposed by the R-loop (window 4–8); the cell later reads U as T.'))} onPointerOut={untip} />
      </group>
      <mesh geometry={geo.scaffold} material={mat.scaffold}
        onPointerMove={domTip(t('Scaffold do sgRNA', 'sgRNA scaffold'), t('Parte fixa do RNA guia, com hairpins que encaixam na Cas9. Só os 20 nt do espaçador mudam de um experimento para outro.', 'Fixed part of the guide RNA, with hairpins that dock into Cas9. Only the 20-nt spacer changes between experiments.'))} onPointerOut={untip} />

      <Label tone={PALETTE.cas} at={(o) => visible((s) => s === 2 || s === 3)(o, _v.set(-0.4, 3.9, 0))}>Cas9 · sgRNA</Label>
      <Label tone={PALETTE.hnh} at={(o) => visible((s, p) => s === 3 && p < 0.9)(o, _v.copy(hnh.current?.position ?? HNH_OFF).add(_w.set(0, 0.9, 0)))}>HNH</Label>
      <Label tone={PALETTE.pi} at={(o) => visible((s, p) => s === 2 && p < 0.62)(o, _v.set(3.4, -1.7, 0.4))}>{t('PI · lê o PAM', 'PI · reads the PAM')}</Label>
      {cas !== 'wt' && <Label tone="#9aa3b5" at={(o) => visible((s) => s === 3)(o, _v.set(1.5, -2.2, 1.1))}>{t('RuvC inativo (D10A)', 'RuvC inactive (D10A)')}</Label>}
      {isBaseEditor(cas) && <Label tone={PALETTE.deaminase} at={(o) => visible((s) => s === 3)(o, _v.set(-1.9, 1.6, 2.05))}>{t(`desaminase · ${BASE_EDITORS[cas].from}→${cas === 'be' ? 'U' : 'I'}`, `deaminase · ${BASE_EDITORS[cas].from}→${cas === 'be' ? 'U' : 'I'}`)}</Label>}
      {cas === 'pe' && <Label tone={PALETTE.deaminase} at={(o) => visible((s) => s === 3)(o, _v.set(-1.9, 1.6, 2.05))}>{t('transcriptase reversa', 'reverse transcriptase')}</Label>}
    </group>
  )
}

const _v = new THREE.Vector3(), _w = new THREE.Vector3()
