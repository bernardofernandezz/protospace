import SectionHeader from '../components/SectionHeader'
import { SITE } from '../content/site'
import { useT, type L } from '../i18n'

const BUILT: L<[string, string][]> = {
  pt: [
    [
      'Simulação 3D procedural',
      'DNA com sulcos maior e menor, dobra no PAM, R-loop, giro do domínio HNH, reparo por NHEJ (Ku70/80 + ligase) e HDR — tudo gerado por código e shaders GLSL próprios, sem modelos 3D externos.',
    ],
    [
      'Lógica de sequência real',
      'Busca de PAMs, pontos de corte, indels reproduzíveis, HDR e editor de bases operam sobre a sequência de verdade e são cobertos por testes automatizados.',
    ],
    [
      'Feito para apresentar',
      'Modo cinema, modo apresentação com QR code, atalhos de teclado, links que reproduzem um experimento e captura de imagem da cena.',
    ],
    [
      'Acessível e resiliente',
      'Bilíngue, navegável por teclado, compatível com leitores de tela e com “reduzir movimento”; qualidade gráfica adaptativa e funcionamento offline (PWA).',
    ],
  ],
  en: [
    [
      'Procedural 3D simulation',
      'DNA with major and minor grooves, PAM bending, R-loop, HNH domain swing, NHEJ (Ku70/80 + ligase) and HDR repair — all generated in code with custom GLSL shaders, no external 3D models.',
    ],
    [
      'Real sequence logic',
      'PAM search, cut sites, reproducible indels, HDR and base editing operate on the actual sequence and are covered by automated tests.',
    ],
    ['Built to present', 'Cinema mode, presentation mode with a QR code, keyboard shortcuts, shareable experiment links and scene screenshots.'],
    [
      'Accessible and resilient',
      'Bilingual, keyboard-navigable, screen-reader and reduced-motion friendly; adaptive graphics quality and offline support (PWA).',
    ],
  ],
}

const Ext = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer noopener"
    className="magnetic inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white ring-1 ring-white/10 transition hover:bg-white/10 hover:ring-dna/50"
  >
    {children}{' '}
    <span aria-hidden="true" className="text-mist">
      ↗
    </span>
  </a>
)

export default function About() {
  const t = useT()
  const { author } = SITE
  const initials = author.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
  return (
    <section id="sobre" className="section">
      <SectionHeader
        n="11"
        eyebrow={t('Sobre o projeto', 'About the project')}
        title={
          t.lang === 'en' ? (
            <>
              Built to teach — <span className="text-gradient">and to be explored</span>.
            </>
          ) : (
            <>
              Feito para ensinar — <span className="text-gradient">e para ser explorado</span>.
            </>
          )
        }
        lead={t(
          'Um site de apoio a seminário que virou um laboratório interativo: o conteúdo científico, a simulação e a interface foram pensados juntos, para que a visualização ajude a entender — e nunca exagere — o que a técnica faz.',
          'A seminar companion site that became an interactive lab: the science, the simulation and the interface were designed together, so the visuals help explain — and never overstate — what the technique does.',
        )}
      />

      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <aside className="glass relative overflow-hidden rounded-3xl p-7" data-reveal>
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-dna/20 blur-3xl" />
          <div className="flex items-center gap-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-linear-to-br from-dna via-bio to-cas font-display text-2xl font-bold text-ink">
              {initials}
            </span>
            <div>
              <p className="font-display text-2xl font-semibold">{author.name}</p>
              <p className="text-sm text-mist">{t('Conteúdo, design e desenvolvimento', 'Content, design and development')}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {author.linkedin && <Ext href={author.linkedin}>LinkedIn</Ext>}
            <Ext href={author.github}>GitHub</Ext>
            <Ext href={SITE.repo}>{t('Código-fonte', 'Source code')}</Ext>
          </div>
          <div className="mt-8">
            <p className="hud-label">Stack</p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {SITE.stack.map((s) => (
                <li key={s} className="rounded-md bg-white/5 px-2 py-1 font-mono text-[11px] text-mist ring-1 ring-white/10">
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="grid gap-5 sm:grid-cols-2">
          {t.pick(BUILT).map(([title, body], i) => (
            <article key={i} className="glass tilt-card rounded-3xl p-6" data-reveal>
              <span className="font-mono text-xs text-dna">0{i + 1}</span>
              <h3 className="mt-2 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{body}</p>
            </article>
          ))}
        </div>
      </div>

      <footer className="mt-24 flex flex-col gap-4 border-t border-white/10 pt-8 text-sm text-mist/70 md:flex-row md:items-center md:justify-between">
        <p className="max-w-2xl">
          {t(
            'Material didático de apoio a seminário acadêmico. O playground é uma simulação simplificada e não representa um protocolo experimental real.',
            'Teaching material for an academic seminar. The playground is a simplified simulation and does not represent a real experimental protocol.',
          )}
        </p>
        <p className="shrink-0">
          © {new Date().getFullYear()} {author.name} ·{' '}
          <a href={`${SITE.repo}/blob/main/LICENSE`} target="_blank" rel="noreferrer noopener" className="underline hover:text-white">
            MIT
          </a>
        </p>
      </footer>
    </section>
  )
}
