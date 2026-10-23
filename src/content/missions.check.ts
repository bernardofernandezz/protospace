// Autoverificação das missões do modo Explorar: `npm test`
import assert from 'node:assert/strict'
import { EXHIBITS } from './exhibits.ts'
import { MISSIONS, accomplished, currentMission } from './missions.ts'

// toda missão aponta para uma zona que existe e tem id único
const zones = new Set(EXHIBITS.map((e) => e.id))
for (const m of MISSIONS) assert.ok(m.zone ? zones.has(m.zone) : m.task === 'collect', `zona inexistente: ${m.zone}`)
assert.equal(new Set(MISSIONS.map((m) => m.id)).size, MISSIONS.length, 'ids repetidos')

// a trilha segue em ordem e termina
assert.equal(currentMission([])?.id, MISSIONS[0].id)
assert.equal(currentMission([MISSIONS[0].id])?.id, MISSIONS[1].id)
assert.equal(currentMission(MISSIONS.map((m) => m.id)), undefined)

// visita: basta entrar na zona; etapa: só quando ela toca até o fim, dentro da zona
const at = (zone: string | null | undefined, rest: Partial<{ step: number; progress: number; bases: string; cargo: boolean }> = {}) =>
  ({ zone: zone ?? null, step: 0, progress: 0, bases: '', cargo: false, ...rest })
const visit = MISSIONS.find((m) => m.step === undefined && !m.task)!
const watch = MISSIONS.find((m) => m.step !== undefined)!
const collect = MISSIONS.find((m) => m.task === 'collect')!
const carry = MISSIONS.find((m) => m.task === 'carry')!
assert.ok(accomplished(visit, at(visit.zone)))
assert.ok(!accomplished(visit, at(null)))
assert.ok(!accomplished(watch, at(watch.zone, { step: watch.step!, progress: 0.5 })))
assert.ok(!accomplished(watch, at(null, { step: watch.step!, progress: 1 })))
assert.ok(accomplished(watch, at(watch.zone, { step: watch.step!, progress: 1 })))
// coleta: as 4 bases, em qualquer ordem e em qualquer lugar
assert.ok(!accomplished(collect, at(null, { bases: 'ACG' })))
assert.ok(accomplished(collect, at(null, { bases: 'TGCA' })))
// carga: só vale chegando à zona com o molde a bordo
assert.ok(!accomplished(carry, at(carry.zone)))
assert.ok(!accomplished(carry, at(null, { cargo: true })))
assert.ok(accomplished(carry, at(carry.zone, { cargo: true })))

console.log('missions.check ok')
