
# Gerador de Scripts por IA com Contexto do Plano de Vendas

## Conceito

Substituir o dialog simples de "Novo Script" por um fluxo inteligente com duas opcoes:

1. **Gerar com IA** -- a IA cria o script com base em um briefing curto + dados automaticos do Plano de Vendas
2. **Criar manual** -- o usuario escreve o conteudo manualmente (fluxo atual, mantido)

A IA puxa automaticamente do Plano de Vendas:
- Segmento/nicho do negocio
- Canais de aquisicao configurados
- Produtos cadastrados no CRM
- Score da avaliacao comercial (para ajustar complexidade)
- Tamanho da equipe

O usuario complementa com 3-4 perguntas rapidas especificas da etapa do funil.

---

## Fluxo do "Gerar com IA"

1. Usuario clica "Novo Script" e escolhe a etapa do funil
2. Sistema mostra um briefing com perguntas contextuais por etapa:

| Etapa | Perguntas |
|-------|-----------|
| Prospeccao | Qual o canal principal? Qual a dor do cliente? Qual o primeiro contato (WhatsApp, ligacao, email)? |
| Diagnostico | Quais perguntas voce faz para qualificar? Quais criterios de qualificacao (BANT, SPIN)? |
| Negociacao | Qual o diferencial competitivo? Qual a faixa de preco? Existe desconto? |
| Fechamento | Qual a urgencia de fechamento? Tem periodo de teste? Como e a formalizacao? |
| Objecoes | Quais as 3 objecoes mais comuns? Qual o concorrente principal? |

3. Dados do Plano de Vendas sao injetados automaticamente (o usuario ve um resumo)
4. IA gera o script completo com formatacao profissional
5. Usuario pode editar, regenerar ou salvar

---

## Implementacao Tecnica

### 1. Edge Function `generate-script` (nova)

- Recebe: etapa do funil, respostas do briefing, contexto automatico (produtos, canais, segmento)
- Prompt especializado por etapa com instrucoes de formatacao
- Retorna o script estruturado (titulo + conteudo + tags sugeridas)
- Usa Lovable AI (google/gemini-3-flash-preview)
- Nao usa streaming (resposta unica)

### 2. Componente `ScriptGeneratorDialog` (novo)

Dialog com 3 passos:
- **Passo 1**: Escolher etapa do funil + modo (IA ou manual)
- **Passo 2** (se IA): Briefing com perguntas contextuais + preview do contexto automatico
- **Passo 3**: Preview do script gerado com opcoes de editar, regenerar ou salvar

### 3. Busca de contexto automatico

O dialog busca dados ja existentes:
- `crm_products` -- lista de produtos/servicos
- Dados do Plano de Vendas (localStorage, pois e o padrao atual da pagina)
- `crm_funnels` -- etapas do funil configurado

### 4. Edicao de scripts existentes com IA

Alem de gerar novos, adicionar botao "Melhorar com IA" nos scripts existentes que:
- Envia o script atual + contexto para a IA
- Pede sugestoes de melhoria
- Mostra diff entre original e sugerido

---

## Arquivos a criar/editar

| Arquivo | Acao |
|---------|------|
| `supabase/functions/generate-script/index.ts` | **Criar** -- edge function com prompts por etapa |
| `supabase/config.toml` | **Editar** -- registrar nova function |
| `src/components/cliente/ScriptGeneratorDialog.tsx` | **Criar** -- dialog com briefing + geracao |
| `src/pages/cliente/ClienteScripts.tsx` | **Editar** -- integrar novo dialog, adicionar botao "Melhorar com IA" |

---

## Detalhes Tecnicos

### Prompt por etapa (exemplo Prospeccao)

```
Voce e um especialista em vendas B2B. Crie um script de prospeccao profissional.

CONTEXTO DO NEGOCIO:
- Segmento: {segmento}
- Produtos: {produtos}
- Canais: {canais}
- Tamanho da equipe: {equipe}

BRIEFING DO USUARIO:
- Canal principal: {canal}
- Dor do cliente: {dor}
- Tipo de contato: {tipo_contato}

INSTRUCOES:
- Formate como um roteiro passo a passo
- Inclua saudacao, qualificacao, gancho e CTA
- Use linguagem {formal/informal} baseada no segmento
- Inclua variacoes para diferentes cenarios
- Marque com [PAUSA] onde o vendedor deve esperar resposta
```

### Estrutura da edge function

- Endpoint: POST com body `{ stage, briefing, context }`
- Usa `supabase.functions.invoke()` no frontend
- Tratamento de erros 429/402 com toast no frontend
- Log de tokens via `ai_conversation_logs` para contabilizar no consumo

### Dados automaticos

Os dados do Plano de Vendas estao atualmente em localStorage (state local da pagina). O dialog lera:
- `crm_products` via Supabase (ja tem hook `useCrmProducts`)
- `crm_funnels` via Supabase (ja tem hook `useCrmFunnels`)
- Estrutura comercial do Plano de Vendas: como esta em state local, o dialog recebera via props ou context se disponivel; caso contrario, mostra campos extras no briefing

### Consumo de creditos

Cada geracao consome tokens que sao registrados em `ai_conversation_logs`. O sistema de alertas de credito ja implementado cobrira automaticamente.
