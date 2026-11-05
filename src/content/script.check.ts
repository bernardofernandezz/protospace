// Autoverificação do roteiro do apresentador: `npm test`
import assert from 'node:assert/strict'
import { SCRIPT } from './script.ts'

const STEPS = 6 // STEP_COUNT em src/playground/store.ts
for (const lang of ['pt', 'en'] as const) {
  assert.equal(SCRIPT[lang].length, STEPS, `${lang}: uma nota por etapa`)
  for (const n of SCRIPT[lang]) assert.ok(n.tip.trim() && n.ask.includes('?'), `${lang}: nota incompleta`)
}
