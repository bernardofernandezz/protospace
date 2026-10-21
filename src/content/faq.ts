// Perguntas frequentes. Os blocos "A simulação" descrevem o que o código do
// playground realmente faz — se a lógica em src/lib/dna.ts mudar, revise aqui.

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

export const FAQ: FaqGroup[] = [
  {
    id: 'conceitos',
    title: 'Dúvidas conceituais',
    summary: 'As perguntas que costumam aparecer logo depois da explicação do mecanismo.',
    color: '#3ef0d0',
    items: [
      {
        id: 'c1',
        q: 'CRISPR, Cas9 e sgRNA: afinal, o que é o quê?',
        a: [
          'CRISPR é a região do genoma bacteriano onde ficam as repetições e os pedaços de vírus arquivados. Cas9 é a proteína que corta. O sgRNA é o RNA que diz a ela onde cortar.',
          'No uso corrente, "CRISPR" acabou virando sinônimo da técnica inteira. Não é errado, mas na aula ajuda separar: a bactéria tem o arquivo (CRISPR) e a tesoura (Cas); o laboratório usa só a tesoura, com um endereço escolhido por nós.',
        ],
      },
      {
        id: 'c2',
        q: 'A Cas9 corta o DNA ou reescreve o gene?',
        a: [
          'Apenas corta. Toda a mudança de sequência é feita pela célula, quando ela conserta a quebra. Por isso o mesmo corte pode gerar resultados diferentes em células diferentes.',
          'As exceções são as ferramentas derivadas: editores de bases e prime editing alteram a sequência sem depender do reparo por colagem — e, nos dois casos, sem partir as duas fitas.',
        ],
      },
      {
        id: 'c3',
        q: 'Por que o PAM é necessário, se o guia já define o alvo?',
        a: [
          'O PAM é a primeira coisa que a proteína confere. Sem ele, a Cas9 nem chega a testar o guia. Na bactéria, isso evita que ela corte o próprio arquivo de vírus; no laboratório, é uma restrição: só dá para editar perto de um PAM.',
          'É também por isso que existem tantas variantes de Cas. Cada uma reconhece uma marca diferente, e juntas ampliam as regiões do genoma que podem ser alcançadas.',
        ],
      },
      {
        id: 'c4',
        q: 'A edição é herdada pelos filhos?',
        a: [
          'Depende do tipo de célula. Editar células do corpo de uma pessoa já nascida — sangue, fígado, músculo — afeta só ela: é a edição somática, usada nas terapias aprovadas.',
          'Editar um embrião, um óvulo ou um espermatozoide muda também o que será transmitido às próximas gerações. É a edição germinativa, que hoje não é aceita para uso clínico e, no Brasil, é vedada por lei.',
        ],
      },
      {
        id: 'c5',
        q: 'Qual a diferença entre CRISPR e transgenia?',
        a: [
          'Na transgenia clássica insere-se um gene, muitas vezes de outra espécie, em um ponto não escolhido do genoma. Com CRISPR é possível alterar um ponto definido — inclusive apenas desligando um gene, sem acrescentar nada.',
          'As duas coisas podem se combinar: CRISPR também serve para inserir sequências novas, e nesse caso o resultado é um organismo geneticamente modificado como qualquer outro, com as mesmas exigências regulatórias.',
        ],
      },
    ],
  },
  {
    id: 'simulacao',
    title: 'Como a simulação funciona',
    summary: 'O que o playground calcula de verdade, o que é ilustrativo e por que isso está explícito.',
    color: '#ff4fa3',
    items: [
      {
        id: 's1',
        q: 'A sequência mostrada é de um gene real?',
        a: [
          'Não. É uma sequência fictícia, escrita para conter vários PAMs NGG em posições convenientes para a demonstração. Usar um gene real sugeriria que os números da tela valem para aquele gene, o que não é o caso.',
          'A sequência pode ser trocada no painel "Editar a sequência do locus": ao aplicar, o sistema varre a nova sequência e lista os sítios candidatos encontrados nela.',
        ],
      },
      {
        id: 's2',
        q: 'A busca por sítios-alvo é de verdade ou é animação?',
        a: [
          'Essa parte é cálculo real sobre a sequência. O programa percorre a fita senso procurando 20 letras seguidas de NGG e, para cada ocorrência, marca o ponto de corte três pares de base antes do PAM.',
          'O mesmo vale para o resultado da edição: inserções, deleções e trocas de base são aplicadas à sequência e mostradas no diff colorido. O que você lê no painel é a sequência realmente modificada, não uma figura pré-pronta.',
        ],
      },
      {
        id: 's3',
        q: 'E o "score" do guia? Posso usar esse número?',
        a: [
          'Não. Ele está rotulado como ilustrativo na própria tela. É uma conta simples que penaliza conteúdo GC fora da faixa usual, quatro T seguidos e homopolímeros longos — critérios reais de desenho de guia, mas longe de um preditor validado.',
          'Para um experimento de verdade, os escores precisam vir de ferramentas como CRISPOR ou CHOPCHOP, que consideram o genoma inteiro e foram calibradas com dados experimentais.',
        ],
      },
      {
        id: 's4',
        q: 'Como o simulador calcula a chance de corte e os off-targets?',
        a: [
          'Por uma curva logística sobre o número de mismatches entre o guia e o sítio, com peso maior para os erros próximos ao PAM — 2,5 contra 1,0 para os distais. Esse peso reflete um fato bem estabelecido: errar perto do PAM compromete muito mais o reconhecimento.',
          'O controle "mismatches tolerados" desloca essa curva. Valores baixos imitam variantes de alta fidelidade; valores altos imitam excesso de enzima ou exposição prolongada. Os dois sítios off-target mostrados na cena são fictícios, construídos a partir do alvo com mismatches propositais, para que o efeito do ajuste fique visível.',
          'Os números resultantes são comparativos, não previsões. Servem para mostrar a direção do efeito — mais mismatches, mais risco —, não a magnitude esperada em bancada.',
        ],
      },
      {
        id: 's5',
        q: 'Os indels do NHEJ são aleatórios a cada rodada?',
        a: [
          'São sorteados, mas de forma reproduzível: o sorteio usa uma semente, então a mesma rodada sempre dá o mesmo resultado. O botão "sortear novo indel" avança a semente e gera outro desfecho.',
          'A distribuição é enviesada para deleções curtas e para a inserção de uma única base, que é o padrão mais frequente descrito para a SpCas9. É uma caricatura do real, suficiente para discutir frameshift em sala.',
        ],
      },
      {
        id: 's6',
        q: 'Por que a eficiência do HDR aparece sempre baixa?',
        a: [
          'Porque o modelo aplica um fator menor a essa via, refletindo o que se observa na prática: a colagem rápida predomina, e o reparo por molde depende da fase do ciclo celular.',
          'É um número fixo no código, não uma simulação de ciclo celular. A intenção é que a diferença entre as duas vias fique evidente na comparação, já que ela costuma surpreender quem está vendo a técnica pela primeira vez.',
        ],
      },
      {
        id: 's7',
        q: 'O que a simulação deliberadamente não mostra?',
        a: [
          'Cromatina, nucleossomos e acessibilidade do DNA; a cinética real de busca da enzima, que envolve colisões tridimensionais e não um deslizamento contínuo; a resposta da célula ao dano; e eventos como grandes deleções e rearranjos.',
          'O aviso no canto da tela existe por isso: é uma simulação didática simplificada, não um protocolo nem um preditor. Vale dizer isso em voz alta na apresentação — a honestidade sobre o modelo é parte da aula.',
        ],
      },
    ],
  },
  {
    id: 'aula',
    title: 'Uso em aula e apresentação',
    summary: 'Questões práticas de quem vai projetar o site ou indicá-lo aos alunos.',
    color: '#ffb547',
    items: [
      {
        id: 'a1',
        q: 'Como conduzir o playground durante a apresentação?',
        a: [
          'A tecla P liga o modo apresentação: a legenda de cada etapa fica maior, pensada para ser lida em voz alta. As setas avançam e voltam etapas, a barra de espaço pausa, R reinicia, C recentraliza a câmera e F abre em tela cheia.',
          'Um roteiro que funciona: percorrer as seis etapas com o guia perfeito, mostrar o resultado, depois voltar à etapa do guia, clicar em duas bases para criar mismatches e repetir. A queda da eficiência e a subida dos off-targets aparecem na mesma tela.',
        ],
      },
      {
        id: 'a2',
        q: 'Preciso de internet durante o seminário?',
        a: [
          'Não, depois que a página carregar. Não há backend nem chamada a serviços externos: todo o conteúdo, as geometrias 3D e os ícones são gerados pelo próprio código.',
          'Ainda assim, vale abrir o site e rolar até o playground alguns minutos antes de começar, para que a cena 3D já esteja carregada.',
        ],
      },
      {
        id: 'a3',
        q: 'E se o computador da sala não rodar o 3D?',
        a: [
          'A página detecta a ausência de WebGL e substitui a cena por uma ilustração estática, mantendo todos os painéis funcionando: guia, parâmetros, etapas, diff da sequência e análise.',
          'Em máquinas lentas, o site reduz sozinho a resolução de renderização e desliga o brilho; a cena também pausa quando sai da tela, para não consumir bateria à toa.',
        ],
      },
      {
        id: 'a4',
        q: 'Os votos dos dilemas e o checklist são compartilhados entre os alunos?',
        a: [
          'Não. Tudo fica salvo apenas no navegador de cada pessoa, sem servidor e sem coleta de dados. Dois alunos no mesmo celular veriam os mesmos votos; em aparelhos diferentes, contagens independentes.',
          'Para uma votação coletiva no telão, o modo plateia faz cada clique somar um voto. Assim dá para contar as mãos levantadas e registrar o resultado ali mesmo.',
        ],
      },
      {
        id: 'a5',
        q: 'Posso usar o material em outras turmas?',
        a: [
          'Sim. Os textos ficam separados do código: as seções de bioética, o quiz e as referências vêm de arquivos próprios em src/content, o que permite adaptar perguntas e exemplos sem mexer na interface.',
          'Antes de reaproveitar, confira os itens marcados com [verificar] na seção de referências — eles sinalizam datas e números que precisam de conferência na fonte original.',
        ],
      },
    ],
  },
]
