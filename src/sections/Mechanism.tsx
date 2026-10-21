import { useEffect, useRef, useState } from 'react'
import SectionHeader from '../components/SectionHeader'

const STEPS = [
  { k: 'sgRNA', t: 'O RNA guia', b: 'É o endereço. Suas primeiras 20 letras são escolhidas por quem faz o experimento e definem onde a Cas9 vai agir; o resto do RNA só serve para encaixar na proteína. Trocando essas 20 letras, muda-se o alvo — é isso que torna a ferramenta programável.' },
  { k: 'alvo', t: 'O alvo e a marca PAM', b: 'O alvo são 20 letras do DNA que combinam com o guia. Logo depois delas precisa haver o PAM: duas letras G, precedidas de qualquer letra (NGG). Sem essa marca não há corte, mesmo com o guia perfeito — por isso nem todo ponto do genoma pode ser editado.' },
  { k: 'reconhecimento', t: 'A procura', b: 'A Cas9 desliza pelo DNA procurando PAMs. Cada vez que acha um, confere se o guia combina com as letras ao lado. Na imensa maioria das vezes não combina, e ela segue adiante. A conferência começa pelas letras vizinhas ao PAM: um erro ali já basta para a enzima desistir.' },
  { k: 'abertura', t: 'A abertura', b: 'Quando o guia combina, as duas fitas do DNA se separam naquele ponto. O RNA ocupa o lugar de uma delas, grudando na fita que é sua complementar. A outra fita fica solta. Essa bolha aberta é chamada de R-loop.' },
  { k: 'dsb', t: 'O corte', b: 'Com o DNA aberto, as duas tesouras da proteína entram em ação: cada uma corta uma fita, três letras antes do PAM. O resultado é o DNA partido em dois — o que os textos chamam de quebra de fita dupla, ou DSB.' },
  { k: 'nhej', t: 'Reparo rápido: NHEJ', b: 'Um DNA partido é perigoso, então a célula corre para colar as pontas. Essa colagem é rápida, mas desleixada: costuma perder ou ganhar algumas letras no caminho. Se isso acontece dentro de um gene, a leitura dele sai embaralhada e a proteína deixa de ser produzida. É assim que se desliga um gene de propósito.' },
  { k: 'hdr', t: 'Reparo fiel: HDR', b: 'Se o pesquisador fornecer um molde — um pedaço de DNA com a sequência desejada e pontas iguais às da região — a célula pode copiar esse molde ao consertar a quebra. É assim que se corrige uma mutação ou se insere algo novo. Funciona bem menos vezes que a colagem rápida, e só quando a célula está se dividindo.' },
]

const XS = Array.from({ length: 26 }, (_, i) => 30 + i * 22)
const BASE = ['#3ee6a0', '#ff5c8a', '#4cc9ff', '#ffc24b']
const T_START = 8, T_END = 17, PAM_END = 20 // índices de base: alvo [8,18), PAM [18,21)
const CUT = (XS[14] + XS[15]) / 2

