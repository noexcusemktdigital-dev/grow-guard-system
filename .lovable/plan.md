

## Situação Atual — Nenhuma mudança necessária

O fluxo já está correto para o caso de uso padrão:

1. **Cadastro (`SaasAuth`)** → Nome, Email, Senha + Termos ✅
2. **Onboarding (`ClienteOnboardingCompany`)** → CNPJ, Telefone, Segmento, etc. ✅  
3. **Checkout (`ClientePlanoCreditos` → SubscriptionDialog)** → Escolha de plano + Campo de cupom + Pagamento ✅

O cupom de desconto já foi implementado no local correto: no momento do checkout/assinatura, onde o usuário escolhe o plano e o desconto é aplicado ao valor antes de enviar ao Asaas.

### Se quiser mudar algo

Existem duas opções caso queira antecipar o cupom:

**Opção A — Manter como está (recomendado)**
Cupom no checkout faz sentido comercial: o usuário já decidiu assinar e aplica o desconto ali.

**Opção B — Cupom no onboarding**  
Adicionar campo de cupom no Step 3 do `ClienteOnboardingCompany`, salvar na org, e auto-aplicar no checkout depois. Mais complexo, mas permite captar o cupom antes.

Nenhuma implementação é necessária agora — tudo já está funcionando. Confirme se quer alterar o momento em que o cupom é solicitado.

