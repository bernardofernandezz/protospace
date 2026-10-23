import { expect, test, type Page } from '@playwright/test'

/** Coleta erros de console/página durante o teste. */
function trackErrors(page: Page) {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
  return errors
}

test('abre em português sem erros e sem placeholders', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/?lang=pt')
  await expect(page.locator('h1')).toContainText('Editar')
  await expect(page).toHaveTitle(/CRISPR-Cas9/)
  const text = await page.locator('main').innerText()
  expect(text).not.toMatch(/conteúdo a inserir|\[verificar\]/i)
  await page.locator('#referencias').scrollIntoViewIfNeeded()
  await expect(page.getByRole('link', { name: /DOI/ }).first()).toBeVisible()
  expect(errors, errors.join('\n')).toEqual([])
})

test('alterna para inglês pelo seletor e pelo caminho /en/', async ({ page }) => {
  await page.goto('/?lang=pt')
  await page.getByRole('button', { name: 'en', exact: true }).click()
  await expect(page.locator('h1')).toContainText('Edit the genome')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page).toHaveURL(/\/en\/$/)

  await page.goto('/en/')
  await expect(page.locator('h1')).toContainText('Edit the genome')
  const og = await page.locator('meta[property="og:image"]').getAttribute('content')
  expect(og).toMatch(/og-en\.png$/)
  expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toMatch(/\/en\/$/)
})

test('playground percorre as 6 etapas e mostra o resultado', async ({ page }) => {
  const errors = trackErrors(page)
  await page.goto('/?lang=pt#playground')
  const steps = page.getByRole('list', { name: 'Etapas do experimento' }).getByRole('button')
  await expect(steps).toHaveCount(6)
  await steps.nth(5).click()
  await expect(steps.nth(5)).toHaveAttribute('aria-current', 'step')
  await expect(page.getByRole('tab', { name: 'Resultado' })).toHaveAttribute('aria-selected', 'true')
  await expect(page.getByText('Eficiência simulada').first()).toBeVisible()
  // a cena 3D monta (canvas WebGL) sem quebrar a página
  await expect(page.locator('.stage canvas').first()).toBeVisible({ timeout: 20_000 })
  expect(errors, errors.join('\n')).toEqual([])
})

test('modo Explorar liga, mostra "voar até" e sai com Esc', async ({ page, isMobile }) => {
  // dois voos guiados com WebGL por software (runner do CI) passam de 60 s
  test.setTimeout(120_000)
  const errors = trackErrors(page)
  await page.goto('/?lang=pt#playground')
  await page.locator('.stage').scrollIntoViewIfNeeded()
  await expect(page.locator('.stage canvas').first()).toBeVisible({ timeout: 20_000 })
  const btn = page.getByRole('toolbar', { name: 'Controles da simulação' }).getByRole('button', { name: /Explorar/ })
  await btn.click()
  await expect(btn).toHaveAttribute('aria-pressed', 'true')
  const snd = page.getByRole('toolbar', { name: 'Controles da simulação' }).getByRole('button', { name: 'Som' })
  await snd.click()
  await expect(snd).toHaveAttribute('aria-pressed', 'false')
  await snd.click()
  await expect(snd).toHaveAttribute('aria-pressed', 'true')
  // missão 1: "Ir" voa até o guia e a trilha avança
  await expect(page.getByText('Missão 1/11')).toBeVisible()
  await page.getByRole('button', { name: 'Ir', exact: true }).click()
  await expect(page.getByText('Missão 2/11')).toBeVisible({ timeout: 30_000 })
  if (isMobile) {
    // no toque o palco cobre a tela inteira e o "voar até" fica atrás do botão Mapa
    const vp = page.viewportSize()!
    expect(await page.locator('.stage').boundingBox()).toEqual({ x: 0, y: 0, width: vp.width, height: vp.height })
    await page.getByRole('button', { name: 'Mapa' }).click()
  }
  const fly = page.getByRole('group', { name: 'Voar até' })
  await fly.getByRole('button', { name: 'Corte' }).click()
  // voo guiado; com WebGL por software (CI) o quadro é lento
  await expect(page.getByText('Sítio de corte')).toBeVisible({ timeout: 30_000 })
  await page.keyboard.press('Escape')
  await expect(btn).toHaveAttribute('aria-pressed', 'false')
  expect(errors, errors.join('\n')).toEqual([])
})

