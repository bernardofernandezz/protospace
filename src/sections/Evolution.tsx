import { useState } from 'react'
import SectionHeader from '../components/SectionHeader'

const TOOLS = [
  {
    k: 'cas9', name: 'Cas9 clássica', tag: 'DSB', color: '#ff4fa3', year: '2012–2013',
    what: 'A versão original: corta as duas fitas do DNA e deixa o resto com a célula. O que acontece depois depende de como ela conserta o corte.',
    pros: ['Simples e versátil', 'Ótima para knockouts', 'Enorme base de dados e ferramentas'],
    cons: ['DSB pode gerar indels indesejados, grandes deleções e rearranjos', 'Off-targets', 'Requer PAM NGG'],
    target: 'DNA', edits: 'Indels; inserções/correções via HDR',
  },
  {
    k: 'nick', name: 'Nickases', tag: 'nick', color: '#ffb547', year: '2013',
    what: 'Uma das duas tesouras da proteína foi desativada, então ela corta só uma fita. Usando duas delas lado a lado, cada uma cortando uma fita, obtém-se o mesmo corte duplo — mas agora dois guias precisam acertar o alvo, o que reduz muito os erros de endereço.',
    pros: ['Par de nickases reduz off-target', 'Base de editores de bases e prime editing'],
    cons: ['Exige dois guias bem posicionados', 'Nick isolado edita pouco'],
    target: 'DNA', edits: 'Indels (em par); plataforma para outros editores',
  },
  {
    k: 'be', name: 'Base editing', tag: 'sem DSB', color: '#7dff9b', year: '2016–2017',
    what: 'Em vez de cortar, troca uma letra por outra. É a Cas9 enfraquecida grudada a uma enzima que modifica quimicamente a base: C vira T, ou A vira G, numa pequena janela do alvo.',
    pros: ['Mutações pontuais sem quebra de fita dupla', 'Menos indels', 'Funciona em células que não se dividem'],
    cons: ['Só certas transições', 'Edições “bystander” de bases vizinhas na janela', 'Desaminação off-target de DNA/RNA'],
    target: 'DNA', edits: 'Transições pontuais (C→T, A→G)',
  },
  {
    k: 'pe', name: 'Prime editing', tag: 'sem DSB', color: '#4cc9ff', year: '2019',
    what: 'Funciona como o “localizar e substituir” de um editor de texto. O próprio RNA guia carrega a versão corrigida, e uma enzima acoplada à Cas9 escreve essa correção direto no DNA, sem precisar partir a molécula nem fornecer molde à parte.',
    pros: ['Todas as 12 substituições de base', 'Pequenas inserções e deleções', 'Sem DSB nem molde doador separado'],
    cons: ['Eficiência variável por sítio', 'Construções grandes, difíceis de entregar', 'Design de pegRNA complexo'],
    target: 'DNA', edits: 'Substituições, pequenas inserções/deleções',
  },
  {
    k: 'cas12', name: 'Cas12 (Cpf1)', tag: 'DSB escalonado', color: '#b98cff', year: '2015',
    what: 'Uma prima da Cas9. Exige uma marca PAM diferente, rica em T, o que abre regiões do genoma onde a Cas9 não consegue atuar. O corte que ela faz é desencontrado, deixando pontas pegajosas em vez de retas.',
    pros: ['Amplia os sítios editáveis', 'Multiplexação a partir de um único transcrito', 'Atividade colateral útil em diagnóstico (DETECTR)'],
    cons: ['Eficiência variável em células humanas', 'PAM restrito a regiões ricas em T'],
    target: 'DNA', edits: 'Indels; diagnóstico',
  },
  {
    k: 'cas13', name: 'Cas13', tag: 'RNA', color: '#3ef0d0', year: '2016',
    what: 'Age sobre o RNA, não sobre o DNA. Como não mexe no genoma, o efeito é temporário e reversível. Ao encontrar o alvo, ela passa a cortar RNAs vizinhos também — um efeito “colateral” que foi aproveitado para criar testes de diagnóstico.',
    pros: ['Atua no RNA: efeitos reversíveis, sem alterar o genoma', 'Diagnóstico sensível de vírus de RNA'],
    cons: ['Atividade colateral pode afetar RNAs da célula', 'Efeito transitório exige reaplicação'],
    target: 'RNA', edits: 'Knockdown de RNA; detecção',
  },
]

export default function Evolution() {
  const [sel, setSel] = useState(0)
  const t = TOOLS[sel]
  return (
    <section id="evolucao" className="section">
      <SectionHeader n="03" eyebrow="Evolução da ferramenta" title={<>Da tesoura ao <span className="text-gradient">lápis e borracha</span>.</>}
        lead="Cortar o DNA e torcer para a célula consertar do jeito certo é pouco controle. Por isso a Cas9 virou base para outras ferramentas: desligando suas tesouras e acoplando outras enzimas, surgiram versões que trocam uma letra ou reescrevem um trecho sem precisar partir a molécula." />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]" data-reveal>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1" role="tablist" aria-label="Ferramentas">
          {TOOLS.map((x, i) => (
            <button key={x.k} type="button" role="tab" aria-selected={sel === i} onClick={() => setSel(i)}
              className={`glass flex items-center justify-between rounded-2xl px-5 py-4 text-left transition ${sel === i ? 'ring-1' : 'opacity-70 hover:opacity-100'}`}
              style={{ ['--tw-ring-color' as string]: x.color }}>
              <span><span className="block font-display text-lg font-semibold">{x.name}</span><span className="font-mono text-xs text-mist">{x.year}</span></span>
              <span className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase" style={{ background: x.color + '22', color: x.color }}>{x.tag}</span>
            </button>
          ))}
        </div>

        <article key={t.k} role="tabpanel" className="glass relative overflow-hidden rounded-3xl p-8 md:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ background: t.color, opacity: 0.18 }} />
          <h3 className="text-3xl font-semibold md:text-4xl" style={{ color: t.color }}>{t.name}</h3>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/90">{t.what}</p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="hud-label">Vantagens</h4>
              <ul className="mt-3 space-y-2">{t.pros.map((p) => <li key={p} className="flex gap-2 text-mist"><span className="text-bio">+</span>{p}</li>)}</ul>
            </div>
            <div>
              <h4 className="hud-label">Limitações</h4>
              <ul className="mt-3 space-y-2">{t.cons.map((p) => <li key={p} className="flex gap-2 text-mist"><span className="text-cas">−</span>{p}</li>)}</ul>
            </div>
          </div>
        </article>
      </div>

      <div className="glass mt-10 overflow-x-auto rounded-3xl" data-reveal>
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">Comparação resumida das ferramentas</caption>
          <thead className="text-mist">
            <tr className="border-b border-white/10">
              {['Ferramenta', 'Alvo', 'Quebra de fita dupla?', 'Edições típicas'].map((h) => <th key={h} scope="col" className="px-5 py-4 font-medium">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {TOOLS.map((x, i) => (
              <tr key={x.k} onClick={() => setSel(i)} className={`cursor-pointer border-b border-white/5 transition hover:bg-white/5 ${sel === i ? 'bg-white/5' : ''}`}>
                <th scope="row" className="px-5 py-3 font-display font-semibold" style={{ color: x.color }}>{x.name}</th>
                <td className="px-5 py-3 font-mono text-xs">{x.target}</td>
                <td className="px-5 py-3">{x.tag === 'DSB' || x.tag === 'DSB escalonado' ? 'Sim' : x.tag === 'nick' ? 'Não (nick); sim em par' : 'Não'}</td>
                <td className="px-5 py-3 text-mist">{x.edits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
