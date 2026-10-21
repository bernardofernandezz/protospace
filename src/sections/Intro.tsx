import SectionHeader from '../components/SectionHeader'

const TIMELINE: { year: string; title: string; body: string; accent?: boolean }[] = [
  { year: '1987', title: 'Repetições misteriosas', body: 'Pesquisadores encontram, no DNA da bactéria E. coli, repetições estranhas separadas por trechos diferentes entre si. Ninguém sabia para que serviam.' },
  { year: '2002', title: 'Nasce o nome', body: 'O conjunto ganha o nome CRISPR. Os genes vizinhos, que trabalham junto com ele, são batizados de genes cas.' },
  { year: '2005', title: 'Espaçadores vêm de vírus', body: 'Três grupos descobrem, separadamente, que os trechos entre as repetições são pedaços de DNA de vírus. Primeiro indício de um sistema de defesa.' },
  { year: '2007', title: 'Prova experimental', body: 'Um experimento confirma a hipótese: a bactéria que guarda o pedaço de um vírus fica resistente a ele.' },
  { year: '2011', title: 'A peça que faltava', body: 'Descrição do tracrRNA, um segundo RNA necessário para o sistema funcionar.' },
  { year: '2012', title: 'Uma tesoura programável', body: 'Doudna, Charpentier e colegas mostram que dá para programar a Cas9, por meio de um RNA, para cortar o DNA onde se quiser. O grupo de Šikšnys chega a conclusões parecidas.', accent: true },
  { year: '2013', title: 'Edição em células humanas', body: 'A ferramenta funciona também em células humanas e de outros mamíferos.' },
  { year: '2018', title: 'O caso He Jiankui', body: 'Anúncio do nascimento de gêmeas a partir de embriões editados. A comunidade científica condenou o caso.' },
  { year: '2020', title: 'Nobel de Química', body: 'Emmanuelle Charpentier e Jennifer Doudna recebem o Nobel de Química “pelo desenvolvimento de um método para edição de genoma”.', accent: true },
  { year: '2023', title: 'Primeira terapia aprovada', body: 'O Casgevy, primeira terapia com CRISPR, é aprovado para anemia falciforme no Reino Unido (nov/2023) e nos EUA (dez/2023). Em jan/2024, a aprovação nos EUA se estende à beta-talassemia.', accent: true },
]

/** Arranjo CRISPR estilizado: líder, repetições (losangos) e espaçadores (memória de infecções). */
function CrisprArray() {
  const spacerColors = ['#3ef0d0', '#ffb547', '#ff4fa3', '#7dff9b', '#4cc9ff']
  return (
    <figure className="glass rounded-3xl p-6 md:p-8" data-reveal>
      <svg viewBox="0 0 640 170" className="w-full" role="img" aria-labelledby="arr-t arr-d">
        <title id="arr-t">Arranjo CRISPR</title>
        <desc id="arr-d">Esquema do arquivo CRISPR: uma sequência líder seguida de repetições iguais (losangos), alternadas com pedaços de DNA de vírus diferentes (retângulos coloridos). O pedaço mais recente entra logo após o líder.</desc>
        <rect x="10" y="70" width="70" height="30" rx="6" fill="#1b2a3a" stroke="#a9b8c9" strokeOpacity=".4" />
        <text x="45" y="90" textAnchor="middle" fill="#a9b8c9" fontSize="12" fontFamily="JetBrains Mono Variable">líder</text>
        {spacerColors.map((c, i) => {
          const x = 92 + i * 108
          return (
            <g key={i}>
              <polygon points={`${x},85 ${x + 14},70 ${x + 28},85 ${x + 14},100`} fill="#0f1b28" stroke="#a9b8c9" strokeOpacity=".6" />
              <rect x={x + 34} y="72" width="66" height="26" rx="5" fill={c} fillOpacity=".22" stroke={c}>
                <animate attributeName="fill-opacity" values=".1;.45;.1" dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
              </rect>
              <text x={x + 67} y="90" textAnchor="middle" fill={c} fontSize="11" fontFamily="JetBrains Mono Variable">S{i + 1}</text>
            </g>
          )
        })}
        <path d="M126 50 Q 140 20 200 22" stroke="#ffb547" fill="none" strokeDasharray="3 4" />
        <text x="206" y="26" fill="#ffb547" fontSize="12">o vírus mais recente entra aqui</text>
        <text x="106" y="128" fill="#a9b8c9" fontSize="12">◇ repetição (sempre igual)</text>
        <text x="360" y="128" fill="#a9b8c9" fontSize="12">▭ espaçador: pedaço de DNA de um vírus</text>
        <text x="10" y="160" fill="#a9b8c9" fillOpacity=".7" fontSize="11">Cada espaçador vira um RNA guia, que leva a proteína Cas até o vírus correspondente.</text>
      </svg>
    </figure>
  )
}

