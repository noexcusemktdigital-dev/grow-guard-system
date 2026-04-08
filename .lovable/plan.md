

# Social Content Engine — Plano de Implementacao Completo

## Visao Geral

Criar um novo modulo **Social Content Engine** que transforma a ferramenta atual de geracao de artes unitarias em um motor completo de automacao de redes sociais com 3 modos de operacao.

```text
┌─────────────────────────────────────────────────┐
│           SOCIAL CONTENT ENGINE                 │
├──────────┬──────────────┬───────────────────────┤
│ Modo 1   │ Modo 2       │ Modo 3               │
│ Arte     │ Producao     │ Automacao             │
│ Unitaria │ Mensal       │ Completa              │
│ (existe) │ (lote)       │ (calendario+copy+art) │
└──────────┴──────────────┴───────────────────────┘
         ↑                    ↑
     ArtWizard           Novo modulo
     (manter)            (criar)
```

---

## Fase 1 — Fundacao: Restricoes Inteligentes + Prompt (1 sessao)

### 1.1 Classificacao de restricoes no backend
- Alterar `generate-social-image/index.ts` para classificar o campo `restrictions` em 3 categorias (visual, copy, global) usando tool calling com Lovable AI antes da CoT
- Injetar blocos separados `COPY RESTRICTIONS` e `VISUAL RESTRICTIONS` no prompt final
- Adicionar regra no NEGATIVE: "Strictly avoid all user-defined restrictions"

### 1.2 Melhorias no prompt
- Hierarquia reforcada: "Headline dominant, Subheadline secondary, Logo tertiary"
- Legibilidade: "Strong contrast between text and background"
- Anti-erro: "Do not improvise layout. Do not reposition elements outside defined grid"
- Consistencia: "Strictly follow visual identity from references"

### 1.3 Geracao de 3 opcoes de headline
- Alterar `generate-social-briefing/index.ts` para retornar `headlines: string[3]`, `subheadlines: string[2]`
- No frontend (ArtWizardStepReview), mostrar opcoes para selecao

---

## Fase 2 — QA Automatico + Fallback (1 sessao)

### 2.1 QA pos-geracao
- Apos gerar imagem, chamar IA com a imagem para avaliar: layout_score, logo_score, readability_score, branding_score (0-10)
- Implementar dentro de `generate-social-image/index.ts`

### 2.2 Fallback em 3 niveis
- Normal: regenera com nota de correcao
- Strict: regras rigidas adicionais
- Ultra Strict: "Do not change layout at all. Reinforce spacing and alignment strictly."
- Maximo 3 tentativas antes de entregar melhor resultado

---

## Fase 3 — Layout Inteligente + Direcao Criativa (1 sessao)

### 3.1 Escolha automatica de layout por objetivo
- sales → hero_center, authority → minimal, educational → grid, engagement → overlay
- Pre-selecionar no wizard (Step 8) baseado no objetivo do Step 4

### 3.2 Direcao criativa automatica
- Antes do prompt, gerar `creative_direction` (tone, visual_intensity, contrast_level) baseado em objetivo + segmento

### 3.3 Rotacao controlada de layout
- Persistir ultimos 3 layouts usados por org (nova coluna ou tabela)
- Evitar repetir o mesmo layout consecutivamente

---

## Fase 4 — Social Content Engine: Tabelas + Config (1 sessao)

### 4.1 Novas tabelas (migration)

**`social_content_config`** — configuracao mensal do cliente
- organization_id, posts_per_month, content_mix (jsonb), format_mix (jsonb), frequency, brand_visual_rules (jsonb), created_at, updated_at
- RLS: `is_member_of_org`

**`social_content_calendar`** — calendario editorial gerado
- organization_id, month_ref, calendar_data (jsonb), status (draft/approved/generating/done), created_at
- RLS: `is_member_of_org`

**`social_content_items`** — cada post individual
- organization_id, calendar_id (FK), date, objective, topic, format, layout, headline, subheadline, caption, hashtags (text[]), image_prompt, image_url, status (pending/generating/ready/approved/failed), qa_scores (jsonb), created_at
- RLS: `is_member_of_org`

### 4.2 Pagina de configuracao
- Nova rota `/cliente/social-engine/config`
- Interface para definir: volume mensal, mix de conteudo (sliders), mix de formato, frequencia
- Puxa dados do GPS do Negocio automaticamente (brand_profile)
- Salva em `social_content_config`

