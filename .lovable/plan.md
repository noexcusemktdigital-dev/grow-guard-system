

## Plano: Implementar Alterações na Calculadora de Propostas

### 1. Inverter abas (`src/pages/franqueadora/FranqueadoraPropostas.tsx`)
- Linha 394: mudar default de `"propostas"` para `"calculadora"`
- Linhas 407-408: inverter ordem — Calculadora primeiro, Propostas segundo
- Linhas 410-415: inverter ordem dos `TabsContent`

### 2. Atualizar serviços (`src/data/services.ts`)

| Serviço | Mudança |
|---------|---------|
| `ebook` (L79-85) | Nome → "E-book / Cardápio / Catálogo", preço R$55, `quantityType: 'quantity'`, `perUnit: 'página'`, min 1, max 100 |
| `apresentacao-comercial` (L87-93) | Preço R$55, `quantityType: 'quantity'`, `perUnit: 'página'`, min 1, max 100 |
| `capa-destaques` (L167-173) | `quantityType: 'quantity'`, `perUnit: 'capa'`, min 1, max 20 |
| `criacao-avatar` (L174-181) | Preço R$25, `quantityType: 'quantity'`, `perUnit: 'avatar'`, min 1, max 20 |
| `template-canva` (L182-189) | `quantityType: 'quantity'`, `perUnit: 'template'`, min 1, max 20 |
| `config-gmb` (L251-257) | `quantityType: 'quantity'`, `perUnit: 'conta'`, min 1, max 10 |
| `lp-link-bio` (L298-304) | `quantityType: 'quantity'`, `perUnit: 'LP'`, min 1, max 10 |
| `lp-vsl` (L306-312) | `quantityType: 'quantity'`, `perUnit: 'LP'`, min 1, max 10 |
| `lp-vendas` (L314-320) | `quantityType: 'quantity'`, `perUnit: 'LP'`, min 1, max 10 |
| `lp-ebook` (L333-339) | `quantityType: 'quantity'`, `perUnit: 'LP'`, min 1, max 10 |
| `ecommerce` (L362-369) | Nome → "E-commerce", descrição → adicionar "até 50 produtos" |
| `config-crm` (L379-385) | Nome → "Configuração do CRM + Implantação", limpar descrição |
| `fluxo-funil` (L386-393) | **REMOVER** completamente |

### 3. YouTube com quantidade (`ServiceCard.tsx` + `useCalculator.ts`)

**`ServiceCard.tsx`** — No bloco `youtube_time` (linhas ~120-140), adicionar campo Input de quantidade antes do Select de duração. Atualizar `calculateDisplayPrice` para multiplicar por quantity.

**`useCalculator.ts`** — Em `calculateServicePrice`, multiplicar `getYoutubePrice(minutes) * selection.quantity`. Em `toggleService`, inicializar `quantity: 1` para `youtube_time`.

### Arquivos (4)
- `src/data/services.ts`
- `src/components/calculator/ServiceCard.tsx`
- `src/hooks/useCalculator.ts`
- `src/pages/franqueadora/FranqueadoraPropostas.tsx`

