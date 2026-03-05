

# Recriação da Ferramenta de Tráfego Pago (Documento 6)

## Situação Atual

`ClienteTrafegoPago.tsx` (412 linhas) tem 3 tabs: Estratégia (gera direto sem coletar dados), Tutoriais (hardcoded), Histórico. A edge function `generate-traffic-strategy` gera para 4 plataformas fixas usando apenas dados da org + estratégia de marketing. Não coleta informações do usuário (objetivo, orçamento, região, plataformas desejadas, etc.) conforme Documento 6.

## Plano

### 1. Reescrever `ClienteTrafegoPago.tsx` — Wizard visual de 8 etapas + resultado

Substituir a interface atual por wizard com coleta de dados + resultado rico:

**Etapas do wizard:**
1. **Objetivo** — Cards: gerar leads, vender produtos, agendar reuniões, captar franqueados, tráfego no site
2. **Produto/Oferta** — Textarea do produto/serviço anunciado
3. **Público** — Chips + texto livre (empresários, médicos, consumidores finais, etc.)
4. **Página de destino** — Cards: site institucional, landing page, WhatsApp, formulário
5. **Orçamento** — Slider ou input numérico (R$500 a R$50.000)
6. **Plataformas** — Multi-select: Meta, Google, TikTok, LinkedIn (sugestão automática baseada no público)
7. **Região** — Input: cidade, estado, país
8. **Ativos disponíveis** — Multi-select: site, landing page, artes, vídeos (auto-detectar dos dados existentes)

**Dados auto-injetados** (badges visuais):
- Estratégia: público-alvo, posicionamento, proposta de valor (via `useActiveStrategy`)
- Conteúdo: mensagens principais (via `useContentHistory`)
- Postagens: criativos gerados (via `usePostHistory`)
- Sites: páginas de destino (via `useSiteHistory`)

**Tela de resultado** (após geração):
- Diagnóstico de mídia
- Cards por plataforma (com campanhas, conjuntos, anúncios)
- Plano de investimento (gráfico pizza com distribuição %)
- Projeção de resultados (gráfico barras: CPC, CTR, CPL, leads, clientes, faturamento)
- KPIs sugeridos
- Plano de otimização
- Tutorial de execução por plataforma
- Botões: Aprovar (debita créditos), Regenerar, Baixar

**Histórico**: Lista de estratégias anteriores com status (pendente/aprovado)

### 2. Atualizar `generate-traffic-strategy` Edge Function

- Remover débito automático de créditos (mover para aprovação)
- Aceitar novos campos do wizard: `objetivo`, `produto`, `publico`, `pagina_destino`, `orcamento`, `plataformas`, `regiao`, `ativos`
- Enriquecer prompt com dados da estratégia, conteúdo, postagens e sites
- Expandir resultado para incluir: diagnóstico, estrutura de campanhas, plano de investimento, projeções, KPIs, otimização, tutorial
- Gerar apenas para plataformas selecionadas (não fixo 4)

### 3. Atualizar `useTrafficStrategy.ts`

- `useGenerateTrafficStrategy` — aceitar body com dados do wizard
- Adicionar `useApproveTrafficStrategy` — debita 200 créditos e marca status como aprovado
- Adicionar campo `status` ao tipo `TrafficStrategy`

### 4. Migration — Adicionar coluna `status` à tabela `traffic_strategies`

```sql
ALTER TABLE traffic_strategies ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
```

## Arquivos

| Arquivo | Ação |
|---------|------|
| `supabase/migrations/` | Adicionar coluna `status` em `traffic_strategies` |
| `src/pages/cliente/ClienteTrafegoPago.tsx` | Reescrever completamente |
| `supabase/functions/generate-traffic-strategy/index.ts` | Aceitar dados do wizard, remover débito auto, expandir prompt |
| `src/hooks/useTrafficStrategy.ts` | Adicionar params no generate, criar `useApproveTrafficStrategy` |

