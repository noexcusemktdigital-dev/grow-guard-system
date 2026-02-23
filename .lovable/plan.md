
# Modulo Sistema: Integracoes, Planos e Creditos, Configuracoes

## Visao Geral

Tres paginas precisam evoluir para que o sistema fique pronto para venda:

1. **Integracoes** - Mostrar integracao ativa (WhatsApp) + placeholders de futuras integracoes + area de API keys
2. **Plano e Creditos** - Self-checkout real com Asaas, upsell, faturas, compra de creditos avulsos, contratacao modular (Comercial / Marketing / Ambos)
3. **Configuracoes** - Gestao de usuarios com convite por email, edicao do proprio perfil, dados da organizacao

Times comerciais ficam no CRM (ja tem `CrmTeamManager` la).

---

## 1. Reestruturacao dos Planos (precificacao)

### Modelo: Plano Base + Addon

Cada plano tem um preco base que inclui **1 modulo** (Comercial ou Marketing). Para ter os dois, paga um adicional.

| Plano | Base (1 modulo) | Combo (2 modulos) | Creditos/mes | Usuarios | Conteudos | Artes | Sites |
|-------|-----------------|---------------------|-------------|----------|-----------|-------|-------|
| Starter | R$ 197 | R$ 297 | 500 | 2 | 8 | 4 | 1 LP |
| Growth | R$ 497 | R$ 697 | 2.000 | 5 | 12 | 8 | 2 |
| Scale | R$ 997 | R$ 1.397 | 5.000 | 15 | 20 | 12 | 5 |

**Extras avulsos:**
- Usuario adicional: R$ 29/mes
- Pacote 500 creditos: R$ 49
- Pacote 2.000 creditos: R$ 149
- Pacote 5.000 creditos: R$ 299

### Estimativa de custo IA por credito

Baseado nos modelos usados (Gemini Flash):
- ~1 credito = 1 interacao de agente IA (~2.000 tokens input + 500 output)
- Custo estimado por credito: ~R$ 0,02-0,05
- Starter (500 creditos): custo IA ~R$ 10-25/mes → margem saudavel em R$ 197
- Growth (2.000 creditos): custo IA ~R$ 40-100/mes → margem saudavel em R$ 497

Os creditos cobrem: respostas de agentes IA, geracao de conteudo, geracao de scripts, geracao de sites, disparos WhatsApp.

### Alteracoes no codigo

**Arquivo: `src/constants/plans.ts`**
- Adicionar campos: `basePrice`, `comboPrice`, `modules` (comercial/marketing/ambos)
- Adicionar constantes de extras avulsos (`CREDIT_PACKS`, `EXTRA_USER_PRICE`)

**Arquivo: `supabase/functions/asaas-create-subscription/index.ts`**
- Atualizar `PLAN_PRICES` para suportar base vs combo
- Receber parametro `modules` (comercial/marketing/ambos) no body

---

## 2. Pagina Plano e Creditos (Self-Checkout)

### Layout redesenhado

```
+------------------------------------------+
| Status do Plano (card atual expandido)   |
| Plano Growth · Combo · R$ 697/mes       |
| Modulos: Comercial + Marketing          |
| Renovacao: 15/03/2026                    |
| [Fazer Upgrade] [Gerenciar Assinatura]  |
+------------------------------------------+

+-------------------+  +-------------------+
| Wallet Creditos   |  | Consumo por Modulo|
| 1.450 / 2.000     |  | Grafico barras    |
| [Comprar Extra]   |  |                   |
+-------------------+  +-------------------+

+------------------------------------------+
| Planos Disponiveis                       |
| Toggle: [Apenas Comercial] [Apenas Mkt] |
|         [Combo]                          |
| 3 cards com precos ajustados pelo toggle |
+------------------------------------------+

+------------------------------------------+
| Pacotes de Creditos Avulsos              |
| 3 cards: 500/2000/5000 creditos          |
+------------------------------------------+

+------------------------------------------+
| Faturas / Historico de Pagamentos        |
| Lista de cobrancas do Asaas              |
+------------------------------------------+

+------------------------------------------+
| Historico de Transacoes de Creditos      |
| (ja existe, manter)                      |
+------------------------------------------+
```

### Novos componentes e funcionalidades

