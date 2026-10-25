// Quatro estratégias para a mesma doença. Cada uma abre o playground já configurada,
// e o desfecho descrito em `result` é o que a simulação produz com esse preset.
import type { L } from '../i18n'
import type { CasType, Repair } from '../lib/dna'

export interface Path {
  id: string
  name: L
  /** Como a estratégia funciona, em linguagem comum. */
  plain: L
  /** O que o playground mostra ao testar: é o que torna o cartão verificável. */
  result: L
  preset: { disease: string | null; cas: CasType; repair?: Repair }
  color: string
}

export const PATHS: Path[] = [
  {
    id: 'hdr',
    name: { pt: 'Corrigir a letra com molde (HDR)', en: 'Fix the letter with a template (HDR)' },
    plain: {
      pt: 'A Cas9 corta ao lado da mutação e a célula copia um molde que traz a sequência saudável. É a correção mais literal possível: o gene volta a ser o original.',
      en: 'Cas9 cuts next to the mutation and the cell copies a template carrying the healthy sequence. It is the most literal fix there is: the gene goes back to the original.',
    },
    result: {
      pt: 'Funciona, mas a eficiência é baixa: na população de alelos, o [[nhej|NHEJ]] vence o molde na maioria das vezes e deixa [[indel|indels]] no lugar.',
      en: 'It works, but efficiency is low: across the allele population, [[nhej|NHEJ]] beats the template most of the time and leaves [[indel|indels]] instead.',
    },
    preset: { disease: 'sickle', cas: 'wt', repair: 'hdr' },
    color: '#7dff9b',
  },
  {
    id: 'pe',
    name: { pt: 'Escrever a correção (prime editing)', en: 'Write the fix in (prime editing)' },
    plain: {
      pt: 'Em vez de quebrar as duas fitas, a enzima corta só uma e uma transcriptase reversa escreve ali a sequência ditada pelo próprio RNA guia. Sem quebra dupla, sem molde doador.',
      en: 'Instead of breaking both strands, the enzyme nicks one and a reverse transcriptase writes there the sequence dictated by the guide RNA itself. No double-strand break, no donor template.',
    },
    result: {
      pt: 'Corrige o [[alelo|alelo]] com muito menos indel indesejado — desde que exista um sítio cujo nick caia logo antes da mutação.',
      en: 'It fixes the [[alelo|allele]] with far fewer unwanted indels — as long as there is a site whose nick falls just before the mutation.',
    },
    preset: { disease: 'sickle', cas: 'pe' },
    color: '#4cc9ff',
  },
  {
    id: 'abe',
    name: { pt: 'Trocar a letra sem cortar (editor de base)', en: 'Swap the letter without cutting (base editor)' },
    plain: {
      pt: 'Um editor de adenina converte A em G sem quebrar o DNA. Na anemia falciforme ele não devolve a letra original, mas pode gerar a hemoglobina Makassar — uma variante benigna que não falciforma.',
      en: 'An adenine editor converts A to G without breaking the DNA. In sickle cell disease it does not restore the original letter, but it can create haemoglobin Makassar — a benign variant that does not sickle.',
    },
    result: {
      pt: 'Aqui o caminho trava: neste trecho não há PAM NGG que coloque a base certa na janela de edição (posições 4–8 do guia), então o editor mexe nas vizinhas. A escolha da enzima e do PAM decide o que é possível.',
      en: 'Here the path stalls: in this stretch no NGG PAM puts the right base inside the editing window (guide positions 4–8), so the editor touches the neighbours instead. The choice of enzyme and PAM decides what is possible.',
    },
    preset: { disease: 'sickle', cas: 'abe' },
    color: '#ffb547',
  },
  {
    id: 'bcl11a',
    name: { pt: 'Não mexer no gene doente (Casgevy)', en: 'Leave the faulty gene alone (Casgevy)' },
    plain: {
      pt: 'A terapia aprovada não corrige a HBB. Ela quebra um interruptor no BCL11A, e a pessoa volta a produzir a hemoglobina fetal que tinha ao nascer — que ocupa o lugar da hemoglobina doente.',
      en: 'The approved therapy does not fix HBB. It breaks a switch in BCL11A, and the person goes back to making the fetal haemoglobin they had at birth — which takes the place of the diseased haemoglobin.',
    },
    result: {
      pt: 'É o caminho mais eficiente da lista, porque aqui o [[indel|indel]] "bagunçado" do [[nhej|NHEJ]] é exatamente o objetivo, e não um efeito colateral.',
      en: 'It is the most efficient path on this list, because here the "messy" [[nhej|NHEJ]] [[indel|indel]] is exactly the goal, not a side effect.',
    },
    preset: { disease: 'bcl11a', cas: 'wt', repair: 'nhej' },
    color: '#ff4fa3',
  },
]
