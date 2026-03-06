

## Diagnostico: Integracao Google Agenda

### Problema identificado

O `redirect_uri` enviado ao Google e `https://sistema.noexcusedigital.com/agenda`. Para o OAuth funcionar, esse URI **exato** precisa estar cadastrado como "Authorized redirect URI" no Google Cloud Console do projeto `344970008357`.

### O que precisa ser feito

#### 1. No Google Cloud Console (manual, feito por voce)
- Acesse [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
- Edite o OAuth Client ID `344970008357-kugceeg6vonnkurs9vhu5b14fe1ruutv`
- Em **Authorized redirect URIs**, adicione:
  - `https://sistema.noexcusedigital.com/agenda` (franqueadora)
  - `https://sistema.noexcusedigital.com/franqueado/agenda` (franqueado)
  - `https://grow-guard-system.lovable.app/agenda` (preview/staging)
- Em **Authorized JavaScript origins**, adicione:
  - `https://sistema.noexcusedigital.com`
  - `https://grow-guard-system.lovable.app`

#### 2. Verificacao do app (referente ao link que voce enviou)
- Se o app esta em modo "Testing", somente usuarios adicionados como "Test users" na tela de consentimento (OAuth Consent Screen) poderao autorizar
- Para uso em producao com qualquer usuario, o app precisa ser publicado (e possivelmente verificado pelo Google, dependendo dos escopos)
- O escopo `https://www.googleapis.com/auth/calendar` e **restrito**, entao o Google pode exigir verificacao completa

#### 3. Correcao de codigo (pequena)
O `redirect_uri` no `Agenda.tsx` esta hardcoded como `/agenda`, mas o usuario acessa via `/franqueadora/agenda`. Vou corrigir para usar `window.location.pathname` dinamicamente, garantindo que funcione em ambas as rotas.

### Arquivos a alterar
- `src/pages/Agenda.tsx` - Corrigir `redirectUri` para usar o pathname atual
- `src/pages/franqueado/FranqueadoAgenda.tsx` - Mesmo ajuste (ja usa `/franqueado/agenda`, esta ok)

### Resumo
| Acao | Responsavel |
|------|-------------|
| Adicionar redirect URIs no Google Console | Voce |
| Adicionar test users ou publicar app | Voce |
| Corrigir redirectUri dinamico no codigo | Lovable |