- **Toggle de modulos**: alterna preco entre base e combo
- **Cards de pacotes de creditos**: botao "Comprar" que invoca edge function para criar cobranca avulsa no Asaas
- **Faturas**: nova edge function `asaas-list-payments` que busca pagamentos do cliente no Asaas e mostra status (pago/pendente/vencido)
- **Compra de usuario extra**: botao nas Configuracoes que cria cobranca avulsa

### Edge Functions novas

1. **`asaas-list-payments`** - Lista faturas/cobranças do cliente Asaas
2. **`asaas-create-charge`** - Cria cobranca avulsa (creditos extras, usuario extra)

---

## 3. Pagina Integracoes

### Layout

```
+------------------------------------------+
| Integracoes Ativas                       |
| [WhatsApp via Z-API] ● Conectado        |
|   (ja existe, manter)                    |
+------------------------------------------+

+------------------------------------------+
| Integracoes Disponiveis                  |
| [Google Agenda] Em breve                 |
| [RD Station] Em breve                   |
| [Meta Ads] Em breve                     |
| [Google Ads] Em breve                   |
+------------------------------------------+

+------------------------------------------+
| API & Webhooks                           |
| Chave de API da organizacao              |
| Webhook URL para receber leads externos  |
| (ja existe crm-lead-webhook)            |
+------------------------------------------+
```

### Implementacao

- Reorganizar `ClienteIntegracoes.tsx` com 3 secoes
- Cards de integracoes futuras como "Em breve" (apenas visual)
- Secao de API mostrando a URL do webhook de leads (`crm-lead-webhook`) para o cliente copiar
- Gerar/mostrar API key da organizacao (campo na tabela `organizations`)

---

## 4. Pagina Configuracoes

### Layout com abas

```
Abas: [Perfil] [Organizacao] [Usuarios] [Notificacoes]
```

**Aba Perfil** (ja existe, melhorar):
- Salvar de verdade na tabela `profiles` (nome, telefone, cargo, avatar)

**Aba Organizacao** (nova):
- Nome da empresa, CNPJ, email, telefone, endereco
- Salvar na tabela `organizations`

**Aba Usuarios** (nova):
- Lista de membros da organizacao (`organization_memberships` + `profiles`)
- Botao "Convidar Usuario" → cria conta via `auth.admin.createUser` + membership
- Badge de role (Admin / Gestor / Marketing / Operador)
- Limite de usuarios baseado no plano
- Indicador: "2/5 usuarios" com opcao de comprar mais

**Aba Notificacoes** (ja existe, manter)

### Edge Function nova

**`invite-user`** - Cria usuario, profile, membership e role. Envia email de boas-vindas.

### Migracao de banco

- Adicionar campo `api_key` na tabela `organizations` (para a secao de API nas integracoes)

---

## 5. Resumo Tecnico de Arquivos

| Arquivo | Acao |
|---------|------|
| `src/constants/plans.ts` | Reestruturar com basePrice, comboPrice, extras |
| `src/pages/cliente/ClientePlanoCreditos.tsx` | Redesenhar com toggle modulos, pacotes creditos, faturas |
| `src/pages/cliente/ClienteIntegracoes.tsx` | Adicionar secoes de integracoes futuras e API/Webhooks |
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Adicionar abas Organizacao e Usuarios com persistencia real |
| `supabase/functions/asaas-create-subscription/index.ts` | Suportar modulos (base/combo) |
| `supabase/functions/asaas-create-charge/index.ts` | **Nova** - cobranca avulsa |
| `supabase/functions/asaas-list-payments/index.ts` | **Nova** - listar faturas |
| `supabase/functions/invite-user/index.ts` | **Nova** - convidar usuario |
| `src/hooks/useOrgMembers.ts` | **Novo** - listar membros da org |
| `src/hooks/useOrgProfile.ts` | **Novo** - dados da organizacao |
| Migracao SQL | Adicionar `api_key` em `organizations` |

### Ordem de implementacao sugerida

1. Reestruturar `plans.ts` (base de tudo)
2. Configuracoes (perfil real + organizacao + usuarios)
3. Plano e Creditos (checkout, faturas, pacotes)
4. Integracoes (reorganizar + API section)
5. Edge functions de suporte (invite-user, asaas-create-charge, asaas-list-payments)

