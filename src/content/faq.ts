// Perguntas frequentes (PT/EN). Os blocos "A simulação" descrevem o que o código do
// playground realmente faz — se a lógica em src/lib/dna.ts mudar, revise aqui.
import type { L } from '../i18n'

export interface FaqItem {
  id: string
  q: string
  /** Parágrafos da resposta. */
  a: string[]
}

export interface FaqGroup {
  id: string
  title: string
  summary: string
  color: string
  items: FaqItem[]
}

export const FAQ_HEADER: L<{ eyebrow: string; title: [string, string, string]; lead: string; count: string }> = {
  pt: { eyebrow: 'Perguntas frequentes', title: ['O que costumam ', 'perguntar', ' depois.'], lead: 'Reunidas as dúvidas que mais aparecem na discussão — inclusive as que são sobre o próprio simulador: o que ele calcula de verdade e o que é apenas ilustrativo.', count: 'perguntas' },
  en: { eyebrow: 'FAQ', title: ['What people usually ', 'ask', ' afterwards.'], lead: 'The questions that come up most in discussion — including ones about the simulator itself: what it really computes and what is only illustrative.', count: 'questions' },
}

export const FAQ: L<FaqGroup[]> = {
  pt: [
    {
      id: 'conceitos',
      title: 'Dúvidas conceituais',
      summary: 'As perguntas que costumam aparecer logo depois da explicação do mecanismo.',
      color: '#3ef0d0',
      items: [
        { id: 'c1', q: 'CRISPR, Cas9 e sgRNA: afinal, o que é o quê?', a: [
          'CRISPR é a região do genoma bacteriano onde ficam as repetições e os pedaços de vírus arquivados. Cas9 é a proteína que corta. O sgRNA é o RNA que diz a ela onde cortar.',
          'No uso corrente, "CRISPR" acabou virando sinônimo da técnica inteira. Não é errado, mas na aula ajuda separar: a bactéria tem o arquivo (CRISPR) e a tesoura (Cas); o laboratório usa só a tesoura, com um endereço escolhido por nós.',
        ] },
        { id: 'c2', q: 'A Cas9 corta o DNA ou reescreve o gene?', a: [
          'Apenas corta. Toda a mudança de sequência é feita pela célula, quando ela conserta a quebra. Por isso o mesmo corte pode gerar resultados diferentes em células diferentes.',
          'As exceções são as ferramentas derivadas: editores de bases e prime editing alteram a sequência sem depender do reparo por colagem — e, nos dois casos, sem partir as duas fitas.',
        ] },
        { id: 'c3', q: 'Por que o PAM é necessário, se o guia já define o alvo?', a: [
          'O PAM é a primeira coisa que a proteína confere. Sem ele, a Cas9 nem chega a testar o guia. Na bactéria, isso evita que ela corte o próprio arquivo de vírus; no laboratório, é uma restrição: só dá para editar perto de um PAM.',
          'É também por isso que existem tantas variantes de Cas. Cada uma reconhece uma marca diferente, e juntas ampliam as regiões do genoma que podem ser alcançadas.',
        ] },
        { id: 'c4', q: 'A edição é herdada pelos filhos?', a: [
          'Depende do tipo de célula. Editar células do corpo de uma pessoa já nascida — sangue, fígado, músculo — afeta só ela: é a edição somática, usada nas terapias aprovadas.',
          'Editar um embrião, um óvulo ou um espermatozoide muda também o que será transmitido às próximas gerações. É a edição germinativa, que hoje não é aceita para uso clínico e, no Brasil, é vedada por lei.',
        ] },
        { id: 'c5', q: 'Qual a diferença entre CRISPR e transgenia?', a: [
          'Na transgenia clássica insere-se um gene, muitas vezes de outra espécie, em um ponto não escolhido do genoma. Com CRISPR é possível alterar um ponto definido — inclusive apenas desligando um gene, sem acrescentar nada.',
          'As duas coisas podem se combinar: CRISPR também serve para inserir sequências novas, e nesse caso o resultado é um organismo geneticamente modificado como qualquer outro, com as mesmas exigências regulatórias.',
        ] },
      ],
    },
    {
      id: 'simulacao',
      title: 'Como a simulação funciona',
      summary: 'O que o playground calcula de verdade, o que é ilustrativo e por que isso está explícito.',
      color: '#ff4fa3',
      items: [
        { id: 's1', q: 'A sequência mostrada é de um gene real?', a: [
          'Não. É uma sequência fictícia, escrita para conter vários PAMs NGG em posições convenientes para a demonstração. Usar um gene real sugeriria que os números da tela valem para aquele gene, o que não é o caso.',
          'A sequência pode ser trocada no painel "Editar a sequência do locus": ao aplicar, o sistema varre a nova sequência e lista os sítios candidatos encontrados nela.',
        ] },
        { id: 's2', q: 'A busca por sítios-alvo é de verdade ou é animação?', a: [
          'Essa parte é cálculo real sobre a sequência. O programa percorre a fita senso procurando 20 letras seguidas de NGG e, para cada ocorrência, marca o ponto de corte três pares de base antes do PAM. Na cena 3D, a Cas9 para justamente nos PAMs encontrados antes de chegar ao alvo escolhido.',
          'O mesmo vale para o resultado da edição: inserções, deleções e trocas de base são aplicadas à sequência, mostradas no diff colorido e refletidas na hélice 3D. O que você lê no painel é a sequência realmente modificada, não uma figura pré-pronta.',
        ] },
        { id: 's3', q: 'E o "score" do guia? Posso usar esse número?', a: [
          'Não. Ele está rotulado como ilustrativo na própria tela. É uma conta simples que penaliza conteúdo GC fora da faixa usual, quatro T seguidos e homopolímeros longos — critérios reais de desenho de guia, mas longe de um preditor validado.',
          'Para um experimento de verdade, os escores precisam vir de ferramentas como CRISPOR ou CHOPCHOP, que consideram o genoma inteiro e foram calibradas com dados experimentais.',
        ] },
        { id: 's4', q: 'Como o simulador calcula a chance de corte e os off-targets?', a: [
          'Por uma curva logística sobre o número de mismatches entre o guia e o sítio, com peso maior para os erros próximos ao PAM — 2,5 contra 1,0 para os distais. Esse peso reflete um fato bem estabelecido: errar perto do PAM compromete muito mais o reconhecimento.',
          'O controle "mismatches tolerados" desloca essa curva. Valores baixos imitam variantes de alta fidelidade; valores altos imitam excesso de enzima ou exposição prolongada. Os dois sítios off-target mostrados na cena são fictícios, construídos a partir do alvo com mismatches propositais, para que o efeito do ajuste fique visível.',
          'Os números resultantes são comparativos, não previsões. Servem para mostrar a direção do efeito — mais mismatches, mais risco —, não a magnitude esperada em bancada.',
        ] },
        { id: 's5', q: 'Os indels do NHEJ são aleatórios a cada rodada?', a: [
          'São sorteados, mas de forma reproduzível: o sorteio usa uma semente, então a mesma rodada sempre dá o mesmo resultado. O botão "sortear novo indel" avança a semente e gera outro desfecho.',
          'A distribuição é enviesada para deleções curtas e para a inserção de uma única base, que é o padrão mais frequente descrito para a SpCas9. É uma caricatura do real, suficiente para discutir frameshift em sala.',
        ] },
        { id: 's6', q: 'Por que a eficiência do HDR aparece sempre baixa?', a: [
          'Porque o modelo aplica um fator menor a essa via, refletindo o que se observa na prática: a colagem rápida predomina, e o reparo por molde depende da fase do ciclo celular.',
          'É um número fixo no código, não uma simulação de ciclo celular. A intenção é que a diferença entre as duas vias fique evidente na comparação, já que ela costuma surpreender quem está vendo a técnica pela primeira vez.',
        ] },
        { id: 's7', q: 'O que a simulação deliberadamente não mostra?', a: [
          'Cromatina e nucleossomos aparecem só como cenário, sem efeito sobre o acesso ao DNA; a busca da enzima é uma coreografia simplificada (saltos e paradas em PAMs), não a cinética real; a forma das proteínas é estilizada, não a estrutura cristalográfica; e eventos como grandes deleções e rearranjos não são simulados.',
          'O aviso no canto da tela existe por isso: é uma simulação didática simplificada, não um protocolo nem um preditor. Vale dizer isso em voz alta na apresentação — a honestidade sobre o modelo é parte da aula.',
        ] },
      ],
    },
    {
      id: 'aula',
      title: 'Uso em aula e apresentação',
      summary: 'Questões práticas de quem vai projetar o site ou indicá-lo aos alunos.',
      color: '#ffb547',
      items: [
        { id: 'a1', q: 'Como conduzir o playground durante a apresentação?', a: [
          'A tecla P liga o modo apresentação (legendas maiores e um QR code para a plateia abrir o site no celular). M liga o modo cinema, que percorre as seis etapas sozinho com câmera automática. As setas avançam e voltam etapas, a barra de espaço pausa, R reinicia, C recentraliza a câmera e F abre em tela cheia.',
          'Um roteiro que funciona: rodar o modo cinema com o guia perfeito, mostrar o resultado, depois voltar à etapa do guia, clicar em duas bases da região seed para criar mismatches e repetir. O R-loop que colapsa, a queda da eficiência e a subida dos off-targets aparecem na mesma tela.',
        ] },
        { id: 'a2', q: 'Preciso de internet durante o seminário?', a: [
          'Não, depois da primeira visita. O site é instalável e funciona offline: conteúdo, geometrias 3D, fontes e ícones ficam em cache no navegador. Sem rede, só a votação dos dilemas fica em espera: seu voto é guardado e enviado quando a conexão voltar.',
          'Ainda assim, vale abrir o site e rolar até o playground alguns minutos antes de começar, para que a cena 3D já esteja carregada.',
        ] },
        { id: 'a3', q: 'E se o computador da sala não rodar o 3D?', a: [
          'A página detecta a ausência de WebGL (ou a perda do contexto gráfico) e substitui a cena por uma ilustração estática, mantendo todos os painéis funcionando: guia, parâmetros, etapas, diff da sequência e análise.',
          'Em máquinas lentas, o site reduz sozinho a qualidade gráfica (alta → média → baixa: resolução, sombreamento, profundidade de campo e partículas). Também dá para escolher o nível manualmente em Parâmetros. A cena pausa quando sai da tela, para não consumir bateria à toa.',
        ] },
        { id: 'a4', q: 'Os votos dos dilemas são compartilhados?', a: [
          'Sim. A votação é aberta a todos os visitantes: cada navegador tem um voto por dilema (dá para mudar de ideia) e os resultados aparecem ao vivo depois que você escolhe sua posição — ótimo para a plateia votar pelo celular durante a apresentação.',
          'Os votos são anônimos: o site guarda só um identificador aleatório do navegador, sem nome, e-mail ou login. Já o checklist de boas práticas fica salvo apenas no seu navegador.',
        ] },
        { id: 'a5', q: 'Posso compartilhar um experimento específico?', a: [
          'Sim. O botão de link no playground copia uma URL com o locus, o sítio, o guia (incluindo mismatches), o tipo de Cas, a entrega, o reparo e a semente do indel. Quem abrir o link vê exatamente o mesmo experimento. O botão de câmera salva uma imagem PNG da cena.',
          'Os textos ficam separados do código, em src/content, nas duas línguas — o que permite adaptar perguntas e exemplos para outras turmas sem mexer na interface.',
        ] },
      ],
    },
  ],
  en: [
    {
      id: 'conceitos',
      title: 'Concepts',
      summary: 'The questions that usually come up right after the mechanism is explained.',
      color: '#3ef0d0',
      items: [
        { id: 'c1', q: 'CRISPR, Cas9 and sgRNA: what is what?', a: [
          'CRISPR is the region of the bacterial genome that holds the repeats and the archived pieces of viruses. Cas9 is the protein that cuts. The sgRNA is the RNA that tells it where to cut.',
          'In everyday use, "CRISPR" has become shorthand for the whole technique. That is not wrong, but it helps to separate them: the bacterium has the archive (CRISPR) and the scissors (Cas); the lab uses only the scissors, with an address we choose.',
        ] },
        { id: 'c2', q: 'Does Cas9 cut DNA or rewrite the gene?', a: [
          'It only cuts. Any sequence change is made by the cell as it repairs the break. That is why the same cut can lead to different outcomes in different cells.',
          'The exceptions are the derived tools: base editors and prime editors change the sequence without relying on end-joining — and, in both cases, without breaking both strands.',
        ] },
        { id: 'c3', q: 'Why is the PAM needed if the guide already defines the target?', a: [
          'The PAM is the first thing the protein checks. Without it, Cas9 never even tests the guide. In bacteria this prevents it from cutting its own archive; in the lab it is a constraint: you can only edit near a PAM.',
          'That is also why there are so many Cas variants. Each recognises a different mark, and together they expand the regions of the genome that can be reached.',
        ] },
        { id: 'c4', q: 'Is the edit inherited by children?', a: [
          'It depends on the cell type. Editing body cells of someone already born — blood, liver, muscle — affects only that person: this is somatic editing, used in approved therapies.',
          'Editing an embryo, an egg or a sperm cell also changes what is passed on to future generations. This is germline editing, which is not accepted for clinical use today and is prohibited by law in Brazil.',
        ] },
        { id: 'c5', q: 'How is CRISPR different from transgenics?', a: [
          'Classic transgenics inserts a gene, often from another species, at an unchosen spot in the genome. With CRISPR you can change a defined spot — even just switch a gene off without adding anything.',
          'The two can be combined: CRISPR can also insert new sequences, and in that case the result is a genetically modified organism like any other, with the same regulatory requirements.',
        ] },
      ],
    },
    {
      id: 'simulacao',
      title: 'How the simulation works',
      summary: 'What the playground really computes, what is illustrative and why that is made explicit.',
      color: '#ff4fa3',
      items: [
        { id: 's1', q: 'Is the sequence shown from a real gene?', a: [
          'No. It is a fictional sequence written to contain several NGG PAMs at convenient positions for the demo. Using a real gene would suggest that the numbers on screen apply to that gene, which is not the case.',
          'You can replace the sequence in the "Edit the locus sequence" panel: on apply, the app scans the new sequence and lists the candidate sites it finds.',
        ] },
        { id: 's2', q: 'Is the target-site search real or just animation?', a: [
          'That part is real computation on the sequence. The program scans the sense strand for 20 letters followed by NGG and, for each hit, marks the cut site three base pairs before the PAM. In the 3D scene, Cas9 stops at exactly those PAMs before reaching the chosen target.',
          'The same goes for the edit: insertions, deletions and base swaps are applied to the sequence, shown in the coloured diff and reflected in the 3D helix. What you read in the panel is the actually modified sequence, not a canned picture.',
        ] },
        { id: 's3', q: 'What about the guide "score"? Can I use that number?', a: [
          'No. It is labelled as illustrative on screen. It is a simple formula that penalises GC content outside the usual range, runs of four Ts and long homopolymers — real guide-design criteria, but far from a validated predictor.',
          'For a real experiment, scores must come from tools such as CRISPOR or CHOPCHOP, which consider the whole genome and are calibrated on experimental data.',
        ] },
        { id: 's4', q: 'How does the simulator compute cut probability and off-targets?', a: [
          'With a logistic curve over the number of mismatches between guide and site, weighting errors near the PAM more heavily — 2.5 versus 1.0 for distal ones. That weighting reflects a well-established fact: errors near the PAM hurt recognition far more.',
          'The "tolerated mismatches" control shifts the curve. Low values mimic high-fidelity variants; high values mimic excess enzyme or prolonged exposure. The two off-target sites in the scene are fictional, built from the target with deliberate mismatches so the effect of the setting is visible.',
          'The resulting numbers are comparative, not predictions. They show the direction of the effect — more mismatches, more risk — not the magnitude you would see at the bench.',
        ] },
        { id: 's5', q: 'Are the NHEJ indels random every run?', a: [
          'They are drawn randomly, but reproducibly: the draw uses a seed, so the same run always gives the same result. The "roll a new indel" button advances the seed and produces another outcome.',
          'The distribution is biased towards short deletions and single-base insertions, the most common pattern reported for SpCas9. It is a caricature of reality, good enough to discuss frameshifts in class.',
        ] },
        { id: 's6', q: 'Why is HDR efficiency always low?', a: [
          'Because the model applies a smaller factor to that pathway, reflecting what is seen in practice: end-joining dominates, and template-based repair depends on the cell-cycle phase.',
          'It is a fixed number in the code, not a cell-cycle simulation. The aim is to make the difference between the two pathways obvious, since it often surprises people seeing the technique for the first time.',
        ] },
        { id: 's7', q: 'What does the simulation deliberately leave out?', a: [
          'Chromatin and nucleosomes appear only as scenery, with no effect on DNA access; the enzyme’s search is simplified choreography (hops and stops at PAMs), not real kinetics; protein shapes are stylised, not the crystal structure; and events such as large deletions and rearrangements are not simulated.',
          'That is why the notice in the corner exists: this is a simplified teaching simulation, not a protocol or a predictor. It is worth saying out loud during the talk — honesty about the model is part of the lesson.',
        ] },
      ],
    },
    {
      id: 'aula',
      title: 'Teaching and presenting',
      summary: 'Practical questions for anyone projecting the site or recommending it to students.',
      color: '#ffb547',
      items: [
        { id: 'a1', q: 'How should I drive the playground during a talk?', a: [
          'P turns on presentation mode (larger captions and a QR code so the audience can open the site on their phones). M starts cinema mode, which plays all six steps with an automatic camera. Arrow keys move between steps, space pauses, R resets, C recentres the camera and F goes fullscreen.',
          'A script that works: run cinema mode with the perfect guide, show the outcome, then go back to the guide step, click two seed-region bases to create mismatches and run it again. The collapsing R-loop, the drop in efficiency and the rise in off-targets all show up on the same screen.',
        ] },
        { id: 'a2', q: 'Do I need internet during the seminar?', a: [
          'Not after the first visit. The site is installable and works offline: content, 3D geometry, fonts and icons are cached in the browser. Offline, only dilemma voting waits: your vote is kept and sent when the connection returns.',
          'Still, it is worth opening the site and scrolling to the playground a few minutes before you start so the 3D scene is already loaded.',
        ] },
        { id: 'a3', q: 'What if the room’s computer cannot run the 3D?', a: [
          'The page detects missing WebGL (or a lost graphics context) and swaps the scene for a static illustration, keeping every panel working: guide, parameters, steps, sequence diff and analysis.',
          'On slow machines the site lowers graphics quality on its own (high → medium → low: resolution, shading, depth of field and particles). You can also pick the level manually under Parameters. The scene pauses when off screen so it does not drain the battery.',
        ] },
        { id: 'a4', q: 'Are dilemma votes shared?', a: [
          'Yes. Voting is open to every visitor: each browser gets one vote per dilemma (you can change your mind) and results appear live once you pick a position — great for letting the audience vote from their phones during a talk.',
          'Votes are anonymous: the site only stores a random browser identifier, with no name, email or login. The best-practice checklist, on the other hand, stays in your browser only.',
        ] },
        { id: 'a5', q: 'Can I share a specific experiment?', a: [
          'Yes. The link button in the playground copies a URL with the locus, site, guide (mismatches included), Cas type, delivery, repair and indel seed. Anyone opening it sees exactly the same experiment. The camera button saves a PNG of the scene.',
          'All text lives apart from the code, in src/content, in both languages — so questions and examples can be adapted for other classes without touching the interface.',
        ] },
      ],
    },
  ],
}
