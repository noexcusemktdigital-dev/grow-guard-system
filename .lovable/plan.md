

## Usar credenciais próprias do Google OAuth (branding NoExcuse)

### Problema
Atualmente o Google Sign-In usa as credenciais gerenciadas pela Lovable Cloud, que exibem a logo e nome "Lovable" na tela de consentimento do Google. O usuário quer que apareça a marca **NoExcuse**.

### Solução
Não é necessário alterar código. É preciso configurar credenciais OAuth próprias no Google Cloud Console e cadastrá-las no Lovable Cloud:

1. **No Google Cloud Console** (`console.cloud.google.com`):
   - Criar um projeto (ou usar existente) com o nome "NoExcuse"
   - Configurar a **Tela de Consentimento OAuth** com nome "NoExcuse", logo da NoExcuse, e-mail de suporte
   - Adicionar domínios autorizados: `lovable.app` e qualquer domínio customizado
   - Escopos: `userinfo.email`, `userinfo.profile`, `openid`
   - Criar credencial **OAuth Client ID** tipo "Web application"
   - Em **URIs de redirecionamento autorizados**, adicionar a URL de callback exibida nas configurações de autenticação do Lovable Cloud
   - Copiar o **Client ID** e **Client Secret** gerados

2. **No Lovable Cloud** (aba Cloud → Users → Authentication Settings → Google):
   - Colar o Client ID e Client Secret do projeto Google da NoExcuse
   - Salvar

Nenhuma alteração de código necessária — o `lovable.auth.signInWithOAuth("google")` já existente usará automaticamente as credenciais configuradas.

