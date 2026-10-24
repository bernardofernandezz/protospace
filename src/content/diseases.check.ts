// Autoverificação dos cenários clínicos: `npm test`
import assert from 'node:assert/strict'
import { DISEASES, targetPos, targetSpan } from './diseases.ts'
import {
  FIX_RANGE, MAX_LOCUS, PE_RANGE, applyOps, clean, findCandidates, hdrOps, nearestSite, nhejOps,
  primeEditOps, translate,
} from '../lib/dna.ts'

/** Início do peptídeo sadio de cada cenário codificante, conferido contra a literatura. */
const PEPTIDE: Record<string, string> = {
  sickle: 'MVHLTPEEK',
  cftr: 'MPGTIKENIIFGVSYDEY',
}

for (const d of DISEASES) {
  const where = `[${d.id}]`
  assert.equal(clean(d.locus), d.locus, `${where} locus só com A/C/G/T maiúsculos`)
  assert.ok(d.locus.length <= MAX_LOCUS, `${where} locus acima do limite do playground`)

  const cands = findCandidates(d.locus)
  assert.ok(cands.length > 0, `${where} nenhum PAM NGG no locus`)
  const pos = targetPos(d)
  assert.ok(pos >= 0 && pos < d.locus.length, `${where} alvo fora do locus`)
  const site = cands[nearestSite(cands, pos)]

  if (d.goal === 'fix') {
    assert.ok(d.fix && d.orf !== undefined, `${where} cenário 'fix' precisa de fix e orf`)
    assert.equal(d.locus.slice(d.orf, d.orf + 3), 'ATG', `${where} orf precisa apontar para um códon ATG`)
    assert.ok(pos > d.orf, `${where} o alvo deve cair depois do início da tradução`)

    const healthy = applyOps(d.locus, [d.fix]).seq
    assert.notEqual(healthy, d.locus, `${where} o locus deve carregar o alelo DOENTE`)
    const sickProtein = translate(d.locus, d.orf)
    const protein = translate(healthy, d.orf)
    assert.notEqual(protein, sickProtein, `${where} a correção precisa mudar a proteína`)
    assert.ok(!protein.includes('*'), `${where} o trecho sadio não deveria ter parada prematura`)
    assert.ok(protein.startsWith(PEPTIDE[d.id]), `${where} peptídeo sadio inesperado: ${protein.slice(0, 20)}`)

    // HDR: o sítio mais próximo alcança a mutação e restaura exatamente o alelo sadio
    assert.ok(Math.abs(site.cut - pos) <= FIX_RANGE, `${where} nenhum corte ao alcance da mutação`)
    assert.equal(applyOps(d.locus, hdrOps(site, d.fix)).seq, healthy, `${where} HDR com molde deve restaurar o alelo sadio`)

    // prime editing: existe um sítio cujo nick cai logo antes do alvo
    const nick = cands.find((c) => pos - c.cut >= 0 && pos - c.cut <= PE_RANGE)
    assert.ok(nick, `${where} nenhum nick ao alcance do prime editor`)
    assert.equal(applyOps(d.locus, primeEditOps(nick, d.fix)).seq, healthy, `${where} prime editing deve restaurar o alelo sadio`)

    // um sítio longe demais não corrige: o molde só deixa a marca de triagem
    const far = cands.find((c) => Math.abs(c.cut - pos) > FIX_RANGE)
    if (far) assert.notEqual(translate(applyOps(d.locus, hdrOps(far, d.fix)).seq, d.orf), protein, `${where} corte distante não deveria corrigir`)

    // NHEJ no mesmo sítio inativa o gene em vez de corrigi-lo (nunca "cura" por acaso)
    for (let s = 1; s < 40; s++) {
      assert.notEqual(translate(applyOps(d.locus, nhejOps(d.locus, site.cut, s)).seq, d.orf), protein, `${where} NHEJ não corrige (seed ${s})`)
    }
  } else {
    assert.ok(d.motif, `${where} cenário 'disrupt' precisa de motif`)
    assert.equal(d.locus.split(d.motif).length - 1, 1, `${where} o motivo deve ocorrer uma única vez`)

    // o corte precisa cair dentro do motivo, para que o indel tenha chance de destruí-lo
    const span = targetSpan(d)
    assert.ok(site.cut >= span.start && site.cut < span.start + span.length, `${where} o corte não cai no motivo`)

    // a maioria dos indels resolve, mas nem todos: numa repetição, deletar "CA" de "TTATCACA"
    // reconstrói o motivo. É esse resto que a simulação de população precisa mostrar.
    const seeds = 200
    let destroyed = 0
    for (let s = 1; s <= seeds; s++) {
      if (!applyOps(d.locus, nhejOps(d.locus, site.cut, s)).seq.includes(d.motif)) destroyed++
    }
    assert.ok(destroyed / seeds > 0.8, `${where} indel deveria destruir o motivo na maioria das vezes (${destroyed}/${seeds})`)
    assert.ok(destroyed < seeds, `${where} esperado ao menos um indel que preserva o motivo`)
  }
}

const summary = DISEASES.map((d) => (d.goal === 'fix' ? `${d.id} ${translate(d.locus, d.orf!).slice(0, 9)}` : `${d.id} ${d.motif}`))
console.log('ok:', summary.join(', '))
