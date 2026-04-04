

## Plano — Redesign do Acompanhamento de Clientes (Ferramenta Manual do Gestor)

### Mudança conceitual

A ferramenta atual vincula ciclos a uma estratégia e tem geração por IA. O novo modelo é uma **plataforma de preenchimento manual** organizada por **pastas de clientes**, onde o gestor de performance preenche 5 seções que geram automaticamente uma apresentação padronizada em PDF.

### Estrutura de dados

**Migração SQL:**
- Adicionar coluna `client_name text` na tabela `client_followups`
- Tornar `strategy_id` nullable (não mais obrigatório)
- Remover o unique index `client_followups_strategy_month_idx` e criar novo por `(organization_id, client_name, month_ref)`

**Novo schema JSONB do `plano_proximo`** (5 seções):

```text
1. analise       → metricas, destaques, gaps, observacoes (já existe)
2. conteudo      → roteiros[], artes[], qtd_postagens, tipo_conteudo[], 
                    linha_editorial, referencias[], necessidades_cliente[]
3. trafego       → plataformas[{nome, tipo_campanha, conteudo_campanha, 
                    publicos, objetivo, investimento, metricas_meta}]
4. web           → secoes[{titulo, motivo, necessidades_cliente}]
5. vendas        → analise_crm, estrategias[], melhorias[]
```

### Interface — 3 níveis de navegação

```text
┌─────────────────────────────────────────┐
│  ACOMPANHAMENTO DE CLIENTES             │
│                                         │
│  [+ Nova Pasta de Cliente]              │
│                                         │
│  📁 Cliente A (3 ciclos)                │
│  📁 Cliente B (1 ciclo)                 │
│  📁 Cliente C (5 ciclos)                │
└─────────────────────────────────────────┘
         ↓ click na pasta
┌─────────────────────────────────────────┐
│  ← Voltar    Cliente A                  │
│  [+ Novo Acompanhamento]                │
│                                         │
│  📄 Abril 2026 — Rascunho              │
│  📄 Março 2026 — Apresentado           │
│  📄 Fevereiro 2026 — Aprovado          │
└─────────────────────────────────────────┘
         ↓ click no ciclo
┌─────────────────────────────────────────┐
│  FORMULÁRIO DE 5 ABAS (preenchimento)   │
│  [Análise] [Conteúdo] [Tráfego]         │
│  [Web] [Vendas]                         │
│                                         │
│  Botões: Salvar | Exportar PDF          │
└─────────────────────────────────────────┘
```

### Detalhes das 5 abas do formulário

1. **Análise do Mês** — Métricas (leads, conversoes, trafego, engajamento, faturamento), pontos positivos (lista), pontos negativos (lista), observações gerais

2. **Conteúdo** — Dividido em Orgânico e Pago. Campos: roteiros (lista de textos), artes/criativos (lista), quantidade de postagens, tipos de conteúdo (multi-select: reels, stories, carrossel, etc.), linha editorial (textarea), referências (lista de links/descrições), necessidades do cliente (lista)

3. **Tráfego Pago** — Tabela dinâmica por plataforma (Meta, Google, TikTok, LinkedIn). Para cada: tipo de campanha, o que vai rodar, públicos-alvo, objetivo, investimento (R$), divisão do investimento, métricas-meta a alcançar

4. **Web / Landing Pages** — Lista de seções/páginas a criar ou alterar. Para cada: título da seção, motivo/justificativa, o que precisa do cliente para executar

5. **Vendas / CRM** — Análise do CRM (textarea), estratégias propostas (lista), melhorias sugeridas (lista)

### PDF gerado automaticamente

- Capa com logo No Excuse + nome do cliente + mês de referência
- 5 seções correspondentes às 5 abas, formatadas em A4 com layout profissional
- Dual-theme: Análise em fundo claro, Plano (Conteúdo/Tráfego/Web/Vendas) em fundo escuro
- Gerado via jsPDF programático (mesmo padrão da estratégia)

### O que é removido

- Vínculo obrigatório com `franqueado_strategies` (select de estratégia)
- Botão "Gerar com IA" e chamada à edge function `generate-followup`
- Checklist de entregas vindas da estratégia

### Arquivos afetados

| Arquivo | Acao |
|---------|------|
| Migração SQL | `client_name` column, nullable `strategy_id`, novo unique index |
| `src/hooks/useClientFollowups.ts` | Refatorar interfaces (novo schema 5 seções), queries por `client_name`, listar pastas distintas |
| `src/pages/franqueado/FranqueadoAcompanhamento.tsx` | Reescrever: navegação por pastas → ciclos → formulário 5 abas, remover IA, novo PDF |
| `src/lib/followupPdfGenerator.ts` | Novo gerador de PDF programático para o acompanhamento |

