// Autoverificação da lógica de sequência: `npm test`
import assert from 'node:assert/strict'
import { DEFAULT_LOCUS, aminoAcid, applyOps, baseEditOps, cutProbability, diffSegments, findCandidates, hdrOps, nhejOps, translate } from './dna.ts'

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
for (const k of cands) for (const op of baseEditOps(k)) assert.equal(DEFAULT_LOCUS[op.pos], 'C')

console.log('ok:', cands.map((k) => `${k.protospacer} ${k.pam} score=${k.score}`).join('\n    '))
