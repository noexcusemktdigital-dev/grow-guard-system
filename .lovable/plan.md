
Corrigir a geração do GPS sem exigir novo preenchimento.

### O que encontrei
- A função `generate-strategy` está configurada com `verify_jwt = true` em `supabase/config.toml`.
- Ao mesmo tempo, ela já faz autenticação manual dentro do código (`Authorization` + `supabase.auth.getUser()`).
- Esse padrão está desalinhado com o restante do projeto: funções similares já usam `verify_jwt = false` + validação manual via `getClaims(token)`.
- O erro que você reportou (`401 Invalid JWT`) é compatível com rejeição no gateway antes da função processar a geração.
- Há um detalhe extra: o helper `extractEdgeFunctionError` hoje prioriza `body.error`, mas o gateway pode devolver `body.message` (`Invalid JWT`), então a mensagem ao usuário fica ruim.

### Plano de correção

1. **Alinhar a autenticação da função `generate-strategy`**
   - Em `supabase/config.toml`, trocar:
     - `[functions.generate-strategy] verify_jwt = true`
     - para `verify_jwt = false`
   - Isso evita que o gateway bloqueie a requisição antes do código rodar.

2. **Atualizar a validação dentro da própria função**
   - Em `supabase/functions/generate-strategy/index.ts`:
     - manter leitura do header `Authorization`
     - trocar `supabase.auth.getUser()` por `auth.getClaims(token)`
     - extrair o usuário via `claimsData.claims.sub`
   - Seguir o mesmo padrão já usado em `whatsapp-sync-photos`, `whatsapp-sync-chats` e `generate-script`.

3. **Manter o modelo de dois clientes**
   - Continuar com:
     - cliente em contexto do usuário para validar sessão/token
     - cliente com service role para créditos, `sales_plans`, logs e demais operações administrativas
   - Isso preserva a lógica atual sem mexer no fluxo de negócio.

4. **Melhorar a mensagem de erro no frontend**
   - Em `src/lib/edgeFunctionError.ts`, ampliar a extração para usar:
     - `body.error`
     - senão `body.message`
     - senão `error.message`
   - Assim, se houver qualquer novo 401/429/500, o toast mostra a causa real.

5. **Garantir reaproveitamento de quem já respondeu tudo**
   - O fluxo atual em `ClienteGPSNegocio.tsx` já salva progresso e já tem `Gerar Resultado`.
   - Depois da correção de autenticação, quem já preencheu comercial + marketing poderá apenas gerar novamente sem responder tudo de novo, desde que os dados já estejam salvos em `sales_plans`.

### Arquivos a ajustar
- `supabase/config.toml`
- `supabase/functions/generate-strategy/index.ts`
- `src/lib/edgeFunctionError.ts`

### Resultado esperado
- O GPS volta a gerar a estratégia final.
- O erro `Invalid JWT` deixa de bloquear a função no gateway.
- Quem já concluiu comercial e marketing não precisa refazer o briefing.
- Se ainda houver falha, a mensagem exibida será específica e útil para diagnóstico.