---

## Fase 5 — Motor de Calendario + Copy (2 sessoes)

### 5.1 Edge function `generate-social-calendar`
- Recebe: config + strategy_result do GPS
- Gera calendario de 30 dias com: date, content_type, format, topic
- Regras: alternar tipos, nao repetir temas proximos, distribuir vendas sem saturar, incluir datas relevantes
- Salva em `social_content_calendar`

### 5.2 Edge function `generate-social-post-content`
- Para cada item do calendario, gera:
  - headline, subheadline, caption (Hook + Desenvolvimento + Insight + CTA), hashtags
  - image_prompt (integrado com layouts + grid maps + identidade visual)
- Usa tool calling para output estruturado
- Salva em `social_content_items`

### 5.3 Geracao de legendas automaticas
- Estrutura padrao: Hook → Desenvolvimento → Valor/Insight → CTA leve → Hashtags
- Alinhada com tom de voz do GPS

---

## Fase 6 — Geracao em Lote + Dashboard (2 sessoes)

### 6.1 Edge function `generate-social-batch`
- Processa items do calendario em sequencia
- Para cada post: monta prompt → gera imagem (reusa `generate-social-image`) → QA → fallback
- Atualiza status de cada item (generating → ready / failed)
- Debita creditos por arte (25 creditos cada)

### 6.2 Suporte a carrossel automatico
- Quando format = carousel: gera slides com progressao logica (hook → context → value → CTA)
- Mesma identidade visual, mesma posicao de logo, mesma paleta

### 6.3 Dashboard de entrega
- Nova rota `/cliente/social-engine`
- Calendario visual com posts por dia (grid mensal)
- Status por post (pendente, gerando, pronto, aprovado)
- Preview de cada post: arte + legenda + hashtags
- Acoes: editar, regenerar arte, regenerar copy, aprovar, baixar
- Download em lote (todas as artes + CSV de legendas)

---

## Fase 7 — Memoria e Aprendizado (1 sessao)

### 7.1 Memoria da marca
- Expandir `social_art_feedback` para rastrear: layouts mais usados, estilos preferidos, cores dominantes
- Usar historico para influenciar geracoes futuras

### 7.2 Evitar repeticao
- Consultar ultimos posts gerados antes de gerar novos
- Variar temas, layouts e abordagens

### 7.3 Banco de ideias
- Gerar lista de ideias extras alem do calendario
- Sugestoes de temas virais e tendencias do segmento

---

## Resumo de Arquivos

| Tipo | Arquivo | Fase |
|------|---------|------|
| Migration | 3 novas tabelas + RLS | 4 |
| Edge Function | `generate-social-calendar` | 5 |
| Edge Function | `generate-social-post-content` | 5 |
| Edge Function | `generate-social-batch` | 6 |
| Edge Function | Alteracoes em `generate-social-image` | 1,2 |
| Edge Function | Alteracoes em `generate-social-briefing` | 1 |
| Pagina | `/cliente/social-engine` (dashboard) | 6 |
| Pagina | `/cliente/social-engine/config` | 4 |
| Componentes | CalendarView, PostItemCard, ConfigForm, BatchProgress | 4-6 |
| Hook | `useSocialContentEngine.ts` | 4 |
| Hook | `useSocialCalendar.ts` | 5 |
| Constants | Expandir `constants.ts` com regras de layout por objetivo | 3 |

## Ordem de Execucao Recomendada

| Fase | Descricao | Sessoes |
|------|-----------|---------|
| 1 | Restricoes + Prompt | 1 |
| 2 | QA + Fallback | 1 |
| 3 | Layout Inteligente | 1 |
| 4 | Tabelas + Config UI | 1 |
| 5 | Calendario + Copy | 2 |
| 6 | Lote + Dashboard | 2 |
| 7 | Memoria + Aprendizado | 1 |

**Total estimado: 9 sessoes de implementacao**

Fases 1-3 melhoram o Modo 1 existente. Fases 4-7 criam o Social Content Engine (Modos 2 e 3). A arquitetura reutiliza toda a infraestrutura de geracao de imagem, layouts, grid maps e composicao de logo ja existentes.

