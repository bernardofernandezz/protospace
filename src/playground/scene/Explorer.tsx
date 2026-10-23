import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Trail } from '@react-three/drei'
import * as THREE from 'three'
import { BASE_COLOR, PALETTE } from '../colors'
import { useSim, type Quality, type ZoneId } from '../store'
import { organicMaterial, tickOrganic } from './materials'
import { integrate, pushOut, stepFloater, type Body, type Floater } from './physics'
import { input } from './shared'
import { casPose, centerAt, focus, frame, normalAt, type Ready } from './timeline'

const PROBE_R = 0.45
const DNA_R = 1.0 + PROBE_R + 0.25 // raio da hélice + sonda + folga
const OFF_POS = [new THREE.Vector3(-12, 8, -16), new THREE.Vector3(12, 8, -16)] // mesmas posições do Nucleoplasm
const ZONE_R = 4.5
const FLOATERS: Record<Quality, number> = { low: 120, medium: 200, high: 300 }
const KEYS: Record<string, [axis: 'x' | 'y' | 'z', dir: number]> = {
  w: ['z', 1], s: ['z', -1], a: ['x', -1], d: ['x', 1], e: ['y', 1], q: ['y', -1],
}

const rand = (seed: number) => { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647) }
const _n = new THREE.Vector3(), _f = new THREE.Vector3(), _r = new THREE.Vector3(), _t = new THREE.Vector3(), _m = new THREE.Matrix4()

