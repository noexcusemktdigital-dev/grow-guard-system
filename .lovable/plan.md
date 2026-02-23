

# Redes Sociais — Artes com IA + Editor de Texto + Limites por Plano

Implementacao completa da pagina de Redes Sociais com geracao de artes via IA, editor de texto integrado (Canvas), e limites mensais por plano. Inclui tambem a atualizacao dos limites de conteudo na pagina de Conteudos.

---

## 1. Limites Mensais por Plano

Adicionar campos `maxContentCampaigns` e `maxSocialArts` ao `PlanConfig` em `src/constants/plans.ts`:

| Plano | Campanhas de Conteudo/mes | Artes de Redes Sociais/mes |
|-------|--------------------------|---------------------------|
| Starter | 1 campanha | 8 artes (4 posts x Feed+Story) |
| Growth | 3 campanhas | 20 artes (10 posts) |
| Scale | Ilimitado | Ilimitado |

O frontend consulta o plano atual via `useClienteSubscription` e bloqueia a criacao quando o limite for atingido, exibindo um card de upgrade.

---

## 2. Redes Sociais — Reescrita Completa

### Estrutura de Abas

| Aba | Conteudo |
|-----|----------|
| Campanhas | Wizard de criacao + galeria com editor de texto |
| Identidade Visual | Base de conhecimento visual (manter existente) |
| Calendario | Calendario de publicacoes (manter existente) |

### Wizard de Criacao (3 etapas)

**Etapa 1 — Briefing Visual**
- Mes, objetivo, estilo visual, cores, temas, promocoes, observacoes
- Quantidade de posts (cada post = 1 Feed + 1 Story)
- Validacao contra limite do plano antes de prosseguir

**Etapa 2 — Geracao com IA (sequencial com progresso)**
1. Chama `generate-social-concepts` (gemini-3-flash-preview) para gerar conceitos: titulo, legenda, CTA, hashtags, prompt visual
2. Para cada conceito, chama `generate-social-image` (gemini-3-pro-image-preview) 2x: Feed (1:1) e Story (9:16)
3. Imagens salvas no bucket `social-arts`
4. Progress bar: "Gerando arte 3 de 10..."

**Etapa 3 — Galeria + Editor de Texto**
Grid de cards com imagem real. Ao clicar:
- Modal com imagem ampliada
- Campos de texto pre-preenchidos pela IA (titulo, legenda, CTA)
- Opcoes: posicao (topo/centro/rodape), cor (branco/preto/primaria), tamanho (P/M/G)
- Canvas API renderiza texto sobre a imagem em tempo real
- Botoes: "Baixar com Texto", "Baixar sem Texto", "Copiar Legenda", "Aprovar"

### Verificacao de Limite

Antes de abrir o wizard, o sistema conta quantas artes ja foram geradas no mes atual e compara com o limite do plano. Se excedido, exibe card com botao de upgrade.

---

## 3. Conteudos — Adicionar Verificacao de Limite

Na pagina `ClienteConteudos.tsx`, antes de abrir o wizard de nova campanha, verificar quantas campanhas ja existem no mes atual e comparar com `maxContentCampaigns` do plano. Bloquear se necessario.

---

## 4. Backend — 2 Edge Functions Novas

### `generate-social-concepts`
Usa `google/gemini-3-flash-preview` com tool calling para retornar JSON estruturado:
```text
Input: { briefing, quantidade, estilo }
Output: { concepts: [{ titulo, legenda, cta, hashtags[], visual_prompt_feed, visual_prompt_story }] }
```

### `generate-social-image`
Usa `google/gemini-3-pro-image-preview` para gerar uma imagem por chamada:
```text
Input: { prompt, format: "feed"|"story" }
Output: { image_base64 }
```
A imagem e convertida para Blob e salva no bucket `social-arts`. URL publica retornada.

Prompt inclui instrucao: "Do NOT include any text or letters in the image."

---

## 5. Storage

Criar bucket `social-arts` (publico) via migracao SQL.

---

## 6. Arquivos Modificados/Criados

| Arquivo | Acao |
|---------|------|
| `src/constants/plans.ts` | Adicionar `maxContentCampaigns` e `maxSocialArts` |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Reescrita completa |
| `src/pages/cliente/ClienteConteudos.tsx` | Adicionar verificacao de limite |
| `supabase/functions/generate-social-concepts/index.ts` | Nova edge function |
| `supabase/functions/generate-social-image/index.ts` | Nova edge function |
| `supabase/config.toml` | Registrar 2 novas funcoes |

Migracao SQL para criar bucket `social-arts`.

---

## Detalhes Tecnicos

### Editor Canvas

Usa `<canvas>` nativo para composicao:
1. Carrega imagem como background
2. Renderiza texto configuravel em posicoes pre-definidas
3. Re-renderiza a cada mudanca de texto/posicao/cor
4. Export via `canvas.toDataURL('image/png')`
5. Sem dependencias externas

### Controle de Limites

```text
const planLimits = {
  starter: { contentCampaigns: 1, socialArts: 8 },
  growth:  { contentCampaigns: 3, socialArts: 20 },
  scale:   { contentCampaigns: -1, socialArts: -1 }  // -1 = ilimitado
};
```

O estado local (useState) armazena campanhas e artes. Persistencia em banco sera adicionada junto com a definicao final de repasse de custos.

