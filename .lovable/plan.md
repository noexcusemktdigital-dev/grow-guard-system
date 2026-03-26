

## Geração Inteligente de Tarefas com IA — Análise Completa do Usuário

### Problema atual
O edge function `generate-daily-checklist` usa 3 tarefas fixas hardcoded ("Verificar leads novos", "Responder mensagens", "Atualizar pipeline") e apenas algumas verificações condicionais simples (leads parados, tarefas vencidas, propostas pendentes). Não há análise inteligente nem personalização real.

### Solução

Reescrever o edge function para **coletar dados completos do usuário** e enviar para a **Lovable AI** gerar tarefas personalizadas e priorizadas.

### Dados coletados para análise

O function vai buscar antes de chamar a IA:

1. **CRM**: leads ativos sem contato, leads quentes parados, tarefas vencidas, propostas pendentes/enviadas, leads novos sem follow-up
2. **WhatsApp/Chat**: mensagens não lidas, contatos sem resposta há mais de 24h
3. **Conteúdo**: roteiros pendentes de aprovação, postagens em rascunho
4. **Metas**: goals ativos e progresso atual vs meta
5. **Gamificação**: streak atual, XP, nível
6. **Estratégia**: se tem plano de marketing/vendas ativo ou não
7. **Créditos**: saldo atual (alertar se baixo)

### Fluxo

1. Edge function coleta todos os dados acima via queries ao Supabase
2. Monta um prompt contextual com os dados reais do usuário
3. Chama `ai.gateway.lovable.dev` com `tool_choice` para extrair um array estruturado de tarefas (título, categoria, prioridade, justificativa)
4. Insere as tarefas retornadas pela IA na tabela `client_checklist_items`
5. Debita créditos e atualiza streak (lógica existente mantida)

### Prompt da IA (resumo)

```
Você é um gestor de produtividade. Com base nos dados reais do usuário, gere 5-8 tarefas diárias priorizadas.
Regras: tarefas específicas e acionáveis, com números reais (ex: "Fazer follow-up nos 3 leads quentes parados há 4 dias").
Priorize: leads quentes sem contato > tarefas vencidas > mensagens não respondidas > metas atrasadas > rotina.
```

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/generate-daily-checklist/index.ts` | Reescrever: coletar dados do usuário + chamar Lovable AI + inserir tarefas personalizadas |

Nenhuma mudança no frontend — o botão "Gerar Checklist com IA" já chama esse function e exibe os resultados.

