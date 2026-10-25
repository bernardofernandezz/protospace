// Glossário: definições curtas em linguagem comum, para quem nunca ouviu falar de CRISPR.
// No texto das seções, marque um termo com [[chave|texto exibido]] e o <Rich> transforma
// em botão que abre a explicação (ver src/components/Term.tsx).
import type { L } from '../i18n'

export interface GlossaryEntry {
  /** Nome por extenso, quando a sigla não diz nada sozinha. */
  full?: L
  what: L
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  dna: {
    what: {
      pt: 'A molécula que guarda as instruções de um ser vivo, escrita com quatro letras químicas: A, T, C e G. São duas fitas enroladas uma na outra, e cada letra de uma fita tem um par fixo na outra.',
      en: 'The molecule that stores a living thing’s instructions, written with four chemical letters: A, T, C and G. Two strands coil around each other, and every letter on one strand has a fixed partner on the other.',
    },
  },
  rna: {
    what: {
      pt: 'Parente do DNA, feito de uma fita só. A célula o usa como cópia de trabalho: para levar recados, montar proteínas e, no caso do CRISPR, servir de endereço.',
      en: 'A relative of DNA, made of a single strand. The cell uses it as a working copy: to carry messages, build proteins and, in CRISPR, to act as an address.',
    },
  },
  gene: {
    what: {
      pt: 'Um trecho do DNA com a receita de uma proteína (ou de um RNA com função própria). Uma pessoa tem cerca de 20 mil genes que codificam proteínas.',
      en: 'A stretch of DNA holding the recipe for a protein (or for an RNA with a job of its own). A person has around 20,000 protein-coding genes.',
    },
  },
  genoma: {
    what: {
      pt: 'O conjunto completo do DNA de um organismo. O humano tem cerca de 3,1 bilhões de pares de letras — e os genes ocupam só uma pequena parte disso.',
      en: 'The complete set of an organism’s DNA. The human genome has about 3.1 billion letter pairs — and genes take up only a small part of it.',
    },
  },
  proteina: {
    what: {
      pt: 'A peça que faz o trabalho na célula: digere, transporta, sustenta, corta. É montada seguindo a receita de um gene. A Cas9 é uma proteína.',
      en: 'The part that does the work in a cell: digesting, transporting, supporting, cutting. It is built by following a gene’s recipe. Cas9 is a protein.',
    },
  },
  crispr: {
    full: { pt: 'Clustered Regularly Interspaced Short Palindromic Repeats', en: 'Clustered Regularly Interspaced Short Palindromic Repeats' },
    what: {
      pt: 'Na bactéria, a região do DNA onde ela arquiva pedaços dos vírus que já a atacaram. No uso corrente, virou o nome da técnica de edição que nasceu desse sistema.',
      en: 'In bacteria, the region of DNA where they file pieces of the viruses that have attacked them. In everyday use, it became the name of the editing technique born from that system.',
    },
  },
  cas9: {
    what: {
      pt: 'A proteína que corta o DNA. Sozinha ela não sabe onde cortar: quem dá o endereço é o RNA guia. A mais usada vem da bactéria Streptococcus pyogenes (por isso SpCas9).',
      en: 'The protein that cuts DNA. On its own it does not know where to cut: the guide RNA supplies the address. The most used one comes from the bacterium Streptococcus pyogenes (hence SpCas9).',
    },
  },
  sgrna: {
    full: { pt: 'single guide RNA — RNA guia único', en: 'single guide RNA' },
    what: {
      pt: 'O RNA que diz à Cas9 onde cortar. As 20 primeiras letras são escolhidas por quem faz o experimento; o resto só serve para encaixar na proteína.',
      en: 'The RNA that tells Cas9 where to cut. Its first 20 letters are chosen by the experimenter; the rest just docks into the protein.',
    },
  },
  pam: {
    full: { pt: 'Protospacer Adjacent Motif — motivo adjacente ao protoespaçador', en: 'Protospacer Adjacent Motif' },
    what: {
      pt: 'Uma marca curta de letras que precisa estar logo ao lado do alvo. A Cas9 confere essa marca antes de testar o guia: sem ela, não há corte. Para a SpCas9 a marca é NGG — duas letras G depois de qualquer letra.',
      en: 'A short mark of letters that must sit right next to the target. Cas9 checks it before testing the guide: without it, no cut. For SpCas9 the mark is NGG — two Gs after any letter.',
    },
  },
  protoespacador: {
    what: {
      pt: 'As 20 letras do DNA que o guia reconhece — o alvo propriamente dito. Fica sempre imediatamente antes do PAM.',
      en: 'The 20 letters of DNA the guide recognises — the target itself. It always sits immediately before the PAM.',
    },
  },
  seed: {
    what: {
      pt: 'As 8 a 12 letras do alvo mais próximas do PAM, onde a conferência do guia começa. Erros aí atrapalham muito mais do que erros na ponta oposta.',
      en: 'The 8 to 12 letters of the target closest to the PAM, where checking of the guide begins. Errors there matter far more than errors at the opposite end.',
    },
  },
  rloop: {
    what: {
      pt: 'A bolha que se forma quando o guia combina com o alvo: as duas fitas do DNA se separam e o RNA ocupa o lugar de uma delas. É o sinal verde para o corte.',
      en: 'The bubble that forms when the guide matches the target: the two DNA strands separate and the RNA takes the place of one of them. It is the green light for cutting.',
    },
  },
  dsb: {
    full: { pt: 'double-strand break — quebra de fita dupla', en: 'double-strand break' },
    what: {
      pt: 'O DNA partido nas duas fitas, ou seja, em dois pedaços. É o estrago que a Cas9 faz — e que obriga a célula a entrar em ação para consertar.',
      en: 'DNA broken on both strands, that is, in two pieces. It is the damage Cas9 does — and what forces the cell to step in and repair it.',
    },
  },
  nhej: {
    full: { pt: 'non-homologous end joining — junção de extremidades não homólogas', en: 'non-homologous end joining' },
    what: {
      pt: 'O conserto rápido: a célula cola as pontas partidas sem consultar molde. Funciona quase sempre, mas costuma perder ou ganhar algumas letras no caminho.',
      en: 'The quick fix: the cell glues the broken ends back without consulting a template. It almost always works, but usually loses or gains a few letters along the way.',
    },
  },
  hdr: {
    full: { pt: 'homology-directed repair — reparo dirigido por homologia', en: 'homology-directed repair' },
    what: {
      pt: 'O conserto fiel: a célula copia um molde com a sequência certa. É assim que se corrige uma mutação, mas acontece bem menos vezes e só quando a célula está se dividindo.',
      en: 'The faithful fix: the cell copies a template carrying the right sequence. That is how a mutation gets corrected, but it happens far less often and only in dividing cells.',
    },
  },
  indel: {
    what: {
      pt: 'Letras a mais ou a menos deixadas pelo conserto apressado. O nome junta inserção e deleção.',
      en: 'Letters gained or lost by a hasty repair. The name merges insertion and deletion.',
    },
  },
  frameshift: {
    what: {
      pt: 'A célula lê o gene de três em três letras. Tirar ou pôr um número de letras que não seja múltiplo de três desloca essa leitura, e tudo dali em diante sai embaralhado.',
      en: 'The cell reads a gene three letters at a time. Removing or adding a number of letters that is not a multiple of three shifts that reading, and everything after it comes out scrambled.',
    },
  },
  knockout: {
    what: {
      pt: 'Desligar um gene de propósito, para descobrir para que ele servia. É o uso mais comum do CRISPR em pesquisa.',
      en: 'Switching a gene off on purpose, to find out what it was doing. It is the most common use of CRISPR in research.',
    },
  },
  offtarget: {
    what: {
      pt: 'Um corte no lugar errado: um trecho parecido com o alvo, em outro ponto do genoma, que o guia reconheceu por engano. É o principal risco técnico da edição.',
      en: 'A cut in the wrong place: a stretch resembling the target elsewhere in the genome that the guide recognised by mistake. It is the main technical risk of editing.',
    },
  },
  mismatch: {
    what: {
      pt: 'Uma letra do guia que não combina com a letra correspondente do DNA. Quanto mais mismatches, menor a chance de a Cas9 cortar ali.',
      en: 'A letter of the guide that does not match the corresponding letter of the DNA. The more mismatches, the lower the chance Cas9 cuts there.',
    },
  },
  rnp: {
    full: { pt: 'ribonucleoproteína', en: 'ribonucleoprotein' },
    what: {
      pt: 'Entregar a proteína e o RNA guia já montados, prontos para agir. Como não entra DNA estranho e a dupla se degrada em horas, há menos tempo para cortes fora do alvo.',
      en: 'Delivering the protein and guide RNA pre-assembled, ready to act. Since no foreign DNA goes in and the pair degrades within hours, there is less time for off-target cuts.',
    },
  },
  plasmideo: {
    what: {
      pt: 'Um anel de DNA que se coloca dentro da célula para que ela mesma produza o que está escrito nele — aqui, a Cas9 e o guia.',
      en: 'A ring of DNA put inside the cell so that the cell itself makes whatever is written on it — here, Cas9 and the guide.',
    },
  },
  vetorviral: {
    what: {
      pt: 'Um vírus esvaziado do que o tornava perigoso, usado como entregador: ele continua sabendo entrar na célula, mas carrega a carga escolhida pelo laboratório.',
      en: 'A virus emptied of what made it dangerous, used as a delivery van: it still knows how to get into a cell, but carries the cargo the lab chose.',
    },
  },
  somatica: {
    what: {
      pt: 'Edição feita nas células do corpo de alguém já nascido — sangue, fígado, olho. O efeito termina naquela pessoa e não passa aos filhos.',
      en: 'Editing done in the body cells of someone already born — blood, liver, eye. The effect ends with that person and is not passed to their children.',
    },
  },
  germinativa: {
    what: {
      pt: 'Edição feita em embriões, óvulos ou espermatozoides. A mudança entra em todas as células da futura pessoa e é transmitida aos descendentes. Hoje não é aceita na clínica, e no Brasil é proibida por lei.',
      en: 'Editing done in embryos, eggs or sperm. The change enters every cell of the future person and is passed to their descendants. It is not accepted in the clinic today, and in Brazil it is prohibited by law.',
    },
  },
  exvivo: {
    what: {
      pt: 'Tirar as células do paciente, editá-las no laboratório e devolvê-las. Dá mais controle: dá para conferir o resultado antes de devolver.',
      en: 'Taking the patient’s cells out, editing them in the lab and putting them back. It gives more control: the result can be checked before the cells go back.',
    },
  },
  invivo: {
    what: {
      pt: 'Editar as células dentro do corpo, com a ferramenta aplicada no paciente. Evita a retirada das células, mas é mais difícil acertar só o tecido pretendido.',
      en: 'Editing cells inside the body, with the tool given to the patient. It avoids removing cells, but it is harder to reach only the intended tissue.',
    },
  },
  pb: {
    full: { pt: 'par de bases', en: 'base pair' },
    what: {
      pt: 'Duas letras que se encaixam, uma em cada fita do DNA (A com T, C com G). É a unidade usada para medir distâncias ao longo da molécula.',
      en: 'Two letters that fit together, one on each DNA strand (A with T, C with G). It is the unit used to measure distances along the molecule.',
    },
  },
  alelo: {
    what: {
      pt: 'Cada uma das duas cópias de um gene: uma veio da mãe, a outra do pai. Basta uma cópia diferente para mudar o resultado, conforme a doença.',
      en: 'Each of the two copies of a gene: one came from the mother, the other from the father. A single different copy can change the outcome, depending on the disease.',
    },
  },
  pegrna: {
    full: { pt: 'RNA guia de prime editing', en: 'prime editing guide RNA' },
    what: {
      pt: 'Um RNA guia com uma cauda extra: a cauda traz, escrita, a correção que a enzima vai copiar para o DNA.',
      en: 'A guide RNA with an extra tail: the tail carries, written out, the fix the enzyme will copy into the DNA.',
    },
  },
  locus: {
    what: {
      pt: 'O endereço de um trecho no genoma: a posição onde um gene ou uma sequência fica.',
      en: 'The address of a stretch of the genome: the position where a gene or sequence sits.',
    },
  },
  exon: {
    what: {
      pt: 'Os pedaços de um gene que sobram depois da edição interna feita pela própria célula e que acabam virando proteína. Cortar neles é o caminho mais direto para desligar o gene.',
      en: 'The pieces of a gene left after the cell’s own internal editing, which end up becoming protein. Cutting in them is the most direct way to switch a gene off.',
    },
  },
  nickase: {
    what: {
      pt: 'Uma Cas9 com uma das duas tesouras desativada: corta só uma fita. Esse corte simples quase sempre é remendado sem erro, o que a torna base para ferramentas mais finas.',
      en: 'A Cas9 with one of its two scissors disabled: it cuts a single strand. That single cut is almost always patched without error, which makes it the base for finer tools.',
    },
  },
  dcas9: {
    full: { pt: 'dead Cas9 — Cas9 “morta”', en: 'dead Cas9' },
    what: {
      pt: 'Uma Cas9 com as duas tesouras desativadas. Não corta nada, mas continua sabendo achar o endereço — então serve de carona para outras enzimas.',
      en: 'A Cas9 with both scissors disabled. It cuts nothing, but still knows how to find the address — so it serves as a ride for other enzymes.',
    },
  },
  sequenciamento: {
    what: {
      pt: 'Ler, letra por letra, um trecho de DNA. É o único jeito de saber com certeza o que a edição fez de fato.',
      en: 'Reading a stretch of DNA letter by letter. It is the only way to know for sure what the edit actually did.',
    },
  },
  mosaicismo: {
    what: {
      pt: 'Quando nem todas as células do mesmo indivíduo ficam iguais, porque a edição só pegou depois das primeiras divisões. Num embrião, o resultado é uma pessoa feita de partes editadas e não editadas.',
      en: 'When not every cell of the same individual ends up alike, because the edit only took hold after the first divisions. In an embryo, the result is a person made of edited and unedited parts.',
    },
  },
}

/** Marcador no texto: [[chave]] ou [[chave|texto exibido]]. */
export const TERM_RE = /\[\[([a-z0-9]+)(?:\|([^\]]+))?\]\]/g

/** Remove os marcadores — para title, aria-label e qualquer lugar que só aceite texto. */
export const plain = (s: string) => s.replace(TERM_RE, (_, k, label) => label ?? k)
