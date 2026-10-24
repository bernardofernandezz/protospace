// Cenários clínicos do playground: um alelo patogênico real para o usuário tentar corrigir.
// As sequências são trechos curtos do gene (fita senso), suficientes para desenhar o guia.
import type { L } from '../i18n'

export interface Disease {
  id: string
  name: L
  gene: L
  /** Trecho do gene com o alelo DOENTE (fita senso). */
  locus: string
  /** Índice, no locus, da base patogênica. */
  pos: number
  /** Base do alelo saudável nessa posição. */
  wt: string
  /** Índice do ATG inicial: define o quadro de leitura da tradução. */
  orf: number
  /** O que a doença faz, em linguagem comum. */
  plain: L
  /** O detalhe molecular, para quem quer o nível técnico. */
  tech: L
  /** Por que ser recessiva muda o que a edição precisa alcançar. */
  inherit: L
}

export const DISEASES: Disease[] = [
  {
    id: 'sickle',
    name: { pt: 'Anemia falciforme', en: 'Sickle cell disease' },
    gene: { pt: 'HBB · β-globina (éxon 1)', en: 'HBB · β-globin (exon 1)' },
    locus: 'ACATTTGCTTCTGACACAACTGTGTTCACTAGCAACCTCAAACAGACACCATGGTGCACCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGG',
    pos: 69,
    wt: 'A',
    orf: 50,
    plain: {
      pt: 'Uma única letra trocada no gene da hemoglobina faz a proteína se agrupar quando falta oxigênio. A hemácia perde a forma de disco, vira uma foice, entope vasos pequenos e causa crises de dor e anemia.',
      en: 'A single swapped letter in the haemoglobin gene makes the protein clump when oxygen runs low. The red blood cell loses its disc shape, turns into a sickle, blocks small vessels and causes pain crises and anaemia.',
    },
    tech: {
      pt: 'HBB c.20A>T: o códon 6 passa de GAG (Glu) para GTG (Val). A valina é hidrofóbica e cria um ponto de adesão entre moléculas de hemoglobina desoxigenada, que polimerizam em fibras. É a troca que define a HbS.',
      en: 'HBB c.20A>T: codon 6 changes from GAG (Glu) to GTG (Val). Valine is hydrophobic and creates a sticky patch between deoxygenated haemoglobin molecules, which polymerise into fibres. This is the substitution that defines HbS.',
    },
    inherit: {
      pt: 'Herança recessiva: quem tem só um alelo alterado (traço falciforme) costuma ser assintomático. A doença aparece com os dois alelos alterados — por isso a terapia precisa corrigir (ou compensar) os dois.',
      en: 'Recessive inheritance: carrying one altered allele (sickle cell trait) is usually asymptomatic. The disease appears with both alleles altered — so therapy must correct (or compensate for) both.',
    },
  },
]

export const findDisease = (id: string | null) => DISEASES.find((d) => d.id === id)
