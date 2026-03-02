
# Prioridade 3: Remover elementos genericos restantes

## Situacao atual

Apos investigacao detalhada, a maioria dos modulos ja esta 100% conectada ao banco:
- **MetasRanking** -- usa `useGoals()`, `useRankings()`, `useUnits()` via RPCs reais
- **Onboarding** -- usa hooks reais (`useOnboardingUnits`, `useOnboardingChecklist`, etc.)
- **Unidades** -- usa `useUnits()` com queries reais
- **Comunicados** -- usa `useAnnouncements()` via RPC real
- **Home** -- usa hooks reais para mensagens, comunicados, eventos, leads

O que resta sao **componentes orfaos**, **mensagens placeholder** e **pequenos ajustes**.

---

## Itens a implementar

### 1. Limpar OnboardingIndicadores (remover texto "valores simulados")
- Arquivo: `src/components/onboarding/OnboardingIndicadores.tsx`
- O componente ja consome dados reais da tabela `onboarding_indicators` via hook
- Remover a frase "Valores simulados -- integracao em desenvolvimento" (linha 55)
- Substituir por: "Dados referentes aos primeiros 90 dias da unidade."

### 2. Ativar HomeAlertas e HomeComercial no Home.tsx com dados reais
Atualmente o `Home.tsx` tem um bloco inline "Nenhuma prioridade pendente" e um bloco "Comercial" simplificado. Os componentes `HomeAlertas`, `HomeHojePreciso` e `HomeComercial` existem mas nao sao usados.

**Acao:**
- Remover o bloco inline de "Hoje eu preciso de..." e substituir pelo `HomeAlertas` alimentado por dados reais
- Gerar alertas dinamicamente a partir de:
  - Tickets de suporte abertos (ja temos `useSupportTickets`)
  - Comunicados criticos nao confirmados (ja temos `useAnnouncements`)
  - Leads sem atividade recente (ja temos `useCrmLeads`)
- Substituir o bloco "Comercial" simplificado pelo componente `HomeComercial` alimentado por dados reais do CRM e rankings

### 3. Remover mensagens "Em breve" de funcionalidades ja implementadas
- `AgendaConfig.tsx`: Ja existe integracao Google Calendar (hooks `useGoogleCalendar`) -- remover "Em breve" e habilitar o botao
- `CrmConfig.tsx`: Remover "Integracao em desenvolvimento" do webhook e "Funcionalidade em desenvolvimento" do CSV (o `CrmCsvImportDialog` ja existe)
- `ContratosConfiguracoes.tsx`: Os campos Asaas ja tem edge functions reais -- habilitar inputs com dados da org
- `AcademyCertificates.tsx`: Manter toast "Em breve" (PDF generation realmente nao esta implementado)
- `AcademyAdmin.tsx`: Manter toast "Em breve" para nova questao (formulario nao implementado)
- `MarketingDrive.tsx`: Manter toast "Em breve" (ZIP download nao implementado)
- `ClienteRedesSociais.tsx`: Manter "em breve" no upload de logo (storage upload nao implementado)
- `ClienteChecklist.tsx`: Manter texto (e informacional, nao bloqueante)

### 4. Deletar componentes orfaos nao utilizados
- `src/components/home/HomeHojePreciso.tsx` -- substituido pelo HomeAlertas com dados reais
- `src/components/metas/GoalCard.tsx` -- verificar se ainda e importado (MetasGoals foi deletado)
- `src/components/metas/GoalProgressRing.tsx` -- verificar se ainda e importado
- `src/components/metas/MetasConfig.tsx` -- verificar se ainda e importado

---

## Detalhes tecnicos

### HomeAlertas com dados reais (Home.tsx)
```text
Fontes de alertas:
+--------------------+------------------+----------------------------+
| Fonte              | Hook existente   | Criterio de alerta         |
+--------------------+------------------+----------------------------+
| Tickets suporte    | useSupportTickets| status = 'open'            |
| Comunicados        | useAnnouncements | prioridade = 'Critica'     |
| Leads CRM          | useCrmLeads      | sem atividade > 7 dias     |
+--------------------+------------------+----------------------------+
```

### HomeComercial com dados reais (Home.tsx)
- Faturamento: soma de `leads.value` onde `won_at IS NOT NULL` no mes atual
- Top unidades: dados do `useRankings()` (top 3)
- Leads novos: contagem de leads criados no mes
- Chamados abertos: contagem de tickets com status open

### Arquivos alterados

| Arquivo | Acao |
|---------|------|
| `src/pages/Home.tsx` | Integrar HomeAlertas e HomeComercial com dados reais |
| `src/components/onboarding/OnboardingIndicadores.tsx` | Remover texto "valores simulados" |
| `src/components/agenda/AgendaConfig.tsx` | Habilitar Google Calendar (remover "Em breve") |
| `src/components/crm/CrmConfig.tsx` | Habilitar webhook e CSV import |
| `src/pages/ContratosConfiguracoes.tsx` | Habilitar campos Asaas |
| `src/components/home/HomeHojePreciso.tsx` | Deletar (orfao) |
| `src/components/metas/GoalCard.tsx` | Deletar se orfao |
| `src/components/metas/GoalProgressRing.tsx` | Deletar se orfao |
| `src/components/metas/MetasConfig.tsx` | Deletar se orfao |
