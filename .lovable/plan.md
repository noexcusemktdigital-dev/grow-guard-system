
# Auditoria Completa: O que ainda esta generico no sistema

## Resumo

Apos investigar toda a base de codigo, identifiquei **6 categorias principais** de elementos genericos que precisam ser ajustados para usar dados reais do banco de dados.

---

## 1. PASTA `src/mocks/` -- Dados mock ainda importados por componentes

A pasta `src/mocks/` contem **8 arquivos** com dados fictícios hardcoded. Varios ainda sao importados diretamente por componentes ativos:

| Arquivo Mock | Usado por | Problema |
|---|---|---|
| `comunicadosData.ts` | `ComunicadosList.tsx` | Lista de comunicados usa `mockComunicados` em vez de dados do banco |
| `crm.ts` | `homeData.ts` | `mockLeads` usado no calculo de dados comerciais do Home |
| `homeData.ts` | `HomeMensagemDia.tsx`, `HomeMensagemAdmin.tsx` | Funcoes `getAlertasFranqueadora()`, `getDadosComerciais()` usam tickets e contratos mock |
| `metasRankingData.ts` | `MetasGoals.tsx`, `MetasCampaigns.tsx`, `homeData.ts` | Rankings e franquias hardcoded |
| `onboardingData.ts` | `OnboardingList.tsx` | Dados de onboarding |
| `unidadesData.ts` | `OnboardingList.tsx`, `UnidadesList.tsx` | `mockUnidades` e `mockUnidadeUsers` em vez de dados do banco |
| `matrizData.ts` | Possivelmente importado por tipos | Dados mock da matriz |
| `marketingData.ts` | A verificar | Dados de marketing |

**Acao:** Substituir cada import de mock por queries reais ao banco (hooks com `useQuery` + Supabase). Deletar a pasta `src/mocks/` quando todos forem migrados.

---

## 2. TIPOS com dados mock embutidos (`src/types/`)

Alguns arquivos de tipos exportam dados mock junto com as definicoes de tipo:

| Arquivo | Dados mock exportados |
|---|---|
| `src/types/home.ts` | `mockMensagens` (array de mensagens do dia hardcoded) |
| `src/types/metas.ts` | `mockGoals`, `mockCampaigns`, `getAllFranchises()` com dados hardcoded |
| `src/types/comunicados.ts` | `mockComunicados`, `mockVisualizacoes` |
| `src/types/unidades.ts` | `mockUnidades` (lista de unidades fictícias) |

**Acao:** Mover tipos para ficar so com interfaces/types. Remover dados mock. Componentes devem buscar dados via hooks do banco.

---

## 3. `localStorage` como "banco de dados" para features do cliente

Varias features do painel SaaS (cliente) usam `localStorage` como persistencia em vez do banco:

| Feature | Arquivo | O que salva no localStorage |
|---|---|---|
| Plano de Vendas | `ClientePlanoVendas.tsx` | Respostas do diagnostico (`plano_vendas_data`) |
| Sites gerados | `ClienteSites.tsx` | Sites criados pelo wizard (`generated-sites`) |
| Campanhas de conteudo | `ClienteConteudos.tsx` | Campanhas criadas (`content-campaigns`) |
| Estrategia de marketing | `ClienteRedesSociais.tsx` | Carrega campanhas do localStorage |
| Scripts | `ClienteScripts.tsx` | Contexto de vendas do localStorage |
| Feature Gate | `FeatureGateContext.tsx` | Verifica `plano_vendas_data` do localStorage para gates |

**Acao:** Criar tabelas no banco para persistir esses dados por organizacao/usuario. Isso garante que dados nao se perdem ao trocar de navegador/dispositivo.

---

## 4. Componentes com mensagens "Em desenvolvimento" / "Em breve"

