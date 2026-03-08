

## Plano: Renomear "Treinamentos" para "NOE Academy" na Franqueadora

O módulo já se chama "NOE Academy" no header da página (`Academy.tsx`) e no portal do Franqueado. Só falta atualizar as referências na sidebar e atalhos da Franqueadora.

### Mudanças

| Arquivo | O que muda |
|---------|-----------|
| `src/components/FranqueadoraSidebar.tsx` | `label: "Treinamentos"` → `label: "NOE Academy"` |
| `src/components/home/HomeAtalhos.tsx` | `label: "Treinamentos"` → `label: "NOE Academy"` |

A rota `/franqueadora/treinamentos` e o componente `Academy.tsx` permanecem iguais — apenas o label visível muda.

