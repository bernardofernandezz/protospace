import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// URL pública usada em canonical/Open Graph: VITE_SITE_URL explícita, senão o domínio de produção da Vercel.
// Analytics da Vercel só existem quando o deploy é na Vercel.
process.env.VITE_ON_VERCEL ??= process.env.VERCEL ? '1' : ''
process.env.VITE_SITE_URL ??= process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:4173'

/** Metadados da versão em inglês (o LinkedIn lê o HTML sem executar JS). */
const EN_META: Record<string, string> = {
  'og:title': 'Protospace — CRISPR-Cas9 from guide to repair, in 3D',
  'og:description': 'Mechanism, best practice and bioethics of genome editing, with an interactive 3D playground: design the guide, add mismatches and watch Cas9 cut and the cell repair.',
  'og:image:alt': '3D simulation of Cas9 unwinding the DNA double helix and forming the R-loop.',
  'og:locale': 'en_US',
  'og:locale:alternate': 'pt_BR',
  'twitter:title': 'Protospace — CRISPR-Cas9 from guide to repair, in 3D',
  'twitter:description': 'Mechanism, best practice and bioethics of genome editing, with an interactive 3D playground.',
  description: 'Interactive site about CRISPR-Cas9: mechanism, tool evolution, lab best practices, applications and bioethics — with a 3D playground from guide design to DNA repair.',
}

/** robots.txt, sitemap.xml e /en/index.html (metadados em inglês) com a URL pública do build. */
function seoFiles(): Plugin {
  const site = process.env.VITE_SITE_URL!.replace(/\/$/, '')
  const today = new Date().toISOString().slice(0, 10)
  return {
    name: 'seo-files',
    enforce: 'post',
    generateBundle(_, bundle) {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\n\nSitemap: ${site}/sitemap.xml\n` })
      const url = (path: string) => `  <url><loc>${site}${path}</loc><lastmod>${today}</lastmod>` +
        `<xhtml:link rel="alternate" hreflang="pt-BR" href="${site}/"/><xhtml:link rel="alternate" hreflang="en" href="${site}/en/"/></url>`
      this.emitFile({
        type: 'asset', fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${url('/')}\n${url('/en/')}\n</urlset>\n`,
      })
      const index = bundle['index.html']
      if (index?.type !== 'asset') return
      let html = String(index.source)
        .replace('<html lang="pt-BR">', '<html lang="en">')
        .replace(/<title>[^<]*<\/title>/, '<title>Protospace · CRISPR-Cas9 from guide to repair, in 3D</title>')
        .replace(`<link rel="canonical" href="${site}/" />`, `<link rel="canonical" href="${site}/en/" />`)
        .replace(`<meta property="og:url" content="${site}/" />`, `<meta property="og:url" content="${site}/en/" />`)
        .replaceAll('/og-pt.png', '/og-en.png')
      for (const [k, v] of Object.entries(EN_META)) {
        html = html.replace(new RegExp(`(<meta (?:property|name)="${k}" content=")[^"]*"`), `$1${v}"`)
      }
      this.emitFile({ type: 'asset', fileName: 'en/index.html', source: html })
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    seoFiles(),
    // offline-first: o site precisa abrir no seminário mesmo sem Wi-Fi
    VitePWA({
      registerType: 'autoUpdate',
      // o registro do service worker não precisa bloquear a primeira pintura
      injectRegister: 'script-defer',
      includeAssets: ['favicon.svg', 'favicon-32.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      manifest: false,
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'], maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        // só os subsets latinos das fontes; os demais o navegador baixa sob demanda (unicode-range)
        globIgnores: ['**/*-{cyrillic,cyrillic-ext,greek,greek-ext,vietnamese}-*.woff2', 'og-*.png'] },
    }),
  ],
  build: {
    // o chunk do three.js (~1 MB) é carregado sob demanda, só quando o 3D entra na tela
    chunkSizeWarningLimit: 1200,
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          // React e afins num grupo próprio: senão o bundler os puxa para o chunk do three.js
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler|zustand|use-sync-external-store)[\\/]/.test(id)) return 'react'
          if (/[\\/](three|three-stdlib|postprocessing|@react-three|maath|troika|n8ao)/.test(id)) return 'three'
          if (/[\\/](gsap|lenis)[\\/]/.test(id)) return 'motion'
        },
      },
    },
  },
})
