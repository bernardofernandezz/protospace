// Autoverificação dos cenários clínicos: `npm test`
import assert from 'node:assert/strict'
import { DISEASES } from './diseases.ts'
import { FIX_RANGE, MAX_LOCUS, applyOps, clean, findCandidates, hdrOps, nearestSite, nhejOps, translate } from '../lib/dna.ts'

for (const d of DISEASES) {
  const where = `[${d.id}]`
  assert.equal(clean(d.locus), d.locus, `${where} locus só com A/C/G/T maiúsculos`)
  assert.ok(d.locus.length <= MAX_LOCUS, `${where} locus acima do limite do playground`)
  assert.ok(d.pos >= 0 && d.pos < d.locus.length, `${where} posição fora do locus`)
  assert.notEqual(d.locus[d.pos], d.wt, `${where} o locus deve carregar o alelo DOENTE`)
  assert.equal(d.locus.slice(d.orf, d.orf + 3), 'ATG', `${where} orf precisa apontar para o códon de início`)
  assert.ok(d.pos > d.orf, `${where} a mutação deve cair depois do início da tradução`)

  // a troca muda a proteína em exatamente um resíduo, sem criar parada prematura
  const healthyLocus = d.locus.slice(0, d.pos) + d.wt + d.locus.slice(d.pos + 1)
  const healthy = translate(healthyLocus, d.orf)
  const sick = translate(d.locus, d.orf)
  assert.equal(healthy.length, sick.length, `${where} a troca não deveria mudar o tamanho da proteína`)
  assert.equal([...healthy].filter((a, i) => a !== sick[i]).length, 1, `${where} esperado exatamente 1 resíduo diferente`)

  // existe um sítio NGG cujo corte está ao alcance do molde, e ele corrige o alelo
  const cands = findCandidates(d.locus)
  assert.ok(cands.length > 0, `${where} nenhum PAM NGG no locus`)
  const c = cands[nearestSite(cands, d.pos)]
  assert.ok(Math.abs(c.cut - d.pos) <= FIX_RANGE, `${where} nenhum corte ao alcance da mutação`)
  const fixed = applyOps(d.locus, hdrOps(c, { pos: d.pos, wt: d.wt }))
  assert.equal(fixed.seq, healthyLocus, `${where} HDR com molde deve restaurar o alelo saudável`)
  assert.equal(translate(fixed.seq, d.orf), healthy, `${where} proteína corrigida`)
  assert.equal(fixed.changed.filter(Boolean).length, 1, `${where} a correção deve tocar uma única base`)

  // um sítio longe demais não corrige: o molde só deixa a marca de triagem
  const far = cands.find((k) => Math.abs(k.cut - d.pos) > FIX_RANGE)
  if (far) assert.notEqual(translate(applyOps(d.locus, hdrOps(far, { pos: d.pos, wt: d.wt })).seq, d.orf), healthy, `${where} corte distante não deveria corrigir`)

  // NHEJ no mesmo sítio inativa o gene em vez de corrigi-lo (nunca "cura" por acaso)
  for (let s = 1; s < 40; s++) {
    assert.notEqual(translate(applyOps(d.locus, nhejOps(d.locus, c.cut, s)).seq, d.orf), healthy, `${where} NHEJ não corrige (seed ${s})`)
  }
}

console.log('ok:', DISEASES.map((d) => `${d.id} ${translate(d.locus, d.orf).slice(0, 9)}`).join(', '))
