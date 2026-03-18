

# Bloco: Testes Reais — Scripts & Playbooks (Ações Reais via Browser)

## Contexto
O módulo de Scripts permite criar scripts de vendas organizados por etapa do funil (Prospecção, Diagnóstico, Negociação, Fechamento, Quebra de Objeções). Oferece geração com IA (via edge function `generate-script`, custo 20 créditos) e criação manual, com integração automática ao Plano de Vendas para contexto.

## Testes Planejados

| # | Ação Real | O que vou fazer no browser |
|---|-----------|---------------------------|
| 1 | **Gerar script com IA (Prospecção)** | Clicar "Novo Script" → selecionar Prospecção → modo IA → preencher briefing → Gerar Script → verificar conteúdo gerado → Salvar |
| 2 | **Verificar contexto automático** | No step 2 do wizard, verificar se o Plano de Vendas (segmento, produtos, diferenciais) é exibido automaticamente |
| 3 | **Criar script manual** | Novo Script → selecionar Negociação → modo Manual → preencher título e conteúdo → Salvar |
| 4 | **Testar links de referência** | No briefing, adicionar 2 links de referência e contexto adicional → gerar e verificar se influencia o resultado |
| 5 | **Expandir/copiar script** | Clicar no card do script → verificar expansão → clicar Copiar → verificar clipboard |
| 6 | **Melhorar com IA** | Expandir script existente → clicar "Melhorar com IA" → verificar atualização do conteúdo |
| 7 | **Excluir script** | Expandir script → clicar Excluir → verificar remoção da lista |
| 8 | **Busca e filtros** | Digitar texto na busca → verificar filtragem → alternar abas de etapa |
| 9 | **Tutorial educativo** | Verificar tutorial colapsável para cada etapa (dicas, exemplos) |
| 10 | **Regenerar script** | Na tela de preview (step 3), clicar "Regenerar" → verificar novo conteúdo |
| 11 | **Editar título/conteúdo antes de salvar** | No step 3, editar título e conteúdo gerados pela IA antes de salvar |
| 12 | **Bugs e melhorias** | Documentar erros, UX gaps e oportunidades de melhoria |

## Pontos de atenção pré-identificados no código

- **Custo de créditos inconsistente**: O `InsufficientCreditsDialog` mostra `creditCost={150}` tanto na página (linha 261) quanto no dialog (linha 676), mas o custo real na edge function é **20 créditos** (linha 4 de `generate-script/index.ts`). Isso confunde o usuário.
- **Regenerar perde contexto**: O botão "Regenerar" no step 3 (linha 654) chama `handleGenerate({}, null)` com contexto vazio, perdendo todo o autoContext do Plano de Vendas e o orgId para débito de créditos.
- **Falta botão de edição inline**: Não existe opção para editar um script já salvo (só excluir ou melhorar com IA). O usuário não pode editar título/conteúdo de scripts existentes.
- **Empty state por aba**: Quando não há scripts em uma aba, mostra apenas "Nenhum script nesta etapa" sem CTA para criar.

## Execução
Login com `cliente.teste@noexcuse.com` / `19961996` → Menu lateral → **Scripts** → executar cada ação sequencialmente com screenshots.

## Arquivos relevantes (sem alteração nesta fase)
- `src/pages/cliente/ClienteScripts.tsx` — página principal (264 linhas)
- `src/components/cliente/ScriptGeneratorDialog.tsx` — dialog de criação (680 linhas)
- `src/hooks/useClienteScripts.ts` — CRUD hooks
- `supabase/functions/generate-script/index.ts` — edge function de geração

