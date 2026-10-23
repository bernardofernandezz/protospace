// Exposições do modo Explorar (PT/EN). As zonas "crispr" seguem o locus e são posicionadas pela
// timeline (src/playground/scene/Explorer.tsx); as demais têm posição fixa no mundo.
import type { L } from '../i18n'

export type Region = 'crispr' | 'genome' | 'expression' | 'origin' | 'clinic'
export type Vec3 = [number, number, number]

export interface Exhibit {
  id: string
  region: Region
  short: L
  title: L
  body: L
  fact: L
  /** Etapas da simulação que a zona demonstra (botões "Ver etapa"). */
  steps?: number[]
  /** Posição fixa no mundo (ausente nas zonas que acompanham o locus). */
  pos?: Vec3
  /** Raio aproximado do modelo: define o alcance da zona e onde o "voar até" para. */
  size?: number
  /** Raio de colisão com a sonda (0/ausente = atravessável). */
  solid?: number
}

export const REGIONS: Record<Region, L> = {
  crispr: { pt: 'CRISPR no locus', en: 'CRISPR at the locus' },
  genome: { pt: 'Genoma', en: 'Genome' },
  expression: { pt: 'Expressão gênica', en: 'Gene expression' },
  origin: { pt: 'Origem do CRISPR', en: 'Origin of CRISPR' },
  clinic: { pt: 'Clínica e variação', en: 'Clinic & variation' },
}

const CHROMOSOME: Vec3 = [-8, 16, -36]

