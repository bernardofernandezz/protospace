<div align="center">

# Protospace

**CRISPR-Cas9, do guia ao reparo, em 3D.**

[**Abrir o site →**](https://protospace-crispr.vercel.app) · [English version](https://protospace-crispr.vercel.app/en/)

![Prévia do Protospace](docs/preview.png)

</div>

## O que é

O Protospace é um site interativo que explica a edição genética com CRISPR-Cas9, criado para apoiar um seminário de biologia molecular e bioética.

Em vez de só ler sobre o mecanismo, você **conduz um experimento em 3D**: escolhe onde cortar o DNA, cria erros no RNA guia e vê a Cas9 procurar o alvo, cortar e a célula consertar o corte. Ao lado da simulação, o site cobre a ciência, as boas práticas de laboratório e as questões éticas.

> O nome vem do **protoespaçador**: os 20 nucleotídeos do DNA que o RNA guia reconhece.

## O que tem no site

| Seção | O que você encontra |
|---|---|
| **Ciência** | Como bactérias usam CRISPR como sistema imune, o passo a passo do corte e a evolução da ferramenta (nickases, editores de bases, prime editing) |
| **Playground 3D** | Um experimento completo em 6 etapas: desenho do guia, entrega na célula, busca, corte, reparo e resultado |
| **Prática** | Checklist de boas práticas de laboratório e aplicações reais (terapias aprovadas, agricultura, diagnóstico) |
| **Sociedade** | Tópicos de bioética, dilemas com **votação ao vivo entre os visitantes** e o contexto da lei brasileira |
| **Recursos** | Quiz, perguntas frequentes e referências científicas com DOI |

Tudo em **português e inglês**, acessível por teclado e leitores de tela, e funciona **offline** depois da primeira visita.

## Usando numa apresentação

O playground foi pensado para ser projetado em sala.

| Tecla | Ação |
|---|---|
| `M` | **Modo cinema**: percorre as 6 etapas sozinho, com câmera automática |
| `P` | **Modo apresentação**: legendas maiores e QR code para a plateia abrir o site no celular |
| `←` `→` | Etapa anterior / próxima |
| `Espaço` | Pausar / continuar |
| `R` · `C` · `F` | Reiniciar · recentralizar a câmera · tela cheia |

Também dá para **copiar um link** que reproduz exatamente o experimento atual e **salvar uma imagem** da cena.

**Roteiro sugerido:** rode o modo cinema com o guia perfeito; depois volte à etapa 1, clique em duas bases do guia para criar erros e rode de novo. A plateia vê o reconhecimento falhar e o risco de cortes fora do alvo subir.

> A simulação é didática e simplificada: as probabilidades são ilustrativas, não previsões experimentais.

---

## Para desenvolvedores

### Rodando localmente

Requer **Node.js 22.18+**.

```bash
npm install
npm run dev        # abre em http://localhost:5173
```

| Comando | O que faz |
|---|---|
| `npm run build` | Verifica os tipos e gera o build de produção em `dist/` |
| `npm run lint` | Verifica o estilo do código (ESLint) |
| `npm test` | Testa a lógica de sequência de DNA |
| `npm run test:e2e` | Testes de ponta a ponta (Playwright, desktop e celular) |

O CI roda tudo isso a cada push e pull request.

### Como o projeto está organizado

```
src/
├── sections/         # cada seção da página (Hero, Intro, Ethics…)
├── playground/       # o playground: painéis, estado e a cena 3D (scene/)
├── content/          # todos os textos em PT/EN, separados do código
├── lib/
│   ├── dna.ts        # lógica real de sequência: PAMs, cortes, indels, HDR
│   └── votes.ts      # votação dos dilemas (Supabase)
└── i18n/             # troca de idioma
```

Para **editar textos** (bioética, quiz, FAQ, referências), mexa só em `src/content/`. Nome, links e stack do autor ficam em `src/content/site.ts`.

### Tecnologias

React 18 · TypeScript · Three.js com React Three Fiber · shaders GLSL próprios · GSAP · Tailwind CSS v4 · Vite · Supabase (votação) · Vercel (hospedagem)

A cena 3D é **toda gerada por código**, sem modelos 3D externos, e ajusta a qualidade gráfica ao aparelho.

### Qualidade e segurança

- **Lighthouse (celular, com limitação real de CPU e rede):** Performance ~90 (LCP 2,2 s) · Acessibilidade 100 · Boas práticas 100 · SEO 100. O CI barra regressões (`lighthouserc.json`)
- **Sem segredos no código:** a única chave é a pública do Supabase; o acesso é controlado no banco
- **Votação protegida:** votos anônimos, limite por IP e nenhum voto individual exposto
- **Cabeçalhos de segurança** (CSP, HSTS e outros) testados no CI exatamente como em produção

Detalhes em [SECURITY.md](SECURITY.md).

### Deploy

O site é publicado na **Vercel** a cada merge na `main`. A configuração (cabeçalhos e cache) está em `vercel.json`.

Erros de produção vão para o **Sentry** quando a variável `VITE_SENTRY_DSN` está definida no projeto da Vercel. Sem ela, nada é carregado. Para as stack traces apontarem para o código-fonte, defina também `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` e `SENTRY_PROJECT`: o build envia os source maps ao Sentry e os apaga do site publicado.

Para regenerar as imagens de compartilhamento depois de mudar a cena, rode `node scripts/og.mjs http://localhost:5173` com o `npm run dev` ativo.

---

<div align="center">

[MIT](LICENSE) © Bernardo Fernandez

</div>
