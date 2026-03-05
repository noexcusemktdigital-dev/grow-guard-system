

# Documento 7 — Estrutura de Dados e Integração entre Ferramentas

## Análise do Estado Atual

Após revisar o schema e os hooks, a maioria da infraestrutura do Documento 7 **já existe**:

| Entidade Doc 7 | Tabela existente | FK para strategy? | Status col? |
|---|---|---|---|
| Estratégia | `marketing_strategies` | N/A | `status` |
| Conteúdo | `client_content` | `strategy_id` | `status` |
| Postagem | `client_posts` | `content_id` → content | `status` |
| Site | `client_sites` | -- | `status` |
| Tráfego | `traffic_strategies` | -- | `status` |
| Créditos | `credit_wallets` + `credit_transactions` | -- | -- |
| Identidade Visual | `marketing_visual_identities` | -- | -- |

**O que falta** para cumprir o Documento 7:

1. **`client_sites` sem `strategy_id`** — Sites não estão vinculados à estratégia ativa.
2. **`traffic_strategies` sem `strategy_id`** — Tráfego não vinculado à estratégia.
3. **`client_content` sem link para posts** — Já existe (`client_posts.content_id` → `client_content.id`). OK.
4. **Nenhuma página "Hub" centralizadora** — O Doc 7 pede uma visão mensal unificada mostrando Estratégia → Conteúdos → Postagens → Sites → Tráfego.
5. **Edge functions não propagam `strategy_id`** — `generate-site` e `generate-traffic-strategy` não salvam qual estratégia estava ativa.

## Plano de Implementação

### 1. Migration — Adicionar `strategy_id` às tabelas faltantes

```sql
ALTER TABLE client_sites ADD COLUMN IF NOT EXISTS strategy_id uuid REFERENCES marketing_strategies(id);
ALTER TABLE traffic_strategies ADD COLUMN IF NOT EXISTS strategy_id uuid REFERENCES marketing_strategies(id);
```

### 2. Atualizar Edge Functions — Propagar `strategy_id`

- **`generate-site/index.ts`**: Aceitar `strategy_id` no body e salvar no insert.
- **`generate-traffic-strategy/index.ts`**: Aceitar `strategy_id` no body e salvar no insert.

### 3. Atualizar Hooks — Passar `strategy_id` automaticamente

- **`useClienteSitesDB.ts`** (`useCreateClientSite`): Incluir `strategy_id` no insert.
- **`useTrafficStrategy.ts`** (`useGenerateTrafficStrategy`): Incluir `strategy_id` no body enviado à edge function.

### 4. Atualizar Páginas — Enviar `strategy_id` da estratégia ativa

- **`ClienteSites.tsx`**: Importar `useActiveStrategy`, passar `strategy?.id` ao gerar site.
- **`ClienteTrafegoPago.tsx`**: Importar `useActiveStrategy`, passar `strategy?.id` ao gerar tráfego.

### 5. Criar página Hub de Marketing — Visão mensal unificada

Criar **`src/pages/cliente/ClienteMarketingHub.tsx`** com:

- Seletor de mês (date-fns)
- 5 cards resumo: Estratégia, Conteúdos, Postagens, Sites, Tráfego
- Cada card mostra contagem + status (gerado/aprovado) do mês selecionado
- Diagrama visual da cadeia: Estratégia → Conteúdo → Postagens → Site → Tráfego
- Links rápidos para cada ferramenta
- Dados vindos dos hooks existentes (`useActiveStrategy`, `useContentHistory`, `usePostHistory`, `useClienteSitesDB`, `useActiveTrafficStrategy`)

### 6. Adicionar rota ao ClienteSidebar

Registrar `/cliente/marketing-hub` como nova rota no sidebar e no `App.tsx`.

## Arquivos

| Arquivo | Ação |
|---|---|
| `supabase/migrations/` | Adicionar `strategy_id` em `client_sites` e `traffic_strategies` |
| `supabase/functions/generate-site/index.ts` | Aceitar e salvar `strategy_id` |
| `supabase/functions/generate-traffic-strategy/index.ts` | Aceitar e salvar `strategy_id` |
| `src/hooks/useClienteSitesDB.ts` | Passar `strategy_id` no create |
| `src/hooks/useTrafficStrategy.ts` | Passar `strategy_id` no generate |
| `src/pages/cliente/ClienteSites.tsx` | Enviar `strategy_id` ao gerar |
| `src/pages/cliente/ClienteTrafegoPago.tsx` | Enviar `strategy_id` ao gerar |
| `src/pages/cliente/ClienteMarketingHub.tsx` | Criar novo — hub mensal unificado |
| `src/components/ClienteSidebar.tsx` | Adicionar link Marketing Hub |
| `src/App.tsx` | Adicionar rota `/cliente/marketing-hub` |

