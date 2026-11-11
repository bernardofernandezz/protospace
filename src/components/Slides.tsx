import { lazy, Suspense, useEffect, useState } from 'react'
import { track } from '../lib/track'

const Deck = lazy(() => import('../slides/Deck'))

/** Porta de entrada do modo slide: o botão do Hero (evento `start-slides`) ou a tecla S abrem o deck. */
export default function Slides() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    const start = () => {
      track('slides_start')
      setOn(true)
    }
    const onS = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 's' && !e.metaKey && !e.ctrlKey && !e.altKey && !(e.target as HTMLElement).closest('input, textarea, select')) start()
    }
    addEventListener('start-slides', start)
    addEventListener('keydown', onS)
    return () => {
      removeEventListener('start-slides', start)
      removeEventListener('keydown', onS)
    }
  }, [])
  return on ? (
    <Suspense fallback={null}>
      <Deck onExit={() => setOn(false)} />
    </Suspense>
  ) : null
}
