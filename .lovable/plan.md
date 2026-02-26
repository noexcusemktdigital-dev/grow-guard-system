
## Plano: Melhorias em Avaliacoes, Integracoes, Planos, Perfil e Revisao Geral

Seis grandes blocos de melhorias para refinar modulos existentes do cliente.

---

### 1. Avaliacoes de Desempenho - Reestruturacao Completa

**Problema atual**: A pagina mostra apenas nota geral e lista recente. Nao tem historico por mes, nota por categoria visivel, nem pasta mensal.

**Mudancas em `ClienteAvaliacoes.tsx`**:
- Adicionar **Tabs**: "Equipe" (visao geral por membro), "Historico Mensal" (pastas por mes)
- No card de cada membro, mostrar **nota geral** + **nota por categoria** (Comercial, Atendimento, Engajamento, Proatividade) com barras de progresso
- Na aba Historico Mensal, agrupar avaliacoes por periodo (yyyy-MM) como "pastas" expansiveis usando Accordion
- Cada pasta mostra as avaliacoes daquele mes com detalhes por categoria
- No dialog de nova avaliacao, adicionar campo de **nota geral** separado (alem das notas por categoria)
- Ao clicar num membro, abrir Sheet lateral com evolucao mensal (grafico simples de notas ao longo dos meses)

**Mudancas no banco** (`user_evaluations`):
- A tabela ja tem `score` (geral) e `categories` (JSONB por tipo). Nao precisa de migracao.

---

### 2. Integracoes - Reorganizar por Tipo

**Mudancas em `ClienteIntegracoes.tsx`**:
- Dividir em secoes claras com headers visuais:
  1. **Comunicacao** (WhatsApp Z-API, Widget de Chat)
  2. **Anuncios & Trafego** (Meta Ads, Google Ads, TikTok Ads) - marcar como "Conectar" em vez de "Em breve"
  3. **CRM & Automacao** (RD Station, Webhook de Leads)
  4. **Produtividade** (Google Agenda)
  5. **API & Desenvolvedores** (API Key, Webhook)
- Mudar status de "Em breve" para "Disponivel" com botao "Conectar" que abre dialog de configuracao (mesmo que simplificado com campo de token/chave)
- Cada integracao de anuncios tera campos: Token de acesso, ID da conta, com botao salvar (dados salvos em tabela `organization_integrations`)

**Nova tabela**: `organization_integrations`
```text
id, organization_id, provider (text), config (JSONB), status (text), created_at, updated_at
```
RLS: membros da org podem ler, admins podem gerenciar.

---

### 3. Plano & Creditos - Ajustes de Limites e UX

**Mudancas em `src/constants/plans.ts`**:
- Adicionar campos ao `PlanConfig`: `maxAgents`, `maxDispatches`, `maxDispatchRecipients`
- **Starter**: maxAgents=1, maxSites=1, maxDispatches=0, maxDispatchRecipients=0
- **Growth**: maxAgents=2, maxSites=2, maxDispatches=1, maxDispatchRecipients=500
- **Scale**: maxAgents=4, maxSites=3, maxDispatches=3, maxDispatchRecipients=2000
- Atualizar `features` de cada plano para refletir esses novos limites
- Adicionar destaque visual do combo: economia percentual, badge "Economize X%"

**Mudancas em `ClientePlanoCreditos.tsx`**:
- Na secao de planos, quando `moduleToggle === "combo"`, mostrar banner de destaque: "Economize ate X% com o Combo" e listar beneficios de ter ambos os modulos
- Na secao de creditos avulsos, adicionar explicacao contextual: titulo "Para que servem os creditos?", lista de acoes com custo (usando `CREDIT_COSTS`), e texto "Creditos sao consumidos por acoes de IA como gerar conteudos, criar sites, enviar disparos inteligentes..."
- Cada card de pacote de creditos tera subtexto como "Equivale a ~25 conteudos" ou "~10 sites"

**Reset de creditos do usuario teste**: Sera feito via insert tool (UPDATE na credit_wallets) para zerar o saldo.

---

### 4. Perfil com Foto - Upload de Avatar

**Mudancas em `ClienteConfiguracoes.tsx` (ProfileTab)**:
- Adicionar botao de upload de foto sobre o Avatar existente
- Ao clicar, abrir file input para selecionar imagem
- Upload para storage bucket `avatars` (ou bucket existente)
- Salvar URL no campo `avatar_url` da tabela `profiles`
- Mostrar a foto quando `avatar_url` existe, fallback para iniciais

**Mudancas em `useUserProfile.ts`**:
- Adicionar `avatar_url` ao tipo de updates aceitos na mutation

**Storage**: Criar bucket `avatars` se nao existir (via migracao).

---

### 5. Revisao e Otimizacoes dos Modulos

Apos analise dos modulos, ajustes adicionais necessarios:

**ClienteConfiguracoes.tsx**:
- O Avatar ja exibe iniciais, basta adicionar o upload (item 4)
- Notificacoes usam estado local, nao persistem. Adicionar persistencia futura (nao critico agora)

**ClienteIntegracoes.tsx**:
- Webhook URL expoe project ID do backend diretamente. Manter como esta (necessario para funcionamento)

**ClientePlanoCreditos.tsx**:
- O toggle Comercial/Marketing/Combo funciona mas nao explica o beneficio. Sera melhorado (item 3)

---

### Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| Nenhum novo arquivo | Todas as mudancas sao em arquivos existentes |

### Arquivos a Editar

| Arquivo | Mudanca |
|---------|---------|
| `src/constants/plans.ts` | Adicionar maxAgents, maxDispatches, maxDispatchRecipients. Atualizar features e limites de sites |
| `src/pages/cliente/ClienteAvaliacoes.tsx` | Reestruturar com tabs Equipe/Historico, notas por categoria, pastas mensais |
| `src/pages/cliente/ClienteIntegracoes.tsx` | Reorganizar por tipo, mudar status para "Disponivel", adicionar dialogs de conexao |
| `src/pages/cliente/ClientePlanoCreditos.tsx` | Destaque combo, explicacao de creditos avulsos, equivalencias |
| `src/pages/cliente/ClienteConfiguracoes.tsx` | Upload de foto de perfil no ProfileTab |
| `src/hooks/useUserProfile.ts` | Aceitar avatar_url na mutation |

### Migracoes

1. Tabela `organization_integrations` para armazenar conexoes de integracoes
2. Bucket de storage `avatars` para fotos de perfil
3. UPDATE via insert tool para zerar creditos do usuario teste
