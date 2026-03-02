
# Auditoria: Status de Migração

## ✅ Prioridade 1 — Concluída
- UserMenu roteando para páginas reais
- Mocks deletados (pasta src/mocks/)
- Tipos limpos (sem dados mock exportados)
- Comunicados e Mensagens do Dia usando hooks reais

## ✅ Prioridade 2 — Concluída
- **Plano de Vendas**: Tabela `sales_plans` criada, hook `useSalesPlan` implementado
- **Sites**: `ClienteSites.tsx` migrado para tabela `client_sites`
- **Conteúdos**: `ClienteConteudos.tsx` migrado para tabela `client_campaigns`
- **FeatureGateContext**: Agora usa `useSalesPlanCompleted()` do banco
- **Scripts**: Removidas referências a localStorage mortas

## Pendente — Prioridade 3
- Metas e Ranking: Criar tabelas goals/campaigns e hooks (parcialmente feito)
- Onboarding: Migrar dados para tabelas reais
- Comunicados (ComunicadosList): Usar hook useAnnouncements
- Unidades (OnboardingList): Usar hook useUnits

## Pendente — Prioridade 4
- Deletar referências localStorage restantes (OnboardingTour, CreditAlertBanner — esses são ok como localStorage)
- Limpar tipos restantes
