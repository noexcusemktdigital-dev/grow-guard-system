

# Conexão Automática do Google Agenda — Plano

## Situação Atual
- O fluxo atual exige que cada cliente crie seu próprio projeto no Google Cloud Console, gere Client ID/Secret e cole no wizard de 8 passos
- Isso é inviável para clientes finais

## O Que Muda
Um único par de credenciais OAuth (da plataforma) será usado para todos os clientes. O cliente clica em **"Conectar Google Agenda"** → é redirecionado ao Google → autoriza → volta conectado. Zero configuração manual.

## Pré-requisito: Adicionar Secrets
Os secrets `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` (para Calendar) **ainda não existem** no projeto. Vou solicitar que você os adicione antes de implementar.

## Alterações

### 1. Edge Function `google-calendar-oauth`
- **`get_auth_url`**: em vez de ler `client_id` do banco, lê do secret `GOOGLE_CLIENT_ID`
- **`exchange_code`**: em vez de ler `client_id`/`client_secret` do banco, lê dos secrets `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`
- **Remover** a action `save_credentials` (não é mais necessária)
- O `redirect_uri` será fixo: `{origin}/cliente/agenda` (ou a URL da página)
- Ao criar o registro em `google_calendar_tokens`, não salva mais `client_id`/`client_secret` (campos ficam vazios ou são removidos)

### 2. Hook `useGoogleCalendar.ts`
- **Remover** `useGoogleCalendarSaveCredentials` (não é mais necessário)
- **`useGoogleCalendarConnect`**: chama `get_auth_url` diretamente sem precisar salvar credenciais antes

### 3. Componente `GoogleSetupWizard.tsx`
- **Substituir** o wizard de 8 passos por um simples dialog de confirmação ou eliminá-lo completamente
- O botão "Conectar Google Agenda" chama diretamente `get_auth_url` → redireciona ao Google

### 4. Páginas `ClienteAgenda.tsx` e `Agenda.tsx`
- Atualizar o botão "Conectar Google Agenda" para chamar diretamente a conexão (sem abrir wizard)
- Manter o fluxo de callback (`?code=...`) como está

### 5. Tabela `google_calendar_tokens`
- Colunas `client_id` e `client_secret` podem ser mantidas (compatibilidade) mas não serão mais populadas para novos usuários

## Fluxo Final do Cliente

```text
Clica "Conectar Google Agenda"
  → Edge function gera URL OAuth com CLIENT_ID da plataforma
  → Google mostra tela de consentimento
  → Usuário autoriza
  → Redireciona de volta com ?code=...
  → Edge function troca code por tokens usando CLIENT_ID + CLIENT_SECRET da plataforma
  → Salva tokens no banco
  → Agenda sincronizada ✓
```

## Ordem de Execução
1. Adicionar secrets `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`
2. Atualizar edge function
3. Simplificar hook e componentes
4. Testar fluxo completo

