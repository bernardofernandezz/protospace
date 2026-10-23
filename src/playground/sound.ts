// Som procedural do modo Explorar (Web Audio, sem arquivos): ambiente do núcleo, "nado" da sonda,
// colisões, moléculas empurradas e sinos de zona/descoberta. Tudo nasce de osciladores e ruído.

let ctx: AudioContext | null = null
let master: GainNode
let fx: GainNode
let swimGain: GainNode
let swimFilter: BiquadFilterNode
let on = false
let lastBlip = 0
let lastSwim = -1

/** Escala pentatônica (dó maior): qualquer combinação soa consonante. */
const PENTA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51]

function boot(): AudioContext | null {
  if (ctx) return ctx
  if (typeof AudioContext === 'undefined') return null
  const c = new AudioContext()
  ctx = c
  master = c.createGain()
  master.gain.value = 0
  master.connect(c.destination)

  // ambiente: três osciladores graves desafinados num passa-baixa que "respira" devagar
  const pad = c.createBiquadFilter()
  pad.type = 'lowpass'
  pad.frequency.value = 380
  pad.Q.value = 5
  const padGain = c.createGain()
  padGain.gain.value = 0.09
  for (const [f, type] of [[55, 'sawtooth'], [82.4, 'triangle'], [110.3, 'sine']] as const) {
    const o = c.createOscillator()
    o.type = type
    o.frequency.value = f
    o.detune.value = (Math.random() - 0.5) * 16
    o.connect(pad)
    o.start()
  }
  const lfo = c.createOscillator()
  lfo.frequency.value = 0.06
  const depth = c.createGain()
  depth.gain.value = 200
  lfo.connect(depth).connect(pad.frequency)
  lfo.start()
  pad.connect(padGain).connect(master)

  // nado: ruído em loop num passa-banda; volume e brilho seguem a velocidade da sonda
  const noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = noise
  src.loop = true
  swimFilter = c.createBiquadFilter()
  swimFilter.type = 'bandpass'
  swimFilter.frequency.value = 260
  swimFilter.Q.value = 0.9
  swimGain = c.createGain()
  swimGain.gain.value = 0
  src.connect(swimFilter).connect(swimGain).connect(master)
  src.start()

  // efeitos curtos passam por um eco leve (sensação de espaço líquido)
  fx = c.createGain()
  const delay = c.createDelay(1)
  delay.delayTime.value = 0.27
  const feedback = c.createGain()
  feedback.gain.value = 0.32
  fx.connect(master)
  fx.connect(delay).connect(feedback).connect(delay)
  delay.connect(master)
  return c
}

const live = () => (on && ctx?.state === 'running' ? ctx : null)

/** Nota curta com envelope percussivo. */
function tone(c: AudioContext, freq: number, at: number, dur: number, gain: number, type: OscillatorType = 'sine', glideTo?: number) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, at)
  if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo, at + dur)
  g.gain.setValueAtTime(0.0001, at)
  g.gain.exponentialRampToValueAtTime(gain, at + 0.012)
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  o.connect(g).connect(fx)
  o.start(at)
  o.stop(at + dur + 0.05)
}

export const sound = {
  /** Cria/retoma o contexto. Chame dentro de um gesto do usuário (clique/tecla): política de autoplay. */
  unlock() { boot()?.resume().catch(() => {}) },

  /** Liga ou silencia (com fade); desligado, o contexto é suspenso e não gasta CPU. */
  setOn(value: boolean) {
    on = value
    const c = value ? boot() : ctx
    if (!c) return
    if (value) c.resume().catch(() => {})
    master.gain.setTargetAtTime(value ? 0.8 : 0, c.currentTime, 0.25)
    if (!value) setTimeout(() => { if (!on) c.suspend().catch(() => {}) }, 1200)
  },

  /** Velocidade da sonda normalizada (0 = parada, 1 = velocidade máxima sem turbo). */
  swim(v: number) {
    const c = live()
    if (!c || Math.abs(v - lastSwim) < 0.02) return
    lastSwim = v
    swimGain.gain.setTargetAtTime(Math.min(0.55, v * 0.3), c.currentTime, 0.12)
    swimFilter.frequency.setTargetAtTime(220 + v * 700, c.currentTime, 0.12)
  },

  /** Batida grave ao colidir (força ~ velocidade do impacto). */
  bump(strength: number) {
    const c = live()
    if (!c) return
    tone(c, 110, c.currentTime, 0.28, Math.min(0.5, 0.08 + strength * 0.05), 'sine', 42)
  },

  /** "Plic" agudo ao empurrar uma molécula (no máximo ~12 por segundo). */
  blip() {
    const c = live()
    if (!c || c.currentTime - lastBlip < 0.08) return
    lastBlip = c.currentTime
    tone(c, PENTA[Math.floor(Math.random() * PENTA.length)] * 2, c.currentTime, 0.09, 0.035, 'triangle')
  },

  /** Sino ao entrar numa zona; arpejo mais longo numa descoberta nova. */
  chime(discovery: boolean) {
    const c = live()
    if (!c) return
    const notes = discovery ? [0, 2, 4, 7] : [2, 4]
    notes.forEach((n, i) => {
      const at = c.currentTime + i * 0.09
      tone(c, PENTA[n], at, discovery ? 1.1 : 0.7, discovery ? 0.11 : 0.07)
      tone(c, PENTA[n] * 2, at, 0.5, 0.025, 'triangle')
    })
  },
}
