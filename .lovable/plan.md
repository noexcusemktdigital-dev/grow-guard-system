

## Solução: Adicionar usuário de teste no Google Cloud Console

O erro **403: access_denied** acontece porque o app Google OAuth ainda está em modo **"Testing"** (não publicado). Nesse modo, apenas e-mails cadastrados como "Test users" conseguem autorizar.

### Ação necessária (manual, no Google Cloud Console)

1. Acesse [Google Cloud Console → OAuth Consent Screen](https://console.cloud.google.com/apis/credentials/consent)
2. Na seção **"Test users"**, clique em **"Add users"**
3. Adicione: `davi.ttesch@gmail.com`
4. Salve

Depois disso, tente conectar novamente pela página de Agenda. O fluxo OAuth deve funcionar normalmente.

### Sobre publicação do app

Enquanto o app estiver em modo "Testing", só test users cadastrados poderão conectar. Para permitir qualquer usuário Google sem cadastro prévio, você precisaria publicar o app — mas como o escopo `calendar` é restrito, o Google pode exigir verificação completa (envio de política de privacidade, vídeo demonstrativo, etc). Para uso interno da rede de franquias, manter em modo Testing e adicionar os e-mails manualmente é a abordagem mais prática.

