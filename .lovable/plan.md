
## Diagnóstico

O erro atual não é mais o bloqueio do iframe. Agora o problema é outro e está bem claro:

```text
redirect_uri_mismatch
redirect_uri = https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/ads-oauth-callback
```

Isso significa que o Google está recebendo essa URL no login, mas essa URL ainda não foi cadastrada exatamente nas credenciais OAuth do Google Cloud.

Como o erro acontece antes do retorno, a função `ads-oauth-callback` nem é chamada mesmo — por isso não há logs.

## O que precisa ser corrigido

### 1. Cadastrar a redirect URI exata no Google Cloud
No Google Cloud Console, nas credenciais do OAuth Client usado por esse app, adicionar em **Authorized redirect URIs** exatamente:

```text
https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/ads-oauth-callback
```

Tem que ser idêntica:
- com `https`
- sem barra extra no final
- mesmo domínio
- mesmo caminho `/functions/v1/ads-oauth-callback`

### 2. Conferir se o Client ID é o mesmo do projeto
O `client_id` exibido no erro precisa ser o mesmo Client ID configurado no frontend/backend. Vou validar no código e manter o fluxo apontando sempre para essa mesma credencial, para evitar divergência entre ambientes.

### 3. Validar se o app OAuth está no projeto Google correto
Se existir mais de um projeto/credencial no Google Cloud, o erro pode acontecer porque a URI foi cadastrada em um Client ID diferente do que a aplicação está usando. O ajuste é garantir que:
- o Client ID da plataforma
- e a credencial editada no Google Cloud

sejam exatamente a mesma credencial.

## Passo a passo para corrigir no Google Cloud

1. Abrir **Google Cloud Console**
2. Ir em **APIs e Serviços → Credentials**
3. Abrir o **OAuth 2.0 Client ID** usado na integração
4. Em **Authorized redirect URIs**, adicionar:

```text
https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/ads-oauth-callback
```

5. Salvar
6. Esperar 1 a 5 minutos
7. Testar novamente o botão **Conectar Google Ads**

## O que vou considerar na próxima implementação, se ainda falhar

Se depois disso ainda der erro, o próximo plano será:
1. conferir qual `client_id` o frontend está usando em runtime
2. validar se há conflito entre preview/publicado
3. revisar retorno amigável para exibir o erro dentro da tela de Tráfego Pago
4. testar o fluxo completo até a gravação da conexão

## Resultado esperado

Depois desse ajuste no Google Cloud:
- a tela de login do Google deve abrir normalmente
- o consentimento deve concluir
- o Google deve redirecionar para `ads-oauth-callback`
- a conexão deve ser salva
- o usuário deve voltar para `/cliente/trafego-pago` com sucesso

## Resumo prático

O código já está apontando para uma callback estável. O que falta agora é cadastrar essa callback exata no Google Cloud:

```text
https://gxrhdpbbxfipeopdyygn.supabase.co/functions/v1/ads-oauth-callback
```
