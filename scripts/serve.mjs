// Servidor estático de dist/ que aplica os cabeçalhos do vercel.json — para testar a CSP
// e os cabeçalhos de segurança exatamente como em produção. Uso: node scripts/serve.mjs [porta]
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const root = new URL('../dist/', import.meta.url).pathname
const { headers: rules } = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' }
// "source" do Vercel ("/(.*)", "/assets/(.*)") → regex
const match = (source, path) => new RegExp(`^${source.replace(/\(\.\*\)/g, '.*')}$`).test(path)

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  for (const r of rules) if (match(r.source, path)) for (const h of r.headers) res.setHeader(h.key, h.value)
  let file = normalize(join(root, path))
  if (!file.startsWith(root)) { res.writeHead(403).end(); return }
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html') } catch { file = join(root, 'index.html') }
  try {
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body)
  } catch { res.writeHead(404).end('not found') }
}).listen(Number(process.argv[2] ?? 4173), () => console.log(`serving dist with vercel.json headers on :${process.argv[2] ?? 4173}`))
