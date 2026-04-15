
Diagnóstico mais provável: não é por ela ser “usuária normal” por definição do sistema. Pelo código atual, `cliente_user` pode sim usar CRM e Scripts quando o admin libera. O papel “usuário” só deveria bloquear rotas administrativas fixas, como disparos, dashboard, integrações e plano de créditos.

O que encontrei no código:
1. Scripts usa permissão granular:
   - `ClienteScripts.tsx` libera o botão com `isAdmin || permissions.can_generate_scripts`
2. CRM também usa permissão granular:
   - `ClienteCRM.tsx` usa `isAdmin || permissions.can_manage_crm`
   - além disso, `crm_visibility` controla quais leads ela vê
3. As permissões são buscadas por workspace ativo:
   - `useMemberPermissions` chama `get_member_permissions(user.id, orgId)`
   - `orgId` vem de `useUserOrgId`, que depende do workspace atual salvo no seletor lateral
4. O papel global ainda interfere em partes do app:
   - `useRoleAccess` continua tratando `cliente_user` como não-admin
   - ele bloqueia criação de `scripts` e `crm-config` em regras antigas
   - isso indica que ainda existe lógica legada misturada com a nova lógica granular

Como você disse que:
- o workspace ativo é “Fais e medina”
- e para a Pollyana o efeito é “botão bloqueado”

então as hipóteses mais fortes são estas, por ordem:

1. A Pollyana está recebendo as permissões certas no banco, mas o frontend ainda está usando uma regra antiga baseada só em `role=cliente_user` em algum ponto da tela.
2. A Pollyana está no workspace correto visualmente, mas o `orgId` efetivo usado na query ainda não bate com o registro salvo.
3. O registro foi salvo no `member_permissions`, mas a tela do editor carrega/salva apenas override individual e talvez exista conflito com perfil/time/fallback na leitura.
4. O role carregado no `AuthContext` ainda é resolvido de forma ampla demais entre múltiplas organizações, e isso pode estar deixando a UI em estado inconsistente.

Plano de correção:
1. Validar os dados reais do caso Fais e medina no backend
   - confirmar org da Juliana e da Pollyana
   - confirmar papel da Pollyana nessa organização
   - confirmar linha em `member_permissions`
   - executar `get_member_permissions` para a Pollyana nesse workspace
2. Mapear exatamente onde o bloqueio visual acontece
   - revisar telas de CRM e Scripts e qualquer wrapper/overlay relacionado
   - identificar se o bloqueio vem de `useMemberPermissions`, `useRoleAccess` ou gate visual
3. Unificar a regra de acesso
   - manter `cliente_user` com acesso operacional
   - usar permissões granulares como fonte principal para CRM/Scripts
   - deixar bloqueio por role apenas nas rotas realmente administrativas
4. Corrigir inconsistências de role/workspace
   - revisar se `AuthContext` está escolhendo o role certo para a organização ativa
   - se necessário, alinhar role ao workspace atual, não só a “qualquer org” do usuário
5. Validar os cenários finais
   - Pollyana em Fais e medina:
     - Scripts com botão liberado quando `can_generate_scripts = true`
     - CRM com config/ações liberadas quando `can_manage_crm = true`
     - visibilidade de leads respeitando `crm_visibility`
   - cliente_user sem permissão continua bloqueado corretamente

Arquivos/áreas que provavelmente entram na correção:
- `src/hooks/useRoleAccess.ts`
- `src/contexts/AuthContext.tsx`
- `src/pages/cliente/ClienteScripts.tsx`
- `src/pages/cliente/ClienteCRM.tsx`
- possivelmente componentes de gate/overlay se houver bloqueio indireto
- validação no backend das tabelas/funções já existentes

Detalhe importante:
Hoje o código mostra que “ser usuário normal” não deveria impedir CRM e Scripts por si só. Então, se está bloqueado mesmo com permissão salva, isso é bug de regra de acesso ou de contexto do workspace/role, não comportamento esperado.

Implementação necessária após aprovação:
- consultar os dados do backend do caso Pollyana
- ajustar a regra antiga baseada em `cliente_user`
- validar fim a fim com o fluxo da Juliana liberando e a Pollyana usando

<lov-actions>
<lov-suggestion message="Test the Juliana → Pollyana flow end-to-end after the fix, checking Scripts and CRM in the Fais e medina workspace.">Verify that it works</lov-suggestion>
<lov-suggestion message="Investigate the backend data for Juliana and Pollyana in Fais e medina and fix the workspace/role mismatch if it exists.">Check backend permissions</lov-suggestion>
<lov-suggestion message="Refactor the access control so CRM and Scripts rely on granular member permissions instead of old cliente_user restrictions.">Unify access rules</lov-suggestion>
<lov-suggestion message="Review AuthContext and make role resolution depend on the active workspace to avoid multi-workspace permission bugs.">Fix workspace role loading</lov-suggestion>
</lov-actions>
