

## Corrigir Fluxo End-to-End: Signup -> Onboarding -> Assinatura Asaas

### Problemas Identificados

1. **CNPJ nao salvo no onboarding**: O formulario coleta o CNPJ, mas o `handleFinish` NAO inclui `cnpj` no payload de update. O campo e enviado ao Asaas vazio, causando erro "CPF/CNPJ e obrigatorio".

2. **CNPJ marcado como opcional**: Para gerar assinatura no Asaas, o CNPJ/CPF e obrigatorio. O onboarding marca como "(opcional)", permitindo que o usuario pule.

3. **Sem validacao pre-assinatura**: O `SubscriptionDialog` em `ClientePlanoCreditos.tsx` nao verifica se o CNPJ esta preenchido antes de chamar `asaas-create-subscription`.

### Correcoes

#### 1. `ClienteOnboardingCompany.tsx` — Salvar CNPJ no update
- Adicionar `cnpj: form.cnpj || undefined` ao payload do `handleFinish` (linha 111)
- Manter CNPJ como opcional no onboarding (usuario pode preencher depois)

#### 2. `ClientePlanoCreditos.tsx` — Validar CNPJ antes de assinar
- No `SubscriptionDialog`, antes de chamar a Edge Function, buscar o CNPJ da org
- Se estiver vazio, mostrar toast de erro: "Preencha o CNPJ/CPF da empresa em Configuracoes antes de assinar"
- Impedir o envio da mutation

#### 3. `ClienteConfiguracoes.tsx` — Garantir campo CNPJ editavel
- Verificar que a tela de configuracoes permite editar o CNPJ (ja existe, apenas confirmar)

### Resultado Esperado
1. Usuario cria conta no SaaS
2. Completa onboarding (CNPJ salvo se preenchido)
3. Vai em Planos, escolhe um plano
4. Se CNPJ preenchido: Asaas cria subscription mensal recorrente com sucesso
5. Se CNPJ vazio: mensagem clara pedindo para preencher antes

