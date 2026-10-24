import { useEffect, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import { useT, type L } from '../i18n'
import { Rich } from '../components/Term'
import { plain } from '../content/glossary'

type Group = { k: string; title: string; color: string; items: [string, string][] }

const GROUPS: L<Group[]> = {
  pt: [
    {
      k: 'design', title: 'Design do sgRNA', color: '#3ef0d0', items: [
        ['Definir o objetivo antes do guia', 'Para desligar o gene ([[knockout|knockout]]): cortar em [[exon|éxons]] iniciais ou em domínios essenciais comuns a todas as versões da proteína — assim o estrago atinge qualquer uma delas. Para corrigir ou inserir algo: cortar o mais perto possível do ponto a editar, porque a cópia do molde perde precisão com a distância.'],
        ['Usar ferramentas de predição', 'Programas como CRISPOR, CHOPCHOP, Benchling e Cas-OFFinder estimam a eficiência do guia e varrem o [[genoma|genoma]] inteiro atrás de trechos parecidos, os candidatos a [[offtarget|corte fora do alvo]]. Os escores ajudam a ordenar candidatos, mas são previsões: servem para escolher o que testar, não para dispensar o teste.'],
        ['Testar 2–3 guias por alvo', 'A eficiência real varia muito entre guias com escores parecidos.'],
        ['Conferir a sequência na sua linhagem/organismo', 'Duas pessoas (ou duas linhagens de células) não têm DNA idêntico. Uma única letra diferente no alvo pode anular o pareamento do guia ou destruir o [[pam|PAM]] — e aí nada acontece.'],
        ['Evitar quatro T seguidos no guia', 'Quando o guia é produzido dentro da célula a partir de um [[plasmideo|plasmídeo]], uma sequência de 4 ou mais T funciona como sinal de parada e interrompe a produção do [[rna|RNA]] no meio.'],
      ],
    },
    {
      k: 'delivery', title: 'Cas e método de entrega', color: '#ff4fa3', items: [
        ['Escolher a Cas pelo PAM e pela fidelidade', 'Cada Cas exige uma marca diferente, e isso decide onde dá para cortar: SpCas9 ([[pam|PAM]] NGG), SaCas9 (NNGRRT), Cas12a (TTTV). Variantes de alta fidelidade (SpCas9-HF1, eSpCas9, HypaCas9) reduzem os cortes [[offtarget|fora do alvo]].'],
        ['Preferir RNP quando possível', 'Entregar a proteína e o guia já montados ([[rnp|RNP]]) faz a edição acontecer logo e acabar logo: menos tempo ativo significa menos cortes [[offtarget|fora do alvo]], e não entra [[dna|DNA]] estranho que possa se integrar ao [[genoma|genoma]].'],
        ['Conhecer os limites de plasmídeos', 'O [[plasmideo|plasmídeo]] é barato e prático, mas a célula fica produzindo a enzima por dias: quanto mais tempo ativa, mais cortes [[offtarget|fora do alvo]]. E o próprio plasmídeo pode se integrar ao genoma num ponto qualquer.'],
        ['Conhecer os limites de vetores virais', 'Um [[vetorviral|vetor viral]] entrega bem, mas cada tipo cobra um preço: o AAV só carrega ~4,7 mil letras (a SpCas9 sozinha quase não cabe); o lentivírus se integra ao genoma de vez; e o sistema imune do paciente pode reagir ao vírus.'],
      ],
    },
    {
      k: 'controls', title: 'Controles', color: '#ffb547', items: [
        ['Controle negativo', 'Guia não direcionado (non-targeting) e células apenas tratadas com o veículo (mock).'],
        ['Controle positivo', 'Guia já validado para um locus conhecido, confirmando que entrega e enzima funcionam.'],
        ['Controle de entrega', 'Repórter (ex.: GFP) para estimar a eficiência de transfecção/transdução.'],
        ['Guias independentes', 'Se dois guias diferentes para o mesmo [[gene|gene]] produzem o mesmo resultado, é pouco provável que o efeito venha de um corte [[offtarget|fora do alvo]] — que seria diferente para cada guia.'],
      ],
    },
    {
      k: 'offtarget', title: 'Análise de off-targets', color: '#b98cff', items: [
        ['Predição in silico dos sítios mais prováveis', 'Liste os trechos do genoma que diferem do guia em poucas letras ([[mismatch|mismatches]]), sobretudo quando as diferenças ficam longe do PAM — fora da região [[seed|seed]], elas atrapalham menos e o corte continua possível.'],
        ['Métodos empíricos quando o risco importa', 'Ex.: GUIDE-seq, CIRCLE-seq, DISCOVER-seq identificam cortes sem depender só da predição.'],
        ['Sequenciar os sítios candidatos', '[[sequenciamento|Sequenciar]] fundo, muitas vezes, justamente os trechos suspeitos: é o único jeito de flagrar edições raras que uma leitura superficial não mostra.'],
        ['Procurar também alterações grandes', 'Além de ganhar ou perder poucas letras, a [[dsb|quebra de fita dupla]] pode causar perdas extensas e embaralhar pedaços do cromossomo. O teste de rotina não enxerga esses casos: ele lê apenas o que sobrou, e o que sobrou parece normal.'],
      ],
    },
    {
      k: 'validation', title: 'Validação da edição', color: '#7dff9b', items: [
        ['Genotipar por sequenciamento', '[[sequenciamento|Ler as letras]] da região editada e medir quanto de cada versão existe na amostra: Sanger com decomposição (TIDE, ICE) para uma estimativa rápida, ou leitura massiva (CRISPResso2) quando o número precisa ser confiável.'],
        ['Ensaios de clivagem como triagem', 'Testes como T7E1 e Surveyor dizem se houve alguma edição, mas não dizem qual nem quanto. Servem para uma triagem rápida e barata, nunca como resultado final.'],
        ['Confirmar na proteína, não só no DNA', 'Um [[frameshift|frameshift]] nem sempre elimina a [[proteina|proteína]]: a célula pode começar a leitura depois do ponto alterado, ou pular o trecho estragado e seguir em frente. Confirme que a proteína sumiu mesmo (western blot, imunofluorescência) ou que a função se perdeu.'],
        ['Lembrar que a população é mista', 'Nem toda célula é editada, e as que são nem sempre do mesmo jeito. O que se mede é uma média. Quando o experimento exige uniformidade, isole clones e genotipe um a um.'],
      ],
    },
    {
      k: 'biosafety', title: 'Biossegurança', color: '#ff7a59', items: [
        ['Avaliar risco e nível de biossegurança', 'Os laboratórios são classificados do NB-1 (risco mínimo) ao NB-4 (agentes letais sem tratamento), e cada nível exige estrutura e procedimentos próprios. Trabalho com [[vetorviral|vetores virais]] costuma exigir NB-2 ou superior.'],
        ['Cumprir a regulação institucional', 'No Brasil, trabalho com OGM requer CIBio e Certificado de Qualidade em Biossegurança (CQB) da CTNBio.'],
        ['Descarte adequado', 'Inativação (ex.: autoclavagem) de resíduos biológicos e OGM conforme normas institucionais.'],
        ['Registro rigoroso', 'Caderno de laboratório com lotes, sequências, condições e desvios.'],
      ],
    },
    {
      k: 'reporting', title: 'Reprodutibilidade e relato', color: '#4cc9ff', items: [
        ['Relatar sequências e condições completas', 'Guias, Cas, entrega, doses, linhagem, passagem, tempos de coleta.'],
        ['Compartilhar dados e materiais', 'Dados brutos de sequenciamento em repositórios públicos; plasmídeos em repositórios como o Addgene.'],
        ['Reportar eficiência e off-targets — inclusive negativos', 'Resultados nulos e limitações evitam viés de publicação.'],
        ['Seguir diretrizes de relato', 'Ex.: ARRIVE para experimentos com animais.'],
      ],
    },
  ],
  en: [
    {
      k: 'design', title: 'sgRNA design', color: '#3ef0d0', items: [
        ['Define the goal before the guide', 'To switch the gene off (a [[knockout|knockout]]): cut in early [[exon|exons]] or in essential domains shared by every version of the protein — that way the damage hits all of them. To correct or insert something: cut as close as possible to the spot being edited, because copying from the template loses accuracy with distance.'],
        ['Use prediction tools', 'Programs such as CRISPOR, CHOPCHOP, Benchling and Cas-OFFinder estimate guide efficiency and sweep the whole [[genoma|genome]] for look-alike stretches, the candidates for an [[offtarget|off-target cut]]. Scores help rank candidates, but they are predictions: use them to choose what to test, not to skip testing.'],
        ['Test 2–3 guides per target', 'Real efficiency varies a lot between guides with similar scores.'],
        ['Check the sequence in your cell line/organism', 'No two people (or two cell lines) have identical DNA. A single different letter in the target can abolish the guide’s pairing or destroy the [[pam|PAM]] — and then nothing happens.'],
        ['Avoid four Ts in a row in the guide', 'When the guide is made inside the cell from a [[plasmideo|plasmid]], a run of 4 or more Ts acts as a stop signal and cuts [[rna|RNA]] production short.'],
      ],
    },
    {
      k: 'delivery', title: 'Cas choice and delivery', color: '#ff4fa3', items: [
        ['Choose the Cas by PAM and fidelity', 'Each Cas demands a different mark, and that decides where you can cut at all: SpCas9 (NGG [[pam|PAM]]), SaCas9 (NNGRRT), Cas12a (TTTV). High-fidelity variants (SpCas9-HF1, eSpCas9, HypaCas9) reduce [[offtarget|off-target]] cuts.'],
        ['Prefer RNP when possible', 'Delivering protein and guide pre-assembled (an [[rnp|RNP]]) makes editing start fast and end fast: less active time means fewer [[offtarget|off-target]] cuts, and no foreign [[dna|DNA]] goes in that could integrate into the [[genoma|genome]].'],
        ['Know the limits of plasmids', 'A [[plasmideo|plasmid]] is cheap and practical, but the cell keeps making the enzyme for days: the longer it is active, the more [[offtarget|off-target]] cuts. And the plasmid itself can integrate into the genome at any random spot.'],
        ['Know the limits of viral vectors', 'A [[vetorviral|viral vector]] delivers well, but each type charges a price: AAV carries only ~4,700 letters (SpCas9 alone barely fits); lentivirus integrates into the genome for good; and the patient’s immune system may react to the virus.'],
      ],
    },
    {
      k: 'controls', title: 'Controls', color: '#ffb547', items: [
        ['Negative control', 'Non-targeting guide and vehicle-only (mock) treated cells.'],
        ['Positive control', 'A guide already validated at a known locus, confirming that delivery and enzyme work.'],
        ['Delivery control', 'A reporter (e.g. GFP) to estimate transfection/transduction efficiency.'],
        ['Independent guides', 'If two different guides for the same [[gene|gene]] give the same result, the effect is unlikely to come from an [[offtarget|off-target]] cut — which would differ for each guide.'],
      ],
    },
    {
      k: 'offtarget', title: 'Off-target analysis', color: '#b98cff', items: [
        ['In silico prediction of the likeliest sites', 'List the genome stretches that differ from the guide by only a few letters ([[mismatch|mismatches]]), especially when those differences sit far from the PAM — outside the [[seed|seed]] region they matter less, so a cut is still possible.'],
        ['Empirical methods when risk matters', 'E.g. GUIDE-seq, CIRCLE-seq and DISCOVER-seq find cuts without relying on prediction alone.'],
        ['Sequence the candidate sites', '[[sequenciamento|Sequence]] the suspect stretches deeply, many times over: it is the only way to catch rare edits that a shallow read would miss.'],
        ['Look for large changes too', 'Besides gaining or losing a few letters, a [[dsb|double-strand break]] can cause large deletions and shuffle pieces of the chromosome. The routine test cannot see these cases: it only reads what is left, and what is left looks normal.'],
      ],
    },
    {
      k: 'validation', title: 'Validating the edit', color: '#7dff9b', items: [
        ['Genotype by sequencing', '[[sequenciamento|Read the letters]] of the edited region and measure how much of each version is in the sample: Sanger with decomposition (TIDE, ICE) for a quick estimate, or massive parallel reading (CRISPResso2) when the number has to be reliable.'],
        ['Cleavage assays as a screen', 'Assays such as T7E1 and Surveyor tell you whether any editing happened, but not which edit or how much. They are a quick, cheap screen, never the final answer.'],
        ['Confirm at the protein level, not just DNA', 'A [[frameshift|frameshift]] does not always remove the [[proteina|protein]]: the cell may start reading after the altered spot, or skip the damaged stretch and carry on. Confirm that the protein is really gone (western blot, immunofluorescence) or that the function is lost.'],
        ['Remember the population is mixed', 'Not every cell is edited, and those that are are not all edited the same way. What you measure is an average. When the experiment needs uniformity, isolate clones and genotype them one by one.'],
      ],
    },
    {
      k: 'biosafety', title: 'Biosafety', color: '#ff7a59', items: [
        ['Assess risk and biosafety level', 'Labs are graded from BSL-1 (minimal risk) to BSL-4 (lethal agents with no treatment), and each level demands its own facilities and procedures. Work with [[vetorviral|viral vectors]] usually needs BSL-2 or higher.'],
        ['Follow institutional regulation', 'In Brazil, work with GMOs requires an Internal Biosafety Committee (CIBio) and a Biosafety Quality Certificate (CQB) from CTNBio.'],
        ['Proper disposal', 'Inactivate (e.g. autoclave) biological and GMO waste according to institutional rules.'],
        ['Rigorous records', 'Lab notebook with batches, sequences, conditions and deviations.'],
      ],
    },
    {
      k: 'reporting', title: 'Reproducibility and reporting', color: '#4cc9ff', items: [
        ['Report full sequences and conditions', 'Guides, Cas, delivery, doses, cell line, passage, harvest times.'],
        ['Share data and materials', 'Raw sequencing data in public repositories; plasmids in repositories such as Addgene.'],
        ['Report efficiency and off-targets — including negatives', 'Null results and limitations prevent publication bias.'],
        ['Follow reporting guidelines', 'E.g. ARRIVE for animal experiments.'],
      ],
    },
  ],
}

const KEY = 'crispr-checklist-v2'
const load = (): Record<string, boolean> => { try { return JSON.parse(localStorage.getItem(KEY) ?? '{}') } catch { return {} } }

export default function Practices() {
  const t = useT()
  const groups = t.pick(GROUPS)
  const [done, setDone] = useState<Record<string, boolean>>(load)
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(done)) } catch { /* armazenamento indisponível */ } }, [done])
  const total = groups.reduce((a, g) => a + g.items.length, 0)
  const count = Object.values(done).filter(Boolean).length
  const R = 52, C = 2 * Math.PI * R

  return (
    <section id="boas-praticas" className="section">
      <SectionHeader n="06" eyebrow={t('Boas práticas', 'Best practices')}
        title={t.lang === 'en' ? <>A CRISPR experiment is only as good <span className="text-gradient">as its controls</span>.</> : <>Um experimento CRISPR é tão bom <span className="text-gradient">quanto seus controles</span>.</>}
        lead={t('A parte da técnica que não aparece nas manchetes: desenhar o guia, escolher a entrega, montar os controles e provar que a edição é real. Esta é a seção mais técnica do site — é um checklist de bancada, e cada item abre com a explicação do porquê. Se você chegou agora no assunto, leia só os títulos: eles já contam por que editar um gene dá tanto trabalho. O progresso fica salvo neste navegador.',
          'The part of the technique that never makes headlines: designing the guide, choosing delivery, setting up controls and proving the edit is real. This is the most technical section of the site — a bench checklist, where each item opens with the reasoning behind it. New to the subject? Just read the headings: they already explain why editing a gene is so much work. Progress is saved in this browser.')} />

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start" data-reveal>
          <div className="glass flex items-center gap-5 rounded-3xl p-6 lg:flex-col lg:text-center">
            <svg viewBox="0 0 120 120" className="h-28 w-28 shrink-0 -rotate-90" role="img" aria-label={t(`${count} de ${total} itens concluídos`, `${count} of ${total} items done`)}>
              <circle cx="60" cy="60" r={R} stroke="rgba(255,255,255,.08)" strokeWidth="10" fill="none" />
              <circle cx="60" cy="60" r={R} stroke="url(#g)" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - count / total)} style={{ transition: 'stroke-dashoffset .6s' }} />
              <defs><linearGradient id="g"><stop stopColor="#3ef0d0" /><stop offset="1" stopColor="#ff4fa3" /></linearGradient></defs>
            </svg>
            <div>
              <p className="font-display text-4xl font-semibold">{count}<span className="text-lg text-mist">/{total}</span></p>
              <p className="text-sm text-mist">{t('itens cobertos', 'items covered')}</p>
              <button type="button" onClick={() => setDone({})} className="mt-2 text-xs text-mist underline hover:text-white">{t('limpar', 'clear')}</button>
            </div>
          </div>
        </aside>

        <div className="grid gap-6 md:grid-cols-2">
          {groups.map((g) => (
            <fieldset key={g.k} className="glass rounded-3xl p-6" data-reveal>
              <legend className="sr-only">{g.title}</legend>
              <h3 className="flex items-center gap-2 text-xl font-semibold"><span className="h-2.5 w-2.5 rounded-full" style={{ background: g.color }} />{g.title}</h3>
              <ul className="mt-4 space-y-2">
                {g.items.map(([item, why], ii) => {
                  // id estável (independe do idioma)
                  const id = `${g.k}:${ii}`
                  return (
                    <li key={id} className="flex items-start gap-3 rounded-xl px-2 py-1.5 transition hover:bg-white/5">
                      <input type="checkbox" checked={!!done[id]} onChange={(e) => setDone({ ...done, [id]: e.target.checked })}
                        aria-label={plain(item)} className="mt-1 h-4 w-4 shrink-0 accent-[#3ef0d0]" />
                      <details className="group flex-1">
                        <summary className="flex cursor-pointer list-none items-start gap-3">
                          <span className={`flex-1 ${done[id] ? 'text-mist line-through decoration-dna/60' : ''}`}>{plain(item)}</span>
                          <span className="text-mist transition group-open:rotate-45" aria-hidden="true">+</span>
                        </summary>
                        <p className="mt-2 text-sm leading-relaxed text-mist"><Rich>{why}</Rich></p>
                      </details>
                    </li>
                  )
                })}
              </ul>
            </fieldset>
          ))}
        </div>
      </div>
    </section>
  )
}
