

# Recalcular Sistema de Creditos para Revenda da Lovable AI

## Diagnostico do Problema

O sistema atual tem falhas criticas que impedem a comercializacao:

### 1. Creditos nao refletem custos reais
- Atualmente: 1 credito = 1 token de IA (arbitrario)
- Lovable AI cobra por uso real em USD (mesmos precos do provedor LLM)
- Os planos oferecem 500/2000/5000 "creditos" sem nenhuma relacao com custo real

### 2. Apenas 2 de 11 funcoes de IA debitam creditos
Functions que **debitam** creditos:
- `ai-agent-reply` (agentes WhatsApp)
- `agent-followup-cron` (follow-up automatico)

Functions que **NAO debitam** (vazamento total):
- `generate-content` (conteudos marketing)
- `generate-site` (gerador de sites)
- `generate-script` (scripts de vendas)
- `generate-strategy` (estrategia comercial)
- `generate-prospection` (prospeccao IA)
- `generate-social-concepts` (conceitos visuais)
- `generate-social-image` (geracao de imagem)
- `ai-agent-simulate` (simulador de agente)
- `ai-generate-agent-config` (config automatica)
- `generate-daily-checklist` (checklist diario)

### 3. Nao existe margem de lucro calculada
Voce paga Lovable AI pelo uso real e revende ao cliente, mas sem calculo de margem.

---

## Solucao Proposta: Sistema de Creditos Baseado em Custo Real

### Modelo de Precificacao

Converter tudo para uma unidade padrao: **1 credito = R$ 0,01 de custo IA** (com margem de 5x embutida).

Ou seja, quando o cliente consome 100 creditos, voce gastou ~R$ 0,20 na Lovable e cobrou R$ 1,00 — margem de ~80%.

```text
+-----------------------+------------------+------------------+
| Plano                 | Creditos/mes     | Custo IA real    |
+-----------------------+------------------+------------------+
| Starter (R$197-297)   | 5.000 creditos   | ~R$ 10 de IA     |
| Growth  (R$497-697)   | 20.000 creditos  | ~R$ 40 de IA     |
| Scale   (R$997-1397)  | 50.000 creditos  | ~R$ 100 de IA    |
+-----------------------+------------------+------------------+

Pacotes extras:
| Pack 5.000   | R$ 49   |
| Pack 20.000  | R$ 149  |
| Pack 50.000  | R$ 299  |
+--------------+---------+
```

### Tabela de custos por acao (em creditos)

Cada funcao de IA tera um custo fixo estimado baseado no consumo medio de tokens:

```text
+-----------------------------+------------------+------------------+
| Acao                        | Creditos cobrados| Custo real aprox |
+-----------------------------+------------------+------------------+
| Resposta de agente IA       | tokens_used      | Variavel         |
| Follow-up automatico        | tokens_used      | Variavel         |
| Gerar conteudo (lote)       | 200              | ~R$ 0,40         |
| Gerar site (LP/multi-page)  | 500              | ~R$ 1,00         |
| Gerar script de vendas      | 150              | ~R$ 0,30         |
| Gerar estrategia comercial  | 300              | ~R$ 0,60         |
| Gerar prospeccao IA         | 250              | ~R$ 0,50         |
| Gerar conceitos visuais     | 200              | ~R$ 0,40         |
| Gerar imagem social         | 100              | ~R$ 0,20         |
| Simular agente              | 100              | ~R$ 0,20         |
| Config automatica agente    | 100              | ~R$ 0,20         |
| Checklist diario            | 50               | ~R$ 0,10         |
+-----------------------------+------------------+------------------+
```

Para agentes (uso variavel), o custo sera proporcional aos tokens reais: cada token consumido na API = 1 credito debitado (mantendo sistema atual).

---

## Plano Tecnico de Implementacao

### Fase 1: Atualizar constantes e planos

**Arquivo:** `src/constants/plans.ts`
- Atualizar creditos: Starter 5.000, Growth 20.000, Scale 50.000
- Atualizar pacotes extras para os novos valores
- Adicionar constante `CREDIT_COSTS` com custo por funcao

### Fase 2: Criar funcao utilitaria de debito centralizada

**Arquivo:** `supabase/functions/_shared/debit-credits.ts` (modulo compartilhado)

Como edge functions nao suportam imports compartilhados facilmente, a abordagem sera:

