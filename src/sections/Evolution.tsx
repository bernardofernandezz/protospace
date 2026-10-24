import { useRef, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import { useT, type L } from '../i18n'
import { Rich } from '../components/Term'

type Tool = {
  k: string
  name: string
  tag: string
  dsb: 'yes' | 'no' | 'pair'
  color: string
  year: string
  what: string
  pros: string[]
  cons: string[]
  target: string
  edits: string
}

const TOOLS: L<Tool[]> = {
  pt: [
    {
      k: 'cas9',
      name: 'Cas9 clássica',
      tag: 'DSB',
      dsb: 'yes',
      color: '#ff4fa3',
      year: '2012–2013',
      what: 'A versão original: corta as duas fitas do [[dna|DNA]] — uma [[dsb|quebra de fita dupla]] — e deixa o resto com a célula. O que acontece depois depende de como ela conserta o corte.',
      pros: ['Simples e versátil', 'Ótima para [[knockout|knockouts]]', 'Enorme base de dados e ferramentas'],
      cons: [
        'A quebra pode gerar [[indel|indels]] indesejados, grandes deleções e rearranjos',
        'Cortes [[offtarget|fora do alvo]]',
        'Exige um [[pam|PAM]] NGG',
      ],
      target: 'DNA',
      edits: 'Indels; inserções/correções via HDR',
    },
    {
      k: 'nick',
      name: 'Nickases',
      tag: 'nick',
      dsb: 'pair',
      color: '#ffb547',
      year: '2013',
      what: 'Uma das duas tesouras da proteína foi desativada, então ela corta só uma fita: é a [[nickase|nickase]]. Usando duas delas lado a lado, cada uma cortando uma fita, obtém-se o mesmo corte duplo — mas agora dois guias precisam acertar o alvo, o que reduz muito os erros de endereço.',
      pros: ['Par de nickases reduz os cortes [[offtarget|fora do alvo]]', 'Base de editores de bases e prime editing'],
      cons: ['Exige dois guias bem posicionados', 'Nick isolado edita pouco'],
      target: 'DNA',
      edits: 'Indels (em par); plataforma para outros editores',
    },
    {
      k: 'be',
      name: 'Base editing',
      tag: 'sem DSB',
      dsb: 'no',
      color: '#7dff9b',
      year: '2016–2017',
      what: 'Em vez de cortar, troca uma letra por outra. É uma [[nickase|Cas9 enfraquecida]] grudada a uma enzima que modifica quimicamente a base: C vira T, ou A vira G, numa pequena janela do alvo.',
      pros: ['Mutações pontuais sem [[dsb|quebra de fita dupla]]', 'Menos [[indel|indels]]', 'Funciona em células que não se dividem'],
      cons: ['Só certas transições', 'Edições “bystander” de bases vizinhas na janela', 'Desaminação off-target de DNA/RNA'],
      target: 'DNA',
      edits: 'Transições pontuais (C→T, A→G)',
    },
    {
      k: 'pe',
      name: 'Prime editing',
      tag: 'sem DSB',
      dsb: 'no',
      color: '#4cc9ff',
      year: '2019',
      what: 'Funciona como o “localizar e substituir” de um editor de texto. O próprio RNA guia carrega a versão corrigida, e uma enzima acoplada à Cas9 escreve essa correção direto no DNA, sem precisar partir a molécula nem fornecer molde à parte.',
      pros: ['Todas as 12 substituições de base', 'Pequenas inserções e deleções', 'Sem DSB nem molde doador separado'],
      cons: ['Eficiência variável por sítio', 'Construções grandes, difíceis de entregar', 'Design de pegRNA complexo'],
      target: 'DNA',
      edits: 'Substituições, pequenas inserções/deleções',
    },
    {
      k: 'cas12',
      name: 'Cas12 (Cpf1)',
      tag: 'DSB escalonado',
      dsb: 'yes',
      color: '#b98cff',
      year: '2015',
      what: 'Uma prima da Cas9. Exige uma marca [[pam|PAM]] diferente, rica em T, o que abre regiões do genoma onde a Cas9 não consegue atuar. O corte que ela faz é desencontrado, deixando pontas pegajosas em vez de retas.',
      pros: ['Amplia os sítios editáveis', 'Multiplexação a partir de um único transcrito', 'Atividade colateral útil em diagnóstico (DETECTR)'],
      cons: ['Eficiência variável em células humanas', 'PAM restrito a regiões ricas em T'],
      target: 'DNA',
      edits: 'Indels; diagnóstico',
    },
    {
      k: 'cas13',
      name: 'Cas13',
      tag: 'RNA',
      dsb: 'no',
      color: '#3ef0d0',
      year: '2016',
      what: 'Age sobre o [[rna|RNA]], não sobre o [[dna|DNA]]. Como não mexe no [[genoma|genoma]], o efeito é temporário e reversível. Ao encontrar o alvo, ela passa a cortar RNAs vizinhos também — um efeito “colateral” que foi aproveitado para criar testes de diagnóstico.',
      pros: ['Atua no RNA: efeitos reversíveis, sem alterar o genoma', 'Diagnóstico sensível de vírus de RNA'],
      cons: ['Atividade colateral pode afetar RNAs da célula', 'Efeito transitório exige reaplicação'],
      target: 'RNA',
      edits: 'Knockdown de RNA; detecção',
    },
  ],
  en: [
    {
      k: 'cas9',
      name: 'Classic Cas9',
      tag: 'DSB',
      dsb: 'yes',
      color: '#ff4fa3',
      year: '2012–2013',
      what: 'The original: it cuts both [[dna|DNA]] strands — a [[dsb|double-strand break]] — and leaves the rest to the cell. What happens next depends on how the cell repairs the cut.',
      pros: ['Simple and versatile', 'Great for [[knockout|knockouts]]', 'Huge body of data and tools'],
      cons: [
        'The break can cause unwanted [[indel|indels]], large deletions and rearrangements',
        '[[offtarget|Off-target]] cuts',
        'Requires an NGG [[pam|PAM]]',
      ],
      target: 'DNA',
      edits: 'Indels; insertions/corrections via HDR',
    },
    {
      k: 'nick',
      name: 'Nickases',
      tag: 'nick',
      dsb: 'pair',
      color: '#ffb547',
      year: '2013',
      what: 'One of the protein’s two scissors is disabled, so it cuts a single strand: this is a [[nickase|nickase]]. Using two of them side by side, each nicking one strand, gives the same double cut — but now two guides must hit the target, which greatly reduces addressing errors.',
      pros: ['Paired nickases reduce [[offtarget|off-target]] cuts', 'Foundation of base and prime editors'],
      cons: ['Needs two well-placed guides', 'A single nick edits poorly'],
      target: 'DNA',
      edits: 'Indels (in pairs); platform for other editors',
    },
    {
      k: 'be',
      name: 'Base editing',
      tag: 'no DSB',
      dsb: 'no',
      color: '#7dff9b',
      year: '2016–2017',
      what: 'Instead of cutting, it swaps one letter for another. It is a [[nickase|weakened Cas9]] fused to an enzyme that chemically modifies a base: C becomes T, or A becomes G, within a small window of the target.',
      pros: ['Point mutations without a [[dsb|double-strand break]]', 'Fewer [[indel|indels]]', 'Works in non-dividing cells'],
      cons: ['Only certain transitions', '“Bystander” edits of neighbouring bases in the window', 'Off-target DNA/RNA deamination'],
      target: 'DNA',
      edits: 'Point transitions (C→T, A→G)',
    },
    {
      k: 'pe',
      name: 'Prime editing',
      tag: 'no DSB',
      dsb: 'no',
      color: '#4cc9ff',
      year: '2019',
      what: 'Works like a word processor’s “find and replace”. The guide RNA itself carries the corrected version, and an enzyme fused to Cas9 writes that correction straight into the DNA, without breaking the molecule or supplying a separate template.',
      pros: ['All 12 base substitutions', 'Small insertions and deletions', 'No DSB and no separate donor template'],
      cons: ['Efficiency varies by site', 'Large constructs, hard to deliver', 'Complex pegRNA design'],
      target: 'DNA',
      edits: 'Substitutions, small insertions/deletions',
    },
    {
      k: 'cas12',
      name: 'Cas12 (Cpf1)',
      tag: 'staggered DSB',
      dsb: 'yes',
      color: '#b98cff',
      year: '2015',
      what: 'A cousin of Cas9. It needs a different, T-rich [[pam|PAM]], which opens genome regions Cas9 cannot reach. Its cut is staggered, leaving sticky ends instead of blunt ones.',
      pros: ['Expands the editable sites', 'Multiplexing from a single transcript', 'Collateral activity useful for diagnostics (DETECTR)'],
      cons: ['Variable efficiency in human cells', 'PAM restricted to T-rich regions'],
      target: 'DNA',
      edits: 'Indels; diagnostics',
    },
    {
      k: 'cas13',
      name: 'Cas13',
      tag: 'RNA',
      dsb: 'no',
      color: '#3ef0d0',
      year: '2016',
      what: 'Acts on [[rna|RNA]], not [[dna|DNA]]. Because it leaves the [[genoma|genome]] untouched, the effect is temporary and reversible. Once it finds its target it also starts cutting nearby RNAs — a “collateral” effect that has been harnessed to build diagnostic tests.',
      pros: ['Acts on RNA: reversible effects, genome unchanged', 'Sensitive diagnostics for RNA viruses'],
      cons: ['Collateral activity can hit cellular RNAs', 'Transient effect needs re-dosing'],
      target: 'RNA',
      edits: 'RNA knockdown; detection',
    },
  ],
}

export default function Evolution() {
  const tr = useT()
  const tools = tr.pick(TOOLS)
  const [sel, setSel] = useState(0)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const t = tools[sel]
  return (
    <section id="evolucao" className="section">
      <SectionHeader
        n="03"
        eyebrow={tr('Evolução da ferramenta', 'How the tool evolved')}
        title={
          tr.lang === 'en' ? (
            <>
              From scissors to <span className="text-gradient">pencil and eraser</span>.
            </>
          ) : (
            <>
              Da tesoura ao <span className="text-gradient">lápis e borracha</span>.
            </>
          )
        }
        lead={tr(
          'Cortar o DNA e torcer para a célula consertar do jeito certo é pouco controle. Por isso a Cas9 virou base para outras ferramentas: desligando suas tesouras e acoplando outras enzimas, surgiram versões que trocam uma letra ou reescrevem um trecho sem precisar partir a molécula.',
          'Cutting DNA and hoping the cell repairs it the right way is not much control. So Cas9 became the base for other tools: by disabling its scissors and attaching other enzymes, versions appeared that swap a single letter or rewrite a stretch without breaking the molecule.',
        )}
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]" data-reveal>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1" role="tablist" aria-label={tr('Ferramentas', 'Tools')}>
          {tools.map((x, i) => (
            <button
              key={x.k}
              ref={(el) => {
                tabs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`tool-tab-${x.k}`}
              aria-controls="tool-panel"
              aria-selected={sel === i}
              tabIndex={sel === i ? 0 : -1}
              onClick={() => setSel(i)}
              onKeyDown={(e) => {
                const d = ({ ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 } as Record<string, number>)[e.key]
                if (!d) return
                e.preventDefault()
                const n = (i + d + tools.length) % tools.length
                setSel(n)
                tabs.current[n]?.focus()
              }}
              className={`glass flex items-center justify-between rounded-2xl px-5 py-4 text-left transition ${sel === i ? 'ring-1' : 'opacity-70 hover:opacity-100'}`}
              style={{ ['--tw-ring-color' as string]: x.color }}
            >
              <span>
                <span className="block font-display text-lg font-semibold">{x.name}</span>
                <span className="font-mono text-xs text-mist">{x.year}</span>
              </span>
              <span className="rounded-full px-2 py-0.5 font-mono text-[10px] uppercase" style={{ background: x.color + '22', color: x.color }}>
                {x.tag}
              </span>
            </button>
          ))}
        </div>

        <div
          key={t.k}
          role="tabpanel"
          id="tool-panel"
          aria-labelledby={`tool-tab-${t.k}`}
          tabIndex={0}
          className="glass relative overflow-hidden rounded-3xl p-8 md:p-10"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ background: t.color, opacity: 0.18 }} />
          <h3 className="text-3xl font-semibold md:text-4xl" style={{ color: t.color }}>
            {t.name}
          </h3>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-white/90">
            <Rich>{t.what}</Rich>
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="hud-label">{tr('Vantagens', 'Strengths')}</h4>
              <ul className="mt-3 space-y-2">
                {t.pros.map((p) => (
                  <li key={p} className="flex gap-2 text-mist">
                    <span className="text-bio">+</span>
                    <span>
                      <Rich>{p}</Rich>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="hud-label">{tr('Limitações', 'Limitations')}</h4>
              <ul className="mt-3 space-y-2">
                {t.cons.map((p) => (
                  <li key={p} className="flex gap-2 text-mist">
                    <span className="text-cas">−</span>
                    <span>
                      <Rich>{p}</Rich>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="glass mt-10 overflow-x-auto rounded-3xl" data-reveal>
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">{tr('Comparação resumida das ferramentas', 'Quick comparison of the tools')}</caption>
          <thead className="text-mist">
            <tr className="border-b border-white/10">
              {(tr.lang === 'en'
                ? ['Tool', 'Target', 'Double-strand break?', 'Typical edits']
                : ['Ferramenta', 'Alvo', 'Quebra de fita dupla?', 'Edições típicas']
              ).map((h) => (
                <th key={h} scope="col" className="px-5 py-4 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tools.map((x, i) => (
              <tr
                key={x.k}
                onClick={() => setSel(i)}
                className={`cursor-pointer border-b border-white/5 transition hover:bg-white/5 ${sel === i ? 'bg-white/5' : ''}`}
              >
                <th scope="row" className="px-5 py-3 font-display font-semibold" style={{ color: x.color }}>
                  {x.name}
                </th>
                <td className="px-5 py-3 font-mono text-xs">{x.target}</td>
                <td className="px-5 py-3">
                  {x.dsb === 'yes' ? tr('Sim', 'Yes') : x.dsb === 'pair' ? tr('Não (nick); sim em par', 'No (nick); yes in pairs') : tr('Não', 'No')}
                </td>
                <td className="px-5 py-3 text-mist">{x.edits}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
