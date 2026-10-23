import SectionHeader from '../components/SectionHeader'
import { useT, type L } from '../i18n'
import { prefersReducedMotion } from '../lib/hooks'

type Event = { year: string; title: string; body: string; accent?: boolean }

const TIMELINE: L<Event[]> = {
  pt: [
    { year: '1987', title: 'Repetições misteriosas', body: 'Pesquisadores encontram, no DNA da bactéria E. coli, repetições estranhas separadas por trechos diferentes entre si. Ninguém sabia para que serviam.' },
    { year: '2002', title: 'Nasce o nome', body: 'O conjunto ganha o nome CRISPR. Os genes vizinhos, que trabalham junto com ele, são batizados de genes cas.' },
    { year: '2005', title: 'Espaçadores vêm de vírus', body: 'Três grupos descobrem, separadamente, que os trechos entre as repetições são pedaços de DNA de vírus. Primeiro indício de um sistema de defesa.' },
    { year: '2007', title: 'Prova experimental', body: 'Um experimento confirma a hipótese: a bactéria que guarda o pedaço de um vírus fica resistente a ele.' },
    { year: '2011', title: 'A peça que faltava', body: 'Descrição do tracrRNA, um segundo RNA necessário para o sistema funcionar.' },
    { year: '2012', title: 'Uma tesoura programável', body: 'Doudna, Charpentier e colegas mostram que dá para programar a Cas9, por meio de um RNA, para cortar o DNA onde se quiser. O grupo de Šikšnys chega a conclusões parecidas.', accent: true },
    { year: '2013', title: 'Edição em células humanas', body: 'A ferramenta funciona também em células humanas e de outros mamíferos.' },
    { year: '2018', title: 'O caso He Jiankui', body: 'Anúncio do nascimento de gêmeas a partir de embriões editados. A comunidade científica condenou o caso.' },
    { year: '2020', title: 'Nobel de Química', body: 'Emmanuelle Charpentier e Jennifer Doudna recebem o Nobel de Química “pelo desenvolvimento de um método para edição de genoma”.', accent: true },
    { year: '2023', title: 'Primeira terapia aprovada', body: 'O Casgevy, primeira terapia com CRISPR, é aprovado no Reino Unido (nov/2023) para anemia falciforme e beta-talassemia. Nos EUA, a aprovação sai em dez/2023 para a falciforme e em jan/2024 para a beta-talassemia.', accent: true },
  ],
  en: [
    { year: '1987', title: 'Mysterious repeats', body: 'Researchers find odd repeats in the DNA of E. coli, separated by stretches that all differ from one another. Nobody knew what they were for.' },
    { year: '2002', title: 'A name is born', body: 'The arrangement is named CRISPR. The neighbouring genes that work with it are called cas genes.' },
    { year: '2005', title: 'Spacers come from viruses', body: 'Three groups independently discover that the stretches between repeats are pieces of viral DNA — the first hint of a defence system.' },
    { year: '2007', title: 'Experimental proof', body: 'An experiment confirms the hypothesis: a bacterium that stores a piece of a virus becomes resistant to it.' },
    { year: '2011', title: 'The missing piece', body: 'tracrRNA is described — a second RNA the system needs in order to work.' },
    { year: '2012', title: 'Programmable scissors', body: 'Doudna, Charpentier and colleagues show that Cas9 can be programmed, through an RNA, to cut DNA wherever you choose. Šikšnys’s group reaches similar conclusions.', accent: true },
    { year: '2013', title: 'Editing human cells', body: 'The tool also works in human and other mammalian cells.' },
    { year: '2018', title: 'The He Jiankui case', body: 'The birth of twin girls from edited embryos is announced. The scientific community condemned it.' },
    { year: '2020', title: 'Nobel Prize in Chemistry', body: 'Emmanuelle Charpentier and Jennifer Doudna receive the Nobel Prize in Chemistry “for the development of a method for genome editing”.', accent: true },
    { year: '2023', title: 'First approved therapy', body: 'Casgevy, the first CRISPR therapy, is approved in the UK (Nov 2023) for sickle cell disease and beta-thalassaemia. In the US it is approved for sickle cell disease in Dec 2023 and for beta-thalassaemia in Jan 2024.', accent: true },
  ],
}

