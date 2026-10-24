// Servidor estático de dist/ que aplica os cabeçalhos do vercel.json — para testar a CSP
// e os cabeçalhos de segurança exatamente como em produção. Comprime em brotli como a Vercel, para o Lighthouse
// medir o peso real da página. Uso: node scripts/serve.mjs [porta]
import { createServer } from 'node:http'
import { brotliCompressSync } from 'node:zlib'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const root = new URL('../dist/', import.meta.url).pathname
const { headers: rules } = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'))
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' }
// "source" do Vercel ("/(.*)", "/assets/(.*)") → regex
const br = new Map()
const match = (source, path) => new RegExp(`^${source.replace(/\(\.\*\)/g, '.*')}$`).test(path)

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  // upgrade-insecure-requests sai daqui: servimos em http://localhost e o WebKit (ao contrário do Chrome) também promove
  // localhost para https, quebrando todos os scripts. Em produção o site já é https e a diretiva não muda nada.
  for (const r of rules) if (match(r.source, path)) for (const h of r.headers) res.setHeader(h.key, h.key === 'Content-Security-Policy' ? h.value.replace(/;\s*upgrade-insecure-requests/, '') : h.value)
  let file = normalize(join(root, path))
  if (!file.startsWith(root)) { res.writeHead(403).end(); return }
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html') } catch { file = join(root, 'index.html') }
  try {
    const type = TYPES[extname(file)] ?? 'application/octet-stream'
    let body = await readFile(file)
    if (/text|javascript|json|xml|svg/.test(type) && /\bbr\b/.test(req.headers['accept-encoding'] ?? '')) {
      // brotli no nível máximo é lento: comprime cada arquivo uma vez só
      body = br.get(file) ?? br.set(file, brotliCompressSync(body)).get(file)
      res.setHeader('Content-Encoding', 'br')
    }
    res.writeHead(200, { 'Content-Type': type, Vary: 'Accept-Encoding' }).end(body)
  } catch { res.writeHead(404).end('not found') }
}).listen(Number(process.argv[2] ?? 4173), () => console.log(`serving dist with vercel.json headers on :${process.argv[2] ?? 4173}`))
