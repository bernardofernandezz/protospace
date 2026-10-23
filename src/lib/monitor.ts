// Erros de produção no Sentry. O SDK só é baixado depois do boot e só se houver DSN (variável VITE_SENTRY_DSN).
// shortcut: erros anteriores ao fim do boot não são capturados; carregar o SDK no main.tsx se isso fizer falta.
type Sentry = typeof import('@sentry/browser')

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
let sentry: Promise<Sentry> | undefined

export function initMonitoring() {
  if (!DSN || import.meta.env.DEV || sentry) return
  sentry = import('@sentry/browser').then((S) => {
    S.init({ dsn: DSN, sendDefaultPii: false, tracesSampleRate: 0 })
    return S
  })
}

/** Envia um erro já tratado (ex.: falha do 3D que mostrou o fallback). */
export const report = (e: unknown) => { void sentry?.then((S) => S.captureException(e), () => {}) }
