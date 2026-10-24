import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Trail } from '@react-three/drei'
import * as THREE from 'three'
import { EXHIBITS, type Vec3 } from '../../content/exhibits'
import { BASES, DONOR_POS, currentMission } from '../../content/missions'
import { BASE_COLOR, PALETTE } from '../colors'
import { useSim, type Quality, type ZoneId } from '../store'
import { organicMaterial, tickOrganic } from './materials'
import { MAX_SPEED, integrate, pushOut, stepFloater, type Body, type Floater } from './physics'
import { input, untip } from './shared'
import { sound } from '../sound'
import { casPose, centerAt, focus, frame, normalAt, type Ready } from './timeline'

const PROBE_R = 0.45
const DNA_R = 1.0 + PROBE_R + 0.25 // raio da hélice + sonda + folga
const OFF_POS = [new THREE.Vector3(-12, 8, -16), new THREE.Vector3(12, 8, -16)] // mesmas posições do Nucleoplasm
const ZONE_R = 4.5
const COLLECT_R2 = 6 ** 2
const WORLD_R = 95
const STATIC = EXHIBITS.filter((e) => e.pos).map((e) => ({ id: e.id, pos: new THREE.Vector3(...(e.pos as Vec3)), size: e.size ?? 2, solid: e.solid ?? 0 }))
const SOLID = STATIC.filter((s) => s.solid > 0)
/** Alcance da zona: exposições grandes "começam" mais longe. */
const reach = (id: ZoneId) => (STATIC.find((s) => s.id === id)?.size ?? 0) + ZONE_R
const FLOATERS: Record<Quality, number> = { low: 150, medium: 260, high: 400 }
const KEYS: Record<string, [axis: 'x' | 'y' | 'z', dir: number]> = {
  w: ['z', 1], s: ['z', -1], a: ['x', -1], d: ['x', 1], e: ['y', 1], q: ['y', -1],
}

const rand = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647) }
const UP = new THREE.Vector3(0, 1, 0)
const DONOR = new THREE.Vector3(...DONOR_POS)
const _a = new THREE.Vector3(), _n = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3(), _t = new THREE.Vector3(), _m = new THREE.Matrix4()

/** Posição de cada zona neste quadro (tudo se move com a timeline). */
function zonePositions(d: Ready, out: Map<ZoneId, THREE.Vector3>) {
  const { v, L } = frame(d)
  const c = d.cand
  const at = (id: ZoneId) => { if (!out.has(id)) out.set(id, new THREE.Vector3()); return out.get(id)! }
  const th = centerAt(L, c.start + 10, at('guide'))
  at('guide').addScaledVector(normalAt(th, _n), 3)
  centerAt(L, Math.min(L.n - 1, c.pamStart + 1), at('pam'))
  centerAt(L, c.cut, at('cut'))
  const pose = casPose(v, L)
  if (pose.visible) at('cas9').copy(pose.pos)
  else centerAt(L, c.start + 10, at('cas9'))
  // PAM "isca" mais próximo do alvo (onde a Cas9 para e desiste na busca)
  const decoy = d.candidates.filter((k) => k !== c).sort((a, b) => Math.abs(a.start - c.start) - Math.abs(b.start - c.start))[0]
  if (decoy) centerAt(L, Math.min(L.n - 1, decoy.pamStart + 1), at('decoy'))
  else out.delete('decoy')
  at('off0').copy(OFF_POS[0])
  at('off1').copy(OFF_POS[1])
  for (const s of STATIC) at(s.id).copy(s.pos)
  return out
}

/**
 * Modo Explorar: uma nanossonda em terceira pessoa que nada pelo núcleo. WASD/QE movem em relação
 * à câmera, arrastar gira o olhar, Shift é turbo. Ela colide com o DNA, empurra nucleotídeos livres
 * e, ao chegar perto de algo, avisa a zona ao store (o Playground mostra o cartão).
 */
