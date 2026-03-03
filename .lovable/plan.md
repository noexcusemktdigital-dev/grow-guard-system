

# Prioridade 5: Seguranca, Performance, Warnings e Novas Funcionalidades

## Diagnostico

### Security Scan: 23 findings
- **2 RLS "always true"** policies (INSERT/UPDATE com `WITH CHECK (true)`)
- **1 Leaked Password Protection** desabilitada
- **14 EXPOSED_SENSITIVE_DATA** (tabelas com dados sensiveis acessiveis a todos os membros da org)
- **5 MISSING_RLS_PROTECTION** (chat anonimo sem rate limit, dados financeiros abertos)
- **1 WhatsApp/Google tokens em texto plano**

### Console Warnings
- Badge e Dialog recebem refs sem `forwardRef` na pagina Unidades

### localStorage remanescente
- `useCalculator.ts` — aceitavel (dados temporarios de calculadora)
- `OnboardingTour.tsx` — aceitavel (flag de dismiss)
- `CreditAlertBanner.tsx` — aceitavel (timestamp de dismiss)

### "Em breve" remanescente (funcionalidades realmente nao implementadas)
- Upload de logo em RedesSociais
- Download PDF de certificados
- Nova questao no AcademyAdmin

---

## Plano de execucao

### Bloco A — Seguranca (RLS hardening)

**A1. Corrigir RLS "always true"**
Identificar as 2 policies com `WITH CHECK (true)` e substituir por verificacao de membership/role real.

**A2. Habilitar Leaked Password Protection**
Usar configure-auth para habilitar a protecao contra senhas vazadas.

**A3. Restringir acesso a tabelas sensiveis por role**
Criar uma migration que:
- Adicione policies mais restritivas nas tabelas: `finance_revenues`, `finance_expenses`, `finance_employees`, `contracts`, `client_payments`, `franchisee_charges`, `whatsapp_instances`, `google_calendar_tokens`
- Use a funcao `has_role()` ja existente para limitar UPDATE/DELETE a admins
- Mantenha SELECT para membros da org (necessario para o app funcionar) mas restrinja tokens (whatsapp/google) apenas ao owner ou admin

**A4. Rate limiting no website_chat**
Adicionar uma policy mais restritiva ou validacao no edge function `website-chat` para limitar insercoes anonimas.

### Bloco B — Console Warnings

**B1. Badge com forwardRef**
Atualizar `src/components/ui/badge.tsx` para usar `React.forwardRef`, corrigindo o warning do React.

### Bloco C — Performance & UX

**C1. Loading states e error boundaries**
Adicionar tratamento de erro consistente nos hooks principais (`useUnits`, `useCrmLeads`, `useFinance`) com fallback UI.

**C2. Skeleton loading em paginas-chave**
Verificar que Home, CRM e Financeiro mostram skeletons enquanto carregam.

### Bloco D — Novas Funcionalidades

**D1. Upload de logo (ClienteRedesSociais)**
Implementar upload para o bucket `avatars` ja existente e salvar URL na organizacao.

**D2. Download PDF de certificados (AcademyCertificates)**
Usar `html2pdf.js` (ja instalado) para gerar PDF do certificado no browser.

---

## Arquivos alterados

| Arquivo | Acao |
|---------|------|
| Migration SQL | RLS hardening: ~15 policies atualizadas |
| `src/components/ui/badge.tsx` | Adicionar forwardRef |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Implementar upload de logo |
| `src/components/academy/AcademyCertificates.tsx` | Implementar download PDF |
| Edge function `website-chat` | Adicionar validacao anti-spam |

## Ordem de execucao

1. Bloco A (seguranca) — prioritario
2. Bloco B (warnings)
3. Bloco D (funcionalidades)
4. Bloco C (performance) — se necessario apos os demais

