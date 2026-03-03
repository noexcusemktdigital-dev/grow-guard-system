

# Prioridade 7: Varredura de Melhorias — Franqueadora, Franquia e SaaS

## Diagnostico da Varredura

### 1. Dados Mock Remanescentes
- **AcademyReports.tsx** — unico arquivo com dados mock hardcoded (`franchiseReports`). Marcado com `// TODO: Replace with real data`. KPIs e tabela de progresso por franquia sao ficticios.

### 2. Seguranca (Security Scan: 15 findings)
Os findings restantes sao majoritariamente **EXPOSED_SENSITIVE_DATA** (dados acessiveis a todos os membros da org). Embora o acesso ja seja restrito por organizacao (multi-tenant correto), o scanner recomenda restricoes por **role dentro da org** (ex: apenas admins veem salarios, tokens). Findings relevantes e acionaveis:
- `finance_employees` (salarios) — SELECT aberto a todos os membros
- `whatsapp_instances` (tokens) — SELECT aberto a todos os membros
- `organization_integrations` (config/secrets) — SELECT aberto a todos os membros
- `crm_contacts` e `crm_leads` — acessiveis a todos (aceitavel para CRM, mas pode ser restrito por equipe no futuro)

Os demais (profiles, contracts, proposals, payments) sao necessarios para o funcionamento do app e nao representam risco real com o isolamento por org.

### 3. Funcionalidades Ausentes / Oportunidades

**Franqueadora:**
- Nao existe pagina de **Configuracoes da Franqueadora** (o franqueado e o cliente tem, mas a franqueadora so tem Perfil)
- Sidebar tem item "Propostas" que funciona, mas nao esta listado no menu (acessivel apenas via navegacao direta)
- AcademyReports com dados mock (item 1 acima)

**Franqueado:**
- Tudo funcional. Nenhuma lacuna identificada.

**SaaS (Cliente):**
- Tudo funcional. Nenhuma lacuna identificada.

### 4. UX / Polish
- Nenhum warning de console ativo (limpo apos P6)
- Nenhum issue do linter no Supabase
- Nenhum "Em breve" como funcionalidade bloqueada (os 2 encontrados sao textos de contexto legitimos)

---

## Plano de Execucao

### Bloco A — Mock Final: AcademyReports (dados reais)

**Arquivo**: `src/components/academy/AcademyReports.tsx`

Substituir os dados hardcoded por uma query real que agrega:
- Numero de usuarios por unidade (via `organization_members` + `units`)
- Conclusao media (via `academy_progress`)
- Quizzes aprovados (via `academy_quiz_results`)
- Certificados emitidos (via `academy_certificates`)

Criar um hook `useAcademyReports` ou uma funcao RPC que consolide esses dados por unidade.

### Bloco B — Seguranca: Restringir SELECT em tabelas sensiveis

Migration SQL para:
1. `finance_employees` — SELECT restrito a admins da org (usar `has_role`)
2. `whatsapp_instances` — ocultar colunas `token` e `client_token` do SELECT para nao-admins (criar view ou policy mais restritiva)
3. `organization_integrations` — SELECT restrito a admins

### Bloco C — Franqueadora: Adicionar item "Propostas" na sidebar

**Arquivo**: `src/components/FranqueadoraSidebar.tsx`

O item ja existe na secao `comercialSection` mas esta ausente — precisa adicionar `{ label: "Propostas", icon: FileText, path: "/franqueadora/propostas" }` na secao correta (Comercial).

Verificacao: a rota ja existe no App.tsx (`/franqueadora/propostas`).

---

## Arquivos Alterados

| Arquivo | Acao |
|---------|------|
| `src/components/academy/AcademyReports.tsx` | Substituir mock por dados reais |
| `src/hooks/useAcademy.ts` | Adicionar query de relatorios agregados |
| Migration SQL | Restringir SELECT em 3 tabelas sensiveis |
| `src/components/FranqueadoraSidebar.tsx` | Adicionar "Propostas" na secao Comercial |
| `.lovable/plan.md` | Registrar P7 |

## Ordem

1. Bloco C (sidebar — rapido, 1 linha)
2. Bloco B (seguranca)
3. Bloco A (AcademyReports — mais complexo)

