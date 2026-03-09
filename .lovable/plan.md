

## Cupom de Desconto + Termos Simplificados

### Resumo

Adicionar campo de cupom no checkout e atualizar o conteúdo dos Termos de Uso existentes com cláusulas LGPD/disparos. O checkbox no signup continua simples como já está.

### 1. Cupom de Desconto

**Tabela `discount_coupons`:**
- `id`, `code` (unique), `discount_percent`, `max_uses`, `uses_count`, `expires_at`, `is_active`, `created_at`

**Nova Edge Function `validate-coupon`:**
- Recebe `code`, valida existência, ativo, não expirado, usos disponíveis
- Retorna `discount_percent`

**Atualizar `asaas-create-subscription`:**
- Receber `coupon_code` opcional, validar server-side, aplicar desconto no valor, incrementar `uses_count`

**UI em `ClientePlanoCreditos.tsx` (SubscriptionDialog):**
- Campo de texto + botão "Aplicar"
- Mostrar desconto aplicado no preço (ex: ~~R$ 797~~ R$ 717)

### 2. Termos de Uso — Atualizar Conteúdo

**Atualizar `TermosDeUso.tsx`** adicionando cláusulas:
- LGPD: usuário é controlador, plataforma é operadora
- Disparos/WhatsApp: risco de bloqueio é responsabilidade do usuário
- IA: conteúdos gerados são sugestões, revisar antes de usar

**Signup (`SaasAuth.tsx`)** — manter checkbox simples como está, sem mudanças.

### Arquivos

1. Nova migração — tabela `discount_coupons`
2. Nova Edge Function `validate-coupon/index.ts`
3. `asaas-create-subscription/index.ts` — suporte a cupom
4. `ClientePlanoCreditos.tsx` — campo cupom no dialog
5. `TermosDeUso.tsx` — novas cláusulas

