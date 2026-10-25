// Cenários clínicos do playground: um alvo real para o usuário tentar resolver.
// As sequências são trechos curtos do gene (fita senso), copiados das referências citadas
// em `source`, com o alelo patogênico aplicado. Verificadas em diseases.check.ts.
import type { L } from '../i18n'
import type { Fix } from '../lib/dna'

/** `fix` devolve o alelo saudável; `disrupt` destrói um elemento regulador. */
export type Goal = 'fix' | 'disrupt'

export interface Disease {
  id: string
  name: L
  gene: L
  /** Trecho do gene com o alelo DOENTE (fita senso). */
  locus: string
  /** Notação do alvo (HGVS para variantes), como aparece na literatura. */
  variant: string
  /** De onde veio a sequência, para quem quiser conferir. */
  source: L<string>
  goal: Goal
  /** Cenários `fix`: a edição que restaura o alelo saudável. */
  fix?: Fix
  /** Cenários `disrupt`: o trecho que precisa deixar de existir (ocorre uma vez no locus). */
  motif?: string
  /** Índice onde começa a leitura dos códons, quando o trecho é codificante. */
  orf?: number
  /** O que a doença faz, em linguagem comum. */
  plain: L
  /** O detalhe molecular, para quem quer o nível técnico. */
  tech: L
  /** Por que a herança (ou a escolha do alvo) muda o que a edição precisa alcançar. */
  inherit: L
}

