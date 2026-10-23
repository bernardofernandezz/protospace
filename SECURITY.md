# Segurança · Security

## Como reportar · Reporting

Encontrou uma vulnerabilidade? Não abra uma issue pública: use **Security → Report a vulnerability** neste repositório (GitHub private vulnerability reporting).

Found a vulnerability? Please don't open a public issue — use **Security → Report a vulnerability** on this repository.

## Modelo de segurança · Security model

- **Site estático** servido pela Vercel com CSP restritiva, HSTS, `X-Frame-Options: DENY`, COOP/CORP e `Permissions-Policy` (ver `vercel.json`). Os testes E2E rodam com os mesmos cabeçalhos (`scripts/serve.mjs`).
- **Nenhum segredo no front-end.** A única chave no código é a chave *publicável* do Supabase, pública por design; o acesso é controlado no banco.
- **Votação dos dilemas (Supabase):** votos individuais ficam numa tabela sem acesso pela API; o público só lê os totais. A escrita passa exclusivamente pela função `cast_vote`, que valida a entrada e aplica limite de taxa por IP (via `cf-connecting-ip`, não forjável; o IP é guardado apenas como hash com sal). Votos são anônimos (identificador aleatório por navegador).
- **Entradas da URL** (parâmetros do experimento, idioma) são sanitizadas ou validadas contra listas fechadas.
- **Dependências** auditadas no CI (`npm audit`) e atualizadas pelo Dependabot.
