

## Plano: Refazer o Tutorial/Wizard do Google Calendar

### Contexto
O `GoogleSetupWizard` existe duplicado em `Agenda.tsx` (Franqueadora) e `FranqueadoAgenda.tsx` (Franqueado), com passos incompletos. O tutorial atual tem apenas 7 passos focados na criacao de credenciais, mas faltam etapas criticas como: configurar a Tela de Consentimento OAuth, adicionar Test Users, e ativar a API. O cliente final nao tem agenda, entao nao sera afetado.

### O que muda

**1. Extrair o componente `GoogleSetupWizard` para arquivo compartilhado**
- Criar `src/components/agenda/GoogleSetupWizard.tsx` com o wizard completo
- Remover o wizard inline de `Agenda.tsx` e `FranqueadoAgenda.tsx`, importando o componente compartilhado
- O `redirectUri` sera calculado dinamicamente (`window.location.origin + window.location.pathname`)

**2. Reescrever o passo-a-passo do wizard (Step 1) com o fluxo completo e correto**

O novo tutorial tera as seguintes etapas organizadas em cards:

1. Acesse o Google Cloud Console e crie/selecione um projeto
2. Ative a Google Calendar API em "APIs e Servicos" > "Biblioteca"
3. Configure a Tela de Consentimento OAuth:
   - Tipo: Externo
   - Preencha nome do app, e-mail de suporte e dominio autorizado
4. Adicione Test Users (enquanto app nao for publicado):
   - Em "Tela de Consentimento" > "Test users", adicione os e-mails que vao usar
5. Crie as credenciais OAuth:
   - "Credenciais" > "Criar credenciais" > "ID do cliente OAuth 2.0"
   - Tipo: Aplicativo da Web
6. Em "Origens JavaScript autorizadas", adicione o dominio (ex: `https://sistema.noexcusedigital.com`)
7. Em "URIs de redirecionamento autorizados", adicione a URL exata (mostrada dinamicamente)
8. Copie o Client ID e Client Secret gerados

**3. Step 2 permanece igual** (campos Client ID e Client Secret + botao Salvar e Conectar)

### Arquivos alterados
| Arquivo | Acao |
|---------|------|
| `src/components/agenda/GoogleSetupWizard.tsx` | Criar (novo componente compartilhado) |
| `src/pages/Agenda.tsx` | Remover wizard inline, importar componente |
| `src/pages/franqueado/FranqueadoAgenda.tsx` | Remover wizard inline, importar componente |