test('missões de pilotagem mostram o progresso e podem ser puladas', async ({ page }) => {
  // trilha já nas missões de coleta (4ª) e de carga (7ª)
  await page.addInitScript(() => localStorage.setItem('protospace.missions', JSON.stringify(['find-guide', 'find-pam', 'find-decoy'])))
  await page.goto('/?lang=pt#playground')
  await page.locator('.stage').scrollIntoViewIfNeeded()
  await expect(page.locator('.stage canvas').first()).toBeVisible({ timeout: 20_000 })
  await page.getByRole('toolbar', { name: 'Controles da simulação' }).getByRole('button', { name: /Explorar/ }).click()
  await expect(page.getByText('Missão 4/11')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Ir', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Pular' }).click()
  await expect(page.getByText('Missão 5/11')).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('protospace.missions'))).toContain('collect-bases')
})

test('mismatches na região seed impedem a edição', async ({ page }) => {
  await page.goto('/?lang=pt#playground')
  const bases = page.getByRole('group', { name: 'Bases do guia' }).getByRole('button')
  for (const i of [12, 14, 16]) await bases.nth(i).click()
  await page.getByRole('tab', { name: 'Resultado' }).click()
  await expect(page.getByText(/Sem edição/)).toBeVisible()
})

test('link compartilhável restaura o experimento', async ({ page }) => {
  await page.goto('/?lang=pt&cas=be&delivery=viral&tol=9#playground')
  await page.getByRole('tab', { name: 'Parâmetros' }).click()
  await expect(page.getByRole('button', { name: 'Editor de bases (CBE)' })).toHaveAttribute('aria-pressed', 'true')
  // valores fora da lista fechada caem no padrão / são limitados
  await page.goto('/?lang=pt&cas=<script>#playground')
  await page.getByRole('tab', { name: 'Parâmetros' }).click()
  await expect(page.getByRole('button', { name: 'Editor de bases (CBE)' })).toHaveAttribute('aria-pressed', 'false')
})

test('sem WebGL, o playground continua funcional', async ({ page }) => {
  await page.addInitScript(() => {
    const orig = HTMLCanvasElement.prototype.getContext
    // @ts-expect-error — simula navegador sem WebGL
    HTMLCanvasElement.prototype.getContext = function (type: string, ...rest: unknown[]) {
      return /webgl/.test(type) ? null : orig.call(this, type as '2d', ...(rest as []))
    }
  })
  await page.goto('/?lang=pt#playground')
  await expect(page.getByText('WebGL indisponível neste navegador')).toBeVisible()
  await expect(page.getByRole('tab', { name: 'Parâmetros' })).toBeVisible()
})

