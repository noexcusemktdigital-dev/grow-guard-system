

## 1. Separar conversas em "Nao Lidas" e "Lidas"

**Arquivo**: `src/components/cliente/ChatContactList.tsx`

Atualmente os contatos ja sao ordenados com nao lidos primeiro (linhas 65-73), mas sem separacao visual. A mudanca:

- Dividir a lista em duas secoes com headers visuais: "Nao lidas" (com badge de contagem) e "Lidas"
- A secao "Nao lidas" tera fundo sutil destacado e aparecera primeiro
- A secao "Lidas" mantera a ordenacao por data (Hoje / Ontem / Anteriores)
- Quando nao houver mensagens nao lidas, a secao nao aparece
- O separador de data (Hoje/Ontem/Anteriores) so aparece dentro da secao "Lidas"

### Visual:
```text
+----------------------------+
| NOVAS (3)                  |  <- header verde/primary
|  [contato com 2 nao lidas] |
|  [contato com 1 nao lida]  |
|  [contato com 5 nao lidas] |
+----------------------------+
| HOJE                       |  <- separador de data
|  [contato lido]            |
|  [contato lido]            |
| ONTEM                      |
|  [contato lido]            |
+----------------------------+
```

---

## 2. Chat Widget para o site do cliente

Criar um widget de chat embarcavel que o cliente coloca no site dele. As mensagens chegam no mesmo painel de Conversas.

### Arquitetura:

**Backend:**
- Nova tabela `website_chat_sessions`: armazena sessoes de visitantes do site (visitor_name, visitor_email, organization_id, status)
- Nova tabela `website_chat_messages`: mensagens trocadas (session_id, direction, content, created_at)
- Edge Function `website-chat` que recebe mensagens do widget (sem autenticacao JWT, validada por api_key da organizacao)
- As mensagens do widget criam/atualizam um `whatsapp_contacts` com `contact_type = 'website'` para aparecer na mesma lista de conversas
- Alternativa: as mensagens do website sao inseridas diretamente em `whatsapp_messages` com um contact que tem `contact_type = 'website'`

**Widget (embarcavel):**
- Nova pagina `src/pages/cliente/ClienteChatWidget.tsx` com configuracao: cor, mensagem de boas-vindas, posicao
- Gera um snippet HTML/JS que o cliente cola no site: `<script src="https://[url]/widget.js" data-org="[api_key]"></script>`
- O widget e um Edge Function que serve o JS do widget (`website-chat-widget`)

**Integracao com Conversas:**
- Adicionar filtro "Website" nos mode pills da lista de contatos (ao lado de IA, Humano, Grupos)
- Contatos do website mostram icone de globo/monitor em vez do avatar
- Mensagens do website aparecem com badge "Site" no chat

### Tabelas novas:

```text
website_chat_sessions:
  - id (uuid PK)
  - organization_id (uuid, FK organizations)
  - visitor_name (text)
  - visitor_email (text)
  - visitor_metadata (jsonb) -- pagina, user-agent, etc
  - status (text: active, closed)
  - whatsapp_contact_id (uuid) -- link para aparecer nas conversas
  - created_at, updated_at

website_chat_messages:
  - id (uuid PK)
  - session_id (uuid FK)
  - organization_id (uuid)
  - direction (text: inbound, outbound)
  - content (text)
  - created_at
```

### Edge Functions:

1. `website-chat` -- API REST para o widget enviar/receber mensagens (autenticado por api_key)
2. `website-chat-widget` -- Serve o arquivo JS do widget embarcavel

### Pagina de configuracao:

- Dentro de `ClienteIntegracoes` ou como sub-aba, adicionar secao "Chat do Site"
- Campos: cor primaria, mensagem de boas-vindas, nome do atendente, posicao (direita/esquerda)
- Botao "Copiar codigo" que gera o snippet para colar no site
- Preview ao vivo do widget

### Arquivos a criar/editar:

1. Migracao SQL (2 tabelas + RLS + realtime)
2. `supabase/functions/website-chat/index.ts` -- API de mensagens
3. `supabase/functions/website-chat-widget/index.ts` -- Serve JS do widget
4. `src/components/cliente/WebsiteChatConfig.tsx` -- Config + snippet
5. `src/components/cliente/ChatContactList.tsx` -- Filtro "Website" + icone
6. `src/pages/cliente/ClienteIntegracoes.tsx` -- Adicionar secao widget

### Ordem de implementacao:

1. Separar lidas/nao lidas na ChatContactList
2. Migracoes SQL para website_chat
3. Edge Functions (API + widget JS)
4. Pagina de configuracao do widget
5. Integracao na lista de conversas

