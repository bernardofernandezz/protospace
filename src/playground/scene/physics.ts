// Física mínima do modo Explorar: sonda que "nada" no nucleoplasma e moléculas que ela empurra.
import * as THREE from 'three'

export interface Body {
  pos: THREE.Vector3
  vel: THREE.Vector3
}
export interface Floater extends Body {
  home: THREE.Vector3
}

export const MAX_SPEED = 9
const ACCEL = 40
const DRAG = 2.6
const BOOST = 2.2

const _d = new THREE.Vector3()

/** Empuxo + arrasto viscoso: a sonda acelera, desliza um pouco ao soltar e respeita um teto de velocidade. */
export function integrate(b: Body, thrust: THREE.Vector3, boost: boolean, dt: number) {
  const k = boost ? BOOST : 1
  b.vel.addScaledVector(thrust, ACCEL * k * dt).multiplyScalar(Math.exp(-DRAG * dt))
  if (b.vel.length() > MAX_SPEED * k) b.vel.setLength(MAX_SPEED * k)
  b.pos.addScaledVector(b.vel, dt)
}

/** Mantém o corpo a pelo menos `r` de cada ponto (ex.: linha central do DNA) e quica de leve na parede. Retorna a velocidade do impacto. */
export function pushOut(b: Body, points: readonly THREE.Vector3[], n: number, r: number) {
  let impact = 0
  for (let i = 0; i < n; i++) {
    _d.subVectors(b.pos, points[i])
    const dist = _d.length()
    if (dist >= r || dist === 0) continue
    _d.divideScalar(dist)
    b.pos.addScaledVector(_d, r - dist)
    const vn = b.vel.dot(_d)
    if (vn < 0) {
      b.vel.addScaledVector(_d, -vn * 1.3)
      impact = Math.max(impact, -vn)
    }
  }
  return impact
}

/** Molécula livre: empurrada pela sonda (esfera de alcance `reach`) e puxada de volta por uma mola amortecida. Retorna se foi tocada. */
export function stepFloater(f: Floater, probe: Body, reach: number, dt: number) {
  _d.subVectors(f.pos, probe.pos)
  const dist = _d.length()
  const hit = dist < reach && dist > 0
  if (hit) {
    _d.divideScalar(dist)
    f.pos.addScaledVector(_d, reach - dist)
    f.vel.addScaledVector(_d, Math.max(0, probe.vel.dot(_d)) * 1.3 + 2)
  }
  f.vel.addScaledVector(_d.subVectors(f.home, f.pos), 1.6 * dt).multiplyScalar(Math.exp(-1.2 * dt))
  f.pos.addScaledVector(f.vel, dt)
  return hit
}
