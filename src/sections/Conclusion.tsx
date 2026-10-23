import SectionHeader from '../components/SectionHeader'
import { CONCLUSION, REFERENCES, type Reference } from '../content/references'
import { useT } from '../i18n'

/** Agrupa as referências pela ordem em que os grupos aparecem no arquivo de conteúdo. */
function byGroup(refs: Reference[], lang: 'pt' | 'en') {
  const map = new Map<string, Reference[]>()
  for (const r of refs) map.set(r.group[lang], [...(map.get(r.group[lang]) ?? []), r])
  return [...map]
}

export default function Conclusion() {
  const t = useT()
  const C = t.pick(CONCLUSION)
  return (
    <section id="referencias" className="section">
      <SectionHeader n="10" eyebrow={C.eyebrow} title={<>{C.title[0]}<span className="text-gradient">{C.title[1]}</span>{C.title[2]}</>} lead={C.lead} />

      <div className="grid gap-5 md:grid-cols-3" data-reveal>
        {C.takeaways.map((tk, i) => (
          <div key={i} className="glass tilt-card rounded-3xl p-7">
            <span className="font-display text-5xl font-semibold text-white/10">{i + 1}</span>
            <p className="mt-2 leading-relaxed text-mist">{tk}</p>
          </div>
        ))}
      </div>

      <div className="mt-20" data-reveal>
        <h3 className="text-3xl font-semibold md:text-4xl">{t('Referências', 'References')}</h3>
        <p className="mt-3 max-w-2xl text-sm text-mist">{t('Fontes primárias, relatórios e legislação citados ao longo do site.', 'Primary sources, reports and legislation cited throughout the site.')}</p>

        <div className="mt-8 space-y-10">
          {byGroup(REFERENCES, t.lang).map(([group, items]) => (
            <div key={group}>
              <h4 className="hud-label">{group}</h4>
              <ol className="mt-4 space-y-3">
                {items.map((r) => (
                  <li key={r.id} className="glass flex flex-col gap-1 rounded-2xl p-5 transition hover:bg-white/[0.06] md:flex-row md:items-baseline md:gap-4">
                    <span className="font-mono text-xs text-dna md:w-16 md:shrink-0">{r.year}</span>
                    <span className="flex-1">
                      <span className="block font-medium text-white">{r.title}</span>
                      <span className="mt-1 block text-sm text-mist">{r.authors} · <em>{r.source}</em></span>
                    </span>
                    {r.link && (
                      <a href={r.link} target="_blank" rel="noreferrer noopener" className="shrink-0 text-sm text-dna underline underline-offset-4 hover:text-bio">
                        {r.link.includes('doi.org') ? 'DOI' : t('acessar', 'open')} <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
