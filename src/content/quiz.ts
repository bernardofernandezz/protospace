// Conteúdo do quiz (PT/EN). `correct` é o índice (base 0) da alternativa correta em `options`.
import type { L } from '../i18n'

export interface Question {
  id: string
  question: string
  options: string[]
  correct: number
  /** Explicação mostrada após a resposta. */
  feedback: string
}

interface QuizContent {
  eyebrow: string
  title: [string, string, string]
  lead: string
  questions: Question[]
}

export const QUIZ: L<QuizContent> = {
  pt: {
    eyebrow: 'Quiz rápido',
    title: ['Teste o que ', 'ficou', ' — onze perguntas.'],
    lead: 'Cada resposta vem com uma explicação curta. Funciona bem como fechamento da apresentação ou como revisão antes da prova.',
    questions: [
      {
        id: 'q1',
        question: 'Qual é o papel do PAM?',
        options: [
          'Ele é a sequência que o guia reconhece por complementaridade',
          'É a marca vizinha ao alvo que a Cas9 precisa reconhecer antes de testar o guia',
          'É o sítio onde o molde do HDR se liga',
          'É a parte do sgRNA que encaixa na proteína',
        ],
        correct: 1,
        feedback: 'Sem o PAM (NGG para a SpCas9), a proteína nem testa o pareamento do guia. Na bactéria, é isso que evita cortar o próprio arquivo CRISPR.',
      },
      {
        id: 'q2',
        question: 'Onde a SpCas9 corta o DNA?',
        options: ['Dentro do PAM', 'Na ponta 5′ do protoespaçador', 'Cerca de 3 pb a montante do PAM, nas duas fitas', 'Em qualquer ponto ao longo do R-loop'],
        correct: 2,
        feedback: 'HNH corta a fita-alvo e RuvC a não-alvo, ~3 pb antes do PAM, gerando extremidades predominantemente cegas.',
      },
      {
        id: 'q3',
        question: 'Por que mismatches na região seed pesam mais?',
        options: [
          'Porque o pareamento começa junto ao PAM; um erro ali impede a formação do R-loop',
          'Porque a região seed é onde fica o corte',
          'Porque a seed é a parte do RNA que encaixa na Cas9',
          'Não pesam: todos os mismatches valem o mesmo',
        ],
        correct: 0,
        feedback: 'A abertura da dupla-fita avança a partir do PAM. Um erro nas primeiras bases testadas desestabiliza o R-loop e a enzima desiste.',
      },
      {
        id: 'q4',
        question: 'Para desligar (knockout) um gene, qual via de reparo é normalmente explorada?',
        options: ['HDR com molde doador', 'Reparo por excisão de bases', 'Nenhuma: a Cas9 remove o gene sozinha', 'NHEJ, que costuma deixar pequenos indels'],
        correct: 3,
        feedback: 'Indels de tamanho não múltiplo de 3 deslocam a fase de leitura (frameshift) e costumam inativar a proteína.',
      },
      {
        id: 'q5',
        question: 'O que um editor de bases (CBE) faz?',
        options: [
          'Corta as duas fitas e insere uma base nova',
          'Converte C em T (via U) numa janela do alvo, sem quebra de fita dupla',
          'Substitui qualquer base por qualquer outra',
          'Silencia o gene sem alterar a sequência',
        ],
        correct: 1,
        feedback:
          'Uma Cas9 nickase fundida a uma desaminase converte C→U, que a célula lê como T. Para trocas além de C→T e A→G (o ABE faz A→G), entre as 12 possíveis, usa-se o prime editing.',
      },
      {
        id: 'q6',
        question: 'Como o Casgevy trata a anemia falciforme?',
        options: [
          'Edita células-tronco do sangue para religar a hemoglobina fetal',
          'Corrige a mutação no gene da β-globina de cada célula do corpo',
          'Introduz um gene de hemoglobina de outra espécie',
          'Edita embriões antes da implantação',
        ],
        correct: 0,
        feedback: 'É uma terapia ex vivo: células do próprio paciente são editadas para reativar a hemoglobina fetal, que compensa a hemoglobina defeituosa.',
      },
      {
        id: 'q7',
        question: 'Qual é a melhor forma de verificar se houve cortes fora do alvo?',
        options: [
          'Confiar no escore da ferramenta de design',
          'Fazer um western blot da proteína-alvo',
          'Observar se as células sobreviveram',
          'Sequenciar os sítios preditos e, se o risco importa, usar métodos empíricos (ex.: GUIDE-seq)',
        ],
        correct: 3,
        feedback: 'Predição ajuda a escolher onde olhar, mas a confirmação vem do sequenciamento — incluindo a busca por grandes deleções.',
      },
      {
        id: 'q8',
        question: 'A fibrose cística mais comum (F508del) perde três letras do gene. Qual ferramenta pode devolvê-las?',
        options: [
          'Um editor de bases (CBE ou ABE)',
          'Prime editing ou HDR com molde',
          'Uma Cas9 nickase sozinha',
          'Qualquer uma: todas escrevem sequência nova',
        ],
        correct: 1,
        feedback:
          'Editores de base só trocam uma letra por outra — não inserem nem removem nada. Para devolver as três letras é preciso um molde (HDR) ou a transcriptase reversa do prime editing.',
      },
      {
        id: 'q9',
        question: 'Você achou o alvo perfeito, mas não há PAM ao lado dele. O que fazer?',
        options: [
          'Usar o guia assim mesmo: o PAM é opcional',
          'Trocar de enzima, já que cada uma exige um PAM diferente (a Cas12a usa TTTV)',
          'Alongar o guia para 25 nt',
          'Aumentar a dose da enzima',
        ],
        correct: 1,
        feedback:
          'O PAM limita onde se pode cortar, e é por isso que existe um catálogo de nucleases: mudando a enzima, muda o PAM exigido e abrem-se alvos antes inacessíveis.',
      },
      {
        id: 'q10',
        question: 'No Casgevy, o indel "bagunçado" do NHEJ é um problema?',
        options: [
          'Sim: ele impede a correção da mutação',
          'Não: o objetivo ali é justamente destruir um trecho regulador',
          'Sim: por isso se usa HDR nessa terapia',
          'Tanto faz: o NHEJ não atua em células-tronco',
        ],
        correct: 1,
        feedback:
          'Como o alvo é um motivo que liga o BCL11A, qualquer indel que o torne ilegível resolve. Corrigir letra por letra seria mais difícil e desnecessário.',
      },
      {
        id: 'q11',
        question: 'No Brasil, a edição genética de embriões humanos é…',
        options: [
          'Permitida para fins terapêuticos',
          'Permitida com autorização da CTNBio',
          'Proibida pela Lei de Biossegurança (11.105/2005)',
          'Não regulamentada',
        ],
        correct: 2,
        feedback: 'A lei proíbe engenharia genética em célula germinal, zigoto e embrião humanos e tipifica a prática como crime.',
      },
    ],
  },
  en: {
    eyebrow: 'Quick quiz',
    title: ['Test what ', 'stuck', ' — eleven questions.'],
    lead: 'Each answer comes with a short explanation. Works well as a closer for the talk or as a review before an exam.',
    questions: [
      {
        id: 'q1',
        question: 'What does the PAM do?',
        options: [
          'It is the sequence the guide recognises by complementarity',
          'It is the mark next to the target that Cas9 must recognise before testing the guide',
          'It is where the HDR template binds',
          'It is the part of the sgRNA that docks into the protein',
        ],
        correct: 1,
        feedback:
          'Without the PAM (NGG for SpCas9), the protein does not even test the guide. In bacteria, that is what prevents cutting their own CRISPR archive.',
      },
      {
        id: 'q2',
        question: 'Where does SpCas9 cut DNA?',
        options: ['Inside the PAM', 'At the 5′ end of the protospacer', 'About 3 bp upstream of the PAM, on both strands', 'Anywhere along the R-loop'],
        correct: 2,
        feedback: 'HNH cuts the target strand and RuvC the non-target strand, ~3 bp before the PAM, leaving mostly blunt ends.',
      },
      {
        id: 'q3',
        question: 'Why do mismatches in the seed region weigh more?',
        options: [
          'Because pairing starts next to the PAM; an error there stops the R-loop from forming',
          'Because the cut is in the seed region',
          'Because the seed is the part of the RNA that docks into Cas9',
          'They don’t: all mismatches count the same',
        ],
        correct: 0,
        feedback: 'Unwinding proceeds from the PAM. An error in the first bases tested destabilises the R-loop and the enzyme gives up.',
      },
      {
        id: 'q4',
        question: 'To knock a gene out, which repair pathway is usually exploited?',
        options: ['HDR with a donor template', 'Base excision repair', 'None: Cas9 removes the gene by itself', 'NHEJ, which often leaves small indels'],
        correct: 3,
        feedback: 'Indels whose length is not a multiple of 3 shift the reading frame (frameshift) and usually inactivate the protein.',
      },
      {
        id: 'q5',
        question: 'What does a cytosine base editor (CBE) do?',
        options: [
          'Cuts both strands and inserts a new base',
          'Converts C to T (via U) within a window of the target, without a double-strand break',
          'Swaps any base for any other',
          'Silences the gene without changing its sequence',
        ],
        correct: 1,
        feedback:
          'A Cas9 nickase fused to a deaminase converts C→U, which the cell reads as T. For swaps beyond C→T and A→G (ABEs handle A→G) among the 12 possible, prime editing is used.',
      },
      {
        id: 'q6',
        question: 'How does Casgevy treat sickle cell disease?',
        options: [
          'It edits blood stem cells to switch fetal haemoglobin back on',
          'It corrects the β-globin mutation in every cell of the body',
          'It introduces a haemoglobin gene from another species',
          'It edits embryos before implantation',
        ],
        correct: 0,
        feedback: 'It is an ex vivo therapy: the patient’s own cells are edited to reactivate fetal haemoglobin, which compensates for the faulty haemoglobin.',
      },
      {
        id: 'q7',
        question: 'What is the best way to check for off-target cuts?',
        options: [
          'Trust the design tool’s score',
          'Run a western blot of the target protein',
          'See whether the cells survived',
          'Sequence predicted sites and, when risk matters, use empirical methods (e.g. GUIDE-seq)',
        ],
        correct: 3,
        feedback: 'Prediction helps decide where to look, but confirmation comes from sequencing — including a search for large deletions.',
      },
      {
        id: 'q8',
        question: 'The most common cystic fibrosis allele (F508del) is missing three letters. Which tool can give them back?',
        options: [
          'A base editor (CBE or ABE)',
          'Prime editing or HDR with a template',
          'A Cas9 nickase on its own',
          'Any of them: they all write new sequence',
        ],
        correct: 1,
        feedback:
          'Base editors only swap one letter for another — they insert and delete nothing. Giving the three letters back needs a template (HDR) or the reverse transcriptase of prime editing.',
      },
      {
        id: 'q9',
        question: 'You found the perfect target, but there is no PAM next to it. What now?',
        options: [
          'Use the guide anyway: the PAM is optional',
          'Switch enzyme, since each one requires a different PAM (Cas12a uses TTTV)',
          'Extend the guide to 25 nt',
          'Increase the enzyme dose',
        ],
        correct: 1,
        feedback:
          'The PAM limits where you can cut, which is why there is a catalogue of nucleases: change the enzyme and you change the required PAM, opening up targets that were out of reach.',
      },
      {
        id: 'q10',
        question: 'In Casgevy, is the "messy" NHEJ indel a problem?',
        options: [
          'Yes: it prevents the mutation from being corrected',
          'No: the goal there is precisely to destroy a regulatory stretch',
          'Yes: that is why this therapy uses HDR',
          'It makes no difference: NHEJ does not act in stem cells',
        ],
        correct: 1,
        feedback:
          'Since the target is a motif that switches BCL11A on, any indel that makes it unreadable does the job. Fixing it letter by letter would be harder and pointless.',
      },
      {
        id: 'q11',
        question: 'In Brazil, genome editing of human embryos is…',
        options: ['Allowed for therapeutic purposes', 'Allowed with CTNBio authorisation', 'Prohibited by the Biosafety Law (11,105/2005)', 'Unregulated'],
        correct: 2,
        feedback: 'The law prohibits genetic engineering of human germ cells, zygotes and embryos and makes the practice a crime.',
      },
    ],
  },
}