const STEPS: L<[string, string, string][]> = {
  pt: [
    ['1. Guardar', 'Depois de um ataque, a bactéria arquiva um pedaço do DNA do vírus entre suas repetições. É a memória da infecção.', '#3ef0d0'],
    ['2. Copiar', 'Esse arquivo é transcrito em pequenos RNAs. Cada um carrega a “foto” de um vírus e serve de guia.', '#ffb547'],
    ['3. Cortar', 'O RNA guia leva a proteína Cas até o DNA do vírus que combina com a “foto”. A Cas corta, e o ataque é neutralizado.', '#ff4fa3'],
  ],
  en: [
    ['1. Store', 'After an attack, the bacterium files a piece of the viral DNA between its repeats. That is the memory of the infection.', '#3ef0d0'],
    ['2. Copy', 'The archive is transcribed into short RNAs. Each carries a “mugshot” of one virus and acts as a guide.', '#ffb547'],
    ['3. Cut', 'The guide RNA leads the Cas protein to the viral DNA that matches the mugshot. Cas cuts, and the attack is neutralised.', '#ff4fa3'],
  ],
}

/** Arranjo CRISPR estilizado: líder, repetições (losangos) e espaçadores (memória de infecções). */
function CrisprArray() {
  const t = useT()
  const spacerColors = ['#3ef0d0', '#ffb547', '#ff4fa3', '#7dff9b', '#4cc9ff']
  // animação SMIL não obedece ao CSS de "reduzir movimento"
  const still = prefersReducedMotion()
  return (
    <figure className="glass rounded-3xl p-6 md:p-8" data-reveal>
      <svg viewBox="0 0 640 170" className="w-full" role="img" aria-labelledby="arr-t arr-d">
        <title id="arr-t">{t('Arranjo CRISPR', 'CRISPR array')}</title>
        <desc id="arr-d">{t('Esquema do arquivo CRISPR: uma sequência líder seguida de repetições iguais (losangos), alternadas com pedaços de DNA de vírus diferentes (retângulos coloridos). O pedaço mais recente entra logo após o líder.', 'Diagram of the CRISPR archive: a leader sequence followed by identical repeats (diamonds) alternating with pieces of DNA from different viruses (coloured rectangles). The newest piece is inserted right after the leader.')}</desc>
        <rect x="10" y="70" width="70" height="30" rx="6" fill="#1b2a3a" stroke="#a9b8c9" strokeOpacity=".4" />
        <text x="45" y="90" textAnchor="middle" fill="#a9b8c9" fontSize="12" fontFamily="JetBrains Mono Variable">{t('líder', 'leader')}</text>
        {spacerColors.map((c, i) => {
          const x = 92 + i * 108
          return (
            <g key={i}>
              <polygon points={`${x},85 ${x + 14},70 ${x + 28},85 ${x + 14},100`} fill="#0f1b28" stroke="#a9b8c9" strokeOpacity=".6" />
              <rect x={x + 34} y="72" width="66" height="26" rx="5" fill={c} fillOpacity=".22" stroke={c}>
                {!still && <animate attributeName="fill-opacity" values=".1;.45;.1" dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite" />}
              </rect>
              <text x={x + 67} y="90" textAnchor="middle" fill={c} fontSize="11" fontFamily="JetBrains Mono Variable">S{i + 1}</text>
            </g>
          )
        })}
        <path d="M126 50 Q 140 20 200 22" stroke="#ffb547" fill="none" strokeDasharray="3 4" />
        <text x="206" y="26" fill="#ffb547" fontSize="12">{t('o vírus mais recente entra aqui', 'the newest virus goes in here')}</text>
        <text x="106" y="128" fill="#a9b8c9" fontSize="12">{t('◇ repetição (sempre igual)', '◇ repeat (always identical)')}</text>
        <text x="360" y="128" fill="#a9b8c9" fontSize="12">{t('▭ espaçador: pedaço de DNA de um vírus', '▭ spacer: a piece of viral DNA')}</text>
        <text x="10" y="160" fill="#a9b8c9" fillOpacity=".7" fontSize="11">{t('Cada espaçador vira um RNA guia, que leva a proteína Cas até o vírus correspondente.', 'Each spacer becomes a guide RNA that leads the Cas protein to the matching virus.')}</text>
      </svg>
    </figure>
  )
}

export default function Intro() {
  const t = useT()
  return (
    <section id="o-que-e" className="section">
      <SectionHeader
        n="01" eyebrow={t('O que é CRISPR', 'What CRISPR is')}
        title={t.lang === 'en'
          ? <>An immune system <span className="text-gradient">with memory</span>, invented by bacteria.</>
          : <>Um sistema imune <span className="text-gradient">com memória</span>, inventado por bactérias.</>}
        lead={t.lang === 'en'
          ? <>Bacteria get attacked by viruses too. To defend themselves, some keep a piece of every virus that has infected them in their own DNA — a kind of <strong className="text-white">photo archive of invaders</strong>. If the virus returns, the bacterium uses that archive to recognise it and cut its DNA. That region of the bacterial genome is CRISPR, and the scissors that make the cut are the Cas proteins.</>
          : <>Bactérias também são atacadas por vírus. Para se defender, algumas guardam no próprio DNA um pedaço de cada vírus que já as infectou — uma espécie de <strong className="text-white">arquivo de fotos dos invasores</strong>. Se o vírus voltar, a bactéria usa esse arquivo para reconhecê-lo e cortar o DNA dele. Essa região do genoma bacteriano é o CRISPR, e as tesouras que fazem o corte são as proteínas Cas.</>}
      />

      <div className="grid gap-6 md:grid-cols-3" data-reveal>
        {t.pick(STEPS).map(([title, b, c], i) => (
          <article key={title} className="glass tilt-card group rounded-3xl p-7 transition hover:-translate-y-1">
            <span className="font-mono text-sm" style={{ color: c }}>0{i + 1}</span>
            <h3 className="mt-3 text-2xl font-semibold">{title}</h3>
            <p className="mt-3 leading-relaxed text-mist">{b}</p>
          </article>
        ))}
      </div>

      <div className="mt-10"><CrisprArray /></div>

      <p className="mt-10 max-w-3xl leading-relaxed text-mist" data-reveal>
        {t.lang === 'en'
          ? <>A natural question: why doesn’t the bacterium cut its own archive, since it contains viral DNA? Because cutting only happens when a small mark called the <strong className="text-white">PAM</strong> sits right next to the target. It is present in the viral DNA and absent from the bacterial archive. That is how the system tells “invader” from “memory” — and the PAM is still required when we use CRISPR in the lab.</>
          : <>Uma pergunta natural: por que a bactéria não corta o próprio arquivo, já que ele contém o DNA do vírus? Porque o corte só acontece quando existe, logo ao lado do alvo, uma pequena marca chamada <strong className="text-white">PAM</strong>. Ela está presente no DNA do vírus e ausente no arquivo da bactéria. É assim que o sistema diferencia “invasor” de “memória” — e o PAM continua sendo exigido quando usamos CRISPR em laboratório.</>}
      </p>

      <div className="relative mt-24" data-timeline>
        <h3 className="mb-12 text-3xl font-semibold md:text-4xl" data-reveal>{t('Linha do tempo', 'Timeline')}</h3>
        <div className="absolute bottom-0 left-[11px] top-24 w-px bg-white/10 md:left-1/2" />
        <div data-timeline-line className="absolute bottom-0 left-[11px] top-24 w-px bg-linear-to-b from-dna via-rna to-cas md:left-1/2" />
        <ol className="space-y-12">
          {t.pick(TIMELINE).map((ev, i) => (
            <li key={ev.year + i} className={`relative pl-10 md:w-1/2 md:pl-0 ${i % 2 ? 'md:ml-auto md:pl-14' : 'md:pr-14 md:text-right'}`} data-reveal>
              <span className={`absolute top-1.5 h-[11px] w-[11px] rounded-full ring-4 ring-ink ${ev.accent ? 'bg-cas shadow-[0_0_20px_#ff4fa3]' : 'bg-dna'} left-[6px] ${i % 2 ? 'md:-left-[5.5px]' : 'md:left-auto md:-right-[5.5px]'}`} />
              <p className="font-mono text-sm text-dna">{ev.year}</p>
              <h4 className="mt-1 text-xl font-semibold">{ev.title}</h4>
              <p className="mt-2 leading-relaxed text-mist">{ev.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
