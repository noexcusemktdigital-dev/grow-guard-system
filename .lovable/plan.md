

# Agenda Google - Self-Service por Franqueado

Mudar a arquitetura para que cada franqueado configure suas proprias credenciais do Google Calendar diretamente na interface, com um passo a passo guiado.

---

## Mudanca de arquitetura

Atualmente as Edge Functions buscam `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` de variaveis de ambiente (secrets do sistema). Isso sera alterado para:

- Cada franqueado insere seu proprio Client ID e Client Secret na tela da Agenda
- Credenciais salvas na tabela `google_calendar_tokens` (colunas novas: `client_id`, `client_secret`)
- Edge Functions leem as credenciais do banco, por usuario, em vez de env vars

---

## 1. Banco de dados

Adicionar colunas na tabela `google_calendar_tokens`:

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| client_id | text | Google OAuth Client ID do franqueado |
| client_secret | text | Google OAuth Client Secret do franqueado |

---

## 2. UI - Wizard de configuracao

Na pagina `FranqueadoAgenda.tsx`, ao clicar em "Conectar Google Agenda", abrir um Dialog com 3 etapas:

### Etapa 1 - Passo a passo
Instrucoes visuais (cards numerados) explicando como o franqueado cria as credenciais:

1. Acesse o [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto (ou use um existente)
3. Ative a API "Google Calendar API"
4. Va em "Credenciais" e crie um "ID do cliente OAuth 2.0"
5. Tipo de aplicacao: "Aplicativo da Web"
6. Em "URIs de redirecionamento autorizados", adicione: `https://[dominio-do-app]/franqueado/agenda`
7. Copie o Client ID e Client Secret gerados

### Etapa 2 - Inserir credenciais
Formulario com dois campos:
- Client ID (texto)
- Client Secret (texto/password)

Botao "Salvar e Conectar" que:
1. Salva client_id e client_secret na tabela `google_calendar_tokens`
2. Gera a URL de autorizacao usando essas credenciais
3. Redireciona para o Google OAuth

### Etapa 3 - Callback OAuth
Mesma logica atual de trocar o `code` por tokens, mas agora lendo client_id/client_secret do banco do usuario.

---

## 3. Edge Functions

### `google-calendar-oauth`
- Acao `save_credentials`: salva client_id e client_secret no banco
- Acao `get_auth_url`: le client_id do banco do usuario (nao de env var) e gera URL
- Acao `exchange_code`: le client_id e client_secret do banco do usuario para trocar code por tokens
- Acao `disconnect`: mantem igual

### `google-calendar-sync`
- Le client_id e client_secret do banco do usuario (via `google_calendar_tokens`) para refresh de tokens
- Resto da logica mantem igual

---

## 4. Arquivos editados

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Adicionar colunas `client_id` e `client_secret` em `google_calendar_tokens` |
| `supabase/functions/google-calendar-oauth/index.ts` | Ler credenciais do banco, nova acao `save_credentials` |
| `supabase/functions/google-calendar-sync/index.ts` | Ler credenciais do banco em vez de env vars |
| `src/hooks/useGoogleCalendar.ts` | Adicionar mutation `saveCredentials`, atualizar fluxo |
| `src/pages/franqueado/FranqueadoAgenda.tsx` | Wizard de configuracao com passo a passo + formulario de credenciais |

---

## Fluxo completo do franqueado

```text
1. Clica "Conectar Google Agenda"
2. Ve passo a passo ilustrado de como criar credenciais no Google
3. Insere Client ID e Client Secret
4. Clica "Salvar e Conectar"
5. Redirecionado para Google OAuth (tela de permissao)
6. Autoriza o acesso
7. Redirecionado de volta -> tokens salvos automaticamente
8. Badge "Google conectado" aparece
9. Botao "Sincronizar" disponivel
```

Nenhum secret de sistema e necessario. Cada franqueado e autonomo.

