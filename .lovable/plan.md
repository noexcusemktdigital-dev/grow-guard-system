
# Fluxo Didatico de Aprovacao + Limites para Sites, Artes e Conteudos

## Problema Atual

Os tres modulos (Conteudos, Redes Sociais e Sites) possuem aprovacao basica (toggle simples) sem guia didatico, e nenhum deles valida limites de uso por plano antes de gerar.

## O que muda

### 1. Limites de Uso por Plano (enforced no frontend)

Antes de gerar qualquer conteudo, o sistema verifica o consumo do mes atual e bloqueia se atingiu o limite.

| Modulo | Starter | Growth | Scale |
|--------|---------|--------|-------|
| Campanhas de Conteudo/mes | 1 | 3 | Ilimitado |
| Artes Sociais/mes | 8 | 20 | Ilimitado |
| Sites ativos | 1 (LP) | 2 (LP, 3p, 5p) | 5 (LP, 3p, 5p, 8p) |

- Um banner de cota aparece no topo de cada modulo mostrando "X de Y usados este mes"
- Ao atingir o limite, o botao de gerar e desabilitado e aparece sugestao de upgrade
- Os limites `maxContentCampaigns` e `maxSocialArts` ja existem em `plans.ts`

### 2. Fluxo de Aprovacao Didatico (padrao nos 3 modulos)

Criar um componente reutilizavel `ApprovalPanel` com:

**Barra de Progresso de Aprovacao**
- "3 de 8 aprovados" com barra visual de progresso
- Cores: cinza (pendente), verde (aprovado)

**Acoes por Item**
- Botao "Aprovar" grande e claro com icone de check
- Botao "Solicitar Alteracao" que abre campo de texto para o usuario descrever o que quer mudar
- Botao "Rejeitar" (com confirmacao)
- Cada item mostra status visual claro: pendente (cinza), aprovado (verde), alteracao solicitada (amarelo), rejeitado (vermelho)

**Acoes em Lote**
- "Aprovar Todos" (ja existe parcialmente)
- "Aprovar Pendentes" para aprovar apenas os que ainda nao foram revisados

**Tooltip de Ajuda**
- Ao lado do botao de aprovar, um icone (?) com tooltip explicando: "Ao aprovar, este conteudo esta pronto para publicacao/uso."

### 3. Aplicacao por Modulo

**Conteudos (`ClienteConteudos.tsx`)**
- Antes do botao "Nova Campanha": banner de cota com contagem de campanhas usadas no mes
- Na view de detalhe do conteudo: substituir botao simples pelo `ApprovalPanel` com acoes Aprovar / Solicitar Alteracao / Rejeitar
- Na lista de conteudos da campanha: status visual colorido em cada card
- Adicionar campo "notas de alteracao" que fica visivel quando status = alteracao_solicitada

**Redes Sociais (`ClienteRedesSociais.tsx`)**
- Antes do botao "Nova Criacao Mensal": banner de cota com contagem de artes geradas no mes
- No editor modal de cada arte: painel de aprovacao abaixo do canvas com as mesmas acoes
- Na grid de artes: overlay colorido indicando status (verde = aprovada, amarelo = alteracao, vermelho = rejeitada)

**Sites (`ClienteSites.tsx`)**
- Antes do botao "Criar Novo Site": banner de cota mostrando sites ativos vs. limite (ja tem parcialmente)
- No `SitePreview`: substituir botao "Aprovar e Baixar" por fluxo em 2 passos:
  1. Primeiro "Aprovar" (muda status para aprovado)
  2. Depois "Baixar Codigo" (disponivel so apos aprovacao)
  3. Opcao "Solicitar Ajustes" que volta ao briefing com campo para descrever mudancas

### 4. Componente Reutilizavel `ApprovalPanel`

Novo componente `src/components/approval/ApprovalPanel.tsx` com props:

```text
interface ApprovalPanelProps {
  status: "pending" | "approved" | "changes_requested" | "rejected";
  onApprove: () => void;
  onRequestChanges: (note: string) => void;
  onReject?: () => void;
  changeNote?: string;
  showReject?: boolean;
  helpText?: string;
}
```

E um componente de resumo `ApprovalSummary`:

```text
interface ApprovalSummaryProps {
  total: number;
  approved: number;
  changesRequested: number;
  rejected: number;
  onApproveAll: () => void;
}
```

### 5. Componente `UsageQuotaBanner`

Novo componente `src/components/quota/UsageQuotaBanner.tsx`:

```text
interface UsageQuotaBannerProps {
  used: number;
  limit: number; // -1 = ilimitado
  label: string; // "campanhas de conteudo" | "artes sociais" | "sites"
  planName: string;
}
```

Exibe:
- Barra de progresso com cor (verde < 50%, amarelo 50-80%, vermelho > 80%)
- Texto "X de Y [label] usados este mes"
- Quando limit = -1: "Ilimitado no plano Scale"
- Quando usado >= limite: alerta vermelho + botao "Fazer Upgrade"

---

## Detalhes Tecnicos

### Arquivos Novos

| Arquivo | Descricao |
|---------|-----------|
| `src/components/approval/ApprovalPanel.tsx` | Componente de aprovacao com acoes Aprovar/Alterar/Rejeitar |
| `src/components/approval/ApprovalSummary.tsx` | Barra de resumo de aprovacao de uma campanha |
| `src/components/quota/UsageQuotaBanner.tsx` | Banner de cota de uso por plano |

### Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/cliente/ClienteConteudos.tsx` | Adicionar banner de cota, substituir toggle de aprovacao por ApprovalPanel, adicionar status "changes_requested"/"rejected" ao type GeneratedContent |
| `src/pages/cliente/ClienteRedesSociais.tsx` | Adicionar banner de cota, usar ApprovalPanel no editor modal, overlay de status na grid |
| `src/pages/cliente/ClienteSites.tsx` | Adicionar banner de cota (ja parcial), separar aprovacao e download no SitePreview |
| `src/components/sites/SitePreview.tsx` | Separar fluxo: primeiro aprovar, depois baixar; adicionar campo de solicitar alteracoes |
| `src/types/cliente.ts` | Adicionar type `ApprovalStatus = "pending" \| "approved" \| "changes_requested" \| "rejected"` |

### Mudancas no Type System

O campo `approved: boolean` nos types `GeneratedContent`, `GeneratedArt` e `SavedSite` sera substituido por:

```text
status: "pending" | "approved" | "changes_requested" | "rejected";
changeNote?: string;
```

Retrocompatibilidade: ao carregar dados antigos com `approved: boolean`, converter automaticamente para `status: approved ? "approved" : "pending"`.
