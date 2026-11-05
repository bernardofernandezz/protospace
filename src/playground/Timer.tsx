import { useEffect, useState } from 'react'

/** Cronômetro do modo apresentação: conta desde que o modo foi ligado. */
export default function Timer() {
  const [s, setS] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setS((x) => x + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return (
    <p
      role="timer"
      aria-label="Tempo de apresentação"
      className="glass absolute bottom-24 right-4 hidden rounded-xl px-3 py-1.5 font-mono text-sm tabular-nums md:block"
    >
      {mm}:{ss}
    </p>
  )
}
