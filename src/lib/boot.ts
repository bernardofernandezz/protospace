// Tela de carregamento inicial (#boot em index.html): fica visível até o hero 3D
// renderizar de verdade, com um limite para nunca prender o usuário.

let resolve: () => void = () => {}
/** Resolve quando a tela de carregamento começa a sair (animações de entrada esperam por ela). */
export const bootDone = new Promise<void>((r) => {
  resolve = r
})

let finished = false

export async function finishBoot() {
  if (finished) return
  finished = true
  // evita trocar de fonte depois que o conteúdo aparece
  await Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))])
  const el = document.getElementById('boot')
  el?.classList.add('boot-out')
  setTimeout(() => el?.remove(), 700)
  resolve()
}

/** Limite de segurança: em aparelhos lentos, mostra o site mesmo sem o 3D pronto (ele aparece depois). */
export const BOOT_TIMEOUT_MS = 10_000
