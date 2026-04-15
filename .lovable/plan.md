
Objetivo: corrigir por que a Pollyana continua bloqueada mesmo com CRM e Scripts já salvos pela Juliana.

Diagnóstico confirmado:
- O salvamento funcionou. Já existe um registro de permissões da Pollyana no workspace Fais e medina com:
  - CRM liberado (`can_manage_crm = true`)
  - Scripts liberados (`can_generate_scripts = true`)
  - Visibilidade CRM em `all`
- O problema está na leitura dessas permissões, não no salvamento.
- A função de banco `get_member_permissions(...)` ainda está quebrando em runtime com:
  `record "v_pp" has no field "crm_visibility"`
- Quando essa RPC falha, o hook `useMemberPermissions` retorna o fallback padrão:
  - CRM bloqueado
  - Scripts bloqueados
  - visibilidade `own`
- Por isso a Pollyana não vê a liberação, mesmo com os dados corretos já gravados.

Por que a migration anterior não resolveu:
- A função foi reescrita usando `v_pp` e `v_tp` como `%ROWTYPE`, mas esses registros continuam podendo ficar “não inicializados”.
- Mesmo checando `CASE WHEN v_pp.id IS NOT NULL ...`, o acesso ao próprio registro ainda pode explodir.
- Então a correção precisa ser refeita com variáveis escalares, sem acessar campos de registros vazios.

Implementação proposta:
1. Criar uma nova migration SQL substituindo `get_member_permissions`
   - remover a dependência de `%ROWTYPE`
   - usar variáveis simples para cada campo:
     - `mp_crm_visibility`
     - `pp_crm_visibility`
     - `tp_crm_visibility`
     - etc.
   - carregar:
     1. override individual em `member_permissions`
     2. perfil direto, se existir
     3. perfil do time como fallback
   - retornar o JSON final com `COALESCE(...)` sobre variáveis escalares seguras

2. Endurecer `save_member_permissions` no mesmo ajuste
   - hoje ele valida se o caller é admin “em algum lugar”
   - vou alinhar a checagem para exigir admin da mesma organização
   - isso evita brecha em cenário multi-workspace

3. Validar após a migration
   - executar a função para a Pollyana e confirmar que ela retorna JSON, não erro
   - confirmar que o resultado traz:
     - `can_manage_crm = true`
     - `can_generate_scripts = true`
     - `crm_visibility = all`

4. Conferir o reflexo no app
   - login da Pollyana
   - verificar `/cliente/scripts` com criação de script liberada
   - verificar `/cliente/crm` com comportamento liberado conforme as permissões
   - confirmar que não cai mais no fallback padrão

Arquivos/áreas envolvidos:
- nova migration SQL em `supabase/migrations/...`
- sem mudança obrigatória no frontend para corrigir o bug principal

Detalhe técnico:
- O erro real não é “não salvou”.
- O erro real é:
  ```text
  member_permissions salva certo -> get_member_permissions quebra -> useMemberPermissions retorna permissões padrão -> Pollyana continua bloqueada
  ```

Resultado esperado após a correção:
- a Juliana continua salvando normalmente
- a Pollyana passa a receber as permissões reais já registradas
- CRM e Scripts deixam de aparecer bloqueados para ela
