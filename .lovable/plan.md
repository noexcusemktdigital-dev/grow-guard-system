

# Prioridade 7: Varredura de Melhorias — Franqueadora, Franquia e SaaS ✅

## Concluído

### Bloco A — AcademyReports: dados reais ✅
- Criada RPC `get_academy_reports` que agrega por unidade: usuarios, conclusao media, quizzes aprovados, certificados
- Criado hook `useAcademyReports` 
- Componente `AcademyReports.tsx` agora usa dados reais do banco, com loading state e alertas dinamicos

### Bloco B — Seguranca: SELECT restrito em tabelas sensiveis ✅
- `finance_employees` — SELECT restrito a admins (super_admin, admin, franqueado, cliente_admin)
- `whatsapp_instances` — SELECT restrito a admins
- `organization_integrations` — SELECT restrito a admins

### Bloco C — Sidebar: Propostas ✅
- Item "Propostas" ja existia na secao `comercialSection` (verificado — nenhuma alteracao necessaria)

## Arquivos Alterados
| Arquivo | Acao |
|---------|------|
| Migration SQL | RPC get_academy_reports + RLS restritivas em 3 tabelas |
| `src/hooks/useAcademyReports.ts` | Novo hook para relatorios agregados |
| `src/components/academy/AcademyReports.tsx` | Substituido mock por dados reais |
| `.lovable/plan.md` | Registrado P7 |
