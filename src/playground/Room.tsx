import { useEffect, useState } from 'react'
import { useT } from '../i18n'
import { fetchRoom, type RoomTally as Tally } from '../lib/roomApi'
import { currentRoom } from './roomState'
import { useParams } from './store'

/** Contagem ao vivo das respostas da plateia (modo apresentação). Relê a cada 3 s; falha de rede só pausa. */
export default function RoomTally({ code }: { code: string }) {
  const t = useT()
  const params = useParams() // muda quando o experimento muda: nova rodada
  const [tally, setTally] = useState<Tally | null>(null)

  useEffect(() => {
    const room = currentRoom(code)
    let alive = true
    const tick = () =>
      fetchRoom(room).then(
        (x) => alive && setTally(x),
        () => {},
      )
    void tick()
    const id = setInterval(tick, 3000)
    return () => {
      alive = false
      clearInterval(id)
    }
  }, [code, params])

  if (!tally) return null
  const total = tally.cut + tally.nocut
  return (
    <p role="status" className="glass absolute left-4 top-24 hidden rounded-xl px-3 py-2 text-sm md:block">
      <b className="font-mono text-xs text-mist">
        {t('Sala', 'Room')} {code}
      </b>
      <br />
      {t('Vai cortar', 'It will cut')}: <b className="text-bio">{tally.cut}</b> · {t('Não vai', 'It won’t')}: <b className="text-cas">{tally.nocut}</b>
      <span className="text-mist"> ({total})</span>
    </p>
  )
}
