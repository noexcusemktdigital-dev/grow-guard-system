

## Plano: Espelhamento Real dos Pagamentos do Asaas no Financeiro

### Contexto
Hoje o sistema já puxa pagamentos do Asaas via `asaas-list-payments` (modo `all`), mas a aba "Clientes" lista contratos internos (muitos fake) em vez de mostrar os pagamentos reais. O Dashboard e Receitas já usam dados do Asaas, mas a aba Clientes mostra contratos como fonte de verdade — precisa inverter isso.

### O que vamos fazer

**1. Criar nova Edge Function `asaas-sync-payments` para sincronização completa**
- Busca TODOS os pagamentos da conta Asaas (com paginação — offset/limit até esgotar)
- Inclui filtros por período mais amplo (últimos 12 meses por padrão)
- Retorna dados detalhados: cliente, valor, vencimento, data pagamento, status, tipo de cobrança, fatura, PIX QR code
- Suporta filtros: status (PENDING, OVERDUE, CONFIRMED, RECEIVED), período, cliente Asaas

**2. Melhorar `asaas-list-payments` existente**
- Adicionar paginação real (loop até `hasMore = false`) para não perder cobranças acima de 100
- Incluir campo `netValue` (valor líquido após taxas) na resposta
- Incluir `externalReference` para rastreabilidade

**3. Reformular a aba "Clientes" no FinanceiroDashboard**
- Em vez de listar contratos internos, listar **pagamentos reais do Asaas** agrupados por cliente
- Mostrar para cada cliente: nome, total cobrado, total recebido, total pendente, total vencido
- Expandir para ver cobranças individuais com status, vencimento, link de fatura
- Manter botão "Emitir Cobrança" para contratos que ainda precisam de cobrança manual

**4. Adicionar aba/seção "Cobranças Asaas" dedicada**
- Lista completa de todas as cobranças da conta com filtros (status, período, cliente)
- Status em tempo real: Pendente, Confirmado, Recebido, Vencido, Estornado
- Links diretos para fatura e boleto
- Botão "Sincronizar" para refresh manual

**5. Remover dados fake da Franqueadora**
- Na aba Clientes, filtrar para mostrar apenas dados vinculados ao Asaas real
- Contratos fake permanecem apenas na Unidade Teste

### Detalhes Técnicos

**Edge Function `asaas-list-payments` — paginação completa:**
```typescript
let allPayments = [];
let offset = 0;
let hasMore = true;
while (hasMore) {
  const res = await asaasFetch(`${ASAAS_BASE}/payments?limit=100&offset=${offset}...`);
  const data = await res.json();
  allPayments.push(...(data.data || []));
  hasMore = data.hasMore;
  offset += 100;
}
```

**Resposta enriquecida — campos adicionais:**
```typescript
{
  id, value, netValue, status, dueDate, paymentDate,
  billingType, description, invoiceUrl, bankSlipUrl,
  externalReference, customer, customerName,
  pixQrCode, pixCopyPaste
}
```

**ClientesTab reformulada — agrupamento por cliente Asaas:**
```typescript
const byCustomer = useMemo(() => {
  const map = new Map();
  (asaasPayments ?? []).forEach(p => {
    const key = p.customerAsaasId || p.orgName;
    if (!map.has(key)) map.set(key, { name: p.orgName, payments: [], total: 0, received: 0, pending: 0, overdue: 0 });
    const entry = map.get(key);
    entry.payments.push(p);
    entry.total += p.value;
    if (PAID.includes(p.status)) entry.received += p.value;
    else if (p.status === "OVERDUE") entry.overdue += p.value;
    else entry.pending += p.value;
  });
  return [...map.values()].sort((a, b) => b.total - a.total);
}, [asaasPayments]);
```

### Arquivos a editar
1. `supabase/functions/asaas-list-payments/index.ts` — paginação completa + campos extras
2. `src/hooks/useClientPayments.ts` — atualizar tipo `AsaasPayment` com novos campos
3. `src/pages/FinanceiroDashboard.tsx` — reformular `ClientesTab` para usar dados reais do Asaas agrupados por cliente

