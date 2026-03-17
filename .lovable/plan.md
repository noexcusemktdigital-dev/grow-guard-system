

## Plano: Corrigir 3 Bugs — Flickering de Tela, Erro de Script, e Débito de Créditos do Agente IA

### Problemas identificados

**1. Tela piscando / mudando de cor**
O `ThemeToggle` não persiste a preferência no `localStorage`. A cada navegação de página, o estado `dark` reinicia para `false`, causando um flash visual quando o componente re-renderiza.

**2. Erro ao gerar script**
A última geração de script (16/mar) ainda cobrou **150 créditos** (taxa antiga). A Edge Function `generate-script` não foi redeployada com o novo `CREDIT_COST = 20`. O usuário teste ficou com apenas **50 créditos**, insuficientes para gerar outro script (o edge function ainda pede 150).

Correção: forçar o redeploy da edge function (o código já está correto com `CREDIT_COST = 20`, mas precisa ser redeployado).

**3. Bug grave: Agente IA debita tokens brutos ao invés de créditos fixos**
A função `debitCredits` dentro de `ai-agent-reply/index.ts` debita o valor de `tokensUsed` (ex: 2008, 2349, 2871 tokens) diretamente do saldo de créditos, ao invés de um custo fixo de **2 créditos por mensagem** (conforme definido em `plans.ts`). Isso é o maior dreno de créditos da plataforma.

### Soluções

| Arquivo | Mudança |
|---------|---------|
| `src/components/ThemeToggle.tsx` | Persistir tema no `localStorage`, ler na inicialização |
| `supabase/functions/ai-agent-reply/index.ts` | Alterar `debitCredits` para debitar fixo **2 créditos** por mensagem (logando tokens no metadata para controle), usar `debit_credits` RPC |
| `supabase/functions/generate-script/index.ts` | Adicionar um espaço/comentário trivial para forçar redeploy (código já correto) |

### Detalhe técnico

**ThemeToggle** — Ler `localStorage.getItem("theme")` no `useState` inicial, e salvar no `useEffect`.

**ai-agent-reply debitCredits** — Substituir a lógica que faz `balance - tokensUsed` por chamada ao RPC `debit_credits` com `_amount: 2`:
```typescript
async function debitCredits(adminClient, orgId, tokensUsed, agentName) {
  try {
    await adminClient.rpc("debit_credits", {
      _org_id: orgId,
      _amount: 2,
      _description: `Mensagem IA — ${agentName}`,
      _source: "ai-agent-reply",
    });
  } catch (e) {
    console.error("Debit error:", e);
  }
}
```
Mantém o `tokensUsed` no log de `ai_conversation_logs` para rastreamento de custo real.

**Recarregar créditos do teste** — SQL para restaurar o saldo do usuário teste para 500.

### Resumo de impacto
- 3 arquivos editados
- 1 query SQL para restaurar créditos do teste