/** Posição de cada zona neste quadro (tudo se move com a timeline). */
function zonePositions(d: Ready, out: Map<ZoneId, THREE.Vector3>) {
  const { v, L } = frame(d)
  const c = d.cand
  const at = (id: ZoneId) => { if (!out.has(id)) out.set(id, new THREE.Vector3()); return out.get(id)! }
  const th = centerAt(L, c.start + 10, at('guide'))
  at('guide').addScaledVector(normalAt(th, _n), 3)
  centerAt(L, Math.min(L.n - 1, c.start + 21), at('pam'))
  centerAt(L, c.cut, at('cut'))
  const pose = casPose(v, L)
  if (pose.visible) at('cas9').copy(pose.pos)
  else centerAt(L, c.start + 10, at('cas9'))
  // PAM "isca" mais próximo do alvo (onde a Cas9 para e desiste na busca)
  const decoy = d.candidates.filter((k) => k !== c).sort((a, b) => Math.abs(a.start - c.start) - Math.abs(b.start - c.start))[0]
  if (decoy) centerAt(L, Math.min(L.n - 1, decoy.start + 21), at('decoy'))
  else out.delete('decoy')
  at('off0').copy(OFF_POS[0])
  at('off1').copy(OFF_POS[1])
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
  const probe = useRef<THREE.Group>(null!)
  const inst = useRef<THREE.InstancedMesh>(null!)
  const look = useRef({ yaw: 0, pitch: -0.15 })
  const zones = useMemo(() => new Map<ZoneId, THREE.Vector3>(), [])
  const body = useMemo<Body>(() => ({ pos: new THREE.Vector3(), vel: new THREE.Vector3() }), [])
  const count = FLOATERS[quality]
  const floaters = useMemo<Floater[]>(() => {
    const r = rand(11)
    return Array.from({ length: count }, () => {
      const home = new THREE.Vector3()
      // espalha em volta do locus, fora do tubo do DNA
      do home.set((r() - 0.5) * 70, (r() - 0.5) * 30 + 2, (r() - 0.5) * 40 - 5)
      while (Math.hypot(home.y, home.z) < 3)
      return { home, pos: home.clone(), vel: new THREE.Vector3() }
    })
  }, [count])
  const mat = useMemo(() => ({
    shell: organicMaterial({ color: PALETTE.strand1, rim: '#d6fffa', opacity: 0.55, amp: 0.18, freq: 2.4, power: 1.4 }),
    core: new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.strand1).multiplyScalar(3), toneMapped: false }),
    dot: new THREE.MeshStandardMaterial({ roughness: 0.4, emissive: '#ffffff', emissiveIntensity: 0.15 }),
  }), [])
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.22, 1), [])

  // cores dos dNTPs livres (A, C, G, T)
  useEffect(() => {
    const cols = ['A', 'C', 'G', 'T'].map((b) => new THREE.Color(BASE_COLOR[b]))
    floaters.forEach((_, i) => inst.current.setColorAt(i, cols[i % 4]))
    inst.current.instanceColor!.needsUpdate = true
  }, [floaters])

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
    let drag: { x: number; y: number } | null = null
    const pDown = (e: PointerEvent) => { drag = { x: e.clientX, y: e.clientY } }
    const pMove = (e: PointerEvent) => {
      if (!drag) return
      look.current.yaw += (e.clientX - drag.x) * 0.005
      look.current.pitch = THREE.MathUtils.clamp(look.current.pitch - (e.clientY - drag.y) * 0.004, -1.3, 1.3)
      drag = { x: e.clientX, y: e.clientY }
    }
    const pUp = () => { drag = null }
    addEventListener('keydown', down)
    addEventListener('keyup', up)
    addEventListener('blur', blur)
    el.addEventListener('pointerdown', pDown)
    addEventListener('pointermove', pMove)
    addEventListener('pointerup', pUp)
    el.style.cursor = 'grab'
    return () => {
      removeEventListener('keydown', down)
      removeEventListener('keyup', up)
      removeEventListener('blur', blur)
      el.removeEventListener('pointerdown', pDown)
      removeEventListener('pointermove', pMove)
      removeEventListener('pointerup', pUp)
      el.style.cursor = ''
      blur()
    }
  }, [gl])

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const st = useSim.getState()
    const { L } = frame(d)
    zonePositions(d, zones)
    const { yaw, pitch } = look.current
    // frente = para onde a câmera olha (nado 3D), direita sempre no plano horizontal
    _f.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch))
    _r.set(Math.cos(yaw), 0, Math.sin(yaw))

    if (st.flyTo && !zones.has(st.flyTo)) st.set({ flyTo: null })
    else if (st.flyTo) {
      // voo guiado até a zona: para um pouco à frente, olhando para ela
      _t.copy(zones.get(st.flyTo)!).add(_n.set(0, 1, 3.5))
      body.vel.set(0, 0, 0)
      body.pos.lerp(_t, 1 - Math.exp(-dt * 3))
      look.current.yaw *= Math.exp(-dt * 4)
      look.current.pitch += (-0.2 - look.current.pitch) * (1 - Math.exp(-dt * 4))
      if (body.pos.distanceTo(_t) < 0.3) st.set({ flyTo: null, zone: st.flyTo })
    } else {
      _t.set(0, input.y, 0).addScaledVector(_f, input.z).addScaledVector(_r, input.x)
      if (_t.lengthSq() > 1) _t.normalize()
      integrate(body, _t, input.boost, dt)
    }
    pushOut(body, L.center, L.n, DNA_R)
    pushOut(body, OFF_POS, 2, 2.6)

    // sonda: inclina na direção do movimento
    const g = probe.current
    g.position.copy(body.pos)
    g.rotation.set(-body.vel.dot(_f) * 0.04, -yaw, -body.vel.dot(_r) * 0.06)
    tickOrganic(g, clock.elapsedTime)

    // câmera de perseguição com mola
    _t.copy(body.pos).addScaledVector(_f, -7).add(_n.set(0, 1.4, 0))
    camera.position.lerp(_t, 1 - Math.exp(-dt * 5))
    camera.lookAt(_t.copy(body.pos).addScaledVector(_f, 3))
    focus.copy(body.pos)

    // nucleotídeos livres
    for (let i = 0; i < floaters.length; i++) {
      const f = floaters[i]
      stepFloater(f, body, PROBE_R + 0.5, dt)
      inst.current.setMatrixAt(i, _m.makeTranslation(f.pos.x, f.pos.y, f.pos.z))
    }
    inst.current.instanceMatrix.needsUpdate = true

    // zona mais próxima, com histerese para o cartão não piscar na borda
    let best: ZoneId | null = null
    let bestD = Infinity
    for (const [id, p] of zones) { const dd = p.distanceTo(body.pos); if (dd < bestD) { bestD = dd; best = id } }
    const cur = st.zone
    const curD = cur && zones.has(cur) ? zones.get(cur)!.distanceTo(body.pos) : Infinity
    let next = cur
    if (curD > ZONE_R * 1.3) next = null
    if (best && bestD < ZONE_R && (next === null || bestD < curD - 1)) next = best
    if (next !== cur) st.set({ zone: next })
  })

  return (
    <>
      <Trail width={1.4} length={5} color={PALETTE.strand1} attenuation={(t) => t * t}>
        <group ref={probe}>
          <mesh material={mat.shell} scale={PROBE_R}><icosahedronGeometry args={[1, 8]} /></mesh>
          <mesh material={mat.core} scale={PROBE_R * 0.35}><icosahedronGeometry args={[1, 2]} /></mesh>
          <pointLight intensity={18} distance={9} color={PALETTE.strand1} />
        </group>
      </Trail>
      <instancedMesh ref={inst} args={[geo, mat.dot, floaters.length]} frustumCulled={false} />
    </>
  )
}
