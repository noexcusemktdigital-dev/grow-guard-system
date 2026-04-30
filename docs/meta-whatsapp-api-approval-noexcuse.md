# Aprovação Meta — WhatsApp Cloud API (NoExcuse)

Documento interno para preparação do processo de App Review da Meta para uso da
**WhatsApp Business Platform / WhatsApp Cloud API** dentro da plataforma NoExcuse.

> Status: fundação técnica implementada (provider `whatsapp_cloud`, webhook,
> envio via Graph API v20.0, schema multi-tenant). Pendente: submissão final
> à Meta.

---

## 1. Checklist de aprovação Meta

### 1.1. Pré-requisitos da conta
- [ ] Meta Business Manager verificado (Business Verification concluída).
- [ ] WhatsApp Business Account (WABA) criada dentro do Business Manager.
- [ ] Display Name aprovado para o número comercial.
- [ ] Método de pagamento configurado na WABA.
- [ ] Política de Privacidade pública e atualizada
  (`https://sistema.noexcusedigital.com.br/privacidade`).
- [ ] Termos de Uso públicos e atualizados
  (`https://sistema.noexcusedigital.com.br/termos`).
- [ ] URL de exclusão de dados (Data Deletion) ativa no app Meta.

### 1.2. Configuração do App Meta
- [ ] App Meta do tipo **Business** criado.
- [ ] Produto **WhatsApp** adicionado ao app.
- [ ] Produto **Webhooks** adicionado e apontando para a URL abaixo.
- [ ] System User com permissão na WABA criado e access token de longa duração
  gerado (armazenado em `WHATSAPP_CLOUD_ACCESS_TOKEN`).
- [ ] App Secret copiado para `WHATSAPP_CLOUD_APP_SECRET`.
- [ ] Verify Token gerado e copiado para `WHATSAPP_CLOUD_VERIFY_TOKEN`.

### 1.3. Permissões / escopos solicitados
- [ ] `whatsapp_business_messaging` — enviar/receber mensagens.
- [ ] `whatsapp_business_management` — gerenciar templates, números e WABA.
- [ ] `business_management` — quando o cliente conectar a própria WABA via
  Embedded Signup.

### 1.4. Templates e conteúdo
- [ ] Pelo menos 1 template de cada categoria que será usada
  (`UTILITY`, `MARKETING`, `AUTHENTICATION`) submetido e aprovado.
- [ ] Botões e variáveis dos templates documentados.
- [ ] Política de opt-in escrita e aplicada na UI da plataforma.

### 1.5. App Review (submissão)
- [ ] Caso de uso descrito em português e inglês.
- [ ] Vídeo demo de 3 a 5 minutos enviado (ver roteiro na seção 4).
- [ ] Instruções de teste para o revisor (login, senha de teste, número
  WhatsApp de teste).
- [ ] Resposta padrão pronta para perguntas adicionais (seção 5).

---

## 2. URL do webhook

```
https://<VITE_SUPABASE_PROJECT_ID>.supabase.co/functions/v1/whatsapp-cloud-webhook
```

- **Verify Token**: valor de `WHATSAPP_CLOUD_VERIFY_TOKEN`.
- **Subscribe fields**: `messages`, `message_template_status_update`,
  `account_update`, `phone_number_quality_update`.
- **Método GET**: usado pela Meta para o handshake inicial
  (`hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`).
- **Método POST**: usado pela Meta para entregar eventos. A função valida a
  assinatura `X-Hub-Signature-256` usando `WHATSAPP_CLOUD_APP_SECRET` e
  registra o payload em `whatsapp_cloud_webhook_logs`.

---

## 3. Secrets necessários

Configurar em **Lovable Cloud → Backend → Secrets**:

| Secret | Uso |
|--------|-----|
| `WHATSAPP_CLOUD_VERIFY_TOKEN` | Validação do handshake GET do webhook. |
| `WHATSAPP_CLOUD_ACCESS_TOKEN` | Token global do System User (fallback quando a org não trouxe token próprio via Embedded Signup). |
| `WHATSAPP_CLOUD_APP_SECRET` | Validação HMAC SHA-256 de `X-Hub-Signature-256`. |

> O modelo é **híbrido**: se a `whatsapp_instances` da org tiver
> `access_token_encrypted`, ele é usado; senão, cai no token global do
> ambiente.

---

## 4. Roteiro de vídeo demo (3 a 5 minutos)

Gravar em 1080p, com narração em inglês (ou legendado), mostrando o app
real em produção/preview.

