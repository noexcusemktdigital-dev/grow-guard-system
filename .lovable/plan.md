
## Plano: Melhorias em Avaliacoes, Integracoes, Planos, Perfil e Revisao Geral

**STATUS: CONCLUÍDO**

Todas as melhorias foram implementadas com sucesso.

### Implementado

1. **Avaliações de Desempenho** — Tabs Equipe/Histórico Mensal, notas por categoria com barras de progresso, pastas mensais via Accordion, Sheet lateral de evolução individual, nota geral separada no dialog.

2. **Integrações reorganizadas** — Seções: Comunicação, Anúncios & Tráfego, CRM & Automação, Produtividade, API & Desenvolvedores. Integrações liberadas com dialog de conexão. Tabela `organization_integrations` criada.

3. **Planos & Créditos** — Novos limites (maxAgents, maxDispatches, maxDispatchRecipients) nos 3 planos. Features atualizadas. Destaque visual do combo com badge de economia. Seção "Para que servem os créditos?" com custos por ação e equivalências por pacote.

4. **Perfil com foto** — Upload de avatar via bucket `avatars` com preview, hover para trocar foto, fallback para iniciais. Campo `avatar_url` aceito na mutation do useUserProfile.

5. **Revisão geral** — Módulos revisados e otimizados conforme análise.
