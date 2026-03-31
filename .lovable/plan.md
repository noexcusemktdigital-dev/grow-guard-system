

## Plano — Corrigir erro JWT do Tráfego Pago + Mapa de Regiões

### 1. Correção do erro "Invalid JWT"

O `supabase/config.toml` tem `verify_jwt = true` para `generate-traffic-strategy`, mas a função já valida auth internamente via `getUser()`. O gateway Supabase rejeita o token antes da função executar.

**Correção**: Alterar `verify_jwt = false` no `supabase/config.toml` para `generate-traffic-strategy`.

### 2. Mapa interativo para seleção de regiões

Substituir o campo de texto livre de região por um seletor visual com mapa do Brasil. Como não há biblioteca de mapas no projeto, a abordagem mais leve é usar um **mapa SVG do Brasil** com estados clicáveis + chips de cidades/estados selecionados.

O step "regiao" passará a ter:
- Mapa SVG do Brasil com os 26 estados + DF, cada um clicável
- Ao clicar num estado, ele fica destacado (cor primária) e é adicionado à lista
- Abaixo do mapa, campo de busca para digitar cidades específicas (ex: "São Paulo, Campinas")
- Chips dos estados/cidades selecionados com botão de remover
- Opção "Brasil inteiro" como toggle rápido

O campo `regiao` do `TrafficWizardData` mudará de `string` para `string` (mantém compatibilidade — os estados/cidades selecionados serão concatenados como string separada por vírgula para a Edge Function).

### Arquivos a modificar

| Arquivo | Ação |
|---------|------|
| `supabase/config.toml` | `verify_jwt = false` para `generate-traffic-strategy` |
| `src/components/traffic/BrazilMapSelector.tsx` | **Novo** — Componente SVG do mapa do Brasil com estados clicáveis + campo de cidades + chips |
| `src/pages/cliente/ClienteTrafegoPagoWizardStep.tsx` | Substituir o Input de região pelo `BrazilMapSelector` |

### Detalhes do mapa

O componente `BrazilMapSelector` será um SVG inline com paths para cada estado brasileiro. Cada path terá `onClick` para toggle de seleção, `fill` dinâmico (cinza quando não selecionado, cor primária quando selecionado), e tooltip com nome do estado. Abaixo do mapa, um Input com autocomplete para cidades e badges removíveis mostrando a seleção atual.