| Tempo | Cena | O que mostrar |
|-------|------|---------------|
| 00:00 – 00:20 | **Login** | Abrir `https://sistema.noexcusedigital.com.br`, mostrar a tela de login e entrar com a conta de teste do revisor. |
| 00:20 – 00:50 | **Tour rápido** | Mostrar o dashboard do cliente final e navegar até **Integrações → WhatsApp**. Explicar que a plataforma é um SaaS de gestão comercial e que a integração WhatsApp é usada para conversar com leads do CRM. |
| 00:50 – 01:30 | **Conexão WhatsApp / Meta (Embedded Signup ou credenciais)** | Selecionar o provider **WhatsApp Cloud API (oficial)**, abrir o fluxo de conexão, mostrar a **consent screen** da Meta com as permissões `whatsapp_business_messaging`, `whatsapp_business_management` e `business_management`, autorizar e voltar para a plataforma com a WABA conectada (WABA ID + Phone Number ID + nome verificado exibidos). |
| 01:30 – 02:00 | **Webhook** | Abrir o painel do app Meta e mostrar a URL do webhook configurada (`/functions/v1/whatsapp-cloud-webhook`) com os campos `messages` e `message_template_status_update` assinados. Mostrar o status “verificado”. |
| 02:00 – 02:40 | **Recebimento de mensagem** | De um celular real, enviar uma mensagem para o número comercial. Voltar para a plataforma e mostrar a mensagem chegando em tempo real na conversa do CRM, com o contato criado/atualizado automaticamente. |
| 02:40 – 03:20 | **Resposta dentro da janela de 24h** | Responder pela plataforma com texto livre. Mostrar o status `enviado → entregue → lido` atualizando via webhook. |
| 03:20 – 04:00 | **Envio de template aprovado** | Selecionar um contato fora da janela de 24h, escolher um template aprovado (categoria UTILITY ou MARKETING), preencher variáveis e enviar. Mostrar a mensagem chegando no celular. |
| 04:00 – 04:30 | **Opt-in e opt-out** | Mostrar na UI do CRM o checkbox/registro de opt-in do contato e o fluxo de opt-out (palavra-chave “SAIR” respeitada automaticamente; contato marcado como opted-out e bloqueado para novos envios). |
| 04:30 – 05:00 | **Desconexão** | Voltar em **Integrações → WhatsApp**, clicar em **Desconectar**, confirmar e mostrar que tokens, WABA ID e Phone Number ID foram removidos da plataforma. |

Dicas de gravação:
- Esconder dados sensíveis reais (usar conta/empresa de teste).
- Mostrar o cursor com destaque.
- Falar em voz alta cada permissão na consent screen.
- Subir o vídeo no YouTube como **não listado** e enviar o link no App Review.

---

## 5. E-mail / resposta padrão para a Meta

Use quando o revisor pedir esclarecimentos ou um link adicional do vídeo.

### Versão em inglês

> Subject: NoExcuse — WhatsApp Business Platform App Review — Demo video
>
> Hi Meta Review Team,
>
> Thank you for reviewing our submission. NoExcuse
> (https://sistema.noexcusedigital.com.br) is a B2B SaaS for sales and marketing
> management used by Brazilian SMBs. Our WhatsApp Business Platform
> integration lets each customer connect their own WABA to talk with leads
> stored in our CRM, send approved templates and track delivery status.
>
> The demo video below (3–5 minutes) shows the full functionality and the
> OAuth / WhatsApp workflow end to end:
>
> - Login with a test account
> - Connecting a WhatsApp Business Account via the official Meta consent
>   screen, showing the requested permissions
>   (`whatsapp_business_messaging`, `whatsapp_business_management`,
>   `business_management`)
> - Webhook configuration and verification
> - Receiving an inbound message from a real phone
> - Replying within the 24h customer service window
> - Sending an approved template outside the 24h window
> - Opt-in capture and opt-out enforcement
> - Disconnecting the integration (tokens, WABA ID and Phone Number ID
>   are removed)
>
> Demo video: <link YouTube não listado>
> Test credentials: <usuário / senha / número de teste>
>
> Please let us know if you need any additional information.
>
> Best regards,
> NoExcuse Team

### Versão em português (interno)

> Olá time Meta,
>
> Segue o vídeo demonstrando a funcionalidade completa e o workflow de
> OAuth / WhatsApp da NoExcuse: login, conexão da WABA pela consent
> screen oficial com as permissões solicitadas, configuração e verificação
> do webhook, recebimento de mensagem real, resposta dentro da janela de
> 24h, envio de template aprovado, captura de opt-in, respeito ao opt-out
> e desconexão completa da integração.
>
> Vídeo: <link>
> Credenciais de teste: <…>
>
> À disposição para qualquer dúvida adicional.
