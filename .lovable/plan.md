

## Diagnóstico — E-mails sem personalização

### Situação atual

1. **O domínio `notify.sistema.noexcusedigital.com.br` está com DNS pendente.** Enquanto o DNS não for verificado, os e-mails de autenticação (definição de senha, redefinição, convite, etc.) são enviados pelo sistema padrão, sem os templates personalizados e sem o domínio da NoExcuse.

2. **O `auth-email-hook` usa um padrão antigo** (envia direto via Resend API) em vez do sistema de fila gerenciado. Isso precisa ser atualizado para o padrão atual com `enqueue_email`, que garante retries, rate-limit e integração correta com o domínio verificado.

3. **Os templates já existem e estão corretos** — logo da NoExcuse, textos em PT-BR, cores da marca. O problema não é o conteúdo dos templates, é a infraestrutura de envio.

### Plano de correção

**Passo 1: Atualizar a infraestrutura de e-mail**
- Garantir que a infraestrutura de fila (pgmq, cron, tabelas) esteja configurada
- Re-gerar o `auth-email-hook` para usar o padrão de fila (`enqueue_email`) em vez do Resend direto
- Reaplicar os estilos e textos PT-BR da NoExcuse nos templates (logo, cores, tom)
- Deploy da função atualizada

**Passo 2: DNS (ação do administrador)**
- O DNS do subdomínio `notify.sistema.noexcusedigital.com.br` precisa ser configurado no registrador de domínio
- Registros NS apontando para os nameservers corretos (fornecidos nas configurações de e-mail do projeto)
- Até que o DNS seja verificado, os e-mails continuarão sendo enviados pelo sistema padrão
- Após verificação, todos os e-mails passam automaticamente a usar os templates personalizados com o domínio da NoExcuse

### Resultado esperado

Após DNS verificado, todos os e-mails de autenticação serão enviados:
- Com a logo da NoExcuse Digital
- Em português (PT-BR)
- Do domínio `noexcusedigital.com.br` (ou `notify.sistema.noexcusedigital.com.br`)
- Com os templates personalizados (cores da marca, botões vermelhos, textos customizados)

### Nota importante

A configuração do DNS é a etapa crítica e precisa ser feita no painel do registrador de domínio (onde o `sistema.noexcusedigital.com.br` é gerenciado). Sem isso, nenhuma mudança no código resolverá o problema dos e-mails genéricos.

