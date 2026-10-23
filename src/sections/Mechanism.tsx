import { useEffect, useRef, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import MechanismDiagram from './MechanismDiagram'
import { useT, type L } from '../i18n'

const STEPS: L<{ k: string; t: string; b: string }[]> = {
  pt: [
    { k: 'sgRNA', t: 'O RNA guia', b: 'É o endereço. Suas primeiras 20 letras são escolhidas por quem faz o experimento e definem onde a Cas9 vai agir; o resto do RNA só serve para encaixar na proteína. Trocando essas 20 letras, muda-se o alvo — é isso que torna a ferramenta programável.' },
    { k: 'alvo', t: 'O alvo e a marca PAM', b: 'O alvo são 20 letras do DNA que combinam com o guia. Logo depois delas precisa haver o PAM: duas letras G, precedidas de qualquer letra (NGG). Sem essa marca não há corte, mesmo com o guia perfeito — por isso nem todo ponto do genoma pode ser editado.' },
    { k: 'reconhecimento', t: 'A procura', b: 'A Cas9 desliza pelo DNA procurando PAMs. Cada vez que acha um, confere se o guia combina com as letras ao lado. Na imensa maioria das vezes não combina, e ela segue adiante. A conferência começa pelas letras vizinhas ao PAM: um erro ali já basta para a enzima desistir.' },
    { k: 'abertura', t: 'A abertura', b: 'Quando o guia combina, as duas fitas do DNA se separam naquele ponto. O RNA ocupa o lugar de uma delas, grudando na fita que é sua complementar. A outra fita fica solta. Essa bolha aberta é chamada de R-loop.' },
    { k: 'dsb', t: 'O corte', b: 'Com o DNA aberto, as duas tesouras da proteína entram em ação: cada uma corta uma fita, três letras antes do PAM. O resultado é o DNA partido em dois — o que os textos chamam de quebra de fita dupla, ou DSB.' },
    { k: 'nhej', t: 'Reparo rápido: NHEJ', b: 'Um DNA partido é perigoso, então a célula corre para colar as pontas. Essa colagem é rápida, mas desleixada: costuma perder ou ganhar algumas letras no caminho. Se isso acontece dentro de um gene, a leitura dele sai embaralhada e a proteína deixa de ser produzida. É assim que se desliga um gene de propósito.' },
    { k: 'hdr', t: 'Reparo fiel: HDR', b: 'Se o pesquisador fornecer um molde — um pedaço de DNA com a sequência desejada e pontas iguais às da região — a célula pode copiar esse molde ao consertar a quebra. É assim que se corrige uma mutação ou se insere algo novo. Funciona bem menos vezes que a colagem rápida, e só quando a célula está se dividindo.' },
  ],
  en: [
    { k: 'sgRNA', t: 'The guide RNA', b: 'It is the address. Its first 20 letters are chosen by the experimenter and define where Cas9 will act; the rest of the RNA just docks into the protein. Swap those 20 letters and the target changes — that is what makes the tool programmable.' },
    { k: 'alvo', t: 'The target and the PAM', b: 'The target is 20 letters of DNA that match the guide. Right after them there must be a PAM: two Gs preceded by any letter (NGG). Without that mark there is no cut, even with a perfect guide — which is why not every spot in the genome can be edited.' },
    { k: 'reconhecimento', t: 'The search', b: 'Cas9 scans DNA looking for PAMs. Each time it finds one, it checks whether the guide matches the neighbouring letters. Almost always it does not, and it moves on. The check starts at the letters next to the PAM: a single error there is enough for the enzyme to give up.' },
    { k: 'abertura', t: 'Unwinding', b: 'When the guide matches, the two DNA strands separate at that spot. The RNA takes the place of one of them, pairing with its complementary strand. The other strand is left loose. This open bubble is called an R-loop.' },
    { k: 'dsb', t: 'The cut', b: 'With the DNA open, the protein’s two scissors go to work: each cuts one strand, three letters before the PAM. The result is DNA broken in two — what textbooks call a double-strand break, or DSB.' },
    { k: 'nhej', t: 'Quick repair: NHEJ', b: 'Broken DNA is dangerous, so the cell rushes to glue the ends back. That gluing is fast but sloppy: it often loses or gains a few letters along the way. If this happens inside a gene, its reading frame is scrambled and the protein is no longer made. That is how a gene is switched off on purpose.' },
    { k: 'hdr', t: 'Faithful repair: HDR', b: 'If the researcher supplies a template — a piece of DNA with the desired sequence and ends matching the region — the cell can copy it while fixing the break. That is how a mutation is corrected or something new is inserted. It works far less often than quick gluing, and only when the cell is dividing.' },
  ],
}

export default function Mechanism() {
  const t = useT()
  const steps = t.pick(STEPS)
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLElement | null)[]>([])
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.i))),
      { rootMargin: '-45% 0px -45% 0px' },
    )
    refs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <section id="como-funciona" className="section">
      <SectionHeader n="02" eyebrow={t('Como funciona', 'How it works')}
        title={t.lang === 'en' ? <>Search, unwind, <span className="text-gradient">cut</span> — and let the cell repair.</> : <>Procurar, abrir, <span className="text-gradient">cortar</span> — e deixar a célula reparar.</>}
        lead={t('Role a página e a ilustração acompanha cada etapa. Vale guardar uma ideia antes de começar: a Cas9 não reescreve o DNA. Ela apenas corta. Quem define o resultado final é a própria célula, ao consertar o corte.',
          'Scroll and the illustration follows each step. One idea worth keeping in mind before we start: Cas9 does not rewrite DNA. It only cuts. The final outcome is decided by the cell itself, as it repairs the cut.')} />
      <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr]">
        <ol className="space-y-[30vh] pb-[20vh] lg:pt-[8vh]">
          {steps.map((st, i) => (
            <li key={st.k} data-i={i} ref={(el) => { refs.current[i] = el }}
              className={`glass rounded-3xl p-7 transition duration-500 ${active === i ? 'opacity-100 ring-1 ring-dna/40' : 'opacity-40'}`}>
              <span className="font-mono text-sm text-dna">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-2xl font-semibold">{st.t}</h3>
              <p className="mt-3 leading-relaxed text-mist">{st.b}</p>
              {/* em telas pequenas a ilustração aparece junto ao texto */}
              <div className="mt-5 lg:hidden"><MechanismDiagram step={i} label={`${t('Diagrama', 'Diagram')}: ${st.t}`} /></div>
            </li>
          ))}
        </ol>
        <div className="hidden lg:block">
          <div className="glass sticky top-24 rounded-3xl p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="hud-label">{t('Etapa', 'Step')} {active + 1} / {steps.length}</span>
              <span className="font-display text-sm text-white">{steps[active].t}</span>
            </div>
            <MechanismDiagram step={active} label={`${t('Diagrama', 'Diagram')}: ${steps[active].t}`} />
            <div className="mt-4 flex gap-1.5" aria-hidden="true">
              {steps.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full transition ${i <= active ? 'bg-dna' : 'bg-white/10'}`} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
