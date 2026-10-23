// Erros de produção no Sentry. O SDK só é baixado depois do boot e só se houver DSN (variável VITE_SENTRY_DSN);
// erros anteriores ficam numa fila e são enviados assim que ele carrega.
type Sentry = typeof import('@sentry/browser')

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
const ON = !!DSN && !import.meta.env.DEV
let sentry: Promise<Sentry> | undefined

const early: unknown[] = []
const keep = (e: ErrorEvent | PromiseRejectionEvent) => { if (early.length < 20) early.push('reason' in e ? e.reason : e.error ?? e.message) }
if (ON) { addEventListener('error', keep); addEventListener('unhandledrejection', keep) }

export function initMonitoring() {
  if (!ON || sentry) return
  sentry = import('@sentry/browser').then((S) => {
    S.init({ dsn: DSN, sendDefaultPii: false, tracesSampleRate: 0 })
    removeEventListener('error', keep)
    removeEventListener('unhandledrejection', keep)
    early.splice(0).forEach((e) => S.captureException(e))
    return S
  })
}

/** Envia um erro já tratado (ex.: falha do 3D que mostrou o fallback). Antes do SDK carregar, entra na fila. */
export const report = (e: unknown) => {
  if (!ON) return
  if (sentry) void sentry.then((S) => S.captureException(e), () => {})
  else if (early.length < 20) early.push(e)
}
