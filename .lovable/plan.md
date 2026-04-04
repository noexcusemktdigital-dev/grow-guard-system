

## Plano — Destacar termos de uso no cadastro com cor vermelha

### Mudança

No arquivo `src/pages/SaasAuth.tsx`, linhas 419-432, alterar o estilo do checkbox e label dos termos para ter maior destaque visual com cor vermelha.

### Detalhes técnicos

1. **Label**: Trocar `text-white/50` por `text-white/80` para maior legibilidade e aumentar de `text-xs` para `text-sm`
2. **Links "Termos de Uso" e "Política de Privacidade"**: Manter `text-[hsl(355,78%,60%)]` mas adicionar `font-semibold underline` para destaque
3. **Checkbox border**: Trocar `border-white/20` por `border-[hsl(355,78%,50%)]` para ficar vermelho mesmo desmarcado
4. **Adicionar borda sutil** ao redor do bloco todo com `border border-[hsl(355,78%,50%)]/30 rounded-lg p-3` para chamar atenção

### Arquivo afetado

| Arquivo | Ação |
|---------|------|
| `src/pages/SaasAuth.tsx` | Linhas 419-432: aumentar destaque visual do checkbox de termos |

