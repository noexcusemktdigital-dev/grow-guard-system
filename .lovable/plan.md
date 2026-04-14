

## Plano: Adicionar Legenda (Caption) ao Fluxo de Geração de Post

### Resumo
Gerar automaticamente uma legenda pronta para redes sociais junto com a arte, salvar no banco, e exibir na tela de resultado para o usuário aprovar/copiar.

---

### 1. Migração de Banco — Adicionar coluna `caption`

```sql
ALTER TABLE public.client_posts ADD COLUMN caption text;
```

A tabela `client_posts` hoje não tem campo de legenda. Adicionamos uma coluna `caption` para armazenar o texto.

---

### 2. Edge Function `generate-social-briefing` — Gerar legenda

Adicionar um novo campo `legenda` no tool call da IA, com instrução para gerar uma legenda completa para redes sociais (hook + valor + CTA + hashtags), pronta para copiar e colar.

**Campos novos no schema do tool call:**
- `legenda`: string — Legenda completa para redes sociais (2-4 linhas com emojis, hook, valor, CTA e hashtags)

**Instrução no system prompt:** Adicionar regra para gerar legenda profissional com estrutura Hook → Valor → CTA → Hashtags.

---

### 3. Hook `useClientePosts` — Persistir legenda

- Adicionar `caption` ao payload do `useGeneratePost`
- Salvar o `caption` no insert do `client_posts`
- Retornar `caption` no resultado da mutação
- Atualizar interface `PostItem` com campo `caption`

---

### 4. ArtWizard — Capturar legenda do briefing

No fluxo do wizard, quando o briefing retornar o campo `legenda`, armazená-lo no state e passá-lo ao `useGeneratePost`.

---

### 5. PostResult — Exibir legenda

Na tela de resultado (`PostResult.tsx`), abaixo da imagem gerada:
- Mostrar a legenda em um card com estilo de "copy ready"
- Botão "Copiar Legenda" para clipboard
- A legenda aparece junto com o status de aprovação

---

### 6. PostCard — Exibir legenda no histórico

No card do histórico de posts (`PostCard.tsx`), mostrar um preview da legenda (truncado) quando disponível.

---

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| Migração SQL | `ALTER TABLE client_posts ADD COLUMN caption text` |
| `supabase/functions/generate-social-briefing/index.ts` | Novo campo `legenda` no tool call + instrução no prompt |
| `src/hooks/useClientePosts.ts` | Campo `caption` no payload, insert e interface |
| `src/components/cliente/social/ArtWizard.tsx` | Capturar e passar `caption` do briefing |
| `src/components/cliente/social/PostResult.tsx` | Exibir legenda + botão copiar |
| `src/components/cliente/social/PostCard.tsx` | Preview da legenda no histórico |

