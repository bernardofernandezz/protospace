# Protospace

**CRISPR-Cas9, do guia ao reparo, em 3D.** · *CRISPR-Cas9 from guide to repair, in 3D.*

![Preview](docs/preview.png)

O nome vem do *protoespaçador* — os 20 nucleotídeos que o RNA guia reconhece no DNA.

Site interativo (PT/EN) sobre CRISPR-Cas9 — mecanismo, evolução da ferramenta, boas práticas, aplicações e bioética — com um **playground 3D** que simula um experimento do desenho do guia ao reparo do DNA.

*Interactive bilingual site about CRISPR-Cas9 with a procedural 3D playground, from guide design to DNA repair.*

## Destaques

- **Simulação 3D procedural** (React Three Fiber + GLSL): B-DNA com sulcos maior/menor, Cas9 com domínios REC/HNH/RuvC/PI, busca com paradas em PAMs, R-loop, dobra do DNA, corte (DSB ou nick), editor de bases, NHEJ (Ku70/80 + ligase) e HDR com molde doador. Câmera cinematográfica, profundidade de campo, bloom e AO, com qualidade adaptativa.
- **Lógica de sequência real** (`src/lib/dna.ts`): busca de PAM NGG, pontos de corte, indels reproduzíveis por semente, HDR e edição de bases — testada em `src/lib/dna.check.ts`.
- **Para apresentar**: modo cinema (`M`), modo apresentação com QR code (`P`), atalhos de teclado, link que reproduz o experimento e captura PNG.
- **Bilíngue** (`?lang=en` ou `/en/`), acessível (teclado, leitores de tela, reduzir movimento), **offline** (PWA).
- Lighthouse mobile: Performance 91 · Acessibilidade 100 · Boas práticas 100 · SEO 100 (medição local).

## Rodando

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # typecheck + build de produção em dist/
npm run preview      # serve o build
```

## Qualidade

```bash
npm run lint
npm run typecheck
npm test             # lógica de sequência
npm run test:e2e     # Playwright (desktop + mobile) contra o build
```

O CI (`.github/workflows/ci.yml`) roda tudo isso a cada push/PR.

## Deploy (Vercel)

Importe o repositório na Vercel (framework: Vite). Cabeçalhos de segurança e cache estão em `vercel.json`. A URL pública usada em canonical/Open Graph vem de `VITE_SITE_URL` ou, se ausente, do domínio de produção da Vercel. Depois do deploy, valide o preview no [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/).

## Conteúdo e assets

- Textos (PT/EN) ficam em `src/content/` e nas seções; nome, links e stack do autor em `src/content/site.ts`.
- Imagens Open Graph: `node scripts/og.mjs http://localhost:5173` (com `npm run dev` rodando).
- Ícones: `node scripts/icons.mjs` (a partir de `public/favicon.svg`).

> Simulação didática simplificada: números e probabilidades são ilustrativos, não previsões experimentais.

## Licença

[MIT](LICENSE) © Bernardo Fernandez
