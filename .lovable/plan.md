

# Diagnóstico: O que falta para o SaaS estar pronto para vender?

## O que JA ESTA PRONTO

| Area | Status |
|------|--------|
| Autenticacao (login, signup, Google OAuth, reset senha) | Pronto |
| Provisionamento automatico (org, trial 7 dias, 100 creditos) | Pronto |
| Feature Gate (bloqueio pos-trial e sem creditos) | Pronto |
| Sidebar com modulos Comercial + Marketing | Pronto |
| CRM completo (Kanban, leads, propostas, funis, automacoes) | Pronto |
| Chat WhatsApp (contatos, mensagens, agentes IA) | Pronto |
| Agentes IA (SDR, Closer, Pos-venda, Suporte) | Pronto |
| Scripts de vendas | Pronto |
| Disparos WhatsApp | Pronto |
| Plano de Vendas (metas, diagnostico) | Pronto |
| Dashboard/Relatorios (CRM, Chat, Agentes) | Pronto |
| Conteudos e Redes Sociais | Pronto |
| Sites (gerador IA) | Pronto |
| Trafego Pago | Pronto |
| Plano e Creditos (upgrade, pacotes extras, faturas Asaas) | Pronto |
| Configuracoes (perfil, org, usuarios, convite) | Pronto |
| Integracoes (API key, webhook) | Pronto |
| Checklist diario | Pronto |
| Gamificacao | Pronto |
| Avaliacoes | Pronto |

---

## O que FALTA para vender (itens criticos)

### 1. Confirmacao de email no signup (CRITICO - Seguranca)

Atualmente o signup nao exige verificacao de email. O usuario cria a conta e ja entra direto. Isso permite:
- Contas falsas
- Spam no sistema
- Problemas de cobranca

**Acao:** Ativar confirmacao de email e ajustar o fluxo de signup para exibir tela "Verifique seu email" antes de liberar acesso.

### 2. Provisionamento para Google OAuth (CRITICO - Bug)

Quando o usuario se cadastra via Google, a edge function `signup-saas` nao e chamada automaticamente. O usuario entra mas nao tem organizacao, role, subscription ou wallet criados.

**Acao:** Criar um trigger ou hook que detecte novos usuarios com `signup_source: saas` e execute o provisionamento automaticamente (via trigger no banco ou verificacao no login).

### 3. Termos de Uso e Politica de Privacidade (CRITICO - Legal)

Nao existe checkbox de aceitacao de termos no signup. Para vender um SaaS no Brasil, e obrigatorio ter:
- Termos de Servico
- Politica de Privacidade (LGPD)

**Acao:** Adicionar checkbox no formulario de signup + paginas estaticas com os termos.

### 4. Pagina de Pricing publica / Landing Page (IMPORTANTE)

Atualmente o usuario so ve os planos depois de criar a conta. Para vender, precisa de uma pagina publica com:
- Precos e comparativo de planos
- CTA para criar conta
- Beneficios e screenshots

**Acao:** Criar uma landing page publica em `/app` ou em rota propria com os planos e CTA.

### 5. Webhook Asaas para ativacao de plano (IMPORTANTE)

O webhook `asaas-webhook` ja existe, mas precisa validar que ao confirmar pagamento de assinatura, o plano e atualizado no banco (de trial para o plano pago). Verificar se o fluxo completo funciona:
- Cobranca criada -> Pagamento confirmado -> Subscription atualizada -> Creditos renovados

### 6. Email transacional de boas-vindas (DESEJAVEL)

Apos signup, enviar email de boas-vindas com:
- Instrucoes de primeiros passos
- Link para o painel
- Dicas de uso

---

## Resumo de prioridades

```text
+----+----------------------------------------------+-------------+
| #  | Item                                         | Prioridade  |
+----+----------------------------------------------+-------------+
| 1  | Confirmacao de email no signup                | CRITICO     |
| 2  | Provisionamento para signup via Google OAuth  | CRITICO     |
| 3  | Termos de Uso + Politica de Privacidade       | CRITICO     |
| 4  | Landing page publica com pricing              | IMPORTANTE  |
| 5  | Validar fluxo completo Asaas (webhook)        | IMPORTANTE  |
| 6  | Email de boas-vindas                          | DESEJAVEL   |
+----+----------------------------------------------+-------------+
```

## Plano tecnico de implementacao

### Item 1 - Confirmacao de email
- Usar `configure-auth` para desabilitar auto-confirm
- Alterar `SaasAuth.tsx`: apos signup, exibir tela "Verifique seu email" em vez de redirecionar direto
- Mover chamada do `signup-saas` para apos a confirmacao (via trigger no banco ao confirmar email)

### Item 2 - Provisionamento Google OAuth
- Criar trigger `on_auth_user_created` que verifica `raw_user_meta_data->>'signup_source' = 'saas'`
- Ou: no `ClienteLayout.tsx`, ao detectar usuario sem org, chamar `signup-saas` automaticamente
- A segunda opcao e mais segura e cobre todos os cenarios

### Item 3 - Termos de Uso
- Criar pagina `/termos` e `/privacidade` com conteudo placeholder
- Adicionar checkbox obrigatorio no formulario de signup
- Gravar aceitacao no `profiles` (campo `accepted_terms_at`)

### Item 4 - Landing Page
- Criar rota publica `/app` com hero, beneficios, pricing cards (usando `PLANS` de `constants/plans.ts`) e CTA
- Redirecionar usuarios nao autenticados de `/app` para esta landing

### Item 5 - Validar fluxo Asaas
- Revisar `asaas-webhook` para garantir que `PAYMENT_CONFIRMED` atualiza `subscriptions.plan` e `subscriptions.status`
- Testar fluxo completo com dados reais

### Item 6 - Email boas-vindas
- Usar sistema de auth email templates do Lovable para customizar email de confirmacao com branding e instrucoes

---

## Arquivos a criar/modificar

```text
+---------------------------------------------------+---------------------------+
| Arquivo                                           | Acao                      |
+---------------------------------------------------+---------------------------+
| src/pages/SaasAuth.tsx                            | Tela verificacao email    |
| src/components/ClienteLayout.tsx                  | Auto-provisionamento      |
| src/pages/TermosDeUso.tsx                         | CRIAR - pagina termos     |
| src/pages/PoliticaPrivacidade.tsx                 | CRIAR - pagina LGPD       |
| src/pages/SaasLanding.tsx                         | CRIAR - landing publica   |
| src/App.tsx                                       | Novas rotas               |
| supabase/functions/asaas-webhook/index.ts         | Revisar fluxo             |
+---------------------------------------------------+---------------------------+

Migracoes necessarias:
- Adicionar campo accepted_terms_at (timestamp) na tabela profiles
```
