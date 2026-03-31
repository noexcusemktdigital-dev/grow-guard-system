

## Plano — Funil colorido + 3 scripts automáticos no GPS

### Problema 1: Todas as etapas do funil com mesma cor

O `parseFunnelStages` e `getDefaultFunnelStages` em `ClienteGPSNegocio.tsx` usam um array local de cores hex (`"#8b5cf6"`, `"#0ea5e9"`, etc.), mas o CRM inteiro usa `getColorStyle(stage.color)` que espera **nomes de cor** (`"blue"`, `"amber"`, `"purple"`, etc.) definidos em `CrmStageSystem.tsx`. Como nenhum hex bate com um nome, `getColorStyle` retorna sempre o fallback (azul), e todas as etapas ficam da mesma cor.

### Correção

Em `src/pages/cliente/ClienteGPSNegocio.tsx`:

- Substituir o array hex por nomes de cor do `STAGE_COLORS` do `CrmStageSystem`:
  ```typescript
  import { STAGE_COLORS as CRM_COLORS } from "@/components/crm/CrmStageSystem";
  const COLOR_NAMES = CRM_COLORS.map(c => c.name);
  // ["blue","amber","purple","emerald","red","cyan","pink","orange","indigo","teal"]
  ```
- Em `parseFunnelStages` e `getDefaultFunnelStages`, usar `COLOR_NAMES[i % COLOR_NAMES.length]` em vez de `STAGE_COLORS[i % ...]`.
- Também atribuir ícones variados por posição (primeiro = `"circle-plus"`, último = `"ban"`, meio = variados como `"phone-outgoing"`, `"search-check"`, `"clipboard"`, `"handshake"`, `"shield-check"`).

O mesmo problema existe em `ClientePlanoVendas.tsx` — corrigir lá também.

### Problema 2: Scripts já estão sendo gerados

Os 3 scripts (`prospeccao`, `diagnostico`, `fechamento`) já são gerados automaticamente nas linhas 320-335. Se estão falhando silenciosamente, é porque o `generate-script` pode ter o mesmo problema de JWT que o `generate-strategy` tinha. Preciso verificar se `generate-script` está no `config.toml` com `verify_jwt = false`.

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteGPSNegocio.tsx` | Trocar hex colors por nomes do CRM, adicionar ícones variados |
| `src/pages/cliente/ClientePlanoVendas.tsx` | Mesma correção de cores e ícones |
| `supabase/config.toml` | Verificar/adicionar `verify_jwt = false` para `generate-script` se necessário |

### Resultado

- Cada etapa do funil terá cor distinta (azul, âmbar, roxo, verde, etc.) e ícone próprio
- Os 3 scripts continuam sendo gerados automaticamente — se estavam falhando por JWT, a correção no config.toml resolve

