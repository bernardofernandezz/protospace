import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three-stdlib'
import { BASE_EDITORS, COMP, inPam, isBaseEditor, spacerIndex, spacerPos } from '../../lib/dna'
import { targetSpan } from '../../content/diseases'
import { useT, tNow } from '../../i18n'
import { BASE_COLOR, PALETTE } from '../colors'
import { useSim, type Quality } from '../store'
import { Label } from './Labels'
import { TUBE_RES, tip, untip } from './shared'
import { glowingPhysical, glowTexture } from './materials'
import { Tube, breakTaper } from './tube'
import { MAXN, RADIUS, clamp01, frame, normalAt, rnaLayout, smooth, tangentAt, type Ready } from './timeline'

const BB_R = 0.11 // raio do backbone
const PURINE = new Set(['A', 'G'])
const S1 = new THREE.Color(PALETTE.strand1)
const S2 = new THREE.Color(PALETTE.strand2)
const CASC = new THREE.Color(PALETTE.cas)
const RNAC = new THREE.Color(PALETTE.rna)
const MM = new THREE.Color(PALETTE.mismatch)
const HEAL = new THREE.Color(PALETTE.donor)
const BASES = Object.fromEntries(Object.entries(BASE_COLOR).map(([k, v]) => [k, new THREE.Color(v)]))
const GREY = new THREE.Color('#888')
const WHITE = new THREE.Color('#ffffff')


// vetores temporários reaproveitados (nada é alocado por quadro)
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3()
const _m = new THREE.Matrix4(), _col = new THREE.Color(), _N = new THREE.Vector3(), _T = new THREE.Vector3()

/** Placa de base: de `from` na direção de `to`, com comprimento `len` e espessura alinhada ao eixo `axis`. */
function plate(im: THREE.InstancedMesh, k: number, from: THREE.Vector3, to: THREE.Vector3, len: number, axis: THREE.Vector3, scale = 1, tilt = 0) {
  _y.subVectors(to, from)
  if (tilt) _y.normalize().addScaledVector(axis, tilt)
  _y.normalize()
  _x.copy(axis).addScaledVector(_y, -axis.dot(_y)).normalize()
  _z.crossVectors(_x, _y)
  const l = Math.max(0.001, len) * scale
  _a.copy(from).addScaledVector(_y, l / 2)
  _m.makeBasis(_x.multiplyScalar(scale), _y.multiplyScalar(l), _z.multiplyScalar(scale)).setPosition(_a)
  im.setMatrixAt(k, _m)
}

/** Classifica cada posição da sequência editada: 1 = inserida, 2 = substituída. */
function editKinds(d: Ready) {
  const kinds = new Uint8Array(MAXN)
  let shift = 0
  for (const op of [...d.ops].sort((a, b) => a.pos - b.pos)) {
    const sub = op.del === op.ins.length
    for (let k = 0; k < op.ins.length; k++) kinds[op.pos + shift + k] = sub ? 2 : 1
    shift += op.ins.length - op.del
  }
  return kinds
}

/** Resumo curto da edição para o rótulo 3D. */
function editLabel(d: Ready, t: ReturnType<typeof useT>) {
  const { cas, repair } = useSim.getState()
  if (d.verdict === 'success') return d.dis?.goal === 'disrupt'
    ? t('motivo destruído · interruptor desligado', 'motif destroyed · switch turned off')
    : t('alelo corrigido · proteína saudável', 'allele corrected · healthy protein')
  if (d.verdict === 'broken') return t('gene inativado · não corrigido', 'gene disrupted · not corrected')
  if (isBaseEditor(cas)) {
    const { from, to } = BASE_EDITORS[cas]
    return t(`${from}→${to} × ${d.ops.length} · sem DSB`, `${from}→${to} × ${d.ops.length} · no DSB`)
  }
  if (cas === 'pe') return t('prime editing · escrito pela RT', 'prime editing · written by the RT')
  if (repair === 'hdr') return t('HDR · +GAATTC (EcoRI) · PAM G→C', 'HDR · +GAATTC (EcoRI) · PAM G→C')
  const net = d.ops.reduce((a, o) => a + o.ins.length - o.del, 0)
  return `NHEJ · ${net > 0 ? '+' : '−'}${Math.abs(net)} nt${net % 3 ? ' · frameshift' : ' · in-frame'}`
}