/** Ilustração esquemática que muda conforme a etapa ativa. */
function Diagram({ s }: { s: number }) {
  const open = s >= 3 && s <= 4
  const gap = s === 4 ? 16 : 0
  const show = (cond: boolean) => ({ opacity: cond ? 1 : 0, transition: 'opacity .6s, transform .8s cubic-bezier(.2,.8,.2,1)' })
  const shift = (x: number) => (x < CUT ? -gap / 2 : gap / 2)
  const topY = (i: number) => (open && i >= T_START && i <= T_END + 0 ? 112 - Math.sin(((i - T_START + 1) / (T_END - T_START + 2)) * Math.PI) * 50 : 112)

  return (
    <svg viewBox="0 0 620 360" className="w-full" role="img" aria-label={`Diagrama: ${STEPS[s].t}`}>
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {/* Cas9 */}
      <g style={{ ...show(s >= 2 && s <= 4), transform: `translateX(${s >= 2 ? 0 : -260}px)` }}>
        <ellipse cx="300" cy="105" rx="170" ry="70" fill="#ff4fa3" fillOpacity=".12" stroke="#ff4fa3" strokeOpacity=".5" />
        <ellipse cx="330" cy="200" rx="160" ry="55" fill="#ff7a59" fillOpacity=".12" stroke="#ff7a59" strokeOpacity=".5" />
        <text x="160" y="60" fill="#ff4fa3" fontSize="12">lóbulo REC</text>
        <text x="420" y="262" fill="#ff7a59" fontSize="12">lóbulo NUC (HNH, RuvC, PI)</text>
      </g>

      {/* fitas de DNA */}
      {XS.map((x, i) => {
        const inT = i >= T_START && i <= T_END
        const inP = i > T_END && i <= PAM_END
        const dx = shift(x)
        const hl = s >= 1 && (inT || inP)
        return (
          <g key={i} style={{ transform: `translateX(${dx}px)`, transition: 'transform .8s' }}>
            <line x1={x} x2={x} y1={topY(i) + 6} y2={open && inT ? topY(i) + 18 : 150} stroke={BASE[(i * 3) % 4]} strokeOpacity={hl ? 1 : 0.35} strokeWidth="5" strokeLinecap="round" style={{ transition: 'all .8s' }} />
            <line x1={x} x2={x} y1="162" y2="200" stroke={BASE[(i * 3 + 1) % 4]} strokeOpacity={hl ? 1 : 0.35} strokeWidth="5" strokeLinecap="round" />
            <circle cx={x} cy={topY(i)} r="6" fill={inP && s >= 1 ? '#ff4fa3' : '#3ef0d0'} style={{ transition: 'all .8s' }} />
            <circle cx={x} cy="206" r="6" fill="#2a9df4" />
          </g>
        )
      })}
      <text x="8" y="116" fill="#a9b8c9" fontSize="11">5′</text>
      <text x="600" y="116" fill="#a9b8c9" fontSize="11">3′</text>
      <text x="8" y="210" fill="#a9b8c9" fontSize="11">3′</text>
      <text x="600" y="210" fill="#a9b8c9" fontSize="11">5′</text>

      {/* rótulos de alvo e PAM */}
      <g style={show(s === 1 || s === 2)}>
        <rect x={XS[T_START] - 10} y="225" width={XS[T_END] - XS[T_START] + 20} height="3" fill="#3ef0d0" />
        <text x={(XS[T_START] + XS[T_END]) / 2} y="246" textAnchor="middle" fill="#3ef0d0" fontSize="12">protoespaçador (20 nt)</text>
        <rect x={XS[T_END + 1] - 10} y="225" width={XS[PAM_END] - XS[T_END + 1] + 20} height="3" fill="#ff4fa3" />
        <text x={(XS[T_END + 1] + XS[PAM_END]) / 2} y="246" textAnchor="middle" fill="#ff4fa3" fontSize="12">PAM NGG</text>
      </g>

      {/* sgRNA */}
      <g style={show(s <= 4 && s !== 1)}>
        {XS.slice(T_START, T_END + 1).map((x, i) => (
          <circle key={i} cx={x} cy={s >= 3 && s <= 4 ? 150 : 40} r="5" fill="#ffb547" style={{ transition: 'cy .8s' }} />
        ))}
        <path d={`M${XS[T_END] + 8} ${s >= 3 && s <= 4 ? 150 : 40} C 500 ${s >= 3 ? 120 : 30}, 540 20, 490 0 S 450 40, 520 60`} stroke="#ffb547" strokeWidth="5" fill="none" strokeLinecap="round" style={{ transition: 'd .8s' }} />
        <text x="470" y="85" fill="#ffb547" fontSize="12" style={show(s === 0)}>scaffold</text>
        <text x={XS[T_START]} y="22" fill="#ffb547" fontSize="12" style={show(s === 0)}>espaçador 5′ (20 nt)</text>
      </g>

      {/* corte */}
      <g style={show(s === 4)} filter="url(#glow)">
        <line x1={CUT} x2={CUT} y1="90" y2="220" stroke="#fff" strokeWidth="2" strokeDasharray="5 5" />
        <text x={CUT} y="300" textAnchor="middle" fill="#fff" fontSize="13">DSB · 3 pb a montante do PAM</text>
      </g>

      {/* NHEJ */}
      <g style={show(s === 5)}>
        <rect x={CUT - 16} y="96" width="32" height="120" rx="8" fill="#ff5c5c" fillOpacity=".18" stroke="#ff5c5c" />
        <text x={CUT} y="300" textAnchor="middle" fill="#ff8a8a" fontSize="13">indel (ex.: +1 ou −4 nt) → frameshift?</text>
      </g>

      {/* HDR */}
      <g style={{ ...show(s === 6), transform: s === 6 ? 'none' : 'translateY(-40px)' }}>
        <line x1={XS[6]} x2={XS[22]} y1="60" y2="60" stroke="#7dff9b" strokeWidth="6" strokeLinecap="round" strokeOpacity=".5" />
        <line x1={CUT - 24} x2={CUT + 24} y1="60" y2="60" stroke="#fff" strokeWidth="8" strokeLinecap="round" />
        <text x={XS[6]} y="45" fill="#7dff9b" fontSize="12">molde doador: braço de homologia · edição · braço</text>
        <rect x={CUT - 24} y="96" width="48" height="120" rx="8" fill="#7dff9b" fillOpacity=".18" stroke="#7dff9b" />
        <text x={CUT} y="300" textAnchor="middle" fill="#7dff9b" fontSize="13">sequência copiada do molde</text>
      </g>
    </svg>
  )
}

export default function Mechanism() {
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
      <SectionHeader n="02" eyebrow="Como funciona" title={<>Procurar, abrir, <span className="text-gradient">cortar</span> — e deixar a célula reparar.</>}
        lead="Role a página e a ilustração acompanha cada etapa. Vale guardar uma ideia antes de começar: a Cas9 não reescreve o DNA. Ela apenas corta. Quem define o resultado final é a própria célula, ao consertar o corte." />
      <div className="grid gap-10 lg:grid-cols-[1fr_1.25fr]">
        <ol className="space-y-[30vh] pb-[20vh] lg:pt-[8vh]">
          {STEPS.map((st, i) => (
            <li key={st.k} data-i={i} ref={(el) => { refs.current[i] = el }}
              className={`glass rounded-3xl p-7 transition duration-500 ${active === i ? 'opacity-100 ring-1 ring-dna/40' : 'opacity-40'}`}>
              <span className="font-mono text-sm text-dna">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-2 text-2xl font-semibold">{st.t}</h3>
              <p className="mt-3 leading-relaxed text-mist">{st.b}</p>
              {/* em telas pequenas a ilustração aparece junto ao texto */}
              <div className="mt-5 lg:hidden"><Diagram s={i} /></div>
            </li>
          ))}
        </ol>
        <div className="hidden lg:block">
          <div className="glass sticky top-24 rounded-3xl p-6">
            <div className="mb-3 flex items-center justify-between">
              <span className="hud-label">Etapa {active + 1} / {STEPS.length}</span>
              <span className="font-display text-sm text-white">{STEPS[active].t}</span>
            </div>
            <Diagram s={active} />
            <div className="mt-4 flex gap-1.5" aria-hidden="true">
              {STEPS.map((_, i) => <span key={i} className={`h-1 flex-1 rounded-full transition ${i <= active ? 'bg-dna' : 'bg-white/10'}`} />)}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
