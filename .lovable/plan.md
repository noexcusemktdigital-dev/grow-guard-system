

## Diagnóstico: Mensagens não chegam da Evolution API

### Problema
A instância **noexcuse** está **conectada** (state: open) no servidor Evolution (`http://129.121.44.154:8080`), mas o webhook `evolution-webhook` tem **zero logs** — ou seja, o servidor Evolution não está enviando eventos para a URL do sistema.

A URL correta do webhook deveria ser:
```
https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/evolution-webhook/adb09618-e9f3-4dbd-a89c-29e3eb1bec9f
```

### Causa Provável
O webhook foi configurado durante o `connect`, mas pode ter sido perdido ou sobrescrito no servidor Evolution. Não existe uma ação no sistema para **reconfigurar o webhook** sem reconectar toda a instância.

### Solução

**1. Adicionar ação `reconfigure-webhook` no `whatsapp-setup`**
- Nova action que chama `POST /webhook/set/{instanceName}` na Evolution para reconfigurar a URL do webhook sem precisar desconectar/reconectar
- Também adicionar `MESSAGES_UPDATE` aos eventos monitorados (para status de entrega)

**2. Adicionar botão "Reconfigurar Webhook" na UI de integração**
- No `WhatsAppSetupWizard.tsx`, quando a instância está conectada mas sem mensagens, permitir reconfigurar o webhook com um clique

**3. Verificar webhook atual via Evolution API**
- Chamar `GET /webhook/find/{instanceName}` para mostrar ao usuário qual URL está configurada atualmente no servidor Evolution

### Arquivos a editar
- `supabase/functions/whatsapp-setup/index.ts` — adicionar action `reconfigure-webhook`
- `src/components/cliente/WhatsAppSetupWizard.tsx` — botão para reconfigurar webhook

### Alternativa imediata
Se quiser testar agora, posso reconfigurar o webhook diretamente chamando a Evolution API via curl do edge function, sem precisar mudar código. Basta aprovar o plano.

