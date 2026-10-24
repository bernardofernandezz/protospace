import { useEffect } from 'react'
import { STEP_COUNT, STEP_SECONDS, useSim } from './store'

/** Quanto o modo cinema segura o último quadro antes de seguir para a próxima etapa. */
const CINEMA_HOLD_S = 1.4

type State = ReturnType<typeof useSim.getState>

const running = (st: State) => st.playing || st.cinema

/**
 * Relógio da simulação: avança o progresso da etapa atual, pausado fora da viewport.
 * Só gasta quadros enquanto há algo tocando (play ou modo cinema).
 */
export function useSimClock(inView: boolean) {
  useEffect(() => {
    let raf = 0
    let last = 0
    let hold = 0

    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000)
      last = now
      const st = useSim.getState()
      if (st.playing && (inView || st.presentation)) {
        const p = Math.min(1, st.progress + (dt * st.speed) / STEP_SECONDS[st.step])
        st.set({ progress: p, playing: p < 1 })
      } else if (st.cinema && st.progress >= 1) {
        hold += dt
        if (hold > CINEMA_HOLD_S) {
          hold = 0
          if (st.step < STEP_COUNT - 1) st.goto(st.step + 1)
          else st.set({ cinema: false })
        }
      }
      raf = running(useSim.getState()) ? requestAnimationFrame(tick) : 0
    }

    const sync = (st: State) => {
      if (!running(st) || raf) return
      last = performance.now()
      raf = requestAnimationFrame(tick)
    }

    sync(useSim.getState())
    const unsub = useSim.subscribe(sync)
    return () => {
      unsub()
      cancelAnimationFrame(raf)
    }
  }, [inView])
}