export default function Intro() {
  return (
    <section id="o-que-e" className="section">
      <SectionHeader
        n="01" eyebrow="O que é CRISPR"
        title={<>Um sistema imune <span className="text-gradient">com memória</span>, inventado por bactérias.</>}
        lead={<>Bactérias também são atacadas por vírus. Para se defender, algumas guardam no próprio DNA um pedaço de cada vírus que já as infectou — uma espécie de <strong className="text-white">arquivo de fotos dos invasores</strong>. Se o vírus voltar, a bactéria usa esse arquivo para reconhecê-lo e cortar o DNA dele. Essa região do genoma bacteriano é o CRISPR, e as tesouras que fazem o corte são as proteínas Cas.</>}
      />

      <div className="grid gap-6 md:grid-cols-3" data-reveal>
        {[
          ['1. Guardar', 'Depois de um ataque, a bactéria arquiva um pedaço do DNA do vírus entre suas repetições. É a memória da infecção.', '#3ef0d0'],
          ['2. Copiar', 'Esse arquivo é transcrito em pequenos RNAs. Cada um carrega a “foto” de um vírus e serve de guia.', '#ffb547'],
          ['3. Cortar', 'O RNA guia leva a proteína Cas até o DNA do vírus que combina com a “foto”. A Cas corta, e o ataque é neutralizado.', '#ff4fa3'],
        ].map(([t, b, c], i) => (
          <article key={t} className="glass group rounded-3xl p-7 transition hover:-translate-y-1">
            <span className="font-mono text-sm" style={{ color: c }}>0{i + 1}</span>
            <h3 className="mt-3 text-2xl font-semibold">{t}</h3>
            <p className="mt-3 leading-relaxed text-mist">{b}</p>
          </article>
        ))}
      </div>

      <div className="mt-10"><CrisprArray /></div>

      <p className="mt-10 max-w-3xl leading-relaxed text-mist" data-reveal>
        Uma pergunta natural: por que a bactéria não corta o próprio arquivo, já que ele contém o DNA do vírus? Porque o corte só acontece quando existe, logo ao lado do alvo, uma pequena marca chamada <strong className="text-white">PAM</strong>. Ela está presente no DNA do vírus e ausente no arquivo da bactéria. É assim que o sistema diferencia “invasor” de “memória” — e o PAM continua sendo exigido quando usamos CRISPR em laboratório.
      </p>

      <div className="relative mt-24" data-timeline>
        <h3 className="mb-12 text-3xl font-semibold md:text-4xl" data-reveal>Linha do tempo</h3>
        <div className="absolute bottom-0 left-[11px] top-24 w-px bg-white/10 md:left-1/2" />
        <div data-timeline-line className="absolute bottom-0 left-[11px] top-24 w-px bg-linear-to-b from-dna via-rna to-cas md:left-1/2" />
        <ol className="space-y-12">
          {TIMELINE.map((t, i) => (
            <li key={t.year + t.title} className={`relative pl-10 md:w-1/2 md:pl-0 ${i % 2 ? 'md:ml-auto md:pl-14' : 'md:pr-14 md:text-right'}`} data-reveal>
              <span className={`absolute top-1.5 h-[11px] w-[11px] rounded-full ring-4 ring-ink ${t.accent ? 'bg-cas shadow-[0_0_20px_#ff4fa3]' : 'bg-dna'} left-[6px] ${i % 2 ? 'md:-left-[5.5px]' : 'md:left-auto md:-right-[5.5px]'}`} />
              <p className="font-mono text-sm text-dna">{t.year}</p>
              <h4 className="mt-1 text-xl font-semibold">{t.title}</h4>
              <p className="mt-2 leading-relaxed text-mist">{t.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
