import { db, voterId } from './votes'

export type RoomTally = { cut: number; nocut: number }

export async function castRoom(room: string, choice: 'cut' | 'nocut') {
  const { error } = await (await db()).rpc('room_cast', { p_room: room, p_voter: voterId(), p_choice: choice })
  if (error) throw error
}

export async function fetchRoom(room: string): Promise<RoomTally> {
  const { data, error } = await (await db()).rpc('room_tally', { p_room: room })
  if (error) throw error
  const out: RoomTally = { cut: 0, nocut: 0 }
  for (const r of data as { choice: 'cut' | 'nocut'; votes: number }[]) out[r.choice] = Number(r.votes)
  return out
}