| Componente | Mensagem generica |
|---|---|
| `UserMenu.tsx` | "Perfil em desenvolvimento" e "Configuracoes em desenvolvimento" para roles admin/super_admin |
| `CrmConfig.tsx` | "Integracao em desenvolvimento" e "Funcionalidade em desenvolvimento" (webhook e CSV) |
| `AgendaConfig.tsx` | "Em breve: sincronize com Google Calendar" |
| `MarketingDrive.tsx` | "Download ZIP estara disponível em breve" |
| `ContratosConfiguracoes.tsx` | "Sera habilitado em breve" (API Key Asaas, Webhook) |
| `AcademyCertificates.tsx` | "Download de PDF sera implementado" |
| `OnboardingIndicadores.tsx` | "Valores simulados -- integracao em desenvolvimento" |
| `ClienteRedesSociais.tsx` | "Upload de logo (em breve)" |

**Acao para o UserMenu:** Ja existe `/franqueadora/perfil` -- basta rotear admin/super_admin para la tambem. As demais mensagens "em breve" devem ser implementadas ou removidas conforme prioridade.

---

## 5. Componentes MetasGoals e MetasCampaigns 100% mock

- `MetasGoals.tsx`: `useState(mockGoals)` -- metas completamente hardcoded
- `MetasCampaigns.tsx`: `useState(mockCampaigns)` -- campanhas hardcoded
- `MetasRankingView` (e `metasRankingData.ts`): Rankings calculados a partir de franquias mock com receita/contratos inventados

**Acao:** Criar tabelas `goals`, `campaigns`, `franchise_metrics` no banco e hooks correspondentes.

---

## 6. `homeData.ts` -- funcoes que agregam dados mock

O arquivo `src/mocks/homeData.ts` exporta funcoes usadas por componentes do Home:

- `getAlertasFranqueadora()`: Agrega alertas a partir de `mockTickets`, `mockContratos`, `mockComunicados`
- `getDadosComerciais()`: Retorna faturamento, ranking e leads a partir de dados mock
- `getComunicadosAtivos()`: Filtra `mockComunicados`
- `getMensagemHoje()`: Busca em `mockMensagens`
- `getMonthSummary()`: Retorna valores financeiros hardcoded (`receitaBruta: 73000`)

**Acao:** Substituir por queries reais. O `Home.tsx` da Franqueadora ja usa hooks reais para mensagens, comunicados, eventos e leads -- mas os componentes de alertas e comercial ainda consomem mocks indiretamente.

---

## Plano de Execucao (por prioridade)

### Prioridade 1 -- Correcoes rapidas (sem banco)
1. **UserMenu**: Rotear admin/super_admin para `/franqueadora/perfil` e `/franqueadora/configuracoes` (remover toast "em desenvolvimento")
2. **Remover avisos "em breve"** de funcionalidades ja implementadas

### Prioridade 2 -- Migrar localStorage para banco
3. **Plano de Vendas**: Criar tabela `sales_plans` e persistir respostas por org
4. **Sites gerados**: Criar tabela `generated_sites` e persistir por org
5. **Campanhas de conteudo**: Criar tabela `content_campaigns` por org

### Prioridade 3 -- Migrar mocks para dados reais
6. **Metas e Ranking**: Criar tabelas `goals`, `campaigns` e hooks
7. **Onboarding**: Migrar dados de onboarding para tabelas reais
8. **Comunicados (ComunicadosList)**: Usar hook `useAnnouncements` em vez de `mockComunicados`
9. **Unidades (OnboardingList)**: Usar hook `useUnits` em vez de `mockUnidades`

### Prioridade 4 -- Limpeza
10. **Deletar pasta `src/mocks/`** apos migrar tudo
11. **Limpar tipos** (`home.ts`, `metas.ts`, `comunicados.ts`, `unidades.ts`) removendo dados mock exportados

---

## Escopo recomendado para comecar

Dado o volume, recomendo comecar pela **Prioridade 1** (correcoes rapidas sem necessidade de banco) e depois escolher qual bloco da Prioridade 2 ou 3 atacar primeiro. Posso implementar qualquer bloco que voce aprovar.
