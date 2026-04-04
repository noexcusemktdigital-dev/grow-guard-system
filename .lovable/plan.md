

## Plano — Bloqueio de WhatsApp até pagamento + Atualização de status em tempo real

### Problema

1. O webhook do Asaas **funciona** e atualiza `billing_status = 'active'`, mas o frontend não recarrega os dados da instância após o pagamento — o badge continua mostrando "Pagamento pendente".
2. Não existe bloqueio real do WhatsApp enquanto `billing_status !== 'active'` — o chat funciona mesmo sem pagar.

### Mudanças

#### 1. `src/hooks/useWhatsApp.ts` — Bloquear instância não paga

Na função `useWhatsAppInstance()`, filtrar apenas instâncias com `billing_status = 'active'` ou `billing_status IS NULL` (instâncias antigas sem cobrança):

- Instância com `billing_status = 'pending'` **não será retornada** como conectada
- Isso bloqueia automaticamente o chat, envio de mensagens e toda a UI que depende de `instance`

#### 2. `src/pages/cliente/ClienteChat.tsx` — Tela de bloqueio por pagamento pendente

Adicionar verificação: se existe instância com `status = 'connected'` mas `billing_status = 'pending'`, exibir tela específica:
- Mensagem: "Seu WhatsApp está aguardando confirmação de pagamento"
- Badge amarela: "Pagamento pendente"
- Botão para ir a Integrações

#### 3. `src/pages/cliente/ClienteIntegracoesHelpers.tsx` — Realtime para billing_status

Adicionar subscription Realtime na tabela `whatsapp_instances` para que, quando o webhook do Asaas atualizar `billing_status` para `active`, o frontend atualize automaticamente sem refresh manual.

#### 4. Migração SQL — Habilitar Realtime para `whatsapp_instances`

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_instances;
```

#### 5. `src/components/cliente/WhatsAppSetupWizard.tsx` — Polling de status no step de pagamento

No step 4 (pagamento), adicionar polling a cada 5s verificando `billing_status` da instância. Quando mudar para `active`:
- Mostrar mensagem de sucesso
- Habilitar botão "Concluir" para fechar o wizard

### Fluxo completo após as mudanças

```text
1. Usuário conecta WhatsApp → billing_status = 'pending'
2. Chat mostra tela "Pagamento pendente" (bloqueado)
3. Wizard exibe QR PIX / boleto
4. Usuário paga → Asaas webhook → billing_status = 'active'
5. Realtime atualiza frontend → badge muda para "Pago"
6. Chat desbloqueia automaticamente
```

### Arquivos afetados

| Arquivo | Ação |
|---------|------|
| Migração SQL | Realtime para `whatsapp_instances` |
| `src/hooks/useWhatsApp.ts` | Filtrar instâncias pendentes |
| `src/pages/cliente/ClienteChat.tsx` | Tela de bloqueio por pagamento |
| `src/pages/cliente/ClienteIntegracoesHelpers.tsx` | Realtime subscription |
| `src/components/cliente/WhatsAppSetupWizard.tsx` | Polling no step de pagamento |

