# Performance — Lighthouse CI

## Como rodar localmente

### Pre-requisito

```bash
npm install  # garante @lhci/cli instalado
npm run build
```

### Executar pipeline completo (collect + assert + upload)

```bash
npm run lhci
```

### Apenas coletar relatórios (sem gates)

```bash
npm run lhci:collect
```

### Apenas validar assertions contra o último collect

```bash
npm run lhci:assert
```

O servidor de preview é iniciado automaticamente na porta `8080` via `startServerCommand`. O LHCI aguarda o padrão `Local:.+` no stdout antes de começar a coletar (timeout: 60 s).

---

## Páginas auditadas

| Rota | Descrição |
|------|-----------|
| `/` | Landing / home |
| `/crescimento` | Página de crescimento |
| `/plataformadoempresario` | Portal do empresário |

Cada página recebe **3 runs** em modo desktop. O score final é a mediana.

---

## Métricas alvo (Core Web Vitals)

| Métrica | Alvo | Severidade |
|---------|------|-----------|
| LCP — Largest Contentful Paint | < 2 500 ms | warn |
| INP / TBT — Total Blocking Time (proxy) | < 200 ms | warn |
| CLS — Cumulative Layout Shift | < 0.1 | warn |
| FCP — First Contentful Paint | < 1 800 ms | warn |
| Performance score | >= 0.85 | warn |
| Accessibility score | >= 0.90 | **error** |
| SEO score | >= 0.90 | warn |
| Best Practices score | >= 0.90 | warn |

> **warn** bloqueia o job como `failure` mas não falha o build do PR (exit 0).
> **error** falha o build imediatamente.

Audits desativados (`"off"`): `uses-rel-preconnect`, `csp-xss`, `unused-javascript`, `uses-text-compression`.
Audits pulados no collect: `uses-http2`, `redirects-http` (irrelevantes em preview local).

---

## Como interpretar os resultados

- **Verde (pass)** — métrica dentro do alvo.
- **Amarelo (warn)** — métrica fora do alvo; investigar antes do próximo release.
- **Vermelho (error)** — bloqueia merge. Somente `categories:accessibility` está em `error`.

Após cada run o LHCI faz upload para **temporary-public-storage** e imprime uma URL pública com o relatório HTML completo. O link fica disponível por 7 dias.

Para investigar regressões:

1. Abrir o relatório HTML da URL impressa no log.
2. Comparar as oportunidades listadas em "Performance" — focar em LCP e TBT primeiro.
3. Checar a aba "Treemap" para entender peso de bundles JS/CSS.

---

## Histórico de baselines

| Data | LCP (p50) | TBT (p50) | CLS | Perf score | Notas |
|------|-----------|-----------|-----|------------|-------|
| 2026-05-02 | — | — | — | — | Baseline inicial (gate adicionado, sem runs históricos) |

Atualizar esta tabela a cada sprint com os valores medianos do último run de `main`.

---

## Workflow CI (pendente)

A execução automática via GitHub Actions está fora do escopo desta PR (workflow scope ausente). Quando implementado, o job deverá:

1. Rodar após `build` e `test` passarem.
2. Chamar `npm run lhci` com as variáveis de ambiente:
   - `LHCI_GITHUB_APP_TOKEN` — para status checks no PR.
   - `LHCI_TOKEN` — se usar servidor LHCI privado em vez de `temporary-public-storage`.
3. Publicar o link do relatório como comentário no PR.

Referência: <https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md>
