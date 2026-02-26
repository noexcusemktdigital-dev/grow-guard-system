

## Plano: Pagamento do Sistema pelo Franqueado (R$250) + Finalizar Ferramentas da Franquia

### Resumo

Duas frentes:
1. **Pagamento self-service do sistema (R$250/mes)** — O franqueado acessa uma aba "Meu Plano" nas Configuracoes e paga diretamente via PIX, Boleto ou Cartao, usando a integracao Asaas ja existente
2. **Finalizar ferramentas de gestao** — Completar o Diagnostico NOE (hoje placeholder) e adicionar aba de pagamento do sistema no Financeiro

---

### 1. Edge Function: `asaas-charge-system-fee`

Nova edge function dedicada ao pagamento self-service do franqueado. Diferente da `asaas-charge-franchisee` (disparada pela franqueadora para cobrar royalties + sistema em lote), esta e iniciada pelo proprio franqueado.

**Fluxo:**
1. Franqueado clica em "Pagar Sistema" na interface
2. Seleciona metodo de pagamento (PIX, Boleto, Cartao)
3. Frontend chama `asaas-charge-system-fee` passando `organization_id` e `billing_type`
4. Edge function:
   - Valida autenticacao
   - Busca ou cria customer no Asaas (mesmo padrao do `asaas-create-charge`)
   - Cria cobranca de R$250 com `externalReference: "system_fee|{org_id}|{month}"`
   - Se PIX, busca QR code base64
   - Registra na tabela `franchisee_system_payments` (nova)
   - Retorna dados de pagamento (invoice_url, pix_qr_code, etc.)

**Webhook:** Atualizar `asaas-webhook` para detectar `system_fee|` no externalReference e marcar como pago

### 2. Nova Tabela: `franchisee_system_payments`

```text
franchisee_system_payments
  id             uuid PK
  organization_id uuid FK -> organizations
  month          text (YYYY-MM)
  amount         numeric default 250
  billing_type   text (PIX/BOLETO/CREDIT_CARD)
  asaas_payment_id text
  status         text default 'pending' (pending/paid/overdue)
  paid_at        timestamptz
  created_at     timestamptz
  updated_at     timestamptz
  UNIQUE(organization_id, month)
```

RLS: franqueados podem ver seus proprios pagamentos via `is_member_of_org`

### 3. Interface do Franqueado — Aba "Sistema" no Financeiro

Adicionar uma 4a aba no `FranqueadoFinanceiro.tsx`: **"Pagamento Sistema"**

Conteudo:
- Card com status do mes atual: "Pago", "Pendente" ou "Vencido"
- Historico de pagamentos (ultimos 12 meses) com status
- Botao "Pagar R$250" que abre Dialog com:
  - Selecao de metodo: PIX, Boleto, Cartao
  - Ao selecionar PIX: mostra QR Code base64 + codigo copia e cola inline
  - Ao selecionar Boleto/Cartao: mostra iframe com invoice_url do Asaas
- Badge no sidebar indicando se ha pendencia

### 4. Webhook Update

Atualizar `asaas-webhook/index.ts`:
- Antes de verificar `franchisee_charges`, verificar se o `externalReference` comeca com `system_fee|`
- Se sim, buscar na tabela `franchisee_system_payments` pelo `asaas_payment_id`
- Marcar como `paid` com `paid_at`

### 5. Diagnostico NOE (Finalizar)

O `FranqueadoDiagnostico.tsx` hoje e um placeholder. Implementar:
- Formulario estruturado em etapas (Accordion) com perguntas de diagnostico do cliente
- Perguntas agrupadas por categoria: Comercial, Marketing, Operacional, Financeiro, Digital
- Cada pergunta com select de 1-5 (nota)
- Score geral calculado automaticamente (radar chart opcional)
- Salvar no banco vinculado ao lead_id
- Botao "Gerar Estrategia a partir do Diagnostico" que redireciona para `/franqueado/estrategia` pre-preenchido

Entretanto, como o diagnostico depende de uma tabela nova e ja tem integracao com o CRM (lead_id), fara parte de uma migration adicional.

### 6. Rota do Diagnostico

Adicionar rota no `App.tsx`:
```
<Route path="diagnostico" element={<FranqueadoDiagnostico />} />
```

Adicionar no `FranqueadoSidebar.tsx` na secao Comercial:
```
{ label: "Diagnostico", icon: ClipboardCheck, path: "/franqueado/diagnostico" }
```

---

### Resumo de Arquivos

| Arquivo | Acao |
|---|---|
| `supabase/functions/asaas-charge-system-fee/index.ts` | Criar — nova edge function para pagamento self-service R$250 |
| `supabase/config.toml` | Nao editar (auto-gerenciado) |
| `supabase/functions/asaas-webhook/index.ts` | Editar — adicionar handler para `system_fee|` no externalReference |
| Migration SQL | Criar tabela `franchisee_system_payments` com RLS |
| `src/pages/franqueado/FranqueadoFinanceiro.tsx` | Editar — adicionar 4a aba "Pagamento Sistema" com dialog de pagamento inline |
| `src/pages/franqueado/FranqueadoDiagnostico.tsx` | Reescrever — formulario de diagnostico completo com scoring |
| `src/components/FranqueadoSidebar.tsx` | Editar — adicionar link Diagnostico na secao Comercial |
| `src/App.tsx` | Editar — adicionar rota `/franqueado/diagnostico` |
| `src/hooks/useFranqueadoSystemPayments.ts` | Criar — hook para buscar pagamentos do sistema |
| Migration SQL | Criar tabela `client_diagnostics` para salvar diagnosticos |

### Sequencia de Implementacao

1. Migration: criar `franchisee_system_payments` e `client_diagnostics`
2. Edge function `asaas-charge-system-fee`
3. Atualizar webhook
4. Hook `useFranqueadoSystemPayments`
5. Aba de pagamento no Financeiro
6. Diagnostico NOE completo
7. Sidebar + rotas