export const DISEASES: Disease[] = [
  {
    id: 'sickle',
    name: { pt: 'Anemia falciforme', en: 'Sickle cell disease' },
    gene: { pt: 'HBB · β-globina (éxon 1)', en: 'HBB · β-globin (exon 1)' },
    locus: 'ACATTTGCTTCTGACACAACTGTGTTCACTAGCAACCTCAAACAGACACCATGGTGCATCTGACTCCTGTGGAGAAGTCTGCCGTTACTGCCCTGTGGGGCAAGGTGAACGTGGATGAAGTTGG',
    variant: 'c.20A>T · p.Glu7Val (HbS)',
    source: { pt: 'NM_000518.5 (HBB), nt 1–123', en: 'NM_000518.5 (HBB), nt 1–123' },
    goal: 'fix',
    fix: { pos: 69, del: 1, ins: 'A' },
    orf: 50,
    plain: {
      pt: 'Uma única letra trocada no gene da hemoglobina faz a proteína se agrupar quando falta oxigênio. A hemácia perde a forma de disco, vira uma foice, entope vasos pequenos e causa crises de dor e anemia.',
      en: 'A single swapped letter in the haemoglobin gene makes the protein clump when oxygen runs low. The red blood cell loses its disc shape, turns into a sickle, blocks small vessels and causes pain crises and anaemia.',
    },
    tech: {
      pt: 'HBB c.20A>T: o códon 6 (7 na numeração HGVS, que conta a metionina inicial) passa de GAG (Glu) para GTG (Val). A valina é hidrofóbica e cria um ponto de adesão entre moléculas de hemoglobina desoxigenada, que polimerizam em fibras. É a troca que define a HbS.',
      en: 'HBB c.20A>T: codon 6 (7 in HGVS numbering, which counts the initial methionine) changes from GAG (Glu) to GTG (Val). Valine is hydrophobic and creates a sticky patch between deoxygenated haemoglobin molecules, which polymerise into fibres. This is the substitution that defines HbS.',
    },
    inherit: {
      pt: 'Herança recessiva: quem tem só um alelo alterado (traço falciforme) costuma ser assintomático. A doença aparece com os dois alelos alterados — por isso a terapia precisa corrigir (ou compensar) os dois.',
      en: 'Recessive inheritance: carrying one altered allele (sickle cell trait) is usually asymptomatic. The disease appears with both alleles altered — so therapy must correct (or compensate for) both.',
    },
  },
  {
    id: 'cftr',
    name: { pt: 'Fibrose cística', en: 'Cystic fibrosis' },
    gene: { pt: 'CFTR · éxon 11 (F508del)', en: 'CFTR · exon 11 (F508del)' },
    locus: 'ATTTCATTCTGTTCTCAGTTTTCCTGGATTATGCCTGGCACCATTAAAGAAAATATCATTGGTGTTTCCTATGATGAATATAGATACAGAAGCGTCATCAAAGCATGCCAACTAGAAGAGGACATC',
    variant: 'c.1521_1523delCTT · p.Phe508del',
    source: { pt: 'NM_000492.4 (CFTR), região do códon 508', en: 'NM_000492.4 (CFTR), codon 508 region' },
    goal: 'fix',
    fix: { pos: 59, del: 0, ins: 'CTT' },
    orf: 30,
    plain: {
      pt: 'Faltam três letras no gene CFTR, e com elas some um aminoácido da proteína. O canal que deveria levar cloro para fora da célula se enovela errado e é destruído antes de chegar à membrana: o muco fica espesso e entope pulmões e pâncreas.',
      en: 'Three letters are missing from the CFTR gene, and with them one amino acid of the protein. The channel that should move chloride out of the cell folds wrongly and is destroyed before reaching the membrane: mucus turns thick and clogs lungs and pancreas.',
    },
    tech: {
      pt: 'CFTR c.1521_1523delCTT (p.Phe508del): deleção em quadro no éxon 11, presente em cerca de 70 % dos alelos de fibrose cística. A proteína é sintetizada, mas o controle de qualidade do retículo endoplasmático a degrada (defeito de classe II). Repare que nenhum editor de bases devolve letras perdidas — aqui só HDR ou prime editing resolvem.',
      en: 'CFTR c.1521_1523delCTT (p.Phe508del): an in-frame deletion in exon 11, found in roughly 70 % of cystic fibrosis alleles. The protein is made, but endoplasmic reticulum quality control degrades it (class II defect). Note that no base editor can give back missing letters — here only HDR or prime editing work.',
    },
    inherit: {
      pt: 'Recessiva: são necessários dois alelos alterados. Como o pulmão se renova a partir de células-tronco das vias aéreas, uma terapia genética precisa alcançar essas células — e não apenas as que estão na superfície hoje.',
      en: 'Recessive: two altered alleles are needed. Because the lung renews itself from airway stem cells, a gene therapy must reach those cells — not only the ones sitting on the surface today.',
    },
  },
  {
    id: 'bcl11a',
    name: { pt: 'Hemoglobina fetal (Casgevy)', en: 'Fetal haemoglobin (Casgevy)' },
    gene: { pt: 'BCL11A · enhancer eritroide +58', en: 'BCL11A · +58 erythroid enhancer' },
    locus: 'GGCCAGAAAAGAGATATGGCATCTACTCTTAGACATAACACACCAGGGTCAATACAACTTTGAAGCTAGTCTAGTGCAAGCTAACAGTTGCTTTTATCACAGGCTCCAGGAAGGGTTTGGCCTCTGATTAGGGTGGGGGC',
    variant: 'GATA1 · DHS +58',
    source: { pt: 'hg38 chr2:60.495.223–60.495.363 (fita do gene)', en: 'hg38 chr2:60,495,223–60,495,363 (gene strand)' },
    goal: 'disrupt',
    motif: 'TTATCA',
    plain: {
      pt: 'Aqui o alvo não é o gene defeituoso. Todo mundo nasce produzindo hemoglobina fetal e desliga essa produção nos primeiros meses de vida. Quebrando o interruptor que faz esse desligamento, a pessoa volta a produzir hemoglobina fetal — e ela ocupa o lugar da hemoglobina doente.',
      en: 'Here the target is not the faulty gene. Everyone is born making fetal haemoglobin and switches it off in the first months of life. By breaking the switch that performs the shut-off, a person makes fetal haemoglobin again — and it takes the place of the diseased haemoglobin.',
    },
    tech: {
      pt: 'O corte destrói o motivo GATA1 no núcleo funcional do DHS +58 do BCL11A. Sem esse motivo, o BCL11A deixa de ser expresso nos precursores eritroides, o HBG1/HBG2 é desreprimido e a HbF sobe. É a lógica do exa-cel (Casgevy), aprovado em 2023. Note que, neste cenário, o indel do NHEJ é o objetivo: um reparo fiel não serve de nada.',
      en: 'The cut destroys the GATA1 motif in the functional core of the BCL11A +58 DHS. Without that motif, BCL11A is no longer expressed in erythroid precursors, HBG1/HBG2 are de-repressed and HbF rises. This is the logic of exa-cel (Casgevy), approved in 2023. Note that here the NHEJ indel is the goal: a faithful repair achieves nothing.',
    },
    inherit: {
      pt: 'Como o alvo é um elemento regulador, e não o alelo doente, a mesma edição serve para anemia falciforme e para beta-talassemia. Também não é preciso acertar os dois alelos de todas as células: basta uma fração das células-tronco para elevar a HbF.',
      en: 'Because the target is a regulatory element rather than the faulty allele, the same edit serves both sickle cell disease and beta-thalassaemia. Nor does every cell need both alleles edited: a fraction of the stem cells is enough to raise HbF.',
    },
  },
]

export const findDisease = (id: string | null) => DISEASES.find((d) => d.id === id)

/** Trecho que o experimento precisa alcançar: a correção ou o motivo a destruir. */
export function targetSpan(d: Disease): { start: number; length: number } {
  if (d.goal === 'disrupt') return { start: d.locus.indexOf(d.motif!), length: d.motif!.length }
  return { start: d.fix!.pos, length: Math.max(1, d.fix!.del) }
}

export const targetPos = (d: Disease) => targetSpan(d).start
