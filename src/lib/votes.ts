// Votação compartilhada dos dilemas (Supabase). O cliente é carregado sob demanda.
// Escrita só pela função `cast_vote` (1 voto por navegador e por dilema); leitura dos totais é pública.
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import type { Stance } from '../content/ethics'

export type Tally = Record<Stance, number>
export type Tallies = Record<string, Tally>
interface Row { dilemma_id: string; stance: Stance; votes: number }

// URL e chave publicável são públicas por design (o acesso é controlado no banco).
const URL = import.meta.env.VITE_SUPABASE_URL || 'https://vroqgaybxzzwmjrfacux.supabase.co'
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_efNaQHDNkRMaXEEGtYfodw_qsTIqrqh'

export const EMPTY: Tally = { pro: 0, con: 0, depends: 0 }

let client: Promise<SupabaseClient> | null = null
const db = () => (client ??= import('@supabase/supabase-js').then(({ createClient }) => createClient(URL, KEY, { auth: { persistSession: false } })))

/** Identificador anônimo e estável deste navegador (não identifica a pessoa). */
export function voterId() {
  const key = 'protospace-voter'
  try {
    let id = localStorage.getItem(key)
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id) }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

const fold = (rows: Row[], into: Tallies = {}) => {
  for (const r of rows) into[r.dilemma_id] = { ...(into[r.dilemma_id] ?? EMPTY), [r.stance]: r.votes }
  return into
}

/** Falha de rede (offline, DNS): vale reenviar depois. Recusas do banco (validação, limite de taxa) trazem `code`. */
export const isNetworkError = (e: unknown) => !(e && typeof e === 'object' && 'code' in e && e.code)

export async function fetchTallies(): Promise<Tallies> {
  const { data, error } = await (await db()).from('dilemma_tallies').select('dilemma_id, stance, votes')
  if (error) throw error
  return fold(data as Row[])
}

/** Registra (ou troca) o voto e devolve os totais atualizados daquele dilema. */
export async function castVote(dilemma: string, stance: Stance): Promise<Tally> {
  const { data, error } = await (await db()).rpc('cast_vote', { p_dilemma: dilemma, p_voter: voterId(), p_stance: stance })
  if (error) throw error
  return fold(data as Row[])[dilemma] ?? EMPTY
}

/** Totais ao vivo: chama `onRow` a cada mudança e `onFail` se o canal for recusado. Devolve a função de cancelamento. */
export async function subscribeTallies(onRow: (dilemma: string, stance: Stance, votes: number) => void, onFail: () => void) {
  const supabase = await db()
  const channel: RealtimeChannel = supabase
    .channel('dilemma-tallies')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'dilemma_tallies' }, (p) => {
      const r = p.new as Row
      onRow(r.dilemma_id, r.stance, r.votes)
    })
    .subscribe((status) => { if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') onFail() })
  return () => { supabase.removeChannel(channel) }
}
