import { track as vercelTrack } from '@vercel/analytics'

/** Evento customizado do Vercel Analytics; só envia no deploy da Vercel (o mesmo critério do <Analytics />). */
export function track(name: string, data?: Record<string, string | number | boolean>) {
  if (import.meta.env.VITE_ON_VERCEL !== '1') return
  vercelTrack(name, data)
}
