

# Implementacao WhatsApp Z-API -- Etapas 2, 3 e 4

A infraestrutura (tabelas + edge functions) ja esta implementada. Este plano cobre as 3 etapas restantes.

---

## Etapa 2 -- Pagina de Integracoes (Setup Guiado)

Substituir o placeholder `ClienteIntegracoes.tsx` por uma pagina funcional com:

**Card principal WhatsApp/Z-API:**
- Exibe status da conexao (Conectado com badge verde / Desconectado com badge cinza)
- Quando conectado: mostra numero do telefone, botao "Desconectar" e "Verificar Status"
- Quando desconectado: botao "Configurar"

**Sheet de configuracao com 3 passos:**
1. **Inserir credenciais** -- campos para Instance ID, Token e Client-Token com instrucoes claras
2. **Conectar** -- botao que chama a edge function `whatsapp-setup`, mostra loading e resultado
3. **Confirmacao** -- exibe status da conexao, numero conectado, webhooks configurados

**Componente novo:** `WhatsAppSetupWizard.tsx`

---

## Etapa 3 -- Chat WhatsApp Funcional

Substituir o placeholder `ClienteChat.tsx` por um chat completo de duas colunas:

**Coluna esquerda -- Lista de contatos:**
- Componente `ChatContactList.tsx`
- Lista ordenada por ultima mensagem
- Busca por nome/telefone
- Badge de mensagens nao lidas
- Foto do contato (ou avatar padrao)

**Coluna direita -- Conversa:**
- Componente `ChatConversation.tsx` com `ChatMessageBubble.tsx`
- Bolhas de mensagem com direcao (enviada a direita, recebida a esquerda)
- Horario e status (checkmarks para sent/delivered/read)
- Input de mensagem com botao enviar
- Scroll automatico para ultima mensagem

**Realtime:**
- Subscription no canal `whatsapp_messages` para novas mensagens
- Subscription no canal `whatsapp_contacts` para atualizar unread_count
- Ao selecionar contato, chama `useMarkContactRead`

**Estado vazio:**
- Se nao tem instancia conectada: CTA "Configure o WhatsApp em Integracoes"
- Se conectado mas sem conversas: mensagem "Nenhuma conversa ainda"

---

## Etapa 4 -- Disparos conectados a Z-API

Atualizar `ClienteDisparos.tsx`:

- Verificar se tem instancia Z-API conectada ao abrir a pagina
- Se nao conectado: alerta no topo com link para Integracoes
- Ao criar disparo com canal "whatsapp": botao "Enviar agora" chama `whatsapp-send` para cada destinatario
- Campo de destinatarios (lista de telefones) no wizard de criacao

---

## Arquivos a criar/editar

| Acao | Arquivo |
|------|---------|
| Criar | `src/components/cliente/WhatsAppSetupWizard.tsx` |
| Criar | `src/components/cliente/ChatContactList.tsx` |
| Criar | `src/components/cliente/ChatConversation.tsx` |
| Criar | `src/components/cliente/ChatMessageBubble.tsx` |
| Editar | `src/pages/cliente/ClienteIntegracoes.tsx` |
| Editar | `src/pages/cliente/ClienteChat.tsx` |
| Editar | `src/pages/cliente/ClienteDisparos.tsx` |

## Detalhes Tecnicos

- Hooks ja implementados em `useWhatsApp.ts`: `useWhatsAppInstance`, `useWhatsAppContacts`, `useWhatsAppMessages`, `useSetupWhatsApp`, `useSendWhatsAppMessage`, `useMarkContactRead`
- Edge functions ja deployadas: `whatsapp-setup`, `whatsapp-send`, `whatsapp-webhook`
- Realtime ja habilitado nas tabelas `whatsapp_messages` e `whatsapp_contacts`
- Nenhuma migration adicional necessaria
- O Chat usa `supabase.channel()` para subscricoes realtime de `postgres_changes`

