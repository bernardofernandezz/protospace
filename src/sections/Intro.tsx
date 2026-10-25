import { Fragment, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import { useT, type L } from '../i18n'
import { prefersReducedMotion } from '../lib/hooks'
import { Rich, Term } from '../components/Term'

type Event = { year: string; title: string; body: string; accent?: boolean }

const TIMELINE: L<Event[]> = {
  pt: [
    {
      year: '1987',
      title: 'Repetições misteriosas',
      body: 'Pesquisadores encontram, no DNA da bactéria E. coli, repetições estranhas separadas por trechos diferentes entre si. Ninguém sabia para que serviam.',
    },
    {
      year: '2002',
      title: 'Nasce o nome',
      body: 'O conjunto ganha o nome CRISPR. Os genes vizinhos, que trabalham junto com ele, são batizados de genes cas.',
    },
    {
      year: '2005',
      title: 'Espaçadores vêm de vírus',
      body: 'Três grupos descobrem, separadamente, que os trechos entre as repetições são pedaços de DNA de vírus. Primeiro indício de um sistema de defesa.',
    },
    {
      year: '2007',
      title: 'Prova experimental',
      body: 'Um experimento confirma a hipótese: a bactéria que guarda o pedaço de um vírus fica resistente a ele.',
    },
    { year: '2011', title: 'A peça que faltava', body: 'Descrição do tracrRNA, um segundo RNA necessário para o sistema funcionar.' },
    {
      year: '2012',
      title: 'Uma tesoura programável',
      body: 'Doudna, Charpentier e colegas mostram que dá para programar a [[cas9|Cas9]], por meio de um RNA, para cortar o DNA onde se quiser. O grupo de Šikšnys chega a conclusões parecidas.',
      accent: true,
    },
    { year: '2013', title: 'Edição em células humanas', body: 'A ferramenta funciona também em células humanas e de outros mamíferos.' },
    {
      year: '2018',
      title: 'O caso He Jiankui',
      body: 'Anúncio do nascimento de gêmeas a partir de embriões editados. A comunidade científica condenou o caso.',
    },
    {
      year: '2019',
      title: 'A primeira paciente',
      body: 'Victoria Gray, com anemia falciforme, é a primeira pessoa tratada com CRISPR nos Estados Unidos. Suas células-tronco do sangue são editadas fora do corpo e devolvidas a ela. Anos depois, segue sem as crises de dor que marcavam sua vida.',
    },
    {
      year: '2020',
      title: 'Nobel de Química',
      body: 'Emmanuelle Charpentier e Jennifer Doudna recebem o Nobel de Química “pelo desenvolvimento de um método para edição de genoma”.',
      accent: true,
    },
    {
      year: '2023',
      title: 'Primeira terapia aprovada',
      body: 'O Casgevy, primeira terapia com CRISPR, é aprovado no Reino Unido (nov/2023) para anemia falciforme e beta-talassemia. Nos EUA, a aprovação sai em dez/2023 para a falciforme e em jan/2024 para a beta-talassemia.',
      accent: true,
    },
    {
      year: '2025',
      title: 'Uma terapia para uma só pessoa',
      body: 'Um bebê com deficiência de CPS1, doença rara do ciclo da ureia, recebe um editor de bases desenhado para a mutação dele, projetado, fabricado e aplicado em cerca de seis meses. É o primeiro tratamento de edição genética feito sob medida para um único paciente.',
    },
  ],
  en: [
    {
      year: '1987',
      title: 'Mysterious repeats',
      body: 'Researchers find odd repeats in the DNA of E. coli, separated by stretches that all differ from one another. Nobody knew what they were for.',
    },
    { year: '2002', title: 'A name is born', body: 'The arrangement is named CRISPR. The neighbouring genes that work with it are called cas genes.' },
    {
      year: '2005',
      title: 'Spacers come from viruses',
      body: 'Three groups independently discover that the stretches between repeats are pieces of viral DNA, the first hint of a defence system.',
    },
    {
      year: '2007',
      title: 'Experimental proof',
      body: 'An experiment confirms the hypothesis: a bacterium that stores a piece of a virus becomes resistant to it.',
    },
    { year: '2011', title: 'The missing piece', body: 'tracrRNA is described: a second RNA the system needs in order to work.' },
    {
      year: '2012',
      title: 'Programmable scissors',
      body: 'Doudna, Charpentier and colleagues show that [[cas9|Cas9]] can be programmed, through an RNA, to cut DNA wherever you choose. Šikšnys’s group reaches similar conclusions.',
      accent: true,
    },
    { year: '2013', title: 'Editing human cells', body: 'The tool also works in human and other mammalian cells.' },
    { year: '2018', title: 'The He Jiankui case', body: 'The birth of twin girls from edited embryos is announced. The scientific community condemned it.' },
    {
      year: '2019',
      title: 'The first patient',
      body: 'Victoria Gray, who has sickle cell disease, becomes the first person treated with CRISPR in the United States. Her blood stem cells are edited outside the body and given back to her. Years later she is still free of the pain crises that shaped her life.',
    },
    {
      year: '2020',
      title: 'Nobel Prize in Chemistry',
      body: 'Emmanuelle Charpentier and Jennifer Doudna receive the Nobel Prize in Chemistry “for the development of a method for genome editing”.',
      accent: true,
    },
    {
      year: '2023',
      title: 'First approved therapy',
      body: 'Casgevy, the first CRISPR therapy, is approved in the UK (Nov 2023) for sickle cell disease and beta-thalassaemia. In the US it is approved for sickle cell disease in Dec 2023 and for beta-thalassaemia in Jan 2024.',
      accent: true,
    },
    {
      year: '2025',
      title: 'A therapy for one person',
      body: 'A baby with CPS1 deficiency, a rare urea cycle disorder, receives a base editor designed for his own mutation, conceived, manufactured and infused in about six months. It is the first gene-editing treatment tailored to a single patient.',
    },
  ],
}

const STEPS: L<[string, string, string][]> = {
  pt: [
    ['1. Guardar', 'Depois de um ataque, a bactéria arquiva um pedaço do [[dna|DNA]] do vírus entre suas repetições. É a memória da infecção.', '#3ef0d0'],
    ['2. Copiar', 'Esse arquivo é transcrito em pequenos [[rna|RNAs]]. Cada um carrega a “foto” de um vírus e serve de guia.', '#ffb547'],
    [
      '3. Cortar',
      'O RNA guia leva a [[proteina|proteína]] Cas até o DNA do vírus que combina com a “foto”. A Cas corta, e o ataque é neutralizado.',
      '#ff4fa3',
    ],
  ],
  en: [
    ['1. Store', 'After an attack, the bacterium files a piece of the viral [[dna|DNA]] between its repeats. That is the memory of the infection.', '#3ef0d0'],
    ['2. Copy', 'The archive is transcribed into short [[rna|RNAs]]. Each carries a “mugshot” of one virus and acts as a guide.', '#ffb547'],
    [
      '3. Cut',
      'The guide RNA leads the Cas [[proteina|protein]] to the viral DNA that matches the mugshot. Cas cuts, and the attack is neutralised.',
      '#ff4fa3',
    ],
  ],
}

/** Fagos de laboratório, com a "foto" de 20 nt que a bactéria arquivaria de cada um. */
const PHAGES = [
  { name: 'λ', color: '#3ef0d0', seq: 'GATCCTGCAGTTCGAGCCAG' },
  { name: 'T4', color: '#ffb547', seq: 'TTACCGATGCTAGCTCAAGG' },
  { name: 'T7', color: '#ff4fa3', seq: 'CCAGGATCATCAAGCTTTCA' },
  { name: 'P1', color: '#7dff9b', seq: 'TGACCATGTCGACGTTCCAG' },
  { name: 'Mu', color: '#4cc9ff', seq: 'ACGTTAGCCACTGGAACGTC' },
  { name: 'SPP1', color: '#c58cff', seq: 'GGTCTGACCATGTCGACGTT' },
  { name: 'T5', color: '#ff8a5c', seq: 'CAGTTCGAGCCAGGATCATC' },
] as const

/** O arquivo começa com quatro infecções antigas; o usuário acrescenta as novas. */
const INITIAL_ARCHIVE = [1, 2, 3, 4]
const MAX_SPACERS = 6

/** Losango entre dois espaçadores: a repetição, sempre igual. */
const Repeat = () => <span aria-hidden="true" className="h-3.5 w-3.5 shrink-0 rotate-45 rounded-[3px] border border-mist/50 bg-ink/60" />

/**
 * Arquivo CRISPR interativo: cada espaçador é a memória de uma infecção, e o mais recente
 * entra logo depois do líder. Clicar num espaçador mostra o RNA guia que ele origina.
 */
function CrisprArray() {
  const t = useT()
  const [archive, setArchive] = useState<number[]>(INITIAL_ARCHIVE)
  const [selected, setSelected] = useState(0)
  const [justAdded, setJustAdded] = useState(false)
  const still = prefersReducedMotion()
  const phage = PHAGES[archive[selected]]

  const infect = () => {
    const next = PHAGES.findIndex((_, i) => !archive.includes(i))
    if (next < 0) return
    setArchive([next, ...archive].slice(0, MAX_SPACERS))
    setSelected(0)
    setJustAdded(!still)
  }

  const onKey = (e: React.KeyboardEvent) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    e.preventDefault()
    setSelected((i) => (i + step + archive.length) % archive.length)
  }

  return (
    <figure className="glass rounded-3xl p-5 md:p-8" data-reveal>
      <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
        <h3 className="font-display text-xl font-semibold">{t('O arquivo de infecções', 'The infection archive')}</h3>
        <button
          type="button"
          onClick={infect}
          disabled={archive.length >= MAX_SPACERS && PHAGES.length === archive.length}
          className="rounded-xl bg-rna/15 px-3 py-1.5 text-sm text-rna ring-1 ring-rna/40 transition hover:bg-rna/25 disabled:opacity-40"
        >
          {t('+ nova infecção', '+ new infection')}
        </button>
      </figcaption>

      <p className="mb-2 text-xs text-rna">{t('↓ o vírus mais recente entra aqui', '↓ the newest virus goes in here')}</p>
      <div
        role="radiogroup"
        aria-label={t('Espaçadores do arquivo', 'Spacers in the archive')}
        onKeyDown={onKey}
        className="flex flex-wrap items-center gap-x-1.5 gap-y-2 overflow-x-auto"
      >
        <span className="shrink-0 rounded-lg border border-mist/40 bg-white/5 px-3 py-2 font-mono text-xs text-mist">{t('líder', 'leader')}</span>
        {archive.map((p, i) => {
          const { name, color } = PHAGES[p]
          const on = i === selected
          return (
            <Fragment key={p}>
              <Repeat />
              <button
                type="button"
                role="radio"
                aria-checked={on}
                tabIndex={on ? 0 : -1}
                onClick={() => setSelected(i)}
                className={`shrink-0 rounded-lg px-3.5 py-2.5 font-mono text-sm transition ${on ? 'scale-105' : 'opacity-75 hover:opacity-100'} ${i === 0 && justAdded ? 'caption-in' : ''}`}
                style={{ background: `${color}22`, color, boxShadow: `inset 0 0 0 ${on ? 2 : 1}px ${color}${on ? 'dd' : '66'}` }}
              >
                {name}
                <span className="ml-1.5 text-[11px] text-mist/70">S{i + 1}</span>
              </button>
            </Fragment>
          )
        })}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-mist">
        <span>
          <i aria-hidden="true" className="mr-1.5 inline-block h-2.5 w-2.5 rotate-45 rounded-[2px] border border-mist/50 align-middle" />
          {t('repetição (sempre igual)', 'repeat (always identical)')}
        </span>
        <span>{t(`S1 é a infecção mais recente; S${archive.length}, a mais antiga.`, `S1 is the newest infection; S${archive.length}, the oldest.`)}</span>
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4" aria-live="polite">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <b className="text-sm text-white">{t(`Espaçador S${selected + 1} · fago ${phage.name}`, `Spacer S${selected + 1} · phage ${phage.name}`)}</b>
          <span className="text-[11px] text-mist/70">{t('pedaço de DNA arquivado', 'archived piece of DNA')}</span>
        </div>
        <p className="mt-2 border-l-2 pl-2 font-mono text-sm tracking-wider break-all" style={{ color: phage.color, borderColor: phage.color }}>
          {phage.seq}
        </p>
        <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-mist/70">{t('transcrito em RNA guia', 'transcribed into guide RNA')}</p>
        <p className="mt-1 border-l-2 border-rna pl-2 font-mono text-sm tracking-wider break-all text-white/90">
          {[...phage.seq.replaceAll('T', 'U')].map((b, i) => (
            <span key={i} className={b === 'U' ? 'text-rna' : undefined}>
              {b}
            </span>
          ))}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          {t(
            `Se o fago ${phage.name} voltar, este RNA guia leva a proteína Cas até esse mesmo trecho do DNA dele, e o corte neutraliza o ataque.`,
            `If phage ${phage.name} comes back, this guide RNA leads the Cas protein to that same stretch of its DNA, and the cut neutralises the attack.`,
          )}
        </p>
      </div>
    </figure>
  )
}

