import { useEffect, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import { useT, type L } from '../i18n'

type Group = { k: string; title: string; color: string; items: [string, string][] }

const GROUPS: L<Group[]> = {
  pt: [
    {
      k: 'design', title: 'Design do sgRNA', color: '#3ef0d0', items: [
        ['Definir o objetivo antes do guia', 'Knockout: cortar em éxons iniciais ou em domínios essenciais comuns às isoformas. Knock-in/correção: cortar o mais perto possível do sítio a editar.'],
        ['Usar ferramentas de predição', 'CRISPOR, CHOPCHOP, Benchling e Cas-OFFinder estimam a eficiência do guia e listam os sítios parecidos no genoma. Os escores ajudam a ordenar candidatos, mas são previsões: servem para escolher o que testar, não para dispensar o teste.'],
        ['Testar 2–3 guias por alvo', 'A eficiência real varia muito entre guias com escores parecidos.'],
        ['Conferir a sequência na sua linhagem/organismo', 'SNPs e variantes no sítio podem anular o pareamento ou o PAM.'],
        ['Evitar quatro T seguidos no guia', 'Quando o guia é produzido dentro da célula a partir de um plasmídeo, uma sequência de 4 ou mais T funciona como sinal de parada e interrompe a produção do RNA.'],
      ],
    },
    {
      k: 'delivery', title: 'Cas e método de entrega', color: '#ff4fa3', items: [
        ['Escolher a Cas pelo PAM e pela fidelidade', 'SpCas9 (NGG), SaCas9 (NNGRRT), Cas12a (TTTV); variantes de alta fidelidade (ex.: SpCas9-HF1, eSpCas9, HypaCas9) reduzem off-target.'],
        ['Preferir RNP quando possível', 'Entregar a proteína e o guia já montados faz a edição acontecer logo e acabar logo: menos tempo ativo significa menos cortes fora do alvo, e não há DNA estranho que possa se integrar ao genoma.'],
        ['Conhecer os limites de plasmídeos', 'Baratos e práticos, mas expressão prolongada aumenta off-target e há risco de integração aleatória.'],
        ['Conhecer os limites de vetores virais', 'AAV tem carga limitada (~4,7 kb); lentivírus integra no genoma; imunogenicidade e expressão persistente pesam no desenho.'],
      ],
    },
    {
      k: 'controls', title: 'Controles', color: '#ffb547', items: [
        ['Controle negativo', 'Guia não direcionado (non-targeting) e células apenas tratadas com o veículo (mock).'],
        ['Controle positivo', 'Guia já validado para um locus conhecido, confirmando que entrega e enzima funcionam.'],
        ['Controle de entrega', 'Repórter (ex.: GFP) para estimar a eficiência de transfecção/transdução.'],
        ['Guias independentes', 'Se dois guias diferentes para o mesmo gene produzem o mesmo resultado, é pouco provável que o efeito venha de um corte fora do alvo — que seria diferente para cada guia.'],
      ],
    },
    {
      k: 'offtarget', title: 'Análise de off-targets', color: '#b98cff', items: [
        ['Predição in silico dos sítios mais prováveis', 'Liste os sítios com poucos mismatches, sobretudo fora da região seed.'],
        ['Métodos empíricos quando o risco importa', 'Ex.: GUIDE-seq, CIRCLE-seq, DISCOVER-seq identificam cortes sem depender só da predição.'],
        ['Sequenciar os sítios candidatos', 'Amplicon-seq profundo nos top sítios preditos/detectados.'],
        ['Procurar também alterações grandes', 'Além de ganhar ou perder poucas letras, o corte pode causar perdas extensas e rearranjos no cromossomo. Um PCR curto não enxerga esses eventos: ele amplifica normalmente o que sobrou.'],
      ],
    },
    {
      k: 'validation', title: 'Validação da edição', color: '#7dff9b', items: [
        ['Genotipar por sequenciamento', 'Sanger + decomposição (TIDE, ICE) ou amplicon NGS (ex.: CRISPResso2) para quantificar alelos.'],
        ['Ensaios de clivagem como triagem', 'T7E1/Surveyor detectam heterodúplex; são semiquantitativos e não substituem o sequenciamento.'],
        ['Confirmar na proteína, não só no DNA', 'Uma leitura embaralhada nem sempre elimina a proteína: a célula pode começar a tradução depois do ponto alterado ou pular o trecho. Confirme por western blot, imunofluorescência ou por um ensaio funcional.'],
        ['Lembrar que a população é mista', 'Nem toda célula é editada, e as que são nem sempre do mesmo jeito. O que se mede é uma média. Quando o experimento exige uniformidade, isole clones e genotipe um a um.'],
      ],
    },
    {
      k: 'biosafety', title: 'Biossegurança', color: '#ff7a59', items: [
        ['Avaliar risco e nível de biossegurança', 'NB-1 a NB-4 conforme agente e procedimento; vetores virais costumam exigir NB-2 ou superior.'],
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
        ['Define the goal before the guide', 'Knockout: cut in early exons or in essential domains shared by all isoforms. Knock-in/correction: cut as close as possible to the site to be edited.'],
        ['Use prediction tools', 'CRISPOR, CHOPCHOP, Benchling and Cas-OFFinder estimate guide efficiency and list similar sites across the genome. Scores help rank candidates, but they are predictions: use them to choose what to test, not to skip testing.'],
        ['Test 2–3 guides per target', 'Real efficiency varies a lot between guides with similar scores.'],
        ['Check the sequence in your cell line/organism', 'SNPs and variants at the site can abolish pairing or the PAM.'],
        ['Avoid four Ts in a row in the guide', 'When the guide is expressed in the cell from a plasmid, a run of 4 or more Ts acts as a stop signal and terminates RNA production.'],
      ],
    },
    {
      k: 'delivery', title: 'Cas choice and delivery', color: '#ff4fa3', items: [
        ['Choose the Cas by PAM and fidelity', 'SpCas9 (NGG), SaCas9 (NNGRRT), Cas12a (TTTV); high-fidelity variants (e.g. SpCas9-HF1, eSpCas9, HypaCas9) reduce off-targets.'],
        ['Prefer RNP when possible', 'Delivering pre-assembled protein and guide makes editing start fast and end fast: less active time means fewer off-target cuts, and there is no foreign DNA that could integrate into the genome.'],
        ['Know the limits of plasmids', 'Cheap and practical, but prolonged expression raises off-target activity and there is a risk of random integration.'],
        ['Know the limits of viral vectors', 'AAV has limited cargo (~4.7 kb); lentivirus integrates into the genome; immunogenicity and persistent expression weigh on the design.'],
      ],
    },
    {
      k: 'controls', title: 'Controls', color: '#ffb547', items: [
        ['Negative control', 'Non-targeting guide and vehicle-only (mock) treated cells.'],
        ['Positive control', 'A guide already validated at a known locus, confirming that delivery and enzyme work.'],
        ['Delivery control', 'A reporter (e.g. GFP) to estimate transfection/transduction efficiency.'],
        ['Independent guides', 'If two different guides for the same gene give the same result, the effect is unlikely to come from an off-target cut — which would differ for each guide.'],
      ],
    },
    {
      k: 'offtarget', title: 'Off-target analysis', color: '#b98cff', items: [
        ['In silico prediction of the likeliest sites', 'List sites with few mismatches, especially outside the seed region.'],
        ['Empirical methods when risk matters', 'E.g. GUIDE-seq, CIRCLE-seq and DISCOVER-seq find cuts without relying on prediction alone.'],
        ['Sequence the candidate sites', 'Deep amplicon-seq at the top predicted/detected sites.'],
        ['Look for large changes too', 'Besides gaining or losing a few letters, a cut can cause large deletions and chromosomal rearrangements. A short PCR cannot see these events: it happily amplifies whatever is left.'],
      ],
    },
    {
      k: 'validation', title: 'Validating the edit', color: '#7dff9b', items: [
        ['Genotype by sequencing', 'Sanger + decomposition (TIDE, ICE) or amplicon NGS (e.g. CRISPResso2) to quantify alleles.'],
        ['Cleavage assays as a screen', 'T7E1/Surveyor detect heteroduplexes; they are semi-quantitative and do not replace sequencing.'],
        ['Confirm at the protein level, not just DNA', 'A scrambled reading frame does not always remove the protein: the cell may start translation after the altered spot or skip the stretch. Confirm by western blot, immunofluorescence or a functional assay.'],
        ['Remember the population is mixed', 'Not every cell is edited, and those that are are not all edited the same way. What you measure is an average. When the experiment needs uniformity, isolate clones and genotype them one by one.'],
      ],
    },
    {
      k: 'biosafety', title: 'Biosafety', color: '#ff7a59', items: [
        ['Assess risk and biosafety level', 'BSL-1 to BSL-4 depending on agent and procedure; viral vectors usually need BSL-2 or higher.'],
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
      <SectionHeader n="05" eyebrow={t('Boas práticas', 'Best practices')}
        title={t.lang === 'en' ? <>A CRISPR experiment is only as good <span className="text-gradient">as its controls</span>.</> : <>Um experimento CRISPR é tão bom <span className="text-gradient">quanto seus controles</span>.</>}
        lead={t('A parte da técnica que não aparece nas manchetes: desenhar o guia, escolher a entrega, montar os controles e provar que a edição é real. Use como checklist ao planejar ou revisar um experimento — o progresso fica salvo neste navegador.',
          'The part of the technique that never makes headlines: designing the guide, choosing delivery, setting up controls and proving the edit is real. Use it as a checklist when planning or reviewing an experiment — progress is saved in this browser.')} />

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
                    <li key={id}>
                      <details className="group rounded-xl px-2 py-1.5 transition hover:bg-white/5">
                        <summary className="flex cursor-pointer list-none items-start gap-3">
                          <input type="checkbox" checked={!!done[id]} onChange={(e) => setDone({ ...done, [id]: e.target.checked })} onClick={(e) => e.stopPropagation()}
                            aria-label={item} className="mt-1 h-4 w-4 shrink-0 accent-[#3ef0d0]" />
                          <span className={`flex-1 ${done[id] ? 'text-mist line-through decoration-dna/60' : ''}`}>{item}</span>
                          <span className="text-mist transition group-open:rotate-45" aria-hidden="true">+</span>
                        </summary>
                        <p className="ml-7 mt-2 text-sm leading-relaxed text-mist">{why}</p>
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
