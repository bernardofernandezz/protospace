// Autoverificação das missões do modo Explorar: `npm test`
import assert from 'node:assert/strict'
import { EXHIBITS } from './exhibits.ts'
import { MISSIONS, accomplished, currentMission } from './missions.ts'

// toda missão aponta para uma zona que existe e tem id único
const zones = new Set(EXHIBITS.map((e) => e.id))
for (const m of MISSIONS) assert.ok(zones.has(m.zone), `zona inexistente: ${m.zone}`)
assert.equal(new Set(MISSIONS.map((m) => m.id)).size, MISSIONS.length, 'ids repetidos')

// a trilha segue em ordem e termina
assert.equal(currentMission([])?.id, MISSIONS[0].id)
assert.equal(currentMission([MISSIONS[0].id])?.id, MISSIONS[1].id)
assert.equal(currentMission(MISSIONS.map((m) => m.id)), undefined)

// visita: basta entrar na zona; etapa: só quando ela toca até o fim, dentro da zona
const visit = MISSIONS.find((m) => m.step === undefined)!
const watch = MISSIONS.find((m) => m.step !== undefined)!
assert.ok(accomplished(visit, { zone: visit.zone, step: 0, progress: 0 }))
assert.ok(!accomplished(visit, { zone: null, step: 0, progress: 0 }))
assert.ok(!accomplished(watch, { zone: watch.zone, step: watch.step!, progress: 0.5 }))
assert.ok(!accomplished(watch, { zone: null, step: watch.step!, progress: 1 }))
assert.ok(accomplished(watch, { zone: watch.zone, step: watch.step!, progress: 1 }))

console.log('missions.check ok')
