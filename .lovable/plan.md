

## Diagnóstico: 3 problemas encontrados

### Problema 1: Coluna errada no onboarding checklist
A Edge Function `provision-unit` insere com coluna `phase`, mas a tabela `onboarding_checklist` usa `category`. Isso faz o checklist falhar silenciosamente (log: `Could not find the 'phase' column`). A unidade é criada, mas sem o checklist de onboarding.

### Problema 2: Convite falha para emails já cadastrados
O log mostra erro `422: A user with this email address has already been registered`. O `invite-user` já trata isso e retorna mensagem orientando o uso de "Esqueci minha senha". Mas pode ser que o usuário esteja tentando convidar um email novo e o erro real seja outro — vou melhorar o tratamento de erro para mostrar mensagens mais claras.

### Problema 3: DNS do email pendente
O domínio `notify.sistema.noexcusedigital.com` está com status **Pending** — os registros DNS não foram configurados. Isso significa que os emails de convite enviados pelo sistema de autenticação **não estão sendo entregues** pelo domínio personalizado. Os emails padrão do sistema ainda funcionam, mas sem o branding personalizado.

---

## Plano de correção

### 1. Corrigir `provision-unit` — trocar `phase` por `category`
Substituir o campo `phase` por `category` nos 16 itens do checklist padrão para que o insert funcione corretamente.

### 2. Melhorar tratamento de erro no convite
Atualizar `UnidadeUsuariosReal.tsx` para exibir mensagens de erro mais claras quando o convite falha, especialmente para o caso de email já cadastrado.

### 3. DNS do email
Orientar sobre a configuração dos registros DNS para o domínio `notify.sistema.noexcusedigital.com` — sem isso, os emails personalizados não são enviados.

### Arquivos afetados

| Arquivo | Mudança |
|---------|---------|
| `supabase/functions/provision-unit/index.ts` | Trocar `phase` por `category` no checklist |
| `src/components/unidades/UnidadeUsuariosReal.tsx` | Melhorar mensagens de erro no convite |

