# ADR-003: Edge functions com verify_jwt=false por padrão

- Status: Aceito
- Data: 2026-05-01
- Decisores: Rafael Marutaka (founder/CTO), Davi Tesch (cliente NOEXCUSE)

## Contexto

O Sistema Noé tem 88 edge functions no Supabase. A configuração padrão do Supabase para edge functions é `verify_jwt = true` — o gateway rejeita requisições sem JWT válido antes mesmo da função executar. Isso parece seguro à primeira vista, mas tem dois problemas no contexto da Lovable Cloud:

1. **Webhooks externos** (Lovable AI Gateway, integrações de terceiros, callbacks de pagamento) não enviam JWT do usuário; com `verify_jwt = true` retornam 401 antes de qualquer lógica.
2. **A Lovable Cloud documenta `verify_jwt = false` como padrão** para edge fns, com a expectativa de que cada função faça sua própria autenticação interna usando `supabaseClient.auth.getUser()` a partir do header `Authorization`.

A auditoria de 2026-05-01 mapeou: 74 das 88 edge fns têm `verify_jwt = false` e 14 têm `verify_jwt = true`. Análise caso-a-caso confirmou que o padrão `false` é política intencional, não bug — as 14 com `true` são funções que aceitam apenas usuários autenticados e não recebem webhooks externos.

O risco real não é `verify_jwt = false`: é uma função `verify_jwt = false` esquecer de chamar `getUser()` ou de checar permissões. Para mitigar, usamos um helper interno `requireAuth(req)` que centraliza a lógica.

## Decisão

**`verify_jwt = false` é o padrão para novas edge functions do Sistema Noé.** Cada função é responsável por fazer sua autenticação interna via helper `requireAuth(req)` (que extrai o JWT do header, chama `auth.getUser()` e retorna 401 se inválido). Funções que aceitam webhooks externos validam segredo compartilhado (header `x-webhook-secret`). `verify_jwt = true` só é usado em funções que NUNCA recebem webhook e exigem usuário autenticado, como otimização defensiva.

## Consequências

### Positivas
- Compatível com webhooks externos (AI Gateway, gateways de pagamento, integrações)
- Política consistente com a documentação da Lovable Cloud
- Auditoria fica simples: revisar uso do `requireAuth` em vez de discutir caso a caso
- Permite endpoints públicos legítimos (ex.: aceite digital via link público) sem exceção arquitetural

### Negativas / Trade-offs
- Cada função PRECISA chamar `requireAuth` ou validar webhook secret — esquecer = endpoint aberto
- Code review tem responsabilidade extra: garantir que toda fn tenha auth interna
- 401 vem da função, não do gateway — gasta um pouco mais de invocação
- Onboarding de novo dev exige explicar o padrão (contraintuitivo vs default Supabase)

## Alternativas consideradas

- **`verify_jwt = true` em todas e usar service_role_key para webhooks:** quebra com webhooks externos que não controlamos. Rejeitado.
- **Mix arbitrário caso-a-caso (sem padrão):** estado anterior; resultou em confusão e auditoria difícil. Rejeitado.
- **Gateway intermediário (nginx/Cloudflare Worker) validando antes:** complexidade extra, perde integração nativa Lovable. Rejeitado.
