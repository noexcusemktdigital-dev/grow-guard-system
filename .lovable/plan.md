

# Plano Consolidado: Correções de Créditos + Referências Visuais

Este plano inclui todas as correções do plano anterior (já aprovado) mais o fix de referências visuais.

---

## PARTE A — Correções de Créditos, Quotas e Integração (já aprovado)

Sem mudanças — mantém as fases A1-A5 e B1-B4 do plano consolidado anterior.

---

## PARTE C — Fix: Referências Visuais Não Anexando

### Diagnóstico

O edge function `generate-social-image` recebe `reference_images` (array de URLs) e as envia como `image_url` ao modelo Gemini. Porém:

1. **O modelo de geração de imagem (`gemini-3-pro-image-preview`) pode não conseguir fazer fetch de URLs externas** — modelos de imagem tipicamente precisam de base64 inline, não URLs para download.
2. **O upload de referências no frontend falha silenciosamente** — se `supabase.storage.upload` falha, o erro é ignorado (linha 242-246) e nenhum feedback é dado ao usuário.
3. **`image_bank_urls` está vazio** na identidade visual do teste, então o auto-preenchimento de referências (useEffect linha 165) não funciona.

### Correções

**C1. Edge function: converter URLs para base64 antes de enviar ao modelo**

No `generate-social-image/index.ts`, antes de montar o `messageContent`, fazer fetch de cada URL de referência e converter para base64 inline (`data:image/png;base64,...`). Isso garante que o modelo receba as imagens diretamente, sem precisar fazer download externo.

```
Para cada reference_image URL:
  1. fetch(url)
  2. Converter response para base64
  3. Montar como data:image/...;base64,...
```

**C2. Frontend: adicionar feedback de erro no upload**

No `handleUploadRef` em `ClienteRedesSociais.tsx`, mostrar um toast quando o upload falha em vez de ignorar silenciosamente:

```
if (error) {
  toast({ title: "Erro ao enviar imagem", description: error.message, variant: "destructive" });
} else { ... }
```

**C3. Frontend: adicionar logo da identidade visual como referência automática**

Se `image_bank_urls` está vazio mas `logo_url` existe (caso atual — logo está preenchido), incluir o logo como referência automática no useEffect.

---

## Arquivos a Modificar (consolidado)

| Arquivo | Ação |
|---|---|
| `supabase/functions/generate-social-image/index.ts` | Converter reference URLs para base64 antes de enviar ao modelo |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Toast de erro no upload + auto-incluir logo como referência |
| `src/constants/plans.ts` | Atualizar CREDIT_COSTS + PlanConfig (Parte A) |
| `src/components/cliente/InsufficientCreditsDialog.tsx` | Já criado (Parte B) |
| `src/hooks/useClienteContentV2.ts` | Fix plan_slug → plan (Parte A) |
| `src/hooks/useClientePosts.ts` | usePostQuota + onError (Parte A) |
| `src/hooks/useMarketingStrategy.ts` | onError (Parte B) |
| `src/hooks/useClienteSitesDB.ts` | onError (Parte B) |
| `src/hooks/useTrafficStrategy.ts` | onError (Parte B) |
| `supabase/functions/generate-site/index.ts` | Pré-check saldo (Parte A) |
| `supabase/functions/generate-content/index.ts` | Pré-check saldo (Parte A) |
| `supabase/functions/generate-traffic-strategy/index.ts` | Pré-check saldo (Parte A) |
| `src/pages/cliente/ClienteConteudos.tsx` | Dialog (Parte B) |
| `src/pages/cliente/ClienteSites.tsx` | Dialog (Parte B) |
| `src/pages/cliente/ClientePlanoMarketing.tsx` | Dialog (Parte B) |
| `src/pages/cliente/ClienteTrafegoPago.tsx` | Dialog (Parte B) |

