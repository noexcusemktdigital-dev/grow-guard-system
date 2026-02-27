

# Configurar E-mail Personalizado para Convites

## O que sera feito

Configurar um dominio de e-mail personalizado para que todos os e-mails de autenticacao (convites, reset de senha, verificacao) sejam enviados com o remetente da sua marca.

## Etapas

### 1. Configurar dominio remetente
- Abrir o painel de configuracao de e-mail do Lovable Cloud
- Voce informara o dominio desejado (ex: `noexcuse.com.br`)
- O sistema vai gerar registros DNS (SPF, DKIM, DMARC) que precisam ser adicionados no painel do seu provedor de dominio

### 2. Verificacao DNS
- Apos adicionar os registros DNS, o sistema verifica automaticamente
- A propagacao pode levar de alguns minutos ate 48 horas

### 3. Criar templates de e-mail personalizados
- Gerar templates com a identidade visual do app (cores, logo, linguagem)
- Templates para: convite, reset de senha, verificacao de e-mail, magic link, troca de e-mail
- Os e-mails serao enviados em portugues, com o tom e estilo do app

### 4. Deploy automatico
- A funcao de envio sera implantada automaticamente
- Assim que o DNS for verificado, os e-mails passam a sair com o remetente personalizado

## Requisito
- Voce precisa ter acesso ao painel DNS do seu dominio (ex: Registro.br, Cloudflare, GoDaddy) para adicionar os registros de verificacao

## Resultado
- E-mails de convite e autenticacao saindo de algo como `noreply@noexcuse.com.br` em vez do remetente padrao

