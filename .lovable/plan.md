

## Plano: Cancelar e Editar Cobranças do Asaas

### Situação Atual
- O sistema permite **emitir** cobranças e **cancelar assinaturas**, mas **não permite cancelar ou editar cobranças individuais**.
- A API do Asaas suporta `DELETE /payments/{id}` para cancelar e `PUT /payments/{id}` para editar cobranças pendentes.

### O que vamos implementar

**1. Nova Edge Function `asaas-manage-payment`**
Função unificada que suporta duas ações:
- **cancel**: `DELETE /payments/{id}` — cancela cobrança pendente/vencida
- **update**: `PUT /payments/{id}` — edita valor, vencimento ou descrição de cobranças pendentes

**2. UI no FinanceiroDashboard — Ações por cobrança**
Na lista de cobranças expandida de cada cliente (aba Clientes), adicionar:
- Botão **"Cancelar"** (com confirmação AlertDialog) para cobranças com status PENDING ou OVERDUE
- Botão **"Editar"** (Dialog com formulário) para alterar valor, vencimento e descrição de cobranças pendentes
- Cobranças já pagas/confirmadas não mostram ações de edição

**3. Hook `useManagePayment`**
Mutation que invoca a Edge Function e invalida o cache de pagamentos após sucesso.

### Arquivos a criar/editar
1. `supabase/functions/asaas-manage-payment/index.ts` — nova Edge Function (cancel + update)
2. `src/hooks/useClientPayments.ts` — adicionar hook `useManagePayment`
3. `src/pages/FinanceiroDashboard.tsx` — botões Cancelar/Editar na tabela de cobranças expandida

### Restrições de segurança
- Autenticação via `getUser()` obrigatória
- Apenas cobranças com status PENDING ou OVERDUE podem ser canceladas/editadas
- Confirmação obrigatória antes de cancelar

