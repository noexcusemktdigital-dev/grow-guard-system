

## Plano: Ferramenta de Candidatos na Rede (Franqueadora)

### Contexto

O projeto **Franquia NOE** (landing page) tem um formulário de candidatura (`/candidatura`) que salva leads na tabela `leads` com `funnel = 'candidatura'` e `application_data` (JSONB com dados pessoais, documentos, empresa, etc). Esses dados estão em **outro projeto Supabase**, então precisamos de um mecanismo para sincronizá-los.

### Arquitetura

1. Criar tabela `franchise_candidates` **neste projeto** para armazenar os candidatos
2. Criar edge function `receive-candidate` (webhook público) que o outro projeto chama ao receber uma candidatura
3. Criar página "Candidatos" na Franqueadora com listagem + download de ficha em PDF
4. Adicionar no sidebar da Rede e nas rotas

### Mudanças

| Tipo | O quê |
|------|-------|
| **Migration** | Tabela `franchise_candidates` (name, email, phone, birth_date, marital_status, cep, city, address, cpf, rg, company_name, cnpj, company_address, doc_url, lgpd_consent, lgpd_consent_date, status, source_project_lead_id, organization_id, created_at) |
| **Edge Function** | `receive-candidate/index.ts` — webhook POST que recebe dados do candidato e insere na tabela |
| **Página** | `src/pages/franqueadora/FranqueadoraCandidatos.tsx` — tabela com candidatos, busca, filtros, botão "Baixar Ficha PDF" |
| **Hook** | `src/hooks/useFranchiseCandidates.ts` — query dos candidatos |
| **Sidebar** | `src/components/FranqueadoraSidebar.tsx` — adicionar "Candidatos" na seção Rede, abaixo de Onboarding |
| **Router** | `src/App.tsx` — rota `/franqueadora/candidatos` |
| **Outro projeto** | Após esta implementação, será necessário adicionar uma chamada ao webhook no formulário do Franquia NOE para enviar candidatos automaticamente |

### Tabela `franchise_candidates`

```sql
CREATE TABLE public.franchise_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  birth_date TEXT,
  marital_status TEXT,
  cep TEXT,
  city TEXT,
  address TEXT,
  cpf TEXT,
  rg TEXT,
  company_name TEXT,
  cnpj TEXT,
  company_address TEXT,
  doc_url TEXT,
  lgpd_consent BOOLEAN DEFAULT false,
  lgpd_consent_date TIMESTAMPTZ,
  status TEXT DEFAULT 'novo',
  source_lead_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### Edge Function `receive-candidate`

Webhook público (verify_jwt = false) que aceita POST com os dados do candidato. Valida campos obrigatórios (name, email) e insere na tabela. Protegido por um token simples no header para evitar spam.

### Página Candidatos

- Tabela com colunas: Nome, Email, Telefone, Cidade, CPF, Status, Data
- Busca por nome/email
- Filtro por status (Novo, Em análise, Aprovado, Reprovado)
- Botão "Baixar Ficha" que gera PDF com todos os dados do candidato usando html2pdf.js (mesmo padrão dos certificados e contratos)
- Dialog de detalhe ao clicar no candidato
- Possibilidade de alterar status

### PDF da Ficha

Template profissional com header NOEXCUSE (reusa `getLogoBase64` de `contractPdfTemplate.ts`), seções organizadas: Dados Pessoais, Endereço, Documentos, Dados da Empresa, e status LGPD.

### Fluxo de integração com o outro projeto

Após implementar tudo aqui, será necessário adicionar no projeto Franquia NOE (no `handleSubmit` do `ApplicationForm.tsx`) uma chamada fetch para o webhook:
```typescript
fetch("https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/receive-candidate", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-webhook-token": "TOKEN" },
  body: JSON.stringify({ name, email, phone, ... })
});
```

Isso será feito em um segundo momento, após a implementação principal.