export default function Intro() {
  const t = useT()
  return (
    <section id="o-que-e" className="section">
      <SectionHeader
        n="01"
        eyebrow={t('O que é CRISPR', 'What CRISPR is')}
        title={
          t.lang === 'en' ? (
            <>
              An immune system <span className="text-gradient">with memory</span>, invented by bacteria.
            </>
          ) : (
            <>
              Um sistema imune <span className="text-gradient">com memória</span>, inventado por bactérias.
            </>
          )
        }
        lead={
          t.lang === 'en' ? (
            <>
              Bacteria get attacked by viruses too. To defend themselves, some keep a piece of every virus that has infected them in their own DNA, a kind of{' '}
              <strong className="text-white">photo archive of invaders</strong>. If the virus returns, the bacterium uses that archive to recognise it and cut
              its <Term k="dna">DNA</Term>. That region of the bacterial <Term k="genoma">genome</Term> is <Term k="crispr">CRISPR</Term>, and the scissors that
              make the cut are the <Term k="cas9">Cas</Term> proteins.
            </>
          ) : (
            <>
              Bactérias também são atacadas por vírus. Para se defender, algumas guardam no próprio DNA um pedaço de cada vírus que já as infectou, uma espécie
              de <strong className="text-white">arquivo de fotos dos invasores</strong>. Se o vírus voltar, a bactéria usa esse arquivo para reconhecê-lo e
              cortar o <Term k="dna">DNA</Term> dele. Essa região do <Term k="genoma">genoma</Term> bacteriano é o <Term k="crispr">CRISPR</Term>, e as tesouras
              que fazem o corte são as <Term k="proteina">proteínas</Term> Cas.
            </>
          )
        }
      />

      <div className="grid gap-6 md:grid-cols-3" data-reveal>
        {t.pick(STEPS).map(([title, b, c], i) => (
          <article key={title} className="glass tilt-card group rounded-3xl p-7 transition hover:-translate-y-1">
            <span className="font-mono text-sm" style={{ color: c }}>
              0{i + 1}
            </span>
            <h3 className="mt-3 text-2xl font-semibold">{title}</h3>
            <p className="mt-3 leading-relaxed text-mist">
              <Rich>{b}</Rich>
            </p>
          </article>
        ))}
      </div>

      <div className="mt-10">
        <CrisprArray />
      </div>

      <p className="mt-10 max-w-3xl leading-relaxed text-mist" data-reveal>
        {t.lang === 'en' ? (
          <>
            A natural question: why doesn’t the bacterium cut its own archive, since it contains viral DNA? Because cutting only happens when a small mark
            called the{' '}
            <strong className="text-white">
              <Term k="pam">PAM</Term>
            </strong>{' '}
            sits right next to the target. It is present in the viral DNA and absent from the bacterial archive. That is how the system tells “invader” from
            “memory”, and the PAM is still required when we use CRISPR in the lab.
          </>
        ) : (
          <>
            Uma pergunta natural: por que a bactéria não corta o próprio arquivo, já que ele contém o DNA do vírus? Porque o corte só acontece quando existe,
            logo ao lado do alvo, uma pequena marca chamada{' '}
            <strong className="text-white">
              <Term k="pam">PAM</Term>
            </strong>
            . Ela está presente no DNA do vírus e ausente no arquivo da bactéria. É assim que o sistema diferencia “invasor” de “memória”, e o PAM continua
            sendo exigido quando usamos CRISPR em laboratório.
          </>
        )}
      </p>

      <div className="relative mt-24" data-timeline>
        <h3 className="mb-12 text-3xl font-semibold md:text-4xl" data-reveal>
          {t('Linha do tempo', 'Timeline')}
        </h3>
        <div className="absolute bottom-0 left-[11px] top-24 w-px bg-white/10 md:left-1/2" />
        <div data-timeline-line className="absolute bottom-0 left-[11px] top-24 w-px bg-linear-to-b from-dna via-rna to-cas md:left-1/2" />
        <ol className="space-y-12">
          {t.pick(TIMELINE).map((ev, i) => (
            <li key={ev.year + i} className={`relative pl-10 md:w-1/2 md:pl-0 ${i % 2 ? 'md:ml-auto md:pl-14' : 'md:pr-14 md:text-right'}`} data-reveal>
              <span
                className={`absolute top-1.5 h-[11px] w-[11px] rounded-full ring-4 ring-ink ${ev.accent ? 'bg-cas shadow-[0_0_20px_#ff4fa3]' : 'bg-dna'} left-[6px] ${i % 2 ? 'md:-left-[5.5px]' : 'md:left-auto md:-right-[5.5px]'}`}
              />
              <p className="font-mono text-sm text-dna">{ev.year}</p>
              <h4 className="mt-1 text-xl font-semibold">{ev.title}</h4>
              <p className="mt-2 leading-relaxed text-mist">
                <Rich>{ev.body}</Rich>
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