export default function Helix({ d, quality }: { d: Ready; quality: Quality }) {
  const t = useT()
  const [sub, radial] = TUBE_RES[quality]
  const tubes = useMemo(() => ({ s1: new Tube(MAXN, sub, radial), s2: new Tube(MAXN, sub, radial), rna: new Tube(20, sub, radial) }), [sub, radial])
  useEffect(() => () => { tubes.s1.dispose(); tubes.s2.dispose(); tubes.rna.dispose() }, [tubes])
  const mats = useMemo(() => ({
    backbone: glowingPhysical({ vertexColors: true, roughness: 0.28, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.2, glow: 0.32 }),
    rna: glowingPhysical({ vertexColors: true, roughness: 0.35, clearcoat: 0.6, glow: 0.45 }),
    bases: glowingPhysical({ roughness: 0.4, clearcoat: 0.4, glow: 0.38 }),
    phos: glowingPhysical({ roughness: 0.25, metalness: 0.1, clearcoat: 1, glow: 0.25 }),
  }), [])
  const geo = useMemo(() => ({ plate: new RoundedBoxGeometry(0.11, 1, 0.32, 2, 0.035), phos: new THREE.SphereGeometry(0.155, 14, 10) }), [])
  const kinds = useMemo(() => editKinds(d), [d])
  // alvo do cenário clínico: pulsa em vermelho enquanto está intacto e esverdeia quando é resolvido
  const span = useMemo(() => (d.dis ? targetSpan(d.dis) : null), [d.dis])
  const onTarget = (i: number) => !!span && i >= span.start && i < span.start + span.length
  const healed = d.verdict === 'success'
  const beSites = useMemo(() => new Set(d.cuts === 'none' && d.acts && isBaseEditor(useSim.getState().cas) ? d.ops.map((o) => o.pos) : []), [d])

  const bases = useRef<THREE.InstancedMesh>(null!)
  const phos = useRef<THREE.InstancedMesh>(null!)
  const rnaBases = useRef<THREE.InstancedMesh>(null!)
  const rnaMesh = useRef<THREE.Mesh>(null!)
  const sparks = useRef<THREE.Points>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const sparkDirs = useMemo(() => {
    const dirs = new Float32Array(90 * 3)
    let s = 11
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    for (let i = 0; i < 90; i++) {
      const u = r() * 2 - 1, th = r() * Math.PI * 2, k = 0.4 + r() * 0.6
      dirs.set([Math.sqrt(1 - u * u) * Math.cos(th) * k, u * k, Math.sqrt(1 - u * u) * Math.sin(th) * k], i * 3)
    }
    return dirs
  }, [])
  const sparkGeo = useMemo(() => new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(90 * 3), 3)), [])

  useFrame(() => {
    const { v, L } = frame(d)
    const c = v.cand
    const n = L.n
    const seq = L.seq
    const orig = !v.edited
    const probe = v.path.probe >= 0 ? d.candidates[v.path.probe] : null
    const gapAmt = orig ? clamp01(v.gap / 0.25) : 0
    // pontas do locus afinam (o DNA continua além do trecho mostrado)
    const endTaper = (i: number, u: number) => (i === 0 ? 0.3 + 0.7 * smooth(0, 1, u) : i === n - 2 ? 1 - 0.7 * smooth(0, 1, u) : i === n - 1 ? 0.3 : 1)
    const hl = (i: number) => (orig ? spacerPos(c, i) >= 0 || inPam(c, i) : !!L.changed?.[i])
    const strandColor = (base: THREE.Color, i: number, out: THREE.Color) => {
      if (orig && inPam(c, i)) out.copy(CASC).multiplyScalar(1 + 1.2 * v.rloop)
      else out.copy(base).multiplyScalar(hl(i) ? 1 : 0.42)
      if (probe && orig && inPam(probe, i)) out.lerp(CASC, v.path.probeAmt).multiplyScalar(1 + 1.6 * v.path.probeAmt)
      if (orig && L.deleted[i] && v.shrinkDel > 0) out.lerp(MM, v.shrinkDel)
      // brilho nas pontas recém-cortadas
      if (orig && v.flash > 0 && (i === c.cut || i === c.cut - 1)) out.multiplyScalar(1 + 3 * v.flash)
    }
    // cada fita rompe no seu próprio ponto: iguais num corte cego, afastados num escalonado
    const cutS1 = c.strand === 1 ? c.cut : c.cutFar
    const cutS2 = c.strand === 1 ? c.cutFar : c.cut
    // a nickase inativa o RuvC, então só a fita-alvo (a que pareia com o guia) é cortada
    const nickS1 = c.strand === -1 ? (orig ? v.nickCut : 0) : 0
    const nickS2 = c.strand === 1 ? (orig ? v.nickCut : 0) : 0
    tubes.s1.update(L.p1, n, (i, u) => BB_R * endTaper(i, u) * breakTaper(i, u, cutS1, Math.max(gapAmt, nickS1)), (i, o) => strandColor(S1, i, o))
    // fita-alvo (2): o nick da D10A (HNH ativo) é nela
    tubes.s2.update(L.p2, n, (i, u) => BB_R * endTaper(i, u) * breakTaper(i, u, cutS2, Math.max(gapAmt, nickS2)), (i, o) => strandColor(S2, i, o))

    // fosfatos (contas sobre o tubo)
    if (phos.current) {
      for (let i = 0; i < n; i++) {
        const del = orig && L.deleted[i] ? 1 - v.shrinkDel : 1
        const grow = !orig && kinds[i] === 1 ? v.growIns : 1
        const s = del * grow
        _m.makeScale(s, s, s)
        phos.current.setMatrixAt(i, _m.setPosition(L.p1[i]))
        phos.current.setMatrixAt(n + i, _m.setPosition(L.p2[i]))
        strandColor(S1, i, _col); phos.current.setColorAt(i, _col)
        strandColor(S2, i, _col); phos.current.setColorAt(n + i, _col)
      }
      phos.current.count = n * 2
      phos.current.instanceMatrix.needsUpdate = true
      if (phos.current.instanceColor) phos.current.instanceColor.needsUpdate = true
    }

    // bases: purina mais longa que pirimidina; no R-loop a fita-alvo pareia com o RNA
    const rnaOn = rnaLayout(v, L)
    const span = 2 * RADIUS * Math.sin(((Math.PI * 0.78) / 2))
    for (let i = 0; i < n; i++) {
      const b1 = seq[i]
      const b2 = COMP[b1] ?? 'N'
      tangentAt(L.theta[i], _T)
      const f1 = PURINE.has(b1) ? 0.55 : 0.45
      const o = L.open[i]
      const j = i - c.start
      const del = orig && L.deleted[i] ? 1 - v.shrinkDel : 1
      const ins = !orig && kinds[i] === 1 ? v.growIns : 1
      const s = del * ins
      // fita 1
      if (o > 0) plate(bases.current, i, L.p1[i], L.center[i], (span * f1 - 0.03) * (1 - 0.6 * o), _T, s)
      else plate(bases.current, i, L.p1[i], L.p2[i], span * f1 - 0.03, _T, s)
      // fita 2 (alvo): parceira passa a ser a base do RNA
      if (o > 0 && rnaOn) {
        _c.lerpVectors(L.p1[i], L.rna[j], o)
        plate(bases.current, n + i, L.p2[i], _c, _b.subVectors(_c, L.p2[i]).length() * (1 - f1) - 0.03, _T, s)
      } else plate(bases.current, n + i, L.p2[i], L.p1[i], span * (1 - f1) - 0.03, _T, s)

      // cores
      const lit = hl(i) ? 1 : 0.4
      _col.copy(BASES[b1] ?? GREY).multiplyScalar(lit)
      if (orig && beSites.has(i) && v.deam > 0) _col.lerp(BASES.U, v.deam).multiplyScalar(1 + 1.5 * Math.sin(v.deam * Math.PI) + 0.4 * v.deam)
      if (!orig && kinds[i]) _col.multiplyScalar(1.7 + 2.2 * (1 - v.growIns))
      if (orig && L.deleted[i] && v.shrinkDel > 0) _col.lerp(MM, v.shrinkDel)
      if (orig && onTarget(i)) _col.copy(MM).multiplyScalar(1.5 + 0.5 * Math.sin(performance.now() / 240))
      if (!orig && healed && kinds[i]) _col.lerp(HEAL, 0.7).multiplyScalar(1.4 + 1.4 * (1 - v.growIns))
      bases.current.setColorAt(i, _col)
      _col.copy(BASES[b2] ?? GREY).multiplyScalar(lit)
      if (!orig && kinds[i]) _col.multiplyScalar(1.7 + 2.2 * (1 - v.growIns))
      if (orig && onTarget(i)) _col.lerp(MM, 0.75).multiplyScalar(1.3)
      if (!orig && healed && kinds[i]) _col.lerp(HEAL, 0.5).multiplyScalar(1.3)
      bases.current.setColorAt(n + i, _col)
    }
    bases.current.count = n * 2
    bases.current.instanceMatrix.needsUpdate = true
    if (bases.current.instanceColor) bases.current.instanceColor.needsUpdate = true

    // sgRNA: tubo + bases; mismatches com o protoespaçador ficam vermelhos e não encaixam
    rnaMesh.current.visible = rnaBases.current.visible = rnaOn
    if (rnaOn) {
      const guide = useSim.getState().guide
      tubes.rna.update(L.rna, 20, (i, u) => BB_R * 1.3 * (i === 0 ? 0.4 + 0.6 * u : 1), (i, out) => {
        out.copy(RNAC).multiplyScalar(1.5)
        if (guide[i] !== c.protospacer[i]) out.lerp(MM, 0.5)
      })
      for (let jj = 0; jj < 20; jj++) {
        const i = spacerIndex(c, jj)
        tangentAt(L.theta[i], _T)
        const mm = guide[jj] !== c.protospacer[jj]
        const g = guide[jj] === 'T' ? 'U' : guide[jj]
        const fr = PURINE.has(g) ? 0.55 : 0.45
        const o = L.open[i]
        if (v.step === 0 || o === 0) {
          normalAt(L.theta[i], _N)
          _c.copy(L.rna[jj]).addScaledVector(_N, -1)
          plate(rnaBases.current, jj, L.rna[jj], _c, 0.5, _T, 1, mm ? 0.5 : 0)
        } else plate(rnaBases.current, jj, L.rna[jj], L.p2[i], _b.subVectors(L.p2[i], L.rna[jj]).length() * fr - 0.03, _T, 1, mm ? 0.7 * o : 0)
        if (mm) _col.copy(MM).multiplyScalar(1.6 + 0.6 * Math.sin(performance.now() / 180))
        else _col.copy(BASES[g] ?? GREY).lerp(WHITE, 0.35).multiplyScalar(1.1)
        rnaBases.current.setColorAt(jj, _col)
      }
      rnaBases.current.instanceMatrix.needsUpdate = true
      if (rnaBases.current.instanceColor) rnaBases.current.instanceColor.needsUpdate = true
    }

    // faíscas e anel do corte
    const cutOn = orig && (v.flash > 0 || (v.sparks > 0 && v.sparks < 1))
    sparks.current.visible = cutOn
    ring.current.visible = orig && v.flash > 0
    if (cutOn) {
      _a.lerpVectors(L.center[c.cut - 1], L.center[c.cut], 0.5)
      const e = 1 - (1 - v.sparks) ** 3
      const pos = sparkGeo.getAttribute('position') as THREE.BufferAttribute
      for (let k = 0; k < 90; k++) pos.setXYZ(k, _a.x + sparkDirs[k * 3] * (0.2 + 3.4 * e), _a.y + sparkDirs[k * 3 + 1] * (0.2 + 3.4 * e), _a.z + sparkDirs[k * 3 + 2] * (0.2 + 3.4 * e))
      pos.needsUpdate = true
      ;(sparks.current.material as THREE.PointsMaterial).opacity = (1 - v.sparks) ** 1.4
      ring.current.position.copy(_a)
      tangentAt(L.theta[c.cut], _T)
      ring.current.quaternion.setFromUnitVectors(_z.set(0, 0, 1), _T)
      ring.current.scale.setScalar(0.5 + v.flash * 1.6)
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity = v.flash
    }
  })

  const hoverBase = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const id = e.instanceId
    if (id === undefined) return
    const { v, L } = frame(d)
    const n = L.n
    const i = id % n
    const top = id < n
    const b = top ? L.seq[i] : COMP[L.seq[i]]
    const j = i - v.cand.start
    let body = tNow('Fora da região-alvo.', 'Outside the target region.')
    if (!v.edited && onTarget(i)) body = d.dis!.goal === 'disrupt'
      ? tNow(
        'Este é o motivo GATA1 que mantém o interruptor ligado. Aqui o objetivo é justamente destruí-lo: basta um indel do NHEJ sobre estas letras.',
        'This is the GATA1 motif that keeps the switch on. Here the goal is to destroy it: an NHEJ indel over these letters is enough.',
      )
      : tNow(
        'Esta é a região alterada pela doença. Um corte perto daqui, com molde de reparo (HDR) ou com prime editing, devolve a sequência saudável.',
        'This is the region altered by the disease. A cut nearby, with a repair template (HDR) or with prime editing, brings the healthy sequence back.',
      )
    else if (v.edited && healed && L.changed?.[i]) body = tNow('Alvo resolvido: este alelo alcançou o objetivo do cenário.', 'Target resolved: this allele reached the scenario goal.')
    else if (v.edited && L.changed?.[i]) body = tNow('Base alterada pela edição.', 'Base changed by the edit.')
    else if (!v.edited && j >= 0 && j < 20) {
      body = tNow(
        `Protoespaçador, posição ${j + 1}/20${j >= 8 ? ' (região seed, proximal ao PAM: mismatches aqui pesam mais)' : ' (região distal ao PAM)'}. ${top ? 'Fita não-alvo (mesma sequência do guia, com T em vez de U).' : 'Fita-alvo: pareia com o sgRNA.'}`,
        `Protospacer, position ${j + 1}/20${j >= 8 ? ' (seed region, PAM-proximal: mismatches here weigh more)' : ' (PAM-distal region)'}. ${top ? 'Non-target strand (same sequence as the guide, with T instead of U).' : 'Target strand: pairs with the sgRNA.'}`,
      )
    } else if (!v.edited && j >= 20 && j < 23) {
      body = tNow(
        'PAM (NGG): sem ele a SpCas9 não abre a dupla-fita, mesmo com guia perfeito. Fica na fita não-alvo, logo após o protoespaçador (3′).',
        'PAM (NGG): without it SpCas9 will not unwind the duplex, even with a perfect guide. It sits on the non-target strand, right after the protospacer (3′).',
      )
    }
    const purine = PURINE.has(b) ? tNow('purina', 'purine') : tNow('pirimidina', 'pyrimidine')
    tip(e, tNow(`Par ${i + 1} · ${b} (${purine}) · ${top ? 'fita senso' : 'fita antissenso'}`, `Pair ${i + 1} · ${b} (${purine}) · ${top ? 'sense strand' : 'antisense strand'}`), body)
  }
  const hoverRna = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const j = e.instanceId ?? 0
    const { guide } = useSim.getState()
    const mm = guide[j] !== d.cand.protospacer[j]
    const g = guide[j] === 'T' ? 'U' : guide[j]
    tip(e, `sgRNA · ${t('posição', 'position')} ${j + 1}/20 · ${g}`, mm
      ? t('Mismatch: esta base do guia não é complementar à fita-alvo. Na região seed (posições 9–20), isso costuma impedir o corte.', 'Mismatch: this guide base is not complementary to the target strand. In the seed region (positions 9–20) this usually prevents cleavage.')
      : t('Pareia por complementaridade com a fita-alvo, deslocando a fita não-alvo e formando o R-loop.', 'Base-pairs with the target strand, displacing the non-target strand to form the R-loop.'))
  }

  // âncoras dos rótulos
  const below = (i: number, out: THREE.Vector3, dist = 2.1) => { const { L } = frame(d); normalAt(L.theta[i], _N); return out.copy(L.center[i]).addScaledVector(_N, -dist) }
  const staggered = d.cand.cut !== d.cand.cutFar
  const cutLabel = d.cuts === 'nick'
    ? t('nick · só a fita-alvo', 'nick · target strand only')
    : staggered
      ? t(`DSB escalonado · pontas coesivas de ${Math.abs(d.cand.cutFar - d.cand.cut)} nt`, `staggered DSB · ${Math.abs(d.cand.cutFar - d.cand.cut)}-nt sticky ends`)
      : t('quebra de fita dupla (DSB) · 3 pb do PAM', 'double-strand break (DSB) · 3 bp from PAM')

  return (
    <group>
      <mesh geometry={tubes.s1.geometry} material={mats.backbone} frustumCulled={false} />
      <mesh geometry={tubes.s2.geometry} material={mats.backbone} frustumCulled={false} />
      {quality !== 'low' && <instancedMesh ref={phos} args={[geo.phos, mats.phos, MAXN * 2]} frustumCulled={false} />}
      <instancedMesh ref={bases} args={[geo.plate, mats.bases, MAXN * 2]} frustumCulled={false} onPointerMove={hoverBase} onPointerOut={untip} onClick={hoverBase} />
      <mesh ref={rnaMesh} geometry={tubes.rna.geometry} material={mats.rna} frustumCulled={false} />
      <instancedMesh ref={rnaBases} args={[geo.plate, mats.bases, 20]} frustumCulled={false} onPointerMove={hoverRna} onPointerOut={untip} />
      <points ref={sparks} geometry={sparkGeo} frustumCulled={false}>
        <pointsMaterial map={glowTexture()} size={0.35} color={'#fff3c4'} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>
      <mesh ref={ring} onPointerMove={(e) => tip(e, t('Sítio de corte', 'Cleavage site'), t('SpCas9 corta 3 pb a montante do PAM. O domínio HNH cliva a fita-alvo e o RuvC a não-alvo, gerando extremidades predominantemente cegas.', 'SpCas9 cuts 3 bp upstream of the PAM. The HNH domain cleaves the target strand and RuvC the non-target strand, leaving mostly blunt ends.'))} onPointerOut={untip}>
        <torusGeometry args={[1.6, 0.04, 8, 64]} />
        <meshBasicMaterial color={'#ffffff'} transparent toneMapped={false} />
      </mesh>

      <Label tone={PALETTE.strand1} at={(o) => { const { v } = frame(d); below(v.cand.start + 9, o); return !v.edited && v.step !== 1 && v.step <= 2 }}>{t('protoespaçador · 20 nt', 'protospacer · 20 nt')}</Label>
      <Label tone={PALETTE.cas} at={(o) => { const { v } = frame(d); below(v.cand.start + 21, o, 1.7); return !v.edited && v.step !== 1 && v.step <= 2 }}>PAM · 5′-NGG-3′</Label>
      {d.dis && (
        <Label tone={PALETTE.mismatch} at={(o) => {
          const { v, L } = frame(d)
          const at = span?.start ?? -1
          if (v.edited || at < 0 || at >= L.n) return false
          normalAt(L.theta[at], _N)
          o.copy(L.center[at]).addScaledVector(_N, 2.4)
          return true
        }}>{t.pick(d.dis.name)} · {d.dis.goal === 'disrupt' ? t('motivo-alvo', 'target motif') : t('região alterada', 'altered region')}</Label>
      )}
      <Label tone={PALETTE.rna} at={(o) => { const { v, L } = frame(d); if (v.step !== 0) return false; normalAt(L.theta[v.cand.start], _N); o.copy(L.rna[0]).addScaledVector(_N, 0.5); return true }}>{t('sgRNA · espaçador 5′ → 3′', 'sgRNA · spacer 5′ → 3′')}</Label>
      <Label tone="#ffffff" at={(o) => { const { v, L } = frame(d); if (v.edited || v.step !== 3 || d.cuts === 'none') return false; o.lerpVectors(L.center[v.cand.cut - 1], L.center[v.cand.cut], 0.5).y -= 2.2; return v.p > 0.35 }}>{cutLabel}</Label>
      <Label tone={PALETTE.edit} at={(o) => {
        const { v, L } = frame(d)
        if (!v.edited || !L.changed) return false
        const i = L.changed.indexOf(true)
        if (i < 0) return false
        normalAt(L.theta[i], _N)
        o.copy(L.center[i]).addScaledVector(_N, 2.3)
        return v.step >= 4
      }}>{editLabel(d, t)}</Label>
    </group>
  )
}
