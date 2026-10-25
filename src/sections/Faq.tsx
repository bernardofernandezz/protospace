import { useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import { Rich } from '../components/Term'
import { FAQ, FAQ_HEADER } from '../content/faq'
import { useT } from '../i18n'

export default function Faq() {
  const t = useT()
  const faq = t.pick(FAQ)
  const H = t.pick(FAQ_HEADER)
  const [group, setGroup] = useState(0)
  const [open, setOpen] = useState<string | null>(faq[0].items[0].id)
  const g = faq[group]

  return (
    <section id="faq" className="section">
      <SectionHeader
        n="10"
        eyebrow={H.eyebrow}
        title={
          <>
            {H.title[0]}
            <span className="text-gradient">{H.title[1]}</span>
            {H.title[2]}
          </>
        }
        lead={H.lead}
      />

      <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
        <nav
          className="flex gap-3 overflow-x-auto pb-2 lg:sticky lg:top-24 lg:flex-col lg:self-start lg:overflow-visible lg:pb-0"
          aria-label={t('Categorias de perguntas', 'Question categories')}
        >
          {faq.map((x, i) => (
            <button
              key={x.id}
              type="button"
              onClick={() => {
                setGroup(i)
                setOpen(x.items[0].id)
              }}
              aria-pressed={group === i}
              className={`glass shrink-0 rounded-2xl p-5 text-left transition lg:w-full ${group === i ? 'ring-1' : 'opacity-60 hover:opacity-100'}`}
              style={{ ['--tw-ring-color' as string]: x.color }}
            >
              <span className="block font-display text-lg font-semibold" style={{ color: group === i ? x.color : undefined }}>
                {x.title}
              </span>
              <span className="mt-1 hidden text-sm leading-relaxed text-mist lg:block">{x.summary}</span>
              <span className="mt-1 block font-mono text-[11px] text-mist/70">
                {x.items.length} {H.count}
              </span>
            </button>
          ))}
        </nav>

        <div className="space-y-3" data-reveal>
          {g.items.map((item) => {
            const isOpen = open === item.id
            return (
              <article
                key={item.id}
                className={`glass overflow-hidden rounded-2xl transition ${isOpen ? 'ring-1' : ''}`}
                style={isOpen ? { ['--tw-ring-color' as string]: g.color } : undefined}
              >
                <h3>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${item.id}`}
                    onClick={() => setOpen(isOpen ? null : item.id)}
                    className="flex w-full items-start justify-between gap-4 p-5 text-left transition hover:bg-white/5"
                  >
                    <span className="font-display text-lg font-medium md:text-xl">{item.q}</span>
                    <span
                      className={`mt-1 shrink-0 text-xl transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
                      style={{ color: g.color }}
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </button>
                </h3>
                {isOpen && (
                  <div id={`faq-${item.id}`} className="space-y-3 px-5 pb-5 leading-relaxed text-mist">
                    {item.a.map((p, i) => (
                      <p key={i}>
                        <Rich>{p}</Rich>
                      </p>
                    ))}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
