
# Corrigir Build Error + RLS de Metas para Cliente

## Problema 1 -- Build Error (bloqueia tudo)

O arquivo `ChatConversation.tsx` tem um erro de sintaxe: o bloco `if (!contact)` foi inserido **dentro** do callback do `useMemo` (linha 176), entre o `return items;` e o fechamento `}, [messages]);` que sumiu. Isso impede o build inteiro, o que causa falha em todas as funcoes do app.

### Correcao

Fechar o `useMemo` corretamente na linha 175 (`}, [messages]);`) e mover o `if (!contact)` para **depois** do `useMemo`.

Trecho corrigido (linhas 175-191):
```
    return items;
  }, [messages]);

  if (!contact) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 whatsapp-bg">
        ...
      </div>
    );
  }

  return (
```

## Problema 2 -- Nao consegue criar Metas

A tabela `goals` tem apenas duas policies RLS:
- `Admins can manage goals` (ALL) -- permite somente `super_admin` e `admin`
- `Members can view org goals` (SELECT) -- permite membros da org

O usuario com role `cliente_admin` consegue **ver** metas mas **nao pode criar/editar/excluir** porque nao esta incluso na policy ALL.

### Correcao

Alterar a policy `Admins can manage goals` para incluir `cliente_admin`:

```sql
DROP POLICY "Admins can manage goals" ON public.goals;
CREATE POLICY "Admins can manage goals"
  ON public.goals FOR ALL
  USING (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'cliente_admin')
  )
  WITH CHECK (
    has_role(auth.uid(), 'super_admin') OR
    has_role(auth.uid(), 'admin') OR
    has_role(auth.uid(), 'cliente_admin')
  );
```

## Problema 3 -- Nao consegue excluir Agente IA

A policy de DELETE na tabela `client_ai_agents` ja permite `cliente_admin`. Com o build error corrigido (Problema 1), a exclusao deve voltar a funcionar normalmente. Se persistir, sera investigado separadamente.

## Resumo de arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/cliente/ChatConversation.tsx` | Corrigir sintaxe: fechar `useMemo` e mover `if (!contact)` para fora |
| Migracao SQL | Adicionar `cliente_admin` na policy de `goals` |
