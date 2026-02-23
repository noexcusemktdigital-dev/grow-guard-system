

# Criar Usuario Franqueado de Teste

## Problema

O login `davi.ttesch@gmail.com` ja tem role `super_admin`. O sistema sempre escolhe o role de maior prioridade, entao mesmo adicionando `franqueado` a esse usuario, ele continuaria sendo redirecionado para `/franqueadora/dashboard`.

## Solucao

Adicionar um terceiro usuario no seed e executar:

| Campo | Valor |
|-------|-------|
| Email | franqueado.teste@noexcuse.com |
| Senha | 19961996 |
| Nome | Franqueado Teste |
| Role | franqueado |
| Organizacao | "Unidade Teste" (tipo franqueado) |

## Implementacao

1. Atualizar `supabase/functions/seed-users/index.ts` adicionando bloco para criar o usuario franqueado (mesmo padrao dos outros dois)
2. Fazer deploy e executar o seed
3. Fazer logout e entrar com `franqueado.teste@noexcuse.com` / `19961996`

O redirecionamento automatico levara para `/franqueado/dashboard`.

