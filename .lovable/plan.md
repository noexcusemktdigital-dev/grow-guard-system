

# Bloco: Testes Reais — Plano de Vendas (Ações Reais via Browser)

## Contexto
O Plano de Vendas é composto por 3 abas principais:
1. **Diagnóstico** — Chat briefing com o agente "Rafael" (18+ perguntas em 8 seções), que gera score, radar, insights, projeções e plano de ação. Ao completar, auto-cria funil CRM e 3 scripts de vendas.
2. **Metas** — CRUD de metas comerciais integradas ao CRM com gráficos de progresso, exportação CSV/PDF.
3. **Histórico** — Registro de diagnósticos anteriores (atualmente hardcoded).

## Testes Planejados

| # | Ação Real | O que vou fazer no browser |
|---|-----------|---------------------------|
| 1 | **Completar briefing do Rafael** | Clicar "Começar agora" no modal → responder todas as perguntas do chat (segmento, modelo, produtos, diferenciais, financeiro, equipe, leads, canais, processo) → verificar salvamento |
| 2 | **Verificar resultados do diagnóstico** | Conferir termômetro, radar 5 eixos, insights com CTAs, plano de ação 3 fases, KPIs de impacto, gráficos de projeção (receita e funil) |
| 3 | **Auto-criação de funil CRM** | Ir ao CRM e verificar se o funil foi criado automaticamente com as etapas informadas |
| 4 | **Auto-geração de scripts** | Ir à seção de Scripts e verificar se os 3 scripts (prospecção, diagnóstico, fechamento) foram gerados |
| 5 | **Criar meta comercial** | Aba Metas → "Nova Meta" → preencher nome, métrica (Faturamento), valor alvo, mês, escopo (Empresa) → Salvar |
| 6 | **Editar meta** | Clicar editar na meta criada → alterar título e valor → Salvar |
| 7 | **Exportar CSV/PDF** | Clicar nos botões CSV e PDF → verificar downloads |
| 8 | **Filtros de escopo** | Alternar entre Todas/Empresa/Equipe/Individual → verificar filtragem |
| 9 | **Arquivar meta** | Arquivar a meta e verificar que aparece no histórico |
| 10 | **Refazer diagnóstico** | Clicar "Refazer" → verificar reset do briefing |
| 11 | **Aba Histórico** | Verificar exibição dos diagnósticos anteriores |
| 12 | **Bugs e melhorias** | Documentar qualquer erro, UX gap ou oportunidade de melhoria |

## Pontos de atenção pré-identificados no código
- **Histórico hardcoded** (linhas 636-639): array estático com datas fixas, não vem do banco
- **Ticket médio inconsistente**: `briefingAgents.ts` tem opção "15k+" mas `ClientePlanoVendas.tsx` tem "15-50k", "50-150k", "150k+" — o ticketMap nas projeções pode não mapear corretamente
- **Projeções podem dar zero**: se o ticket não for encontrado no map, usa fallback de R$600

## Execução
Login com `cliente.teste@noexcuse.com` / `19961996` → Menu lateral → **Plano de Vendas** → executar cada ação sequencialmente com screenshots.

## Arquivos relevantes (sem alteração nesta fase)
- `src/pages/cliente/ClientePlanoVendas.tsx` — página principal (1628 linhas)
- `src/components/cliente/ChatBriefing.tsx` — componente de briefing conversacional
- `src/components/cliente/briefingAgents.ts` — steps do Rafael (18+ perguntas)
- `src/hooks/useSalesPlan.ts` — CRUD do plano
- `src/hooks/useGoals.ts` — CRUD de metas
- `src/hooks/useGoalProgress.ts` — progresso real via CRM

