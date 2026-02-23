
# Corrigir Formulario de Criacao de Metas

## Problemas Identificados

1. **Valor alvo sem formatacao**: O campo `target_value` e um `<Input type="number">` simples, sem separador de milhar (ponto/virgula no padrao brasileiro). Ex: usuario digita `50000` sem saber se e R$ 50 ou R$ 50.000.
2. **Escopo "Individual" nao mostra seletor de pessoa**: Quando o usuario seleciona escopo "Individual", nao aparece nenhum dropdown para escolher qual pessoa. O formulario tem logica para `novaMeta.scope === "team"` mas falta a condicao para `"individual"`.
3. **Escopo "Equipe" so aparece se ha times cadastrados**: Se nao houver times, o seletor nao aparece e nao ha orientacao ao usuario.
4. **Abas desnecessarias**: O usuario quer remover as abas (Diagnostico, Metas, Historico) e usar somente filtros na area de metas.

## Mudancas

### 1. Formulario de Nova Meta (em `ClientePlanoVendas.tsx`)

**Campo "Valor alvo"**: Trocar `<Input type="number">` por um input de texto com mascara brasileira (R$ 50.000,00 para metricas monetarias, ou numero simples para leads/reunioes/contratos). Ao salvar, faz o parse para numero.

**Seletor de pessoa (individual)**: Adicionar import do hook `useCrmTeam` que ja existe e retorna membros da organizacao. Quando `scope === "individual"`, renderizar um `<Select>` com a lista de membros (full_name + role).

**Seletor de time (equipe)**: Manter o existente, mas adicionar mensagem "Nenhum time cadastrado" quando `teams` estiver vazio.

### 2. Remover sistema de abas

A pagina continuara com o diagnostico e metas, mas sem abas. O layout sera:
- Secao de Diagnostico (consultoria) fica no topo
- Secao de Metas fica logo abaixo, sempre visivel, com os filtros de escopo ja existentes
- Historico de metas fica como secao colapsavel dentro de Metas (ja esta assim)
- Historico de diagnosticos fica como secao colapsavel no fim da pagina

### 3. Formatacao de valores monetarios no input

Para metricas de dinheiro (revenue, avg_ticket): formatar com separador de milhar brasileiro usando `toLocaleString("pt-BR")` no display, e fazer parse ao salvar removendo pontos e trocando virgula por ponto.

Para metricas de contagem (leads, contracts, meetings, conversions): manter input numerico simples.

---

## Detalhes Tecnicos

### Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/cliente/ClientePlanoVendas.tsx` | 1) Adicionar import de `useCrmTeam` 2) Remover `<Tabs>` wrapper, renderizar diagnostico e metas como secoes sequenciais 3) No dialog Nova Meta: adicionar seletor de membro quando scope="individual", melhorar input de valor com mascara BR, mostrar mensagem quando nao ha times 4) Mover historico de diagnosticos para secao colapsavel |

### Input de Valor com Mascara

Usar estado local `targetDisplay` como string formatada. No `onChange`, extrair apenas digitos/virgula, formatar com `toLocaleString("pt-BR")`. No submit, converter para numero com `parseFloat(valor.replace(/\./g, "").replace(",", "."))`.

### Seletor Individual

```
{novaMeta.scope === "individual" && (
  <div>
    <Label>Responsavel</Label>
    <Select value={novaMeta.assigned_to} onValueChange={...}>
      {members.map(m => <SelectItem key={m.user_id} value={m.user_id}>{m.full_name}</SelectItem>)}
    </Select>
  </div>
)}
```

### Validacao no Submit

Adicionar validacao: se scope="team" exigir `team_id` preenchido; se scope="individual" exigir `assigned_to` preenchido. Mostrar toast de erro se faltar.
