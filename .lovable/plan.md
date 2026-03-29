

## Padronização de termos — "a IA" → "a nossa IA"

### O que será feito

Varredura completa em todos os arquivos `.tsx` e `.ts` do `src/` para substituir referências genéricas à IA por linguagem proprietária ("a nossa IA", "nossa IA"), reforçando que a tecnologia pertence à plataforma NoExcuse.

### Regras de substituição

| De | Para |
|----|------|
| "a IA" (como sujeito) | "a nossa IA" |
| "A IA" (início de frase) | "A nossa IA" |
| "da IA" | "da nossa IA" |
| "pela IA" | "pela nossa IA" |
| "deixe a IA" | "deixe a nossa IA" |
| "com IA" (contexto genérico) | "com a nossa IA" |
| "de IA" (em descrições de features) | "de IA" (manter quando é nome de categoria, ex: "Agentes de IA") |
| "Funções de IA" | "Funções da nossa IA" |
| "ação de IA" | "ação da nossa IA" |
| "agente de IA" (referindo ao produto) | manter como está (é nome do produto) |

**Exceções** — manter sem alteração:
- "Agentes de IA" (nome do módulo/produto)
- "Prospecção IA" (nome de feature)
- Nomes de variáveis/código (ex: `generating === "persona"`)
- Mensagens de erro técnicas (ex: `"Resposta inválida da IA"`)

### Arquivos afetados (16 arquivos)

| Arquivo | Exemplos de alteração |
|---------|----------------------|
| `src/pages/SaasLanding.tsx` | "deixe a IA qualificar" → "deixe a nossa IA qualificar"; "gerados por IA" → "gerados pela nossa IA"; "CRM inteligente com IA" → "CRM inteligente com a nossa IA" |
| `src/constants/featureTutorials.ts` | "A IA analisará" → "A nossa IA analisará"; "A IA criará" → "A nossa IA criará"; "priorizadas pela IA" → "priorizadas pela nossa IA" |
| `src/components/cliente/OnboardingTour.tsx` | "Cada ação de IA" → "Cada ação da nossa IA" |
| `src/components/cliente/CreditAlertBanner.tsx` | "Funções de IA estão pausadas" → "Funções da nossa IA estão pausadas" |
| `src/components/cliente/AgentFormSheetPersona.tsx` | "Gerar saudação com IA" → "Gerar saudação com a nossa IA" |
| `src/components/cliente/AgentFormSheetPrompt.tsx` | "Gerar com IA" → "Gerar com a nossa IA" |
| `src/pages/cliente/ClienteRedesSociais.tsx` | "preenchidos com IA" → "preenchidos pela nossa IA" |
| `src/pages/cliente/ClienteChecklist.tsx` | "Gerar Checklist com IA" → "Gerar Checklist com a nossa IA" |
| `src/pages/cliente/ClientePlanoCreditsHelpers.tsx` | "ação de IA" → "ação da nossa IA" |
| `src/pages/cliente/ClientePlanoVendasData.ts` | Manter "agente de IA" (nome do produto) |
| `src/pages/franqueado/FranqueadoEstrategia.tsx` | "A IA irá extrair" → "A nossa IA irá extrair" |
| `src/pages/franqueado/FranqueadoProspeccaoIA.tsx` | "com IA" → "com a nossa IA" |
| `src/pages/TermosDeUso.tsx` | "geração de conteúdo com IA" → "geração de conteúdo com a nossa IA" |
| `src/components/crm/CrmAutomations.tsx` | "Nossa IA envia" — já está correto |
| `src/components/crm/CrmTutorial.tsx` | "Automações com IA" → "Automações com a nossa IA" |
| `src/components/cliente/ScriptGeneratorDialog.tsx` | "Gerar com IA" → "Gerar com a nossa IA" |

Os arquivos `ArtWizardSteps.tsx` e `ContentWizard.tsx` já usam "A nossa IA" corretamente.

