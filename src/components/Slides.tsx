import { lazy, Suspense, useEffect, useState } from 'react'
import { track } from '../lib/track'

const Deck = lazy(() => import('../slides/Deck'))

/** Porta de entrada do modo slide: só o botão do Hero (evento `start-slides`) abre o deck. */
export default function Slides() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const start = () => {
      track('slides_start')
      setOn(true)
    }
    addEventListener('start-slides', start)
    return () => removeEventListener('start-slides', start)
  }, [])
  return on ? (
    <Suspense fallback={null}>
      <Deck onExit={() => setOn(false)} />
    </Suspense>
  ) : null
}
