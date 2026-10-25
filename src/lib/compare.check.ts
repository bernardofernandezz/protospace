// Autoverificação das linhas da tabela de comparação: `npm test`
import assert from 'node:assert/strict'
import { STRATEGIES, comparePlan, otherNuclease, rank } from './compare.ts'
import { DEFAULT_LOCUS, NUCLEASE, findCandidates } from './dna.ts'
import { DISEASES, targetPos } from '../content/diseases.ts'

const WT_ONLY = STRATEGIES.filter((s) => s.cas === 'wt').length
const params = (over: Partial<Parameters<typeof comparePlan>[0]> = {}) => {
  const locus = over.locus ?? DEFAULT_LOCUS
  const nuclease = over.nuclease ?? 'spcas9'
  return { locus, disease: null, nuclease, selected: 0, guide: findCandidates(locus, nuclease)[0].protospacer, ...over }
}

// as duas nucleases aparecem, e só a Cas9 traz as ferramentas derivadas dela
{
  const p = params()
  const plan = comparePlan(p)
  const mine = plan.filter((r) => r.nuclease === 'spcas9')
  const theirs = plan.filter((r) => r.nuclease === 'cas12a')
  assert.equal(mine.length, STRATEGIES.length, 'a nuclease atual traz todas as ferramentas')
  assert.equal(theirs.length, WT_ONLY, 'a outra nuclease traz só as vias da enzima selvagem')
  assert.ok(
    theirs.every((r) => r.cas === 'wt'),
    'nickase e editores não existem fora da Cas9',
  )

  // a nuclease atual fica no sítio e no guia do usuário
  assert.ok(
    mine.every((r) => r.selected === p.selected && r.guide === p.guide),
    'a atual não muda de alvo',
  )

  // a outra entra num sítio dela: PAM TTTV e corte escalonado
  const sites = findCandidates(p.locus, 'cas12a')
  for (const r of theirs) {
    const site = sites[r.selected]
    assert.ok(site, 'a linha aponta para um sítio existente da outra nuclease')
    assert.match(site.pam, NUCLEASE.cas12a.pam.re, 'PAM TTTV')
    assert.notEqual(site.cut, site.cutFar, 'a Cas12a corta de forma escalonada')
    assert.equal(r.guide, site.protospacer, 'o guia da linha é o do sítio dela')
  }
}

// sem PAM da outra enzima, a tabela fica só com a atual
{
  const semTttv = DEFAULT_LOCUS.replaceAll('TTT', 'TAT')
  assert.equal(findCandidates(semTttv, 'cas12a').length, 0, 'o locus de teste não deveria ter TTTV')
  assert.ok(
    comparePlan(params({ locus: semTttv })).every((r) => r.nuclease === 'spcas9'),
    'sem sítio, a outra não entra',
  )
}

// num cenário, a outra nuclease entra pelo sítio mais próximo do alvo
for (const d of DISEASES) {
  const sites = findCandidates(d.locus, 'cas12a')
  if (!sites.length) continue
  const plan = comparePlan(params({ locus: d.locus, disease: d.id, guide: findCandidates(d.locus)[0].protospacer }))
  const row = plan.find((r) => r.nuclease === 'cas12a')!
  const nearest = sites.reduce((best, s, i) => (Math.abs(s.cut - targetPos(d)) < Math.abs(sites[best].cut - targetPos(d)) ? i : best), 0)
  assert.equal(row.selected, nearest, `[${d.id}] a outra nuclease deveria entrar pelo sítio mais perto do alvo`)
}

// o objetivo do cenário pesa mais que a eficiência bruta
assert.ok(rank({ verdict: 'success', eff: 0.01 }) > rank({ verdict: 'broken', eff: 0.99 }), 'resolver vence eficiência')
assert.ok(rank({ verdict: 'success', eff: 0.5 }) > rank({ verdict: 'success', eff: 0.2 }), 'entre as que resolvem, a mais eficiente')
assert.equal(otherNuclease(otherNuclease('spcas9')), 'spcas9', 'a outra nuclease da outra é a de origem')

console.log('compare.check ok')
