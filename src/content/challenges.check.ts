// Autoverificação dos desafios do playground: `npm test`
import assert from 'node:assert/strict'
import { CHALLENGES, type Outcome } from './challenges.ts'

const base: Outcome = { acts: true, eff: 0.8, offs: [{ p: 0.01 }], cas: 'wt', nuclease: 'spcas9', disease: null }
const by = (id: string) => CHALLENGES.find((c) => c.id === id)!

assert.equal(new Set(CHALLENGES.map((c) => c.id)).size, CHALLENGES.length, 'ids repetidos')

assert.ok(by('clean-cut').met(base))
assert.ok(!by('clean-cut').met({ ...base, eff: 0.5 }), 'eficiência baixa')
assert.ok(!by('clean-cut').met({ ...base, offs: [{ p: 0.05 }] }), 'off-target alto')
assert.ok(!by('clean-cut').met({ ...base, acts: false }))

assert.ok(by('precision').met({ ...base, cas: 'abe' }))
assert.ok(!by('precision').met(base))

assert.ok(by('cas12a').met({ ...base, nuclease: 'cas12a' }))
assert.ok(!by('cas12a').met(base))

assert.ok(by('fix-sickle').met({ ...base, disease: 'sickle', verdict: 'success' }))
assert.ok(!by('fix-sickle').met({ ...base, disease: 'sickle', verdict: 'broken' }))
assert.ok(!by('fix-sickle').met({ ...base, verdict: 'success' }))
