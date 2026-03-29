

## Diagnóstico

**Não é bloqueio de usuário trial nem de créditos.**  
Se fosse limitação de plano/créditos, o fluxo atual exibiria uma resposta do backend como “Créditos insuficientes”. O texto do print é outro: **“Failed to send a request to the Edge Function”**, que é erro de **transporte/rede**, ou seja, a chamada nem conseguiu chegar corretamente na função `generate-script`.

### Do I know what the issue is?
**Sim.** O problema está no caminho da requisição até a função, não na regra de trial.

### Evidências que encontrei
- A função `supabase/functions/generate-script/index.ts` existe e está configurada.
- O frontend já tenta extrair erros HTTP reais; mesmo assim o usuário ainda vê o erro genérico de fetch.
- Os logs recentes da função `generate-script` **não mostram invocações de geração**, o que reforça que a requisição está falhando **antes** da execução da função.
- O helper compartilhado `supabase/functions/_shared/cors.ts` usa uma allowlist rígida e, para origens não reconhecidas, responde com um **origin fixo diferente da origem real**. Isso é um padrão clássico que faz o navegador barrar a chamada com erro genérico.

## Causa raiz mais provável

O arquivo `supabase/functions/_shared/cors.ts` ainda está frágil para múltiplos domínios/ambientes.  
Se o usuário estiver acessando por uma origem que não bate exatamente com a allowlist, o preflight falha e o navegador transforma isso em **“Failed to send a request to the Edge Function”**.

Em outras palavras: **o erro é muito mais compatível com CORS/origem do que com trial**.

## Plano de correção

### 1. Fortalecer o CORS compartilhado
Ajustar `supabase/functions/_shared/cors.ts` para:
- aceitar corretamente todas as origens válidas do sistema
- **nunca** responder com um `Access-Control-Allow-Origin` diferente da origem da requisição
- incluir explicitamente os domínios ativos do projeto e os padrões necessários
- manter compatibilidade com preview, published e domínio customizado

### 2. Melhorar a função `generate-script`
Em `supabase/functions/generate-script/index.ts`:
- adicionar logs objetivos de entrada para facilitar diagnóstico futuro:
  - `origin`
  - método HTTP
  - se passou pelo auth
- manter as respostas de erro JSON consistentes

Isso não muda a lógica de créditos; só melhora rastreabilidade.

### 3. Melhorar a UX do erro no frontend
Nos pontos que chamam `generate-script`, trocar a exibição crua do erro de fetch por uma mensagem clara, por exemplo:
- “Não foi possível conectar ao serviço de geração de scripts.”
- “Verifique sua conexão e tente novamente.”
- se for erro de créditos, continuar mostrando o aviso específico

### 4. Cobrir os 3 fluxos de geração
Aplicar a melhoria nos três pontos já existentes:
- `src/components/cliente/ScriptGeneratorDialog.tsx`
- `src/pages/cliente/ClienteScripts.tsx`
- `src/pages/cliente/ClientePlanoVendas.tsx`

Assim o comportamento fica consistente tanto em:
- gerar novo script
- melhorar script existente
- gerar scripts automáticos do plano de vendas

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/_shared/cors.ts` | corrigir política de origem para evitar bloqueio de preflight |
| `supabase/functions/generate-script/index.ts` | adicionar logs e manter respostas consistentes |
| `src/components/cliente/ScriptGeneratorDialog.tsx` | mensagem amigável para erro de conexão |
| `src/pages/cliente/ClienteScripts.tsx` | idem |
| `src/pages/cliente/ClientePlanoVendas.tsx` | idem |

## Resultado esperado

Depois da correção:
- usuário trial continua podendo gerar scripts normalmente enquanto tiver créditos
- quando houver falta de créditos, o sistema mostra a mensagem correta
- quando houver problema real de conexão/origem, a UI mostra um aviso compreensível
- a função passa a registrar melhor o que aconteceu, evitando novo ciclo de erro genérico

## Detalhes técnicos

- O texto **“Failed to send a request to the Edge Function”** indica falha de fetch/CORS/rota, não regra de negócio.
- Como a função `generate-script` não registrou execuções recentes, o problema está antes da lógica interna dela.
- O ponto mais sensível hoje é o helper compartilhado de CORS, porque ele decide a origem permitida para várias funções do sistema.
- **Nenhuma mudança de banco de dados é necessária.**

