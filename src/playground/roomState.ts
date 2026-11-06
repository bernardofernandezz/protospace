import { useState } from 'react'
import { newRoomCode, roomCode, roomId } from '../lib/room'
import { experimentUrl } from './store'

/** Código da sala deste telão: o da URL ou um novo (sorteado uma vez por visita). */
export function useRoomCode() {
  const [code] = useState(() => roomCode(location.search) ?? newRoomCode())
  return code
}

/** Rodada atual: o código da sala mais a assinatura dos parâmetros do experimento (a mesma que o aluno recebe pelo QR). */
export const currentRoom = (code: string) => roomId(code, new URL(experimentUrl()).search)
