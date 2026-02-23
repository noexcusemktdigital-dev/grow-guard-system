
# Corrigir botao do estado vazio em Scripts

## Problema

Quando nao ha scripts cadastrados, o botao de acao no card vazio exibe "Criar com IA" (com icone Sparkles), dando a impressao de que so existe o modo IA. O dialog ja possui as duas opcoes (IA e Manual) no passo 1, mas o botao de entrada nao reflete isso.

## Solucao

Alterar apenas o botao do estado vazio (empty state) em `ClienteScripts.tsx`:

- Trocar texto de "Criar com IA" para "Novo Script"
- Trocar icone de `Sparkles` para `Plus`
- Ajustar o subtexto para mencionar ambas as opcoes

## Arquivo a editar

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/cliente/ClienteScripts.tsx` | Alterar texto e icone do botao no empty state (linhas ~108-110) |

## Detalhe tecnico

Linha atual:
```tsx
<Button size="sm" onClick={() => setShowCreate(true)}>
  <Sparkles className="w-4 h-4 mr-1" /> Criar com IA
</Button>
```

Sera alterada para:
```tsx
<Button size="sm" onClick={() => setShowCreate(true)}>
  <Plus className="w-4 h-4 mr-1" /> Novo Script
</Button>
```

E o subtexto sera ajustado de:
"Crie scripts com IA ou manualmente para padronizar suas abordagens comerciais."

Para algo mais claro como:
"Crie scripts com IA ou escreva manualmente para padronizar suas abordagens comerciais."
