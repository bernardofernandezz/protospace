// Conteúdo da seção Bioética (PT/EN). O componente (src/sections/Ethics.tsx) só lê daqui:
// adicionar/remover itens nos arrays basta. Mantenha os `id` iguais nas duas línguas
// (os votos dos dilemas são salvos por id).
import type { L } from '../i18n'

export interface EthicsTopic {
  id: string
  title: string
  summary: string
  /** Parágrafos exibidos ao expandir o card. */
  details: string[]
  /** Observações curtas (fontes, ressalvas). */
  notes?: string[]
}

export type Stance = 'pro' | 'con' | 'depends'

export interface Dilemma {
  id: string
  title: string
  summary: string
  pro: string[]
  con: string[]
  /** Argumentos para a posição "depende" (condições, nuances). */
  depends: string[]
  notes?: string[]
}

export interface EthicsContent {
  eyebrow: string
  /** [antes, destaque, depois] — o destaque recebe o gradiente. */
  title: [string, string, string]
  lead: string
  topics: EthicsTopic[]
  dilemmas: Dilemma[]
  /** Bloco de contexto brasileiro (legislação, CTNBio etc.). */
  brazil: { title: string; summary: string; items: { label: string; text: string }[]; notes?: string[] }
}

export const ETHICS: L<EthicsContent> = {
  pt: {
    eyebrow: 'Bioética',
    title: ['O que ', 'devemos', ' fazer com o que já podemos fazer?'],
    lead: 'A técnica ficou barata, rápida e precisa o bastante para sair do laboratório. As perguntas difíceis deixaram de ser hipotéticas: quem pode ser editado, com que segurança, a que custo e decidido por quem.',
    topics: [
      {
        id: 'somatica-germinativa',
        title: 'Somática × germinativa',
        summary: 'A linha que a maior parte das diretrizes trata como fronteira: editar uma pessoa ou editar uma linhagem.',
        details: [
          'A edição [[somatica|somática]] altera células do corpo de alguém já nascido — sangue, fígado, olho. O efeito termina com aquela pessoa, e o debate se parece com o de qualquer terapia nova: eficácia, riscos, consentimento.',
          'A edição [[germinativa|germinativa]] altera embriões, óvulos ou espermatozoides. A mudança passa a todas as células do futuro indivíduo e aos seus descendentes. Por isso pesa mais: os afetados não podem consentir, e um erro se propaga.',
        ],
        notes: ['Relatórios de referência: NASEM (2017) e OMS (2021) — ver Referências.'],
      },
      {
        id: 'seguranca',
        title: 'Segurança e incerteza',
        summary: 'Off-targets, mosaicismo e alterações grandes que métodos simples não detectam.',
        details: [
          'Mesmo um guia bem desenhado pode cortar trechos parecidos com o alvo, os [[offtarget|off-targets]]. Além disso, a [[dsb|quebra de fita dupla]] pode causar grandes deleções e embaralhar pedaços do cromossomo — alterações que os testes de rotina não enxergam.',
          'Em embriões há ainda o [[mosaicismo|mosaicismo]]: a edição acontece depois da primeira divisão e só parte das células é alterada. Efeitos de longo prazo só se conhecem com acompanhamento de anos — o que exige registros e transparência.',
        ],
        notes: ['Ex.: Kosicki et al., 2018, sobre grandes deleções após cortes da Cas9.'],
      },
      {
        id: 'consentimento',
        title: 'Consentimento e gerações futuras',
        summary: 'Quem decide por quem ainda não existe?',
        details: [
          'Na terapia somática, o paciente (ou responsável) pode pesar riscos e benefícios. Na germinativa, quem carrega as consequências é uma pessoa futura — e seus filhos.',
          'Há também consentimento coletivo: populações afetadas por gene drives ou por decisões de saúde pública precisam participar da escolha, não apenas ser informadas.',
        ],
      },
      {
        id: 'justica',
        title: 'Justiça e acesso',
        summary: 'Uma cura que custa milhões de dólares é uma cura para quem?',
        details: [
          'As primeiras terapias aprovadas têm preços de lista na casa dos milhões de dólares por paciente e exigem centros especializados. A anemia falciforme, alvo do Casgevy, é mais frequente em populações que historicamente têm menos acesso à saúde.',
          'Discutir CRISPR com seriedade inclui discutir financiamento público, propriedade intelectual e capacidade instalada — inclusive no SUS.',
        ],
        notes: ['Valores variam por país e negociação; trate números como ordem de grandeza.'],
      },
      {
        id: 'aprimoramento',
        title: 'Terapia × aprimoramento',
        summary: 'Tratar doença é diferente de "melhorar" características?',
        details: [
          'Corrigir uma mutação que causa doença grave tem amplo apoio. Usar a mesma técnica para alterar traços como altura, força ou desempenho cognitivo levanta outra pergunta: o que conta como "normal" e quem define?',
          'A fronteira nem sempre é nítida — reduzir o risco de uma doença comum é terapia ou aprimoramento? — e a resposta tem implicações para desigualdade e discriminação.',
        ],
      },
      {
        id: 'governanca',
        title: 'Governança e o caso He Jiankui',
        summary: 'O que 2018 ensinou sobre fiscalização, transparência e limites.',
        details: [
          'Em 2018, o pesquisador He Jiankui anunciou o nascimento de gêmeas a partir de embriões editados no gene CCR5. Não havia necessidade médica, o consentimento foi questionável e a edição foi imprecisa. Ele foi condenado a três anos de prisão na China e solto em 2022.',
          'O caso acelerou propostas de governança: registro público de pesquisas com edição humana, canais para denúncias e um consenso amplo de que a edição germinativa clínica não é aceitável hoje.',
        ],
        notes: ['OMS (2021): recomendações de governança e registro de ensaios.'],
      },
    ],
    dilemmas: [
      {
        id: 'embriao',
        title: 'Editar embriões para evitar uma doença genética grave?',
        summary: 'Um casal em que ambos têm uma doença recessiva grave quer ter um filho biológico sem a doença.',
        pro: [
          'Evita sofrimento grave e previsível.',
          'Em alguns casos raros, a seleção de embriões (PGT) não oferece embriões saudáveis.',
          'Pode eliminar a variante da família nas próximas gerações.',
        ],
        con: [
          'Riscos de off-target e mosaicismo ainda não são controláveis em embriões.',
          'A futura pessoa e seus descendentes não consentem.',
          'Na maioria dos casos, a seleção de embriões já resolve sem editar.',
          'Abre precedente para usos não terapêuticos.',
        ],
        depends: [
          'De haver alternativa (PGT, doação de gametas, adoção).',
          'Da maturidade da técnica e de dados de segurança de longo prazo.',
          'De uma regulação pública, transparente e com acompanhamento.',
        ],
        notes: ['No Brasil, a engenharia genética em embrião humano é proibida pela Lei 11.105/2005.'],
      },
      {
        id: 'gene-drive',
        title: 'Liberar um gene drive contra mosquitos transmissores de malária?',
        summary: 'Gene drives espalham uma edição por uma população selvagem em poucas gerações — por exemplo, tornando fêmeas estéreis.',
        pro: [
          'A malária mata centenas de milhares de pessoas por ano, a maioria crianças.',
          'Pode reduzir o uso de inseticidas.',
          'Alvos específicos de uma espécie de mosquito, não de todos os insetos.',
        ],
        con: [
          'Efeito difícil de reverter depois de liberado; atravessa fronteiras.',
          'Impactos ecológicos incertos (cadeias alimentares, espécies substitutas).',
          'Risco de decisões tomadas longe das comunidades afetadas.',
        ],
        depends: [
          'De testes graduais (laboratório → gaiolas → campo isolado).',
          'Do consentimento das comunidades e países envolvidos.',
          'De mecanismos de contenção ou reversão (drives autolimitantes).',
        ],
      },
      {
        id: 'sus',
        title: 'Uma terapia gênica de milhões de reais deve ser oferecida pelo SUS?',
        summary: 'Um tratamento de dose única pode curar uma doença crônica, mas custa o equivalente a décadas de cuidados para muitos pacientes.',
        pro: [
          'Saúde é direito; negar uma cura disponível aprofunda desigualdades.',
          'Pode ser custo-efetivo no longo prazo (internações, transfusões, transplantes).',
          'A compra pública ajuda a negociar preços.',
        ],
        con: [
          'O mesmo orçamento poderia atender muito mais pessoas em outras áreas.',
          'Exige infraestrutura especializada que ainda é concentrada.',
          'Dados de longo prazo ainda são limitados.',
        ],
        depends: [
          'De avaliação de tecnologia em saúde (custo-efetividade, impacto orçamentário).',
          'De acordos de preço e pagamento por resultado.',
          'De critérios claros e públicos de elegibilidade.',
        ],
      },
    ],
    brazil: {
      title: 'O que diz a regulação brasileira',
      summary: 'O Brasil tem um marco legal específico para engenharia genética, separando o que é proibido, o que é avaliado caso a caso e o que segue as regras de pesquisa clínica.',
      items: [
        { label: 'Lei de Biossegurança (11.105/2005)', text: 'Proíbe a engenharia genética em célula germinal humana, zigoto e embrião humanos (art. 6º, III) e tipifica a prática como crime, com pena de reclusão de 1 a 4 anos e multa (art. 25). Também cria a CTNBio e o sistema de CIBios.' },
        { label: 'CTNBio · RN nº 16/2018', text: 'Define a avaliação caso a caso das Técnicas Inovadoras de Melhoramento de Precisão (TIMP). Um produto editado sem DNA recombinante no resultado final pode não ser classificado como OGM.' },
        { label: 'Pesquisa clínica e terapias avançadas', text: 'Ensaios em humanos passam pelo sistema CEP/Conep; produtos de terapia gênica e celular são regulados pela Anvisa como terapias avançadas.' },
      ],
      notes: ['Resumo didático — consulte o texto legal vigente antes de citar em trabalhos.'],
    },
  },
  en: {
    eyebrow: 'Bioethics',
    title: ['What ', 'should', ' we do with what we already can?'],
    lead: 'The technique has become cheap, fast and precise enough to leave the lab. The hard questions are no longer hypothetical: who may be edited, how safely, at what cost and decided by whom.',
    topics: [
      {
        id: 'somatica-germinativa',
        title: 'Somatic vs germline',
        summary: 'The line most guidelines treat as a boundary: editing a person or editing a lineage.',
        details: [
          '[[somatica|Somatic]] editing changes body cells of someone already born — blood, liver, eye. The effect ends with that person, and the debate resembles that of any new therapy: efficacy, risk, consent.',
          '[[germinativa|Germline]] editing changes embryos, eggs or sperm. The change reaches every cell of the future individual and their descendants. That is why it weighs more: those affected cannot consent, and a mistake propagates.',
        ],
        notes: ['Key reports: NASEM (2017) and WHO (2021) — see References.'],
      },
      {
        id: 'seguranca',
        title: 'Safety and uncertainty',
        summary: 'Off-targets, mosaicism and large changes that simple methods miss.',
        details: [
          'Even a well-designed guide can cut sites that resemble the target. On top of that, a double-strand break can cause large deletions and chromosomal rearrangements that a short PCR cannot see.',
          'In embryos there is also [[mosaicismo|mosaicism]]: the edit happens after the first division and only some cells are changed. Long-term effects are only known after years of follow-up — which requires registries and transparency.',
        ],
        notes: ['E.g. Kosicki et al., 2018, on large deletions after Cas9 cuts.'],
      },
      {
        id: 'consentimento',
        title: 'Consent and future generations',
        summary: 'Who decides for someone who does not exist yet?',
        details: [
          'In somatic therapy, the patient (or guardian) can weigh risks and benefits. In germline editing, the consequences fall on a future person — and their children.',
          'There is also collective consent: populations affected by gene drives or public-health decisions need to take part in the choice, not just be informed.',
        ],
      },
      {
        id: 'justica',
        title: 'Justice and access',
        summary: 'A cure that costs millions of dollars is a cure for whom?',
        details: [
          'The first approved therapies have list prices in the millions of dollars per patient and require specialised centres. Sickle cell disease, Casgevy’s target, is more common in populations that have historically had less access to healthcare.',
          'Discussing CRISPR seriously includes discussing public funding, intellectual property and installed capacity — including in public health systems such as Brazil’s SUS.',
        ],
        notes: ['Prices vary by country and negotiation; treat figures as orders of magnitude.'],
      },
      {
        id: 'aprimoramento',
        title: 'Therapy vs enhancement',
        summary: 'Is treating disease different from “improving” traits?',
        details: [
          'Correcting a mutation that causes serious disease has broad support. Using the same technique to change traits such as height, strength or cognitive performance raises another question: what counts as “normal”, and who decides?',
          'The line is not always sharp — is lowering the risk of a common disease therapy or enhancement? — and the answer has implications for inequality and discrimination.',
        ],
      },
      {
        id: 'governanca',
        title: 'Governance and the He Jiankui case',
        summary: 'What 2018 taught us about oversight, transparency and limits.',
        details: [
          'In 2018, researcher He Jiankui announced the birth of twin girls from embryos edited at the CCR5 gene. There was no medical need, consent was questionable and the edit was imprecise. He was sentenced to three years in prison in China and released in 2022.',
          'The case accelerated governance proposals: public registries of human genome-editing research, whistle-blowing channels and a broad consensus that clinical germline editing is not acceptable today.',
        ],
        notes: ['WHO (2021): governance recommendations and trial registry.'],
      },
    ],
    dilemmas: [
      {
        id: 'embriao',
        title: 'Edit embryos to prevent a serious genetic disease?',
        summary: 'A couple who both have a serious recessive disease want a biological child without it.',
        pro: [
          'Prevents serious, predictable suffering.',
          'In some rare cases, embryo selection (PGT) yields no healthy embryos.',
          'Could remove the variant from the family in future generations.',
        ],
        con: [
          'Off-target and mosaicism risks are not yet controllable in embryos.',
          'The future person and their descendants cannot consent.',
          'In most cases embryo selection already solves it without editing.',
          'Sets a precedent for non-therapeutic uses.',
        ],
        depends: [
          'On whether alternatives exist (PGT, donor gametes, adoption).',
          'On the technique’s maturity and long-term safety data.',
          'On public, transparent regulation with follow-up.',
        ],
        notes: ['In Brazil, genetic engineering of human embryos is prohibited by Law 11,105/2005.'],
      },
      {
        id: 'gene-drive',
        title: 'Release a gene drive against malaria-carrying mosquitoes?',
        summary: 'Gene drives spread an edit through a wild population within a few generations — for example, making females sterile.',
        pro: [
          'Malaria kills hundreds of thousands of people a year, most of them children.',
          'Could reduce insecticide use.',
          'Targets one mosquito species, not all insects.',
        ],
        con: [
          'Hard to reverse once released; it crosses borders.',
          'Uncertain ecological impact (food webs, replacement species).',
          'Risk of decisions being made far from affected communities.',
        ],
        depends: [
          'On staged testing (lab → cages → isolated field sites).',
          'On consent from the communities and countries involved.',
          'On containment or reversal mechanisms (self-limiting drives).',
        ],
      },
      {
        id: 'sus',
        title: 'Should a multi-million gene therapy be offered by a public health system?',
        summary: 'A one-off treatment may cure a chronic disease, but costs the equivalent of decades of care for many patients.',
        pro: [
          'Health is a right; denying an available cure deepens inequality.',
          'May be cost-effective long term (hospital stays, transfusions, transplants).',
          'Public purchasing helps negotiate prices.',
        ],
        con: [
          'The same budget could serve far more people elsewhere.',
          'Requires specialised infrastructure that is still concentrated.',
          'Long-term data are still limited.',
        ],
        depends: [
          'On health technology assessment (cost-effectiveness, budget impact).',
          'On price agreements and outcome-based payment.',
          'On clear, public eligibility criteria.',
        ],
      },
    ],
    brazil: {
      title: 'What Brazilian regulation says',
      summary: 'Brazil has a specific legal framework for genetic engineering, separating what is prohibited, what is assessed case by case and what follows clinical-research rules.',
      items: [
        { label: 'Biosafety Law (11,105/2005)', text: 'Prohibits genetic engineering of human germ cells, zygotes and embryos (art. 6, III) and makes the practice a crime punishable by 1 to 4 years’ imprisonment and a fine (art. 25). It also creates CTNBio, the national biosafety commission, and the system of internal biosafety committees.' },
        { label: 'CTNBio · Normative Resolution 16/2018', text: 'Sets case-by-case assessment of Innovative Precision Breeding Techniques (TIMP). An edited product with no recombinant DNA in the final result may not be classified as a GMO.' },
        { label: 'Clinical research and advanced therapies', text: 'Human trials go through the CEP/Conep research-ethics system; gene and cell therapy products are regulated by Anvisa as advanced therapies.' },
      ],
      notes: ['Teaching summary — check the current legal text before citing it.'],
    },
  },
}
