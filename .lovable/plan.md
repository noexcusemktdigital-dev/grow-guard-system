

# Recriação da Ferramenta de Geração de Conteúdo

## Situação Atual

`ClienteConteudos.tsx` (966 linhas) funciona como gerador de **campanhas mensais em lote** — o usuário define mês, formatos e quantidades, e a IA gera N conteúdos de uma vez. O Documento 3 pede algo diferente: geração de **conteúdo individual** por etapas visuais (tema → formato → objetivo → mensagem → CTA), alimentado automaticamente pela estratégia.

A edge function `generate-content` gera arrays de conteúdos mensais. Precisa ser reescrita para gerar **1 conteúdo individual** com estrutura específica por formato (carrossel com slides, roteiro de vídeo com timestamps, etc.) + elementos adicionais (variações de headline, pergunta para comentários, legenda, hashtags).

## Plano de Implementação

### 1. Reescrever `generate-content` Edge Function

Novo prompt focado em gerar **1 conteúdo** com tool calling retornando:
- `conteudo_principal` — estrutura depende do formato (slides para carrossel, hook/desenvolvimento/CTA para vídeo, headline/texto/CTA para post)
- `legenda` — legenda completa para redes sociais
- `headlines` — 5 variações de headline
- `pergunta_engajamento` — sugestão de pergunta para comentários
- `hashtags` — array de hashtags
- `embasamento` — por que este conteúdo funciona

O prompt recebe automaticamente os dados da estratégia ativa (persona, pilares, posicionamento, proposta de valor).

Crédito consumido somente na aprovação (não na geração).

### 2. Reescrever `ClienteConteudos.tsx`

Interface visual por etapas (stepper, não chat):

**Etapa 1 — Tema**: Input de texto livre ("Sobre qual tema?")
**Etapa 2 — Formato**: Seleção visual com cards (Carrossel, Post Único, Roteiro de Vídeo, Thread, Artigo Curto)
**Etapa 3 — Objetivo**: Seleção com chips (Gerar leads, Educar, Autoridade, Divulgar serviço, Engajamento)
**Etapa 4 — Mensagem Principal**: Textarea ("Qual ideia principal?")
**Etapa 5 — CTA**: Seleção com chips + custom (Comentar, WhatsApp, Orçamento, Acessar link)

Dados da estratégia injetados automaticamente via `useActiveStrategy()` — exibir badge "Estratégia conectada" se ativa.

**Tela de resultado**: Cards estruturados exibindo:
- Conteúdo principal (slides numerados para carrossel, timestamps para vídeo, etc.)
- Legenda completa com botão copiar
- 5 headlines alternativas
- Pergunta para engajamento
- Hashtags
- Embasamento
- Botões: Aprovar, Regenerar, Editar, Enviar para Postagens

**Histórico**: Lista de conteúdos gerados com filtro por formato/status.

### 3. Atualizar tabela `client_content`

Adicionar colunas para o novo formato:
```sql
ALTER TABLE client_content
  ADD COLUMN IF NOT EXISTS format text,
  ADD COLUMN IF NOT EXISTS objective text,
  ADD COLUMN IF NOT EXISTS cta text,
  ADD COLUMN IF NOT EXISTS main_message text,
  ADD COLUMN IF NOT EXISTS result jsonb,
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS strategy_id uuid;
```

### 4. Criar hook `useClienteContentV2.ts`

- `useContentHistory()` — lista conteúdos gerados
- `useGenerateContent()` — chama edge function
- `useApproveContent()` — debita créditos e atualiza status

### 5. Remover código legado

- Remover `LUNA_STEPS` de `briefingAgents.ts` (o chat Luna não será mais usado)
- Remover hooks de campaigns DB que serviam o formato antigo (`useClienteCampaignsDB`)
- Limpar imports não utilizados

## Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/` | Nova migration: colunas em `client_content` |
| `supabase/functions/generate-content/index.ts` | Reescrever para conteúdo individual |
| `src/pages/cliente/ClienteConteudos.tsx` | Reescrever completamente |
| `src/hooks/useClienteContentV2.ts` | Criar novo hook |
| `src/components/cliente/briefingAgents.ts` | Remover `LUNA_STEPS` |

