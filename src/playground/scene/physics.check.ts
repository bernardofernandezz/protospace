// Autoverificação da física do modo Explorar: `npm test`
import assert from 'node:assert/strict'
import * as THREE from 'three'
import { MAX_SPEED, integrate, pushOut, stepFloater } from './physics.ts'

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z)
const dt = 1 / 60

// teto de velocidade, com e sem turbo
const b = { pos: V(), vel: V() }
for (let i = 0; i < 600; i++) integrate(b, V(0, 0, -1), false, dt)
assert.ok(b.vel.length() <= MAX_SPEED + 1e-6, 'velocidade respeita o teto')
assert.ok(b.pos.z < -10, 'empuxo move a sonda')

// a sonda não atravessa a "hélice" (linha de pontos no eixo x)
const line = Array.from({ length: 40 }, (_, i) => V((i - 20) * 0.34, 0, 0))
const p = { pos: V(0, 4, 0), vel: V() }
for (let i = 0; i < 300; i++) { integrate(p, V(0, -1, 0), true, dt); pushOut(p, line, line.length, 1.6) }
assert.ok(line.every((q) => q.distanceTo(p.pos) >= 1.6 - 1e-3), 'sonda fica fora do DNA')

// molécula empurrada se afasta e volta para casa
const f = { pos: V(0, 0, 0), vel: V(), home: V(0, 0, 0) }
const probe = { pos: V(0.5, 0, 0), vel: V(-8, 0, 0) }
stepFloater(f, probe, 1.2, dt)
assert.ok(f.pos.x < -0.5, 'empurrão afasta a molécula')
probe.pos.set(100, 0, 0)
for (let i = 0; i < 1200; i++) stepFloater(f, probe, 1.2, dt)
assert.ok(f.pos.distanceTo(f.home) < 0.05, 'mola traz de volta')

console.log('physics.check ok')
