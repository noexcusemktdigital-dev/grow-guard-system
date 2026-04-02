

## Plano — Corrigir erro de "senha fraca" e revisar fluxo completo de convite

### Diagnóstico

Os logs confirmam que o fluxo de convite **está funcionando corretamente agora**:
- Usuária "jmfferiato2@gmail.com" foi criada com sucesso
- O OTP foi verificado com sucesso (status 200 no `/verify`)
- A sessão foi estabelecida corretamente

O problema é específico: o `PUT /user` (updateUser) retorna **422** duas vezes. Isso acontece porque o projeto tem a **proteção HIBP (Have I Been Pwned)** ativada. A senha "Juliana12345@" aparece em bases de dados de vazamentos conhecidos, então o Supabase a rejeita como comprometida — mesmo atendendo todos os requisitos visuais de complexidade.

O erro no código está na linha 143 do `Welcome.tsx`:
```
msg.includes("weak_password") || msg.includes("password")
```
Essa condição é genérica demais — qualquer erro contendo "password" cai nela, e a mensagem "Senha muito fraca" não explica o motivo real.

### Correções

#### 1. Melhorar mensagem de erro para senhas comprometidas (`src/pages/Welcome.tsx`)

Separar o tratamento de `weak_password` para explicar que a senha foi encontrada em vazamentos:

- Se `msg` contém "weak_password" ou "leaked" ou "pwned" → mostrar: **"Essa senha foi encontrada em vazamentos de dados. Por segurança, escolha uma senha diferente que não tenha sido exposta."**
- Se `msg` contém "same_password" → manter mensagem atual
- Remover a condição genérica `msg.includes("password")` que captura erros não relacionados
- Para erros 422 não mapeados → mostrar a mensagem original do servidor em vez de mascarar

#### 2. Adicionar dica visual sobre HIBP no checklist de senha (`src/pages/Welcome.tsx`)

Após as 5 regras atuais, adicionar uma nota informativa:
- Texto: "A senha também não pode ter sido exposta em vazamentos conhecidos"
- Exibida como texto informativo (não como regra de validação, pois não dá para checar no frontend)

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/Welcome.tsx` | Refinar mapeamento de erros 422 e adicionar nota sobre HIBP |

### Resultado

- Senhas vazadas mostram mensagem clara explicando o motivo da rejeição
- Usuário entende que precisa escolher uma senha que nunca apareceu em vazamentos
- Outros erros de senha param de ser mascarados como "senha fraca"
- O fluxo de convite em si continua funcionando normalmente (confirmado pelos logs)

