

# Custos dos Planos e Correcoes da Integracao Asaas

## 1. Tabela de Custos Final (o que o seu cliente paga vs o que voce gasta)

```text
PLANOS MENSAIS
+----------+-------------+-------------+----------+----------------+----------------+
| Plano    | Base (1mod) | Combo (2mod)| Creditos | Seu custo IA   | Sua margem     |
+----------+-------------+-------------+----------+----------------+----------------+
| Starter  | R$ 197      | R$ 297      | 5.000    | ~R$ 10         | ~95% / ~97%    |
| Growth   | R$ 497      | R$ 697      | 20.000   | ~R$ 40         | ~92% / ~94%    |
| Scale    | R$ 997      | R$ 1.397    | 50.000   | ~R$ 100        | ~90% / ~93%    |
+----------+-------------+-------------+----------+----------------+----------------+

RECARGAS AVULSAS
+----------------+---------+----------+----------------+----------------+
| Pacote         | Preco   | Creditos | Seu custo IA   | Sua margem     |
+----------------+---------+----------+----------------+----------------+
| Pack 5.000     | R$ 49   | 5.000    | ~R$ 10         | ~80%           |
| Pack 20.000    | R$ 149  | 20.000   | ~R$ 40         | ~73%           |
| Pack 50.000    | R$ 299  | 50.000   | ~R$ 100        | ~67%           |
+----------------+---------+----------+----------------+----------------+

CUSTO POR ACAO (debito automatico da wallet)
+----------------------------+----------+-------------------+
| Acao                       | Creditos | Custo real ~      |
+----------------------------+----------+-------------------+
| Gerar site                 | 500      | R$ 1,00           |
| Gerar estrategia comercial | 300      | R$ 0,60           |
| Gerar prospeccao IA        | 250      | R$ 0,50           |
| Gerar conteudos (lote)     | 200      | R$ 0,40           |
| Gerar conceitos visuais    | 200      | R$ 0,40           |
| Gerar script de vendas     | 150      | R$ 0,30           |
| Gerar imagem social        | 100      | R$ 0,20           |
| Simular agente IA          | 100      | R$ 0,20           |
| Config. automatica agente  | 100      | R$ 0,20           |
| Checklist diario IA        | 50       | R$ 0,10           |
| Resposta agente WhatsApp   | variavel | proporcional      |
| Follow-up automatico       | variavel | proporcional      |
+----------------------------+----------+-------------------+

Usuario extra: R$ 29/mes (cobrado via Asaas avulso)
```

## 2. Bugs Criticos Encontrados (impedem o uso em producao)

Existem 3 inconsistencias graves entre os arquivos que precisam ser corrigidas antes de testar:

### Bug A — `asaas-create-subscription` usa creditos antigos
Linha 162: `{ starter: 500, growth: 2000, scale: 5000 }` mas deveria ser `{ starter: 5000, growth: 20000, scale: 50000 }`.

### Bug B — `asaas-create-charge` usa IDs de pack antigos
Linhas 58-62: Os packs sao `pack-500`, `pack-2000`, `pack-5000` mas o frontend envia `pack-5000`, `pack-20000`, `pack-50000`. Resultado: "Invalid pack_id" sempre.

### Bug C — `asaas-webhook` nao reconhece o externalReference da subscription
Linha 129: O webhook espera `externalReference` no formato `sub_growth`, mas a funcao `asaas-create-subscription` envia no formato `${org.id}|${plan_id}|${moduleChoice}`. Resultado: renovacao de plano nunca funciona.

## 3. Plano de Correcoes

### 3.1 Corrigir `asaas-create-subscription/index.ts`
- Linha 162: Atualizar mapa de creditos para `{ starter: 5000, growth: 20000, scale: 50000 }`
- Linha 134: Mudar `externalReference` para formato que o webhook reconheca: usar o formato pipe `${org.id}|sub|${plan_id}|${moduleChoice}`

### 3.2 Corrigir `asaas-create-charge/index.ts`
- Linhas 58-62: Atualizar IDs e valores dos packs para:
  - `pack-5000`: 5.000 creditos, R$ 49
  - `pack-20000`: 20.000 creditos, R$ 149
  - `pack-50000`: 50.000 creditos, R$ 299

### 3.3 Corrigir `asaas-webhook/index.ts`
- Linhas 128-147: Reescrever a logica de deteccao de subscription para usar o formato pipe `orgId|sub|planId|modules`
- Extrair `plan_id` e `modules` do `externalReference` corretamente
- Usar esse `plan_id` para renovar a subscription e creditar o volume correto (5000/20000/50000)

### 3.4 Configuracao do Webhook no Asaas
- A URL do webhook que voce precisa cadastrar no painel Asaas e:
  `https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/asaas-webhook`
- Eventos a ativar: `PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`, `PAYMENT_REFUNDED`, `PAYMENT_DELETED`
- Se quiser token de validacao, configurar o secret `ASAAS_WEBHOOK_TOKEN` no backend

## 4. Arquivos a Modificar

| Arquivo | Correcao |
|---------|----------|
| `supabase/functions/asaas-create-subscription/index.ts` | Creditos 5k/20k/50k + externalReference formato pipe |
| `supabase/functions/asaas-create-charge/index.ts` | Pack IDs e valores atualizados |
| `supabase/functions/asaas-webhook/index.ts` | Parse do externalReference formato pipe |

## 5. Como Testar (pos-correcao)

1. Cadastrar webhook no painel Asaas apontando para a URL acima
2. No app, acessar Plano e Creditos como cliente
3. Tentar assinar um plano (PIX e mais rapido para testar)
4. Verificar se a cobranca foi criada no Asaas
5. Simular pagamento no sandbox do Asaas
6. Confirmar que o webhook creditou os creditos na wallet
7. Testar compra de pack avulso
8. Testar uma acao de IA e verificar se debita creditos corretamente

