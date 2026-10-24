// Autoverificação da lógica de sequência: `npm test`
import assert from 'node:assert/strict'
import {
  BASE_EDITORS, DEFAULT_LOCUS, PE_RANGE, aminoAcid, applyOps, baseEditOps, consequence, cutProbability,
  diffSegments, findCandidates, hdrOps, nhejOps, population, primeEditOps, repairOdds, translate,
} from './dna.ts'

// código genético: âncoras conhecidas em cada bloco da tabela
for (const [codon, aa] of [['ATG', 'M'], ['GAG', 'E'], ['GTG', 'V'], ['TTT', 'F'], ['TGG', 'W'], ['TAA', '*'], ['TAG', '*'], ['TGA', '*'], ['CCC', 'P'], ['AAA', 'K'], ['GGG', 'G']] as const) {
  assert.equal(aminoAcid(codon), aa, `códon ${codon}`)
}
assert.equal(aminoAcid('AT'), '?')
assert.equal(aminoAcid('ANG'), '?')
// a tradução começa no quadro pedido e para no primeiro stop (incluído)
assert.equal(translate('CCATGGAGTAACCCATG', 2), 'ME*')
assert.equal(translate('ATGGA', 0), 'M')

const cands = findCandidates(DEFAULT_LOCUS)
assert.ok(cands.length >= 3, 'locus padrão deve ter ≥3 sítios NGG')
for (const c of cands) {
  assert.equal(c.protospacer.length, 20)
  assert.match(c.pam, /^[ACGT]GG$/)
  assert.equal(c.cut, c.start + 17) // 3 pb a montante do PAM
}
const c = cands[0]
assert.ok(cutProbability(c.protospacer, c.protospacer, 1) > 0.9)
const seedMm = c.protospacer.slice(0, 19) + (c.protospacer[19] === 'A' ? 'C' : 'A')
const distalMm = (c.protospacer[0] === 'A' ? 'C' : 'A') + c.protospacer.slice(1)
assert.ok(cutProbability(seedMm, c.protospacer, 0) < cutProbability(distalMm, c.protospacer, 0), 'seed pesa mais')

const hdr = applyOps(DEFAULT_LOCUS, hdrOps(c))
assert.equal(hdr.seq.length, DEFAULT_LOCUS.length + 6)
assert.ok(hdr.seq.includes('GAATTC'))
assert.equal(hdr.changed.filter(Boolean).length, 7)

for (let s = 1; s < 50; s++) {
  const ops = nhejOps(DEFAULT_LOCUS, c.cut, s)
  const segs = diffSegments(DEFAULT_LOCUS, ops)
  const orig = segs.filter((g) => g.type !== 'ins').map((g) => g.text).join('')
  const edit = segs.filter((g) => g.type !== 'del').map((g) => g.text).join('')
  assert.equal(orig, DEFAULT_LOCUS)
  assert.equal(edit, applyOps(DEFAULT_LOCUS, ops).seq)
}
// editores de base: só tocam a letra que sabem converter, e só dentro da janela 4–8
for (const [editor, { from, to }] of Object.entries(BASE_EDITORS)) {
  for (const k of cands) {
    for (const op of baseEditOps(k, editor as keyof typeof BASE_EDITORS)) {
      assert.equal(DEFAULT_LOCUS[op.pos], from, `${editor} fora da base de origem`)
      assert.equal(op.ins, to)
      const offset = op.pos - k.start
      assert.ok(offset >= 3 && offset <= 7, `${editor} fora da janela de edição`)
    }
  }
}

// prime editing: escreve só para a frente do nick e dentro do alcance da extensão do pegRNA
const target = { pos: c.cut + 10, del: 1, ins: 'A' }
assert.deepEqual(primeEditOps(c, target), [target])
assert.deepEqual(primeEditOps(c, { ...target, pos: c.cut - 1 }), [], 'atrás do nick: nada escrito')
assert.deepEqual(primeEditOps(c, { ...target, pos: c.cut + PE_RANGE + 1 }), [], 'fora do alcance: nada escrito')
assert.equal(primeEditOps(c).length, 1, 'sem alvo, deixa a marca de triagem no nick')

// consequência sobre a proteína
assert.equal(consequence('MVHLTPEEK', 'MVHLTPEEK', []), 'none')
assert.equal(consequence('MVHLTPEEK', 'MVHLTPEEK', [{ pos: 0, del: 3, ins: 'XYZ' }]), 'silent')
assert.equal(consequence('MVHLTPEEK', 'MVHLTPVEK', [{ pos: 0, del: 1, ins: 'T' }]), 'missense')
assert.equal(consequence('MVHLTPEEK', 'MVHLT*', [{ pos: 0, del: 1, ins: 'T' }]), 'nonsense')
assert.equal(consequence('MVHLTPEEK', 'MVHLTPEK', [{ pos: 0, del: 3, ins: '' }]), 'inframe')
assert.equal(consequence('MVHLTPEEK', 'MVHGH', [{ pos: 0, del: 1, ins: '' }]), 'frameshift')

// população: as contagens fecham, a semente reproduz o resultado e sem corte nada é editado
const popArgs = {
  pEngage: 0.8,
  odds: repairOdds('wt', 'nhej'),
  intended: (seed: number) => nhejOps(DEFAULT_LOCUS, c.cut, seed),
  unwanted: (seed: number) => nhejOps(DEFAULT_LOCUS, c.cut, seed),
  succeeded: () => true,
  seed: 7,
}
const pop = population(popArgs)
assert.equal(pop.tally.intended + pop.tally.indel + pop.tally.unedited, pop.alleles)
assert.equal(pop.cells.none + pop.cells.one + pop.cells.both, pop.alleles / 2)
assert.equal(pop.spectrum.reduce((a, s) => a + s.alleles, 0), pop.tally.intended + pop.tally.indel)
assert.deepEqual(population(popArgs), pop, 'a mesma semente deve dar o mesmo resultado')
assert.notDeepEqual(population({ ...popArgs, seed: 8 }), pop, 'sementes diferentes, resultados diferentes')
assert.equal(population({ ...popArgs, pEngage: 0 }).tally.unedited, pop.alleles, 'sem engate, nada é editado')
assert.equal(population({ ...popArgs, succeeded: () => false }).tally.intended, 0, 'sem sucesso, nada conta como pretendido')

console.log('ok:', cands.map((k) => `${k.protospacer} ${k.pam} score=${k.score}`).join('\n    '))
