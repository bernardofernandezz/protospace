import SectionHeader from '../components/SectionHeader'
import WhatIf from '../components/WhatIf'
import { useT, type L } from '../i18n'
import { Rich } from '../components/Term'

type App = { t: string; c: string; span?: string; b: string; tag: string }

const APPS: L<App[]> = {
  pt: [
    {
      t: 'Terapia somática — doenças genéticas', c: '#ff4fa3', span: 'md:col-span-2',
      b: 'No Casgevy, as células da medula do próprio paciente são retiradas, editadas em laboratório e devolvidas — uma terapia [[exvivo|ex vivo]]. A edição religa a produção da hemoglobina fetal, aquela que usamos antes de nascer, e ela compensa a hemoglobina defeituosa. Não é um procedimento simples: antes da devolução, o paciente passa por quimioterapia para abrir espaço na medula. Já existem também abordagens que editam células dentro do corpo ([[invivo|in vivo]]), ainda em fase de testes clínicos.',
      tag: 'ex vivo · in vivo',
    },
    { t: 'Oncologia', c: '#ffb547', b: 'Células de defesa do paciente são editadas para enxergar melhor o tumor, ou para que células de um doador possam ser usadas em várias pessoas. Em pesquisa, desligar [[gene|genes]] um a um revela de quais deles o tumor depende para sobreviver.', tag: 'imunoterapia' },
    { t: 'Agricultura', c: '#7dff9b', b: 'Como a edição pode produzir uma planta sem [[dna|DNA]] de outra espécie, o resultado se aproxima do que o melhoramento tradicional faria — só que em menos tempo. Isso mudou a forma como alguns países avaliam esses alimentos. Exemplos já descritos: um tomate com mais GABA e um cogumelo que escurece menos.', tag: 'melhoramento de precisão' },
    { t: 'Diagnóstico', c: '#3ef0d0', b: 'Aproveita o efeito colateral da Cas12 e da Cas13: ao encontrar o material genético do vírus procurado, elas passam a cortar moléculas vizinhas que foram preparadas para emitir sinal. Um alvo encontrado vira muitos sinais, e o teste fica sensível e rápido.', tag: 'Cas12 · Cas13' },
    { t: 'Pesquisa básica', c: '#4cc9ff', b: 'Talvez o uso mais comum, e o menos comentado fora da área. Com milhares de guias diferentes é possível testar o papel de cada gene ao mesmo tempo. Versões sem tesoura (a [[dcas9|dCas9]]) ainda permitem desligar ou ligar o volume de um gene sem tocar na sequência.', tag: 'telas · dCas9' },
    { t: 'Organismos modelo', c: '#b98cff', span: 'md:col-span-2', b: 'Criar um camundongo com uma mutação específica levava meses ou anos. Com CRISPR, leva semanas, e dá para alterar vários genes de uma vez. Isso acelerou o estudo de doenças genéticas em animais e em organoides.', tag: 'modelos de doença' },
  ],
  en: [
    {
      t: 'Somatic therapy — genetic diseases', c: '#ff4fa3', span: 'md:col-span-2',
      b: 'With Casgevy, the patient’s own bone-marrow cells are removed, edited in the lab and returned — an [[exvivo|ex vivo]] therapy. The edit switches fetal haemoglobin — the kind we make before birth — back on, and it compensates for the faulty haemoglobin. It is not a simple procedure: before the cells go back, the patient undergoes chemotherapy to make room in the marrow. Approaches that edit cells inside the body ([[invivo|in vivo]]) also exist, still in clinical trials.',
      tag: 'ex vivo · in vivo',
    },
    { t: 'Oncology', c: '#ffb547', b: 'A patient’s immune cells are edited to see the tumour better, or so that cells from one donor can be used for many people. In research, switching [[gene|genes]] off one by one reveals which ones a tumour depends on to survive.', tag: 'immunotherapy' },
    { t: 'Agriculture', c: '#7dff9b', b: 'Because editing can produce a plant without [[dna|DNA]] from another species, the result is close to what conventional breeding would achieve — only faster. That has changed how some countries assess these foods. Published examples: a tomato with more GABA and a mushroom that browns less.', tag: 'precision breeding' },
    { t: 'Diagnostics', c: '#3ef0d0', b: 'Harnesses the collateral activity of Cas12 and Cas13: once they find the target virus’s genetic material, they start cutting nearby reporter molecules designed to emit a signal. One target found becomes many signals, making the test sensitive and fast.', tag: 'Cas12 · Cas13' },
    { t: 'Basic research', c: '#4cc9ff', b: 'Probably the most common use, and the least talked about outside the field. With thousands of different guides you can test the role of every gene at once. Scissor-less versions ([[dcas9|dCas9]]) even let you turn a gene’s volume down or up without touching its sequence.', tag: 'screens · dCas9' },
    { t: 'Model organisms', c: '#b98cff', span: 'md:col-span-2', b: 'Making a mouse with a specific mutation used to take months or years. With CRISPR it takes weeks, and several genes can be changed at once. That has sped up the study of genetic diseases in animals and organoids.', tag: 'disease models' },
  ],
}

export default function Applications() {
  const t = useT()
  return (
    <section id="aplicacoes" className="section">
      <SectionHeader n="07" eyebrow={t('Aplicações', 'Applications')}
        title={t.lang === 'en' ? <>From the bench <span className="text-gradient">to the clinic</span> — and the field.</> : <>Da bancada <span className="text-gradient">à clínica</span> — e ao campo.</>}
        lead={t('Uma distinção que vale repetir em sala: parte do que está aqui já é tratamento aprovado, parte ainda está em testes clínicos e parte é ferramenta de pesquisa. Misturar os três é a forma mais fácil de exagerar o que a técnica faz hoje.',
          'A distinction worth repeating: some of what is here is already approved treatment, some is still in clinical trials and some is a research tool. Mixing the three up is the easiest way to overstate what the technique does today.')} />
      <div className="grid gap-5 md:grid-cols-3">
        {t.pick(APPS).map((a) => (
          <article key={a.t} className={`glass tilt-card group relative overflow-hidden rounded-3xl p-7 transition duration-500 hover:-translate-y-1 ${a.span ?? ''}`} data-reveal>
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full opacity-0 blur-3xl transition duration-700 group-hover:opacity-30" style={{ background: a.c }} />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: a.c }}>{a.tag}</span>
            <h3 className="mt-3 text-2xl font-semibold">{a.t}</h3>
            <p className="mt-3 leading-relaxed text-mist"><Rich>{a.b}</Rich></p>
          </article>
        ))}
      </div>

      <WhatIf
        question={t('você levar a ferramenta certa para o alvo errado? Na fibrose cística faltam três letras, e um editor de base só sabe trocar uma por outra: ele edita algo, sem corrigir nada.',
          'you bring the right tool to the wrong target? Cystic fibrosis is missing three letters, and a base editor only swaps one letter for another: it edits something without fixing anything.')}
        preset={{ disease: 'cftr', cas: 'abe' }}
      />
    </section>
  )
}