export const EXHIBITS: Exhibit[] = [
  // ---------- CRISPR (acompanham o locus) ----------
  {
    id: 'guide', region: 'crispr', steps: [0],
    short: { pt: 'Guia', en: 'Guide' },
    title: { pt: 'sgRNA e protoespaçador', en: 'sgRNA & protospacer' },
    body: { pt: 'O espaçador de 20 nt do guia pareia com o protoespaçador, logo a 5′ do PAM. É ele que dá o endereço da edição.', en: 'The guide’s 20-nt spacer pairs with the protospacer, right 5′ of the PAM. It is the address of the edit.' },
    fact: { pt: 'O sgRNA é uma fusão artificial de dois RNAs naturais da bactéria (crRNA + tracrRNA), proposta por Jinek et al. em 2012.', en: 'The sgRNA is an engineered fusion of two natural bacterial RNAs (crRNA + tracrRNA), introduced by Jinek et al. in 2012.' },
  },
  {
    id: 'pam', region: 'crispr', steps: [2],
    short: { pt: 'PAM', en: 'PAM' },
    title: { pt: 'PAM (NGG)', en: 'PAM (NGG)' },
    body: { pt: 'Sem PAM não há corte: o domínio PI da Cas9 reconhece o NGG antes de testar o guia — é assim que a bactéria poupa o próprio arranjo CRISPR.', en: 'No PAM, no cut: Cas9’s PI domain reads the NGG before testing the guide — that is how bacteria spare their own CRISPR array.' },
    fact: { pt: 'Variantes como SpCas9-NG e SpRY afrouxam a exigência de PAM e ampliam os sítios editáveis.', en: 'Variants such as SpCas9-NG and SpRY relax the PAM requirement and widen the editable sites.' },
  },
  {
    id: 'decoy', region: 'crispr', steps: [2],
    short: { pt: 'PAM isca', en: 'Decoy PAM' },
    title: { pt: 'PAM isca', en: 'Decoy PAM' },
    body: { pt: 'Um NGG sem complementaridade com o guia: a Cas9 para, testa a seed e solta em milissegundos.', en: 'An NGG with no match to the guide: Cas9 stops, tests the seed and lets go within milliseconds.' },
    fact: { pt: 'Experimentos de molécula única mostram a Cas9 procurando por difusão 3D, com contatos breves em cada PAM.', en: 'Single-molecule experiments show Cas9 searching by 3D diffusion, with brief contacts at each PAM.' },
  },
  {
    id: 'cas9', region: 'crispr', steps: [2],
    short: { pt: 'Cas9', en: 'Cas9' },
    title: { pt: 'Cas9', en: 'Cas9' },
    body: { pt: 'O lóbulo REC segura o heterodúplex RNA-DNA; HNH e RuvC são as duas tesouras, uma para cada fita.', en: 'The REC lobe holds the RNA-DNA heteroduplex; HNH and RuvC are the two scissors, one per strand.' },
    fact: { pt: 'A SpCas9 tem 1.368 aminoácidos (~160 kDa) e vem da bactéria Streptococcus pyogenes.', en: 'SpCas9 has 1,368 amino acids (~160 kDa) and comes from the bacterium Streptococcus pyogenes.' },
  },
  {
    id: 'cut', region: 'crispr', steps: [3, 4],
    short: { pt: 'Corte', en: 'Cut' },
    title: { pt: 'Sítio de corte', en: 'Cut site' },
    body: { pt: 'A 3 pb do PAM, HNH e RuvC deixam extremidades cegas. A partir daqui, quem decide o resultado é o reparo da célula.', en: '3 bp from the PAM, HNH and RuvC leave blunt ends. From here on, the cell’s repair decides the outcome.' },
    fact: { pt: 'A Cas9 pode continuar presa ao DNA depois do corte, o que influencia quando e como o reparo consegue agir.', en: 'Cas9 can stay bound to the DNA after cutting, which affects when and how repair can step in.' },
  },
  {
    id: 'off0', region: 'crispr', steps: [5],
    short: { pt: 'Off-target 1', en: 'Off-target 1' },
    title: { pt: 'Sítio off-target', en: 'Off-target site' },
    body: { pt: 'Sequência parecida com o alvo em outro ponto do genoma. Quanto mais mismatches (sobretudo na seed), menor o risco de corte.', en: 'A target look-alike elsewhere in the genome. The more mismatches (especially in the seed), the lower the cut risk.' },
    fact: { pt: 'Métodos como GUIDE-seq e CIRCLE-seq mapeiam experimentalmente onde uma nuclease corta no genoma.', en: 'Methods such as GUIDE-seq and CIRCLE-seq map experimentally where a nuclease cuts in the genome.' },
  },
  {
    id: 'off1', region: 'crispr', steps: [5],
    short: { pt: 'Off-target 2', en: 'Off-target 2' },
    title: { pt: 'Sítio off-target', en: 'Off-target site' },
    body: { pt: 'Outro sítio parecido. Compare o halo com o do primeiro: ele cresce com a probabilidade ilustrativa de corte.', en: 'Another look-alike. Compare its halo with the first one: it grows with the illustrative cut probability.' },
    fact: { pt: 'Variantes de alta fidelidade (eSpCas9, SpCas9-HF1, HypaCas9) reduzem cortes off-target mantendo boa atividade no alvo.', en: 'High-fidelity variants (eSpCas9, SpCas9-HF1, HypaCas9) cut fewer off-targets while keeping good on-target activity.' },
  },

  // ---------- Genoma ----------
  {
    id: 'pairing', region: 'genome', pos: [-14, -9, 9], size: 2.5, solid: 2,
    short: { pt: 'Pareamento', en: 'Base pairing' },
    title: { pt: 'Pareamento de bases', en: 'Base pairing' },
    body: { pt: 'A pareia com T por 2 ligações de hidrogênio; G com C por 3. Por isso trechos ricos em GC são mais estáveis e só se separam a temperaturas maiores.', en: 'A pairs with T through 2 hydrogen bonds; G with C through 3. That is why GC-rich stretches are more stable and only separate at higher temperatures.' },
    fact: { pt: 'A Foto 51, obtida por Rosalind Franklin e Raymond Gosling em 1952, foi peça-chave para o modelo da dupla-hélice de Watson e Crick (1953).', en: 'Photo 51, taken by Rosalind Franklin and Raymond Gosling in 1952, was key to Watson and Crick’s double-helix model (1953).' },
  },
  {
    id: 'nucleosome', region: 'genome', pos: [-34, 4, -10], size: 4, solid: 2.5,
    short: { pt: 'Nucleossomo', en: 'Nucleosome' },
    title: { pt: 'Nucleossomos', en: 'Nucleosomes' },
    body: { pt: 'Cerca de 147 pb de DNA dão quase duas voltas em torno de um octâmero de histonas (2× H2A, H2B, H3 e H4): “contas num colar”, a primeira camada de compactação.', en: 'About 147 bp of DNA wrap almost twice around a histone octamer (2× H2A, H2B, H3 and H4): “beads on a string”, the first layer of packing.' },
    fact: { pt: 'Nucleossomos atrapalham a Cas9: sítios em cromatina fechada costumam ser editados com menos eficiência.', en: 'Nucleosomes get in Cas9’s way: sites in closed chromatin are usually edited less efficiently.' },
  },
  {
    id: 'methyl', region: 'genome', pos: [-28, -11, 6], size: 2.5, solid: 1.5,
    short: { pt: 'Epigenética', en: 'Epigenetics' },
    title: { pt: 'Metilação do DNA', en: 'DNA methylation' },
    body: { pt: 'Grupos metil (esferas brilhantes) em citosinas de dinucleotídeos CpG, sobretudo em promotores, tendem a silenciar genes — sem mudar a sequência. A acetilação de histonas faz o contrário: abre a cromatina.', en: 'Methyl groups (glowing spheres) on cytosines in CpG dinucleotides, especially in promoters, tend to silence genes — without changing the sequence. Histone acetylation does the opposite: it opens chromatin.' },
    fact: { pt: 'Fundindo uma Cas9 “morta” (dCas9) a ativadores, repressores ou enzimas epigenéticas, dá para ligar ou desligar genes sem cortar o DNA (CRISPRa/CRISPRi).', en: 'Fusing a “dead” Cas9 (dCas9) to activators, repressors or epigenetic enzymes switches genes on or off without cutting DNA (CRISPRa/CRISPRi).' },
  },
  {
    id: 'chromosome', region: 'genome', pos: CHROMOSOME, size: 6, solid: 2.5,
    short: { pt: 'Cromossomo', en: 'Chromosome' },
    title: { pt: 'Cromossomo metafásico', en: 'Metaphase chromosome' },
    body: { pt: 'Na divisão celular, cada cromossomo se condensa em duas cromátides-irmãs unidas pelo centrômero. Células humanas têm 46 cromossomos (23 pares).', en: 'During cell division, each chromosome condenses into two sister chromatids joined at the centromere. Human cells have 46 chromosomes (23 pairs).' },
    fact: { pt: 'As bandas claras e escuras, reveladas por coloração (como a de Giemsa), identificam cada cromossomo no cariótipo.', en: 'Light and dark bands revealed by staining (such as Giemsa) identify each chromosome in a karyotype.' },
  },
  {
    // na ponta de um braço do cromossomo (ver Chromosome em Exhibits.tsx)
    id: 'telomere', region: 'genome', pos: [CHROMOSOME[0] + 1.5, CHROMOSOME[1] + 5.7, CHROMOSOME[2]], size: 1.5,
    short: { pt: 'Telômero', en: 'Telomere' },
    title: { pt: 'Telômeros', en: 'Telomeres' },
    body: { pt: 'As pontas dos cromossomos são milhares de repetições TTAGGG. A cada divisão elas encurtam um pouco — um relógio celular.', en: 'Chromosome ends are thousands of TTAGGG repeats. They shorten a little with every division — a cellular clock.' },
    fact: { pt: 'A telomerase, com seu próprio molde de RNA, repõe os telômeros; está ativa em células-tronco e na maioria dos cânceres. Nobel de 2009 (Blackburn, Greider e Szostak).', en: 'Telomerase, with its own RNA template, rebuilds telomeres; it is active in stem cells and in most cancers. 2009 Nobel Prize (Blackburn, Greider and Szostak).' },
  },
  {
    id: 'genome', region: 'genome', pos: [-46, 14, -28], size: 6, solid: 4,
    short: { pt: 'Genoma humano', en: 'Human genome' },
    title: { pt: 'Genoma humano', en: 'Human genome' },
    body: { pt: 'Cerca de 3,1 bilhões de pares de bases por conjunto haploide e ~20 mil genes codificantes de proteína — que ocupam só ~1–2% da sequência.', en: 'About 3.1 billion base pairs per haploid set and ~20,000 protein-coding genes — which make up only ~1–2% of the sequence.' },
    fact: { pt: 'Esticado, o DNA de uma célula humana mede cerca de 2 metros. A primeira sequência humana completa, de ponta a ponta (T2T), só saiu em 2022.', en: 'Stretched out, the DNA in one human cell is about 2 metres long. The first truly complete, end-to-end (T2T) human sequence only came out in 2022.' },
  },
  {
    id: 'replication', region: 'genome', pos: [16, 13, 13], size: 4, solid: 1.5,
    short: { pt: 'Replicação', en: 'Replication' },
    title: { pt: 'Forquilha de replicação', en: 'Replication fork' },
    body: { pt: 'A helicase (anel) abre a dupla-fita. A DNA polimerase só sintetiza de 5′ para 3′, então uma fita sai contínua e a outra em fragmentos de Okazaki (em amarelo).', en: 'Helicase (the ring) unzips the duplex. DNA polymerase only builds 5′ to 3′, so one strand is made continuously and the other in Okazaki fragments (yellow).' },
    fact: { pt: 'Com revisão e reparo de mismatches, a cópia erra cerca de 1 base a cada 10⁹–10¹⁰. A replicação é semiconservativa (Meselson e Stahl, 1958).', en: 'With proofreading and mismatch repair, copying errs about once every 10⁹–10¹⁰ bases. Replication is semi-conservative (Meselson and Stahl, 1958).' },
  },

  // ---------- Expressão gênica ----------
  {
    id: 'transcription', region: 'expression', pos: [34, -6, -8], size: 4, solid: 2,
    short: { pt: 'Transcrição', en: 'Transcription' },
    title: { pt: 'Transcrição', en: 'Transcription' },
    body: { pt: 'A RNA polimerase II abre um trecho do DNA e copia a fita-molde em pré-mRNA (laranja), de 5′ para 3′. É o primeiro passo do dogma central: DNA → RNA → proteína.', en: 'RNA polymerase II opens a stretch of DNA and copies the template strand into pre-mRNA (orange), 5′ to 3′. It is the first step of the central dogma: DNA → RNA → protein.' },
    fact: { pt: 'Promotores e fatores de transcrição decidem quando e quanto cada gene é lido — é assim que um neurônio e uma célula da pele, com o mesmo genoma, ficam tão diferentes.', en: 'Promoters and transcription factors decide when and how much each gene is read — which is how a neuron and a skin cell, with the same genome, end up so different.' },
  },
  {
    id: 'splicing', region: 'expression', pos: [45, 4, -22], size: 4, solid: 1.5,
    short: { pt: 'Splicing', en: 'Splicing' },
    title: { pt: 'Splicing', en: 'Splicing' },
    body: { pt: 'O spliceossomo remove os íntrons — que saem em forma de laço, o “lariat” — e une os éxons. Íntrons quase sempre começam por GU e terminam em AG.', en: 'The spliceosome removes introns — which leave as a loop, the “lariat” — and joins the exons. Introns almost always start with GU and end with AG.' },
    fact: { pt: 'Com splicing alternativo, ~20 mil genes geram muito mais proteínas diferentes. Muitas doenças vêm de mutações em sítios de splicing.', en: 'Through alternative splicing, ~20,000 genes yield many more distinct proteins. Many diseases come from mutations at splice sites.' },
  },
  {
    id: 'pore', region: 'expression', pos: [60, 2, -4], size: 6,
    short: { pt: 'Poro nuclear', en: 'Nuclear pore' },
    title: { pt: 'Envelope e poro nuclear', en: 'Nuclear envelope & pore' },
    body: { pt: 'Complexos enormes, com simetria de 8, controlam o tráfego entre núcleo e citoplasma: o mRNA sai; proteínas como a Cas9 entram.', en: 'Huge complexes with eight-fold symmetry control traffic between nucleus and cytoplasm: mRNA leaves; proteins such as Cas9 come in.' },
    fact: { pt: 'Por isso a Cas9 usada em células humanas leva sinais de localização nuclear (NLS) fundidos — sem eles, ela mal chega ao DNA.', en: 'That is why Cas9 used in human cells carries fused nuclear localisation signals (NLS) — without them it barely reaches the DNA.' },
  },
  {
    id: 'ribosome', region: 'expression', pos: [82, 8, -2], size: 3.5, solid: 2.5,
    short: { pt: 'Ribossomo', en: 'Ribosome' },
    title: { pt: 'Ribossomo (citoplasma)', en: 'Ribosome (cytoplasm)' },
    body: { pt: 'Já fora do núcleo, o ribossomo lê o mRNA de 3 em 3 bases (códons) e encadeia os aminoácidos trazidos pelos tRNAs na proteína.', en: 'Outside the nucleus, the ribosome reads the mRNA three bases at a time (codons) and chains the amino acids brought by tRNAs into a protein.' },
    fact: { pt: 'Quem forma a ligação peptídica é o RNA ribossomal, não uma proteína: o ribossomo é uma ribozima.', en: 'The peptide bond is made by ribosomal RNA, not by a protein: the ribosome is a ribozyme.' },
  },
  {
    id: 'codons', region: 'expression', pos: [83, -9, 16], size: 5,
    short: { pt: 'Código genético', en: 'Genetic code' },
    title: { pt: 'Código genético', en: 'Genetic code' },
    body: { pt: 'Leia de dentro para fora: 1ª, 2ª e 3ª base. São 64 códons para 20 aminoácidos; AUG (branco) inicia, UAA, UAG e UGA (vermelho) param. Vários códons dão o mesmo aminoácido.', en: 'Read from the centre out: 1st, 2nd and 3rd base. 64 codons for 20 amino acids; AUG (white) starts, UAA, UAG and UGA (red) stop. Several codons give the same amino acid.' },
    fact: { pt: 'Por isso nem toda substituição muda a proteína — e um indel que não é múltiplo de 3 embaralha tudo depois dele (frameshift), como no NHEJ do playground.', en: 'That is why not every substitution changes the protein — and an indel that is not a multiple of 3 scrambles everything after it (frameshift), as in the playground’s NHEJ.' },
  },

  // ---------- Origem do CRISPR ----------
  {
    id: 'bacterium', region: 'origin', pos: [-20, 22, 24], size: 5, solid: 3,
    short: { pt: 'Arranjo CRISPR', en: 'CRISPR array' },
    title: { pt: 'CRISPR: o sistema imune das bactérias', en: 'CRISPR: the bacterial immune system' },
    body: { pt: 'Dentro da bactéria, trechos de DNA de vírus (espaçadores coloridos) ficam guardados entre repetições (brancas) — um álbum de “procurados” que guia a Cas9.', en: 'Inside the bacterium, snippets of viral DNA (coloured spacers) are stored between repeats (white) — a “most wanted” album that guides Cas9.' },
    fact: { pt: 'Francisco Mojica estudou essas repetições desde 1993 e propôs a função imune em 2005; em 2007, experimentos com bactérias do iogurte confirmaram.', en: 'Francisco Mojica studied these repeats from 1993 and proposed their immune role in 2005; in 2007, experiments with yogurt bacteria confirmed it.' },
  },
  {
    id: 'phage', region: 'origin', pos: [-9, 27, 31], size: 3,
    short: { pt: 'Bacteriófago', en: 'Bacteriophage' },
    title: { pt: 'Bacteriófagos', en: 'Bacteriophages' },
    body: { pt: 'Vírus que infectam bactérias injetando o próprio DNA pela cauda. São as entidades biológicas mais numerosas da Terra (~10³¹).', en: 'Viruses that infect bacteria by injecting their DNA through the tail. They are the most abundant biological entities on Earth (~10³¹).' },
    fact: { pt: 'A Cas9 evoluiu para cortar o DNA desses invasores; o PAM existe para a bactéria não cortar o próprio arranjo CRISPR.', en: 'Cas9 evolved to cut these invaders’ DNA; the PAM exists so the bacterium does not cut its own CRISPR array.' },
  },
  {
    id: 'casfamily', region: 'origin', pos: [10, -15, 24], size: 4,
    short: { pt: 'Família CRISPR', en: 'CRISPR family' },
    title: { pt: 'Além da Cas9', en: 'Beyond Cas9' },
    body: { pt: 'Cas12a: PAM rico em T e corte escalonado. Cas13: corta RNA, não DNA. Prime editing: Cas9 nickase + transcriptase reversa escrevem a edição a partir de um pegRNA, sem quebra de fita dupla.', en: 'Cas12a: T-rich PAM and staggered cut. Cas13: cuts RNA, not DNA. Prime editing: a Cas9 nickase + reverse transcriptase write the edit from a pegRNA, with no double-strand break.' },
    fact: { pt: 'Emmanuelle Charpentier e Jennifer Doudna receberam o Nobel de Química de 2020 pelo desenvolvimento da edição genômica com CRISPR-Cas9.', en: 'Emmanuelle Charpentier and Jennifer Doudna won the 2020 Nobel Prize in Chemistry for developing CRISPR-Cas9 genome editing.' },
  },

  // ---------- Clínica e variação ----------
  {
    id: 'sickle', region: 'clinic', pos: [-52, -10, 18], size: 5,
    short: { pt: 'Anemia falciforme', en: 'Sickle cell' },
    title: { pt: 'Anemia falciforme', en: 'Sickle cell disease' },
    body: { pt: 'Uma única troca no gene HBB (GAG→GTG: Glu→Val no códon 6) faz a hemoglobina polimerizar e deforma as hemácias em foice, que entopem vasos.', en: 'A single change in the HBB gene (GAG→GTG: Glu→Val at codon 6) makes haemoglobin polymerise and bends red cells into sickles that block vessels.' },
    fact: { pt: 'O Casgevy (aprovado em 2023), primeira terapia com CRISPR, não corrige o HBB: desativa o enhancer de BCL11A e religa a hemoglobina fetal.', en: 'Casgevy (approved in 2023), the first CRISPR therapy, does not fix HBB: it disables the BCL11A enhancer and switches fetal haemoglobin back on.' },
  },
  {
    id: 'snp', region: 'clinic', pos: [-40, -20, -8], size: 3, solid: 2,
    short: { pt: 'Variação (SNP)', en: 'Variation (SNP)' },
    title: { pt: 'Variação humana: SNPs', en: 'Human variation: SNPs' },
    body: { pt: 'Duas pessoas quaisquer diferem em cerca de 1 base a cada 1.000 — milhões de variantes de um único nucleotídeo (SNPs), como a destacada entre as duas hélices.', en: 'Any two people differ at roughly 1 base in 1,000 — millions of single-nucleotide variants (SNPs), like the one highlighted between the two helices.' },
    fact: { pt: 'A maioria dos SNPs é neutra; alguns mudam o risco de doenças ou a resposta a remédios (farmacogenética). Editores de bases foram feitos para corrigir exatamente esse tipo de troca.', en: 'Most SNPs are neutral; some change disease risk or drug response (pharmacogenetics). Base editors were built to fix exactly this kind of change.' },
  },
]

export const EXHIBIT = Object.fromEntries(EXHIBITS.map((e) => [e.id, e])) as Record<string, Exhibit>
