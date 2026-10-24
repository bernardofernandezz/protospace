import { useEffect, useRef, useState } from 'react'
import SectionHeader from '../components/SectionHeader'
import WhatIf from '../components/WhatIf'
import MechanismDiagram from './MechanismDiagram'
import { useT, type L } from '../i18n'
import { Rich } from '../components/Term'

const STEPS: L<{ k: string; t: string; b: string }[]> = {
  pt: [
    { k: 'sgRNA', t: 'O RNA guia', b: 'É o endereço. Suas primeiras 20 letras são escolhidas por quem faz o experimento e definem onde a [[cas9|Cas9]] vai agir; o resto do [[rna|RNA]] só serve para encaixar na proteína. Trocando essas 20 letras, muda-se o alvo — é isso que torna a ferramenta programável.' },
    { k: 'alvo', t: 'O alvo e a marca PAM', b: 'O alvo são 20 letras do [[dna|DNA]] que combinam com o guia: o [[protoespacador|protoespaçador]]. Logo depois delas precisa haver o [[pam|PAM]]: duas letras G, precedidas de qualquer letra (NGG). Sem essa marca não há corte, mesmo com o guia perfeito — por isso nem todo ponto do [[genoma|genoma]] pode ser editado.' },
    { k: 'reconhecimento', t: 'A procura', b: 'A Cas9 não varre o genoma de ponta a ponta. Ela esbarra no DNA ao acaso e, a cada esbarrão, confere se ali existe um PAM. Não existindo, solta quase na hora. Existindo, segura o DNA por alguns segundos e testa o guia a partir das letras vizinhas ao PAM, a região [[seed|seed]] — e um erro logo aí costuma encerrar a tentativa. Um trecho idêntico ao guia, mas sem PAM ao lado, é simplesmente ignorado.' },
    { k: 'abertura', t: 'A abertura', b: 'Quando o guia combina, as duas fitas do DNA se separam naquele ponto. O RNA ocupa o lugar de uma delas, grudando na fita que é sua complementar. A outra fita fica solta. Essa bolha aberta é o [[rloop|R-loop]], e é ela que libera o corte.' },
    { k: 'dsb', t: 'O corte', b: 'Com o DNA aberto, as duas tesouras da proteína entram em ação: cada uma corta uma fita, três [[pb|pares de letras]] antes do PAM. O resultado é o DNA partido em dois — o que os textos chamam de [[dsb|quebra de fita dupla]], ou DSB.' },
    { k: 'nhej', t: 'Reparo rápido: NHEJ', b: 'Um DNA partido é perigoso, então a célula corre para colar as pontas. Essa colagem, o [[nhej|NHEJ]], é rápida mas desleixada: costuma perder ou ganhar algumas letras no caminho, um [[indel|indel]]. Se isso acontece dentro de um [[gene|gene]], a leitura dele sai embaralhada — o [[frameshift|frameshift]] — e a proteína deixa de ser produzida. É assim que se desliga um gene de propósito, o chamado [[knockout|knockout]].' },
    { k: 'hdr', t: 'Reparo fiel: HDR', b: 'Se o pesquisador fornecer um molde — um pedaço de DNA com a sequência desejada e pontas iguais às da região — a célula pode copiar esse molde ao consertar a quebra. É o [[hdr|HDR]], o caminho para corrigir uma mutação ou inserir algo novo. Funciona bem menos vezes que a colagem rápida, e só quando a célula está se dividindo.' },
  ],
  en: [
    { k: 'sgRNA', t: 'The guide RNA', b: 'It is the address. Its first 20 letters are chosen by the experimenter and define where [[cas9|Cas9]] will act; the rest of the [[rna|RNA]] just docks into the protein. Swap those 20 letters and the target changes — that is what makes the tool programmable.' },
    { k: 'alvo', t: 'The target and the PAM', b: 'The target is 20 letters of [[dna|DNA]] that match the guide: the [[protoespacador|protospacer]]. Right after them there must be a [[pam|PAM]]: two Gs preceded by any letter (NGG). Without that mark there is no cut, even with a perfect guide — which is why not every spot in the [[genoma|genome]] can be edited.' },
    { k: 'reconhecimento', t: 'The search', b: 'Cas9 does not sweep the genome end to end. It bumps into DNA at random and, at each bump, checks whether a PAM is there. If there is none, it lets go almost at once. If there is, it holds the DNA for a few seconds and tests the guide starting from the letters next to the PAM, the [[seed|seed]] region — and an error right there usually ends the attempt. A stretch identical to the guide but with no PAM beside it is simply ignored.' },
    { k: 'abertura', t: 'Unwinding', b: 'When the guide matches, the two DNA strands separate at that spot. The RNA takes the place of one of them, pairing with its complementary strand. The other strand is left loose. This open bubble is the [[rloop|R-loop]], and it is what unlocks the cut.' },
    { k: 'dsb', t: 'The cut', b: 'With the DNA open, the protein’s two scissors go to work: each cuts one strand, three [[pb|letter pairs]] before the PAM. The result is DNA broken in two — what textbooks call a [[dsb|double-strand break]], or DSB.' },
    { k: 'nhej', t: 'Quick repair: NHEJ', b: 'Broken DNA is dangerous, so the cell rushes to glue the ends back. That gluing, [[nhej|NHEJ]], is fast but sloppy: it often loses or gains a few letters along the way, an [[indel|indel]]. If this happens inside a [[gene|gene]], its reading comes out scrambled — a [[frameshift|frameshift]] — and the protein is no longer made. That is how a gene is switched off on purpose, a so-called [[knockout|knockout]].' },
    { k: 'hdr', t: 'Faithful repair: HDR', b: 'If the researcher supplies a template — a piece of DNA with the desired sequence and ends matching the region — the cell can copy it while fixing the break. This is [[hdr|HDR]], the route to correcting a mutation or inserting something new. It works far less often than quick gluing, and only when the cell is dividing.' },
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
        <ol className="space-y-6 lg:space-y-[30vh] lg:pb-[20vh] lg:pt-[8vh]">
          {steps.map((st, i) => (
            <li key={st.k} data-i={i} ref={(el) => { refs.current[i] = el }}
              className={`glass rounded-3xl p-7 transition duration-500 ${active === i ? 'ring-1 ring-dna/40' : 'lg:opacity-60'}`}>
              <span className="font-mono text-sm text-dna">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-2xl font-semibold">{st.t}</h3>
              <p className="mt-3 leading-relaxed text-mist"><Rich>{st.b}</Rich></p>
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

      <WhatIf
        question={t('o guia tiver só dois erros, mas bem na região seed, colada no PAM? A Cas9 acha o PAM, começa a abrir a dupla-fita — e desiste.',
          'the guide has just two errors, but right in the seed region next to the PAM? Cas9 finds the PAM, starts unwinding the duplex — and gives up.')}
        preset={{ mismatches: [12, 14] }}
      />
    </section>
  )
}
