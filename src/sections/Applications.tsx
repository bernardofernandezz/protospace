import SectionHeader from '../components/SectionHeader'

const APPS = [
  {
    t: 'Terapia somática — doenças genéticas', c: '#ff4fa3', span: 'md:col-span-2',
    b: 'No Casgevy, as células da medula do próprio paciente são retiradas, editadas em laboratório e devolvidas. A edição religa a produção da hemoglobina fetal, aquela que usamos antes de nascer, e ela compensa a hemoglobina defeituosa. Não é um procedimento simples: antes da devolução, o paciente passa por quimioterapia para abrir espaço na medula. Já existem também abordagens que editam células dentro do corpo, ainda em fase de testes clínicos.',
    tag: 'ex vivo · in vivo',
  },
  {
    t: 'Oncologia', c: '#ffb547',
    b: 'Células de defesa do paciente são editadas para enxergar melhor o tumor, ou para que células de um doador possam ser usadas em várias pessoas. Em pesquisa, desligar genes um a um revela de quais deles o tumor depende para sobreviver.',
    tag: 'imunoterapia',
  },
  {
    t: 'Agricultura', c: '#7dff9b',
    b: 'Como a edição pode produzir uma planta sem DNA de outra espécie, o resultado se aproxima do que o melhoramento tradicional faria — só que em menos tempo. Isso mudou a forma como alguns países avaliam esses alimentos. Exemplos já descritos: um tomate com mais GABA e um cogumelo que escurece menos.',
    tag: 'melhoramento de precisão',
  },
  {
    t: 'Diagnóstico', c: '#3ef0d0',
    b: 'Aproveita o efeito colateral da Cas12 e da Cas13: ao encontrar o material genético do vírus procurado, elas passam a cortar moléculas vizinhas que foram preparadas para emitir sinal. Um alvo encontrado vira muitos sinais, e o teste fica sensível e rápido.',
    tag: 'Cas12 · Cas13',
  },
  {
    t: 'Pesquisa básica', c: '#4cc9ff',
    b: 'Talvez o uso mais comum, e o menos comentado fora da área. Com milhares de guias diferentes é possível testar o papel de cada gene ao mesmo tempo. Versões sem tesoura ainda permitem desligar ou ligar o volume de um gene sem tocar na sequência.',
    tag: 'telas · dCas9',
  },
  {
    t: 'Organismos modelo', c: '#b98cff', span: 'md:col-span-2',
    b: 'Criar um camundongo com uma mutação específica levava meses ou anos. Com CRISPR, leva semanas, e dá para alterar vários genes de uma vez. Isso acelerou o estudo de doenças genéticas em animais e em organoides.',
    tag: 'modelos de doença',
  },
]

export default function Applications() {
  return (
    <section id="aplicacoes" className="section">
      <SectionHeader n="06" eyebrow="Aplicações" title={<>Da bancada <span className="text-gradient">à clínica</span> — e ao campo.</>}
        lead="Uma distinção que vale repetir em sala: parte do que está aqui já é tratamento aprovado, parte ainda está em testes clínicos e parte é ferramenta de pesquisa. Misturar os três é a forma mais fácil de exagerar o que a técnica faz hoje." />
      <div className="grid gap-5 md:grid-cols-3">
        {APPS.map((a) => (
          <article key={a.t} className={`glass group relative overflow-hidden rounded-3xl p-7 transition duration-500 hover:-translate-y-1 ${a.span ?? ''}`} data-reveal>
            <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full opacity-0 blur-3xl transition duration-700 group-hover:opacity-30" style={{ background: a.c }} />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: a.c }}>{a.tag}</span>
            <h3 className="mt-3 text-2xl font-semibold">{a.t}</h3>
            <p className="mt-3 leading-relaxed text-mist">{a.b}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
