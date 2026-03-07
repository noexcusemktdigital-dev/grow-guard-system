

## Plano: Corrigir tipo de dados na RPC de Comunicados

### Causa raiz

A coluna `target_unit_ids` é `uuid[]`, mas a RPC `get_announcements_with_parent` declara `_org_text text` e compara `_org_text = ANY(a.target_unit_ids)`. Isso gera o erro `operator does not exist: text = uuid`, fazendo a RPC falhar completamente para qualquer franqueado.

### Correção

**Migration SQL** — Recriar a RPC corrigindo o tipo da variável de comparação:
- Trocar `_org_text text := _org_id::text` por comparação direta com `_org_id::uuid`
- Na cláusula `ANY(a.target_unit_ids)`, usar `_org_id = ANY(a.target_unit_ids)` diretamente (uuid = uuid)
- Remover a variável `_org_text` que não é mais necessária

Nenhuma alteração de código frontend é necessária — o formulário e os hooks já estão corretos.

### Arquivo alterado

| Arquivo | Ação |
|---------|------|
| Migration SQL | Recriar RPC `get_announcements_with_parent` com tipos corretos |

