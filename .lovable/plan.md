

## Plano — Sugestões e exemplos personalizados com base no GPS do Negócio

### O que muda

Atualmente, os exemplos e sugestões no wizard de postagem (e em outros pontos do sistema) são genéricos e hardcoded: "Consórcio", "Imóvel", "Clínica", "Empresários", "Médicos", etc. Esses exemplos precisam ser substituídos por sugestões derivadas do GPS do Negócio do workspace ativo (segmento, ICP, produtos, público-alvo, pilares de conteúdo, tom de voz).

### Abordagem

Criar uma função utilitária `getSmartSuggestions(strategyData)` que extrai sugestões contextualizadas do GPS e retorna arrays para cada campo. Quando não houver GPS aprovado, mantém as sugestões genéricas como fallback.

### Campos afetados no ArtWizardSteps

| Campo | Fonte no GPS | Fallback genérico |
|-------|-------------|-------------------|
| Step 5 — Tema (topic) | `pilares`, `ideiasConteudo`, `salesPlanProducts`, `salesPlanSegmento` | Lista atual hardcoded |
| Step 7 — Público (audience) | `personaName`, `publicoAlvo`, `icp.descricao`, `dores` | `AUDIENCE_SUGGESTIONS` |
| Step 12 — Elementos visuais | `salesPlanSegmento`, `salesPlanProducts` | `ELEMENT_SUGGESTIONS` |
| Step 6 — Placeholder de texto | `tomPrincipal`, `palavrasUsar` | Placeholder atual |

### Mudanças nos arquivos

| Arquivo | Ação |
|---------|------|
| `src/utils/smartSuggestions.ts` | **Novo** — Função `getSmartSuggestions(strategyData)` que retorna `{ topics, audiences, elements, placeholders }` baseado no GPS. Se GPS ausente, retorna os arrays genéricos atuais. |
| `src/components/cliente/social/ArtWizard.tsx` | Importar `useStrategyData`, chamar `getSmartSuggestions`, passar `suggestions` como prop para `ArtWizardSteps` |
| `src/components/cliente/social/ArtWizardSteps.tsx` | Receber `suggestions` como prop. Usar `suggestions.topics` no Step5, `suggestions.audiences` no Step7, `suggestions.elements` no Step12 em vez dos arrays hardcoded |

### Lógica de extração (`getSmartSuggestions`)

```text
topics:
  - pilares de conteúdo (nomes) → ex: "Autoridade em odontologia"
  - ideias de conteúdo (títulos) → ex: "Benefícios do implante"
  - produtos/serviços → ex: "Implante dentário"
  - segmento → ex: "Odontologia"
  fallback: ["Consórcio", "Imóvel", "Clínica", ...]

audiences:
  - nome da persona → ex: "Maria, 35 anos"
  - descrição do público → ex: "Mulheres 30-50 classe B"
  - dores do ICP → ex: "Medo de dentista"
  fallback: AUDIENCE_SUGGESTIONS

elements:
  - derivar de produtos/segmento → ex: "Consultório", "Paciente sorrindo"
  fallback: ELEMENT_SUGGESTIONS
```

Máximo de 8-10 sugestões por campo (truncar se o GPS gerar mais).

### Resultado

- Usuário vê sugestões relevantes ao seu negócio em todos os campos do wizard
- Se GPS não preenchido, experiência atual permanece idêntica
- Mesma função pode ser reutilizada em outras ferramentas (conteúdos, roteiros, tráfego)

