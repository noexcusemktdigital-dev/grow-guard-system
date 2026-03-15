

## Otimização de Performance Mobile

### Problema
O app carrega **todas as ~60+ páginas** de forma síncrona no `App.tsx`. Isso significa que ao abrir o app no mobile, o navegador precisa baixar, parsear e executar o JavaScript de TODAS as páginas antes de mostrar qualquer coisa. Além disso, o header com `backdrop-blur-xl` causa repaint caro em dispositivos móveis.

### Solução: 3 frentes de otimização

#### 1. Lazy Loading de todas as páginas (impacto principal)
Trocar todos os imports estáticos em `App.tsx` por `React.lazy()` + `Suspense`. Isso faz com que apenas o código da página atual seja carregado, reduzindo o bundle inicial drasticamente.

**Arquivo:** `src/App.tsx`
- Converter ~40 imports de páginas para `const Page = lazy(() => import("./pages/Page"))`
- Envolver as rotas com `<Suspense fallback={<Loader />}>`
- Também lazy-load os 3 layouts (`FranqueadoraLayout`, `FranqueadoLayout`, `ClienteLayout`)

#### 2. Reduzir CSS pesado no mobile
**Arquivo:** `src/pages/Index.tsx`
- Trocar `backdrop-blur-xl` por `backdrop-blur-sm` ou remover no mobile (blur é muito caro em GPUs mobile)

**Arquivo:** `src/index.css`
- Verificar animações `page-enter` e simplificar para mobile

#### 3. Otimizar queries paralelas nos dashboards
**Arquivos:** `src/pages/Home.tsx`, `src/pages/franqueado/FranqueadoDashboard.tsx`
- Ambos disparam 8-10 queries simultaneamente ao carregar. No mobile com conexão lenta, isso trava a UI.
- Priorizar dados visíveis acima da dobra e usar `enabled` condicional para dados secundários

### Resumo de mudanças

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | Lazy loading de todas as páginas e layouts |
| `src/pages/Index.tsx` | Reduzir `backdrop-blur-xl` para `backdrop-blur-sm` |
| `src/pages/Home.tsx` | Adiar queries secundárias |
| `src/pages/franqueado/FranqueadoDashboard.tsx` | Adiar queries secundárias |

O lazy loading sozinho deve reduzir o tempo de carregamento inicial em 60-70% no mobile.