export default function Explorer({ d, quality }: { d: Ready; quality: Quality }) {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const setEvents = useThree((s) => s.setEvents)
  const probe = useRef<THREE.Group>(null!)
  const inst = useRef<THREE.InstancedMesh>(null!)
  const beacon = useRef<THREE.Mesh>(null!)
  const arrow = useRef<THREE.Mesh>(null!)
  const donor = useRef<THREE.Group>(null!)
  const look = useRef({ yaw: 0, pitch: -0.15 })
  const zones = useMemo(() => new Map<ZoneId, THREE.Vector3>(), [])
  const body = useMemo<Body>(() => ({ pos: new THREE.Vector3(), vel: new THREE.Vector3() }), [])
  const count = FLOATERS[quality]
  const floaters = useMemo<Floater[]>(() => {
    const r = rand(11)
    return Array.from({ length: count }, () => {
      const home = new THREE.Vector3()
      // espalha em volta do locus, fora do tubo do DNA
      do home.set((r() - 0.5) * 150, (r() - 0.5) * 55 + 2, (r() - 0.5) * 80)
      while (Math.hypot(home.y, home.z) < 3)
      return { home, pos: home.clone(), vel: new THREE.Vector3() }
    })
  }, [count])
  const mat = useMemo(() => ({
    shell: organicMaterial({ color: PALETTE.strand1, rim: '#d6fffa', opacity: 0.55, amp: 0.18, freq: 2.4, power: 1.4 }),
    core: new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.strand1).multiplyScalar(3), toneMapped: false }),
    dot: new THREE.MeshStandardMaterial({ roughness: 0.4, emissive: '#ffffff', emissiveIntensity: 0.15 }),
    donor: new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.donor).multiplyScalar(2.2), toneMapped: false }),
    goal: new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.rna).multiplyScalar(2), toneMapped: false, transparent: true, depthWrite: false, side: THREE.DoubleSide }),
  }), [])
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.22, 1), [])

  // cores dos dNTPs livres (A, C, G, T)
  useEffect(() => {
    const cols = BASES.map((b) => new THREE.Color(BASE_COLOR[b]))
    floaters.forEach((_, i) => inst.current.setColorAt(i, cols[i % 4]))
    inst.current.instanceColor!.needsUpdate = true
  }, [floaters])

  // ao pilotar não há tooltips: desliga o raycast de ponteiro (custava interseções a cada arrasto)
  // e acende a luz da sonda (que já existe na cena, ver Scene.tsx)
  const light = useMemo(() => scene.getObjectByName('probe-light') as THREE.PointLight | undefined, [scene])
  useEffect(() => {
    untip()
    setEvents({ enabled: false })
    if (light) light.intensity = 18
    return () => { setEvents({ enabled: true }); if (light) light.intensity = 0 }
  }, [setEvents, light])

  // começa onde a câmera estava olhando, para a transição não "pular"
  useEffect(() => {
    camera.getWorldDirection(_f)
    body.pos.copy(camera.position).addScaledVector(_f, 7)
    body.vel.set(0, 0, 0)
    look.current = { yaw: Math.atan2(_f.x, -_f.z), pitch: Math.asin(THREE.MathUtils.clamp(_f.y, -1, 1)) }
  }, [camera, body])

  // teclado (WASD/QE/Shift) e arrastar para olhar
  useEffect(() => {
    const held = new Set<string>()
    const sync = () => {
      input.x = input.y = input.z = 0
      for (const k of held) { const m = KEYS[k]; if (m) input[m[0]] += m[1] }
    }
    const typing = (e: KeyboardEvent) => (e.target as HTMLElement).closest('input, textarea, select')
    const down = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key.toLowerCase()
      if (k === 'shift') input.boost = true
      if (!KEYS[k]) return
      held.add(k)
      sync()
      useSim.getState().set({ flyTo: null })
      e.preventDefault()
    }
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (k === 'shift') input.boost = false
      held.delete(k)
      sync()
    }
    const blur = () => { held.clear(); sync(); input.boost = false }
    const el = gl.domElement
    // só o dedo que começou o arrasto gira a câmera (o outro pode estar no joystick)
    let drag: { id: number; x: number; y: number } | null = null
    const pDown = (e: PointerEvent) => { if (!drag) drag = { id: e.pointerId, x: e.clientX, y: e.clientY } }
    const pMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return
      look.current.yaw += (e.clientX - drag.x) * 0.005
      look.current.pitch = THREE.MathUtils.clamp(look.current.pitch - (e.clientY - drag.y) * 0.004, -1.3, 1.3)
      drag = { id: drag.id, x: e.clientX, y: e.clientY }
    }
    const pUp = (e: PointerEvent) => { if (e.pointerId === drag?.id) drag = null }
    addEventListener('keydown', down)
    addEventListener('keyup', up)
    addEventListener('blur', blur)
    el.addEventListener('pointerdown', pDown)
    addEventListener('pointermove', pMove)
    addEventListener('pointerup', pUp)
    addEventListener('pointercancel', pUp)
    el.style.cursor = 'grab'
    return () => {
      removeEventListener('keydown', down)
      removeEventListener('keyup', up)
      removeEventListener('blur', blur)
      el.removeEventListener('pointerdown', pDown)
      removeEventListener('pointermove', pMove)
      removeEventListener('pointerup', pUp)
      removeEventListener('pointercancel', pUp)
      el.style.cursor = ''
      blur()
    }
  }, [gl])

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20) // física: passo limitado para não atravessar paredes
    const fly = Math.min(rawDt, 0.5) // voo guiado: tempo real, chega no mesmo tempo mesmo com poucos FPS
    const st = useSim.getState()
    const { L } = frame(d)
    zonePositions(d, zones)
    const { yaw, pitch } = look.current
    // frente = para onde a câmera olha (nado 3D), direita sempre no plano horizontal
    _f.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch))
    _r.set(Math.cos(yaw), 0, Math.sin(yaw))

    if (st.flyTo && !zones.has(st.flyTo)) st.set({ flyTo: null })
    else if (st.flyTo) {
      // voo guiado: chega pelo lado do centro do núcleo (no locus, pela frente) e encara a zona
      const zp = zones.get(st.flyTo)!
      if (zp.length() > 15) _a.copy(zp).normalize()
      else _a.set(0, 0, -1)
      _t.copy(zp).addScaledVector(_a, 1 - reach(st.flyTo))
      _t.y += 1
      body.vel.set(0, 0, 0)
      body.pos.lerp(_t, 1 - Math.exp(-fly * 3))
      const k = 1 - Math.exp(-fly * 4)
      const dy = Math.atan2(_a.x, -_a.z) - look.current.yaw
      look.current.yaw += Math.atan2(Math.sin(dy), Math.cos(dy)) * k
      look.current.pitch += (Math.asin(THREE.MathUtils.clamp(_a.y, -1, 1)) - 0.1 - look.current.pitch) * k
      if (body.pos.distanceTo(_t) < 0.3) st.set({ flyTo: null, zone: st.flyTo })
    } else {
      _t.set(0, input.y, 0).addScaledVector(_f, input.z).addScaledVector(_r, input.x)
      if (_t.lengthSq() > 1) _t.normalize()
      integrate(body, _t, input.boost, dt)
    }
    let impact = Math.max(pushOut(body, L.center, L.n, DNA_R), pushOut(body, OFF_POS, 2, 2.6))
    for (const s of SOLID) impact = Math.max(impact, pushOut(body, [s.pos], 1, s.solid + PROBE_R))
    if (impact > 1.5) { sound.bump(impact); navigator.vibrate?.(Math.min(40, impact * 6)) }
    sound.swim(body.vel.length() / MAX_SPEED)
    // borda do mundo: um "aquário" esférico, desliza ao longo da parede
    if (body.pos.length() > WORLD_R) { body.pos.setLength(WORLD_R); body.vel.multiplyScalar(0.5) }

    // sonda: inclina na direção do movimento
    const g = probe.current
    g.position.copy(body.pos)
    light?.position.copy(body.pos)
    g.rotation.set(-body.vel.dot(_f) * 0.04, -yaw, -body.vel.dot(_r) * 0.06)
    tickOrganic(g, clock.elapsedTime)

    // câmera de perseguição com mola
    _t.copy(body.pos).addScaledVector(_f, -7).add(_n.set(0, 1.4, 0))
    camera.position.lerp(_t, 1 - Math.exp(-dt * 5))
    camera.lookAt(_t.copy(body.pos).addScaledVector(_f, 3))
    focus.copy(body.pos)

    // missão atual: anel pulsando no alvo e seta na sonda apontando para ele (somem ao chegar).
    // Na missão de carga o alvo é primeiro o molde de reparo; tocá-lo o prende atrás da sonda.
    const m = currentMission(st.missionsDone)
    const fetch = m?.task === 'carry' && !st.cargo
    if (fetch && body.pos.distanceTo(DONOR) < 1.8) { st.set({ cargo: true }); sound.chime(false); navigator.vibrate?.(20) }
    const dn = donor.current
    dn.visible = m?.task === 'carry'
    if (st.cargo) dn.position.lerp(_t.copy(body.pos).addScaledVector(_f, -1.4), 1 - Math.exp(-dt * 8))
    else dn.position.copy(DONOR).setY(DONOR.y + Math.sin(clock.elapsedTime * 1.5) * 0.3)
    dn.rotation.set(0.4, clock.elapsedTime * 0.8, 0)
    const gp = fetch ? DONOR : m?.zone ? zones.get(m.zone) : undefined
    const there = !fetch && !!m?.zone && st.zone === m.zone
    beacon.current.visible = !!gp && !there
    arrow.current.visible = !!gp && !there && !st.flyTo
    if (gp && !there) {
      const pulse = 1 + 0.15 * Math.sin(clock.elapsedTime * 4)
      beacon.current.position.copy(gp)
      beacon.current.quaternion.copy(camera.quaternion)
      beacon.current.scale.setScalar((fetch ? 2 : reach(m!.zone!)) * 0.6 * pulse)
      _a.subVectors(gp, body.pos).normalize()
      arrow.current.position.copy(body.pos).addScaledVector(_a, PROBE_R + 0.5)
      arrow.current.quaternion.setFromUnitVectors(UP, _a)
      mat.goal.opacity = 0.55 + 0.3 * Math.sin(clock.elapsedTime * 4)
    }

    // nucleotídeos livres
    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i]
      if (stepFloater(f, body, PROBE_R + 0.5, dt)) sound.blip()
      // missão de coleta: a sonda vira um ímã (os dNTPs estão a ~12 unidades uns dos outros; só encostar seria lento
      // demais). O floater i tem a cor da base i % 4, a mesma ordem das cores acima
      if (m?.task === 'collect' && f.pos.distanceToSquared(body.pos) < COLLECT_R2) {
        f.vel.addScaledVector(_n.subVectors(body.pos, f.pos), 6 * dt)
        const b = BASES[i % 4], got = useSim.getState().bases
        if (!got.includes(b)) { useSim.getState().set({ bases: got + b }); sound.chime(false); navigator.vibrate?.(15) }
      }
      inst.current.setMatrixAt(i, _m.makeTranslation(f.pos.x, f.pos.y, f.pos.z))
    }
    inst.current.instanceMatrix.needsUpdate = true

    // zona mais próxima, com histerese para o cartão não piscar na borda
    let best: ZoneId | null = null
    let bestD = Infinity
    // distância "normalizada" pelo alcance: exposições grandes não perdem para zonas pequenas vizinhas
    for (const [id, p] of zones) { const dd = p.distanceTo(body.pos) - reach(id); if (dd < bestD) { bestD = dd; best = id } }
    const cur = st.zone
    const curD = cur && zones.has(cur) ? zones.get(cur)!.distanceTo(body.pos) - reach(cur) : Infinity
    let next = cur
    if (curD > ZONE_R * 0.3) next = null
    if (best && bestD < 0 && (next === null || bestD < curD - 1)) next = best
    if (next !== cur) st.set({ zone: next })
  })

  const ship = (
    <group ref={probe}>
      <mesh material={mat.shell} scale={PROBE_R}><icosahedronGeometry args={[1, 8]} /></mesh>
      <mesh material={mat.core} scale={PROBE_R * 0.35}><icosahedronGeometry args={[1, 2]} /></mesh>
    </group>
  )
  return (
    <>
      {/* o rastro custa um desenho extra por quadro: fica de fora na qualidade baixa */}
      {quality === 'low' ? ship : <Trail width={1.4} length={5} color={PALETTE.strand1} attenuation={(t) => t * t}>{ship}</Trail>}
      <group ref={donor} visible={false}>
        {/* molde de reparo: um trecho curto de fita dupla verde */}
        {[-0.18, 0.18].map((x) => <mesh key={x} position={[x, 0, 0]} material={mat.donor}><capsuleGeometry args={[0.09, 1.3, 4, 8]} /></mesh>)}
        {[-0.45, -0.15, 0.15, 0.45].map((y) => <mesh key={y} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} material={mat.donor}><cylinderGeometry args={[0.04, 0.04, 0.36, 6]} /></mesh>)}
      </group>
      <mesh ref={beacon} material={mat.goal} visible={false}><ringGeometry args={[0.9, 1, 48]} /></mesh>
      <mesh ref={arrow} material={mat.goal} visible={false}><coneGeometry args={[0.16, 0.5, 12]} /></mesh>
      <instancedMesh ref={inst} args={[geo, mat.dot, floaters.length]} frustumCulled={false} />
    </>
  )
}