test('dilemas: votação compartilhada mostra resultado só depois do voto', async ({ page }) => {
  // sem rolagem suave: o Lenis pode sobrescrever a rolagem programática do teste (falha intermitente)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const rows = (d: string, pro: number, con: number, depends: number) => [
    { dilemma_id: d, stance: 'pro', votes: pro }, { dilemma_id: d, stance: 'con', votes: con }, { dilemma_id: d, stance: 'depends', votes: depends },
  ]
  // Supabase simulado: o teste nunca grava votos no banco real
  await page.route('**/rest/v1/dilemma_tallies*', (r) => r.fulfill({ json: [...rows('embriao', 3, 1, 0), ...rows('gene-drive', 0, 0, 0), ...rows('sus', 2, 2, 1)] }))
  let sent: unknown
  await page.route('**/rest/v1/rpc/cast_vote', (r) => { sent = r.request().postDataJSON(); return r.fulfill({ json: rows('embriao', 4, 1, 0) }) })
  await page.routeWebSocket(/supabase\.co/, () => { /* sem tempo real no teste */ })

  await page.goto('/?lang=pt#bioetica')
  const card = page.locator('article', { hasText: 'Editar embriões' })
  await card.scrollIntoViewIfNeeded()
  await expect(card.getByText('4 pessoas votaram ·')).toBeVisible()
  await expect(card.getByText('80%')).toHaveCount(0)

  await card.getByRole('button', { name: 'A favor' }).click()
  await expect(card.getByText('· 5 pessoas votaram')).toBeVisible()
  await expect(card.getByText('80%')).toBeVisible()
  await expect(card.getByRole('button', { name: 'A favor' })).toHaveAttribute('aria-pressed', 'true')
  expect(sent).toMatchObject({ p_dilemma: 'embriao', p_stance: 'pro' })
})

test('dilemas: voto recusado pelo banco é desfeito; falha de rede fica na fila', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const rows = ['embriao', 'gene-drive', 'sus'].flatMap((d) => ['pro', 'con', 'depends'].map((stance) => ({ dilemma_id: d, stance, votes: 1 })))
  await page.route('**/rest/v1/dilemma_tallies*', (r) => r.fulfill({ json: rows }))
  let rejected = true
  await page.route('**/rest/v1/rpc/cast_vote', (r) => rejected
    ? r.fulfill({ status: 400, json: { code: 'P0001', message: 'rate limit', details: null, hint: null } })
    : r.abort('internetdisconnected'))
  await page.routeWebSocket(/supabase\.co/, () => { /* sem tempo real no teste */ })

  await page.goto('/?lang=pt#bioetica')
  const card = page.locator('article', { hasText: 'Editar embriões' })
  await card.scrollIntoViewIfNeeded()
  const pro = card.getByRole('button', { name: 'A favor' })

  await pro.click()
  await expect(pro).toHaveAttribute('aria-pressed', 'false')

  rejected = false
  await pro.click()
  await expect(card.getByText(/sem conexão/)).toBeVisible()
  expect(await page.evaluate(() => localStorage.getItem('protospace-pending-votes'))).toContain('"embriao":"pro"')
})

test('dilemas: canal de tempo real recusado cai para releitura periódica', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.clock.install()
  let votes = 1
  await page.route('**/rest/v1/dilemma_tallies*', (r) => r.fulfill({
    json: ['embriao', 'gene-drive', 'sus'].flatMap((d) => ['pro', 'con', 'depends'].map((stance) => ({ dilemma_id: d, stance, votes }))),
  }))
  // servidor recusa o canal (ex.: limite de conexões estourado num pico)
  await page.routeWebSocket(/supabase\.co/, (ws) => ws.close())

  await page.goto('/?lang=pt#bioetica')
  const card = page.locator('article', { hasText: 'Editar embriões' })
  await card.scrollIntoViewIfNeeded()
  await expect(card.getByText('3 pessoas votaram ·')).toBeVisible()

  votes = 2
  await page.clock.runFor(31_000)
  await expect(card.getByText('6 pessoas votaram ·')).toBeVisible()
})

test('cabeçalhos de segurança de produção estão presentes', async ({ request }) => {
  const res = await request.get('/')
  const h = res.headers()
  expect(h['content-security-policy']).toContain("default-src 'self'")
  expect(h['content-security-policy']).toContain("object-src 'none'")
  expect(h['content-security-policy']).toContain("frame-ancestors 'none'")
  expect(h['x-content-type-options']).toBe('nosniff')
  expect(h['x-frame-options']).toBe('DENY')
  expect(h['strict-transport-security']).toContain('max-age=')
  expect(h['cross-origin-opener-policy']).toBe('same-origin')
})
