

## Plano — Funil padrão convencional no CRM (sem criação automática pelo GPS)

### O que muda

O CRM vai ter um funil padrão convencional criado automaticamente quando o usuário acessar o CRM pela primeira vez (se não existir nenhum funil). A criação automática de funil pelo GPS do Negócio e pelo Plano de Vendas será removida.

### Mudanças

#### 1. Remover auto-criação de funil do GPS e Plano de Vendas

**`src/pages/cliente/ClienteGPSNegocio.tsx`** — Remover o bloco (linhas ~274-293) que cria funil automaticamente após aprovação do GPS.

**`src/pages/cliente/ClientePlanoVendas.tsx`** — Remover o bloco (linhas ~117-139) que cria funil automaticamente ao salvar o plano de vendas.

Ambos os arquivos deixam de importar `useCrmFunnels`, `useCrmFunnelMutations`, `parseFunnelStages`, `getDefaultFunnelStages`.

#### 2. Criar funil padrão convencional automaticamente no CRM

**`src/hooks/useCrmFunnels.ts`** — Adicionar um hook `useEnsureDefaultFunnel()` que:
- Verifica se já existem funis para a org
- Se não existir nenhum, cria automaticamente um "Funil de Vendas" com as etapas padrão do `DEFAULT_STAGES` (Novo Lead → Contato → Qualificação → Proposta → Negociação → Fechado → Perdido)
- Marca como `is_default: true`
- Executa apenas uma vez (com flag `useRef`)

**`src/pages/cliente/ClienteCRM.tsx`** (ou componente raiz do CRM) — Chamar `useEnsureDefaultFunnel()` para garantir que o funil padrão exista ao entrar no CRM.

### Detalhes técnicos

O funil padrão usará as etapas já definidas em `DEFAULT_STAGES` de `CrmStageSystem.tsx`:
- Novo Lead (azul), Contato (âmbar), Qualificação (ciano), Proposta (roxo), Negociação (laranja), Fechado (verde), Perdido (vermelho)

O hook `useEnsureDefaultFunnel` só cria se `funnelsData` estiver carregado e vazio, evitando duplicações.

### Arquivos

| Arquivo | Ação |
|---------|------|
| `src/pages/cliente/ClienteGPSNegocio.tsx` | Remover bloco de auto-criação de funil |
| `src/pages/cliente/ClientePlanoVendas.tsx` | Remover bloco de auto-criação de funil |
| `src/hooks/useCrmFunnels.ts` | Adicionar `useEnsureDefaultFunnel()` |
| Componente raiz do CRM | Chamar `useEnsureDefaultFunnel()` |