**Criar funcao de banco `debit_credits`** via migracao SQL:
```sql
CREATE FUNCTION debit_credits(
  _org_id UUID, 
  _amount INT, 
  _description TEXT, 
  _source TEXT
) RETURNS INT ...
```

Essa funcao:
1. Busca wallet da org
2. Verifica se tem saldo suficiente (se nao, retorna erro)
3. Debita o valor
4. Insere transacao no historico
5. Retorna novo saldo

### Fase 3: Adicionar debito em TODAS as edge functions de IA

Cada function que chama a Lovable AI gateway deve:
1. Receber `organization_id` no body da requisicao
2. Apos resposta bem-sucedida da IA, chamar `debit_credits`
3. Se saldo insuficiente, retornar erro 402 antes de chamar a IA

**Functions a modificar (9 funcoes):**
- `generate-content/index.ts` — debitar 200 creditos
- `generate-site/index.ts` — debitar 500 creditos
- `generate-script/index.ts` — debitar 150 creditos
- `generate-strategy/index.ts` — debitar 300 creditos
- `generate-prospection/index.ts` — debitar 250 creditos
- `generate-social-concepts/index.ts` — debitar 200 creditos
- `generate-social-image/index.ts` — debitar 100 creditos
- `ai-agent-simulate/index.ts` — debitar 100 creditos
- `ai-generate-agent-config/index.ts` — debitar 100 creditos
- `generate-daily-checklist/index.ts` — debitar 50 creditos

### Fase 4: Verificacao pre-debito (guard)

Antes de chamar a IA, verificar se a org tem saldo suficiente:
- Se `balance < custo_estimado` -> retornar JSON `{ error: "insufficient_credits" }` com status 402
- No frontend, interceptar esse erro e mostrar toast "Creditos insuficientes" com link para comprar mais

### Fase 5: Atualizar frontend

**Arquivos a atualizar:**
- `src/constants/plans.ts` — novos valores de creditos e custos
- `src/pages/cliente/ClientePlanoCreditos.tsx` — exibir tabela de custos por acao
- `src/pages/SaasLanding.tsx` — atualizar pricing cards
- `src/components/cliente/CreditAlertBanner.tsx` — ajustar thresholds para novos volumes
- `src/hooks/useCreditAlert.ts` — recalcular percentuais

### Fase 6: Migracao do banco

- Atualizar `credit_wallets.balance` das orgs existentes em trial (de 100 para 1.000 creditos de trial)
- Criar funcao SQL `debit_credits` para uso pelas edge functions
- Atualizar a logica de renovacao no webhook Asaas para os novos volumes

---

## Resumo de Arquivos

```text
+---------------------------------------------------+--------------------------+
| Arquivo                                           | Acao                     |
+---------------------------------------------------+--------------------------+
| src/constants/plans.ts                            | Novos valores creditos   |
| src/pages/cliente/ClientePlanoCreditos.tsx         | Tabela custos por acao   |
| src/pages/SaasLanding.tsx                         | Atualizar pricing        |
| src/hooks/useCreditAlert.ts                       | Ajustar thresholds       |
| supabase/functions/generate-content/index.ts      | Adicionar debito         |
| supabase/functions/generate-site/index.ts         | Adicionar debito         |
| supabase/functions/generate-script/index.ts       | Adicionar debito         |
| supabase/functions/generate-strategy/index.ts     | Adicionar debito         |
| supabase/functions/generate-prospection/index.ts  | Adicionar debito         |
| supabase/functions/generate-social-concepts/index.ts | Adicionar debito      |
| supabase/functions/generate-social-image/index.ts | Adicionar debito         |
| supabase/functions/ai-agent-simulate/index.ts     | Adicionar debito         |
| supabase/functions/ai-generate-agent-config/index.ts | Adicionar debito      |
| supabase/functions/generate-daily-checklist/index.ts | Adicionar debito      |
| supabase/functions/signup-saas/index.ts           | Trial com 1.000 creditos |
| supabase/functions/asaas-webhook/index.ts         | Renovacao novos volumes  |
| Migracao SQL                                      | Funcao debit_credits     |
+---------------------------------------------------+--------------------------+
```

## Resultado Final

- Cada centavo gasto na Lovable AI sera rastreado e cobrado do seu cliente com margem de ~80%
- Nenhuma funcao de IA funcionara "de graca" — todas debitam creditos
- Clientes sem saldo recebem erro 402 e sao redirecionados para comprar mais
- Transparencia total: o cliente ve quanto cada acao custa na pagina de Plano e Creditos
