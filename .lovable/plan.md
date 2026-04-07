
## Diagnóstico provável

O erro de criação de novas unidades está muito provavelmente vindo de uma combinação de 2 problemas:

1. **A função `provision-unit` está protegida com `verify_jwt = true` no `supabase/config.toml`, mas ela já faz validação manual do token no próprio código.**
   - Neste projeto, o padrão das funções administrativas com autenticação customizada é usar `verify_jwt = false` e validar o usuário dentro da função.
   - Evidência: nos logs da `provision-unit` aparece apenas `booted`, sem logs internos da função nem mensagem útil retornada ao frontend. Isso é compatível com bloqueio antes da lógica principal completar.

2. **O frontend está mascarando o erro real.**
   - Em `src/pages/Unidades.tsx`, ao chamar `supabase.functions.invoke("provision-unit")`, o toast mostra só o erro genérico `Edge Function returned a non-2xx status code`.
   - Já existe o helper `extractEdgeFunctionError`, mas ele não está sendo usado nesse fluxo.

## O que eu faria para corrigir

1. **Ajustar a configuração da função**
   - Alterar `provision-unit` para `verify_jwt = false` no `supabase/config.toml`.
   - Manter a validação manual já existente dentro da função (`Authorization` + `auth.getUser`), que é o padrão mais consistente com o restante do projeto.

2. **Melhorar a resposta de erro no frontend**
   - Em `src/pages/Unidades.tsx` e/ou `src/hooks/useUnits.ts`, usar `extractEdgeFunctionError(error)` antes de montar o toast.
   - Assim, se o backend retornar `Unauthorized`, `Forbidden`, erro de insert, FK, campo obrigatório etc., isso aparecerá corretamente.

3. **Endurecer a função `provision-unit`**
   - Adicionar logs e validação por etapas:
     - autenticação
     - permissão na org pai
     - criação da organização filha
     - criação da unit
     - criação do onboarding
     - criação do checklist
   - Retornar mensagens claras de falha em cada etapa.

4. **Aproveitar para corrigir inconsistências do fluxo de unidade**
   - O payload envia `royalty_percent`, mas a função hoje não persiste esse valor em `units`.
   - Isso não parece ser a causa principal da falha, mas é um bug funcional que deve ser alinhado no mesmo ajuste.

## Problemas relacionados que também já aparecem no código

Mesmo focando na criação, há outros bugs na gestão de unidades:

- **Exclusão**
  - `delete-unit` tenta apagar `franchisee_system_payments` com `.eq("unit_org_id", unitOrgId)`, mas essa tabela usa `organization_id`.
  - Também há filtros errados em onboarding:
    - `onboarding_units` está sendo apagado por `organization_id = unitOrgId`, mas o correto parece ser `unit_org_id = unitOrgId`.
    - `onboarding_checklist` está sendo apagado por `organization_id = unitOrgId`, mas esse campo tende a guardar a org matriz, não a org da unidade.

- **Edição**
  - `UnidadeDadosEdit.tsx` usa `asaas_wallet_id` no formulário, mas esse campo **não existe** na tabela `units`; ele existe em `organizations`.
  - Isso tende a quebrar atualização de unidade ao salvar.

## Resultado esperado após a correção

- Criar nova unidade volta a funcionar na matriz.
- O sistema passa a mostrar o erro real, e não só `non-2xx`.
- O fluxo de unidades fica consistente entre:
  - criar
  - editar
  - excluir

## Detalhes técnicos

Arquitetura que eu seguiria:

```text
UI (Unidades.tsx)
  -> invoke("provision-unit")
  -> extractEdgeFunctionError(error)
  -> toast com mensagem real

Edge Function (provision-unit)
  verify_jwt = false
  -> valida Authorization manualmente
  -> valida membership da org pai
  -> cria org filha
  -> cria unit
  -> cria onboarding + checklist
  -> retorna JSON claro
```

## Escopo de implementação recomendado

1. Corrigir `verify_jwt` da `provision-unit`
2. Exibir erro real no frontend
3. Adicionar logs/validação na função
4. Ajustar persistência dos campos financeiros da unidade
5. Na mesma rodada, corrigir `delete-unit` e a edição de `asaas_wallet_id`, porque fazem parte do mesmo módulo e já estão quebrados no código atual
