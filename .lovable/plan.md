

## Análise: Resend vs Lovable Cloud para E-mails

### Situação Atual

O projeto já tem toda a infraestrutura de e-mails implementada:
- 6 templates de autenticação (signup, recovery, invite, magic-link, email-change, reauthentication) com marca NoExcuse
- Edge function `auth-email-hook` deployada
- Fila de processamento (`process-email-queue`) configurada
- Bucket `email-assets` com logo

O único ponto pendente é a **verificação DNS** do domínio `notify.sistema.noexcusedigital.com`.

### Ponto importante sobre Resend

Usar o Resend **não elimina a necessidade de configurar DNS**. O Resend também exige registros CNAME e TXT para verificar seu domínio (DKIM, SPF). Ou seja, você ainda precisaria adicionar registros no painel da HostGator.

### Recomendação

Manter a infraestrutura nativa do Lovable Cloud, que já está pronta, e resolver apenas os registros DNS pendentes. Os registros necessários são poucos (CNAME + TXT) e são os mesmos que qualquer provedor de e-mail exigiria.

### Plano proposto

1. **Reconfigurar o domínio de e-mail** — reabrir o setup de e-mail no Lovable Cloud para `notify.sistema.noexcusedigital.com`
2. **Adicionar os registros DNS na HostGator** — copiar os valores exatos de CNAME e TXT do painel do Lovable e colar na zona DNS da HostGator (são apenas 2-3 registros, sem afetar o site)
3. **Aguardar verificação** — propagação leva até 48h, enquanto isso os e-mails padrão continuam funcionando
4. **Após verificação** — os templates branded NoExcuse ativam automaticamente (auth + transacionais)

### Alternativa com Resend (se preferir mesmo assim)

Se quiser usar Resend de qualquer forma:
1. Criar conta no Resend e verificar domínio (requer os mesmos registros DNS na HostGator)
2. Gerar API key e configurar como secret
3. Criar edge function de envio via Resend
4. Adaptar o `auth-email-hook` para usar Resend em vez do Lovable email
5. Criar edge function para e-mails transacionais via Resend

Essa rota envolve mais trabalho e custo (plano Resend), com o mesmo requisito de DNS.

