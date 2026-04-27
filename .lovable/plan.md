## Objetivo
Fazer as automações do CRM funcionarem de forma confiável e dispararem na hora em que o evento acontece, sem esperar o ciclo de 5 minutos.

## Diagnóstico confirmado
Encontrei 3 fatos importantes no projeto atual:

1. As automações do tipo **mover para outro funil** estão sendo disparadas, mas falham dentro da função backend.
2. Os eventos estão chegando na fila normalmente para o usuário teste.
3. O erro real atual é este:
   - `Could not find the 'metadata' column of 'crm_leads'`

Também confirmei que a tabela `crm_leads` **não tem** as colunas `metadata` nem `notes`, mas a função `crm-run-automations` está tentando ler/escrever essas colunas no `move_to_funnel`.

Isso explica o comportamento atual:
- automações de notificação e mudança de etapa funcionam;
- automações de envio/duplicação para outro funil falham.

## O que vou implementar

### 1) Corrigir o backend da automação `move_to_funnel`
Arquivo:
- `supabase/functions/crm-run-automations/index.ts`

Ajustes:
- parar de usar `crm_leads.metadata` e `crm_leads.notes`, porque essas colunas não existem hoje no banco;
- usar `custom_fields` para guardar a marcação técnica de duplicação, por exemplo:
  - `duplicated_from_lead_id`
  - `duplicated_by_automation_id`
  - `duplicated_at`
- manter a proteção anti-recursão lendo esses dados de `custom_fields`;
- no modo `duplicate`, inserir o lead novo apenas com colunas que realmente existem na tabela;
- no modo `transfer`, manter a atualização do lead original normalmente.

Resultado esperado:
- “lead ganho vai para outro funil” volta a funcionar;
- “lead entrou em etapa X e vai para outro funil” volta a funcionar.

### 2) Tornar a execução instantânea sem reabrir o problema de performance
Hoje existe um cron a cada 5 minutos, e o disparo imediato antigo foi removido porque causava avalanche de execuções.

Em vez de voltar ao modelo antigo, vou implementar um fluxo seguro:

```text
Evento no lead
-> trigger grava item na fila
-> trigger chama a função backend passando o event_id
-> a função processa só aquele evento
-> cron de 5 min continua como fallback
```

Ajustes planejados:
- `supabase/functions/crm-run-automations/index.ts`
  - aceitar `event_id` no body;
  - se vier `event_id`, processar somente aquele item da fila;
  - se não vier `event_id`, continuar no modo lote (cron/manual);
- nova migration SQL
  - recriar o trigger imediato de forma segura, chamando a função com `event_id` específico;
  - evitar voltar ao comportamento antigo que disparava processamento pesado da fila inteira a cada insert.

Resultado esperado:
- a automação roda quase em tempo real;
- o cron continua existindo como segurança se alguma chamada imediata falhar.

### 3) Ajustar o botão “Executar agora” e feedback da tela
Arquivo:
- `src/components/crm/CrmAutomations.tsx`

Ajustes:
- manter o botão manual;
- corrigir o refetch/invalidate para atualizar logs e automações com a chave certa;
- melhorar a mensagem de status para deixar claro quando a automação foi executada imediatamente vs. quando está aguardando fallback.

## Arquivos previstos
- `supabase/functions/crm-run-automations/index.ts`
- `supabase/migrations/<timestamp>_fix_crm_automation_instant_processing.sql`
- `src/components/crm/CrmAutomations.tsx`

## Detalhes técnicos
- A tabela `crm_leads` atual tem `custom_fields`, mas não tem `metadata` nem `notes`.
- Os logs de execução mostram erro apenas nas automações `move_to_funnel`.
- O cron atual está em `*/5 * * * *`.
- A execução imediata antiga foi removida por performance; por isso a correção precisa ser por `event_id`, não por reprocessamento geral.

## Validação após implementar
Vou validar estes cenários:
1. mover lead para etapa `qualificacao` e confirmar duplicação imediata no outro funil;
2. marcar lead como ganho e confirmar envio imediato ao outro funil;
3. verificar logs de execução sem erro `PGRST204`;
4. confirmar que o botão `Executar agora` continua funcionando como fallback manual.

Se aprovar, eu implemento essa correção agora.