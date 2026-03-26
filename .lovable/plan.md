

## Vincular Produtos a Leads no CRM

### Problema
Os produtos cadastrados na configuração do CRM não podem ser associados a leads. O usuário precisa anexar produtos dentro do detalhe do lead.

### Solução

**1. Nova tabela `crm_lead_products`** (migração)
```sql
CREATE TABLE public.crm_lead_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES crm_products(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (lead_id, product_id)
);

ALTER TABLE crm_lead_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage lead products"
  ON crm_lead_products FOR ALL TO authenticated
  USING (public.is_member_of_org(auth.uid(), organization_id))
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));
```

**2. Novo hook `useCrmLeadProducts.ts`**
- `useCrmLeadProducts(leadId)` — lista produtos vinculados ao lead
- `useAddLeadProduct` — vincula produto ao lead (com quantidade, preço unitário, desconto)
- `useRemoveLeadProduct` — remove vínculo
- `useUpdateLeadProduct` — edita quantidade/desconto

**3. Nova aba "Produtos" no `CrmLeadDetailSheet.tsx`**
- Adicionar 6ª aba na `TabsList`: "Produtos" com ícone `Package`
- Conteúdo da aba:
  - Lista de produtos vinculados com nome, quantidade, preço, desconto e subtotal
  - Botão "Adicionar produto" que abre um seletor com os produtos cadastrados (`useCrmProducts`)
  - Campos: produto (select), quantidade (input number), desconto % (input number)
  - Totalização no rodapé (soma dos subtotais)
  - Ação de remover produto vinculado

**4. Re-export no `useClienteCrm.ts`**
- Exportar os novos hooks para acesso no portal cliente

### Detalhes técnicos

- O grid da TabsList passa de `grid-cols-5` para `grid-cols-6`
- O subtotal é calculado: `quantity * unit_price * (1 - discount_percent/100)`
- O `unit_price` é pré-preenchido com o preço do produto selecionado mas pode ser editado
- A tabela usa `UNIQUE (lead_id, product_id)` para evitar duplicatas

### Arquivos afetados
- `supabase/migrations/` — nova migração
- `src/hooks/useCrmLeadProducts.ts` — novo
- `src/components/crm/CrmLeadDetailSheet.tsx` — nova aba
- `src/hooks/useClienteCrm.ts` — re-export

