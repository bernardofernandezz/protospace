import SectionHeader from '../components/SectionHeader'
import { CONCLUSION, REFERENCES, type Reference } from '../content/references'

/** Agrupa as referências pela ordem em que os grupos aparecem no arquivo de conteúdo. */
function byGroup(refs: Reference[]) {
  const map = new Map<string, Reference[]>()
  for (const r of refs) map.set(r.group, [...(map.get(r.group) ?? []), r])
  return [...map]
}

export default function Conclusion() {
  return (
    <section id="referencias" className="section">
      <SectionHeader n="10" eyebrow={CONCLUSION.eyebrow} title={CONCLUSION.title} lead={CONCLUSION.lead} />

      <div className="grid gap-5 md:grid-cols-3" data-reveal>
        {CONCLUSION.takeaways.map((t, i) => (
          <div key={i} className="glass rounded-3xl p-7">
            <span className="font-display text-5xl font-semibold text-white/10">{i + 1}</span>
            <p className="mt-2 leading-relaxed text-mist">{t}</p>
          </div>
        ))}
      </div>

      <div className="mt-20" data-reveal>
        <h3 className="text-3xl font-semibold md:text-4xl">Referências</h3>
        <p className="mt-3 max-w-2xl text-sm text-mist">
          Itens marcados com <span className="verify">[verificar]</span> precisam de conferência (DOI, data ou detalhe) antes do seminário.
        </p>

        <div className="mt-8 space-y-10">
          {byGroup(REFERENCES).map(([group, items]) => (
            <div key={group}>
              <h4 className="hud-label">{group}</h4>
              <ol className="mt-4 space-y-3">
                {items.map((r) => (
                  <li key={r.id} className="glass flex flex-col gap-1 rounded-2xl p-5 transition hover:bg-white/[0.06] md:flex-row md:items-baseline md:gap-4">
                    <span className="font-mono text-xs text-dna md:w-16 md:shrink-0">{r.year}</span>
                    <span className="flex-1">
                      <span className="block font-medium text-white">{r.title}</span>
                      <span className="mt-1 block text-sm text-mist">{r.authors} · <em>{r.source}</em></span>
                      {r.note && <span className="verify mt-2 inline-block">{r.note}</span>}
                    </span>
                    {r.link && (
                      <a href={r.link} target="_blank" rel="noreferrer noopener" className="shrink-0 text-sm text-dna underline underline-offset-4 hover:text-bio">
                        acessar <span aria-hidden="true">↗</span>
                      </a>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      <footer className="mt-24 border-t border-white/10 pt-8 text-sm text-mist/70">
        <p>Material didático de apoio a seminário acadêmico. O playground é uma simulação simplificada e não representa um protocolo experimental real.</p>
        <p className="mt-2">Conteúdo e textos: <span className="verify">[conteúdo a inserir]</span> · Interface e visualizações geradas por código, sem assets externos.</p>
      </footer>
    </section>
  )
}
