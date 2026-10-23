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

  await page.goto('/en/')
  await expect(page.locator('h1')).toContainText('Edit the genome')
  const og = await page.locator('meta[property="og:image"]').getAttribute('content')
  expect(og).toMatch(/og-en\.png$/)
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

test('mismatches na região seed impedem a edição', async ({ page }) => {
  await page.goto('/?lang=pt#playground')
  const bases = page.getByRole('group', { name: 'Bases do guia' }).getByRole('button')
  for (const i of [12, 14, 16]) await bases.nth(i).click()
  await page.getByRole('tab', { name: 'Resultado' }).click()
  await expect(page.getByText(/Sem edição/)).toBeVisible()
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
