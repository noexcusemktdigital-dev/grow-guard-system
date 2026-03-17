

## Plano: Corrigir duplicação de leads ao converter contatos + Navegação CRM

### Problemas identificados

**1. Duplicação de leads**: Em `handleConfirmConvertLeads` (CrmContactsView.tsx, linha 312), o `createLead.mutate()` é chamado em um `forEach` sem controle de duplicidade. Se o mesmo contato (mesmo phone/email) é convertido, cria leads duplicados. Além disso, não há verificação se já existe um lead com aquele phone/email no funil — resultado: o mesmo "Thiago" aparece em várias etapas.

**2. Sem funil padrão**: Se nenhum funil existe quando o usuário tenta converter, o dialog fica vazio e não funciona. Precisamos criar um funil padrão automaticamente ou bloquear com aviso claro.

**3. Sem botão de voltar**: Quando o usuário está em Contatos, não tem atalho visível para voltar ao Pipeline (precisa clicar no botão "Contatos" de novo no header).

### Correções

| Arquivo | Mudança |
|---------|---------|
| `src/components/crm/CrmContactsView.tsx` | 1. Deduplicar: antes de criar lead, verificar se já existe lead com mesmo phone/email no org. Pular duplicatas e avisar. 2. Se não houver funis, exibir aviso no dialog pedindo para criar um funil primeiro. |
| `src/components/crm/CrmContactsView.tsx` | 3. Adicionar botão "← Voltar ao Pipeline" no topo da view de Contatos |
| `src/pages/cliente/ClienteCRM.tsx` | Passar callback `onBackToPipeline` para o `CrmContactsView` |

### Detalhes técnicos

**Deduplicação (CrmContactsView.tsx)**:
```typescript
const handleConfirmConvertLeads = async () => {
  if (!selectedFunnelId || !selectedStage) { ... }
  
  // Fetch existing leads to check duplicates
  let created = 0, skipped = 0;
  for (const c of convertContacts) {
    // Check if lead with same phone or email already exists
    const isDuplicate = (leads || []).some(l => 
      (c.phone && l.phone === c.phone) || (c.email && l.email === c.email)
    );
    if (isDuplicate) { skipped++; continue; }
    
    createLead.mutate({ ...data, funnel_id: selectedFunnelId, stage: selectedStage });
    created++;
  }
  toast({ title: `${created} lead(s) criado(s)${skipped ? `, ${skipped} duplicado(s) ignorado(s)` : ""}` });
};
```

**Sem funil — aviso no dialog**:
```tsx
{funnels.length === 0 && (
  <div className="text-center py-4 text-sm text-muted-foreground">
    Nenhum funil criado. Crie um funil nas configurações do CRM antes de converter contatos.
  </div>
)}
```

**Botão voltar (CrmContactsView)**:
```tsx
// Aceitar prop onBackToPipeline
<Button variant="ghost" size="sm" onClick={onBackToPipeline}>
  <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Pipeline
</Button>
```

**ClienteCRM.tsx** — passar o callback:
```tsx
<CrmContactsView 
  onCreateLeadFromContact={handleCreateLeadFromContact}
  onBackToPipeline={() => setActiveTab("pipeline")}
/>
```

