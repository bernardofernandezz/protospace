// Sala ao vivo: código na URL (?sala=abcd) + assinatura do experimento. Sem rede aqui, para testar em Node.

/** Código da sala na URL: 3 a 8 letras/números minúsculos, ou null. */
export function roomCode(search: string): string | null {
  const c = (new URLSearchParams(search).get('sala') ?? '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return c.length >= 3 ? c.slice(0, 8) : null
}

export const newRoomCode = () => Math.random().toString(36).slice(2, 6).padEnd(4, 'x')

/** Assinatura estável dos parâmetros do experimento (sem `sala`): mudar o experimento abre uma rodada nova. */
export function experimentSignature(search: string): string {
  const q = new URLSearchParams(search)
  q.delete('sala')
  q.sort()
  let h = 5381
  for (const ch of q.toString()) h = ((h << 5) + h + ch.charCodeAt(0)) | 0
  return (h >>> 0).toString(36)
}

/** Id da rodada no banco: casa com `^[a-z0-9.-]{3,40}$` (migration 20261105000100_live_rooms.sql). */
export const roomId = (code: string, search: string) => `${code}.${experimentSignature(search)}`
