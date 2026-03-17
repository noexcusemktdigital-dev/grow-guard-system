

## Plano: Arquitetura Unificada de Planos e Créditos

### Status: ✅ Implementado

### Resumo

Substituímos a arquitetura modular (Vendas + Marketing + Combo) por **3 planos unificados** baseados em créditos:

| | **Starter** | **Pro** | **Enterprise** |
|---|---|---|---|
| Preço | R$ 397/mês | R$ 797/mês | R$ 1.497/mês |
| Créditos/mês | 500 | 1.000 | 1.500 |
| Usuários | até 10 | até 20 | ilimitado |
| CRM Pipelines | 3 | 10 | ilimitado |
| Agente IA | ❌ | ✅ | ✅ |
| WhatsApp/Disparos | ❌ | ✅ | ✅ |
| Marketing completo | ✅ | ✅ | ✅ |

### Trial
- 200 créditos, 7 dias, até 2 usuários
- Sem Agente IA, WhatsApp e Disparos

### Custos por ação (créditos)
Site=100, Arte=25, Conteúdo=30, Script=20, Estratégia=50, Automação CRM=5, Agente IA msg=2

### Pacotes de Recarga
- Básico: 200 cr / R$ 49
- Popular: 500 cr / R$ 99
- Premium: 1.000 cr / R$ 179

---

## Análise: Custo Real Lovable vs Receita dos Planos

### Status: ✅ Documentado

### Custo Lovable AI (Gemini 3 Flash Preview)
- Input: $0,50/1M tokens | Output: $3,00/1M tokens
- Média por mensagem agente: ~2.700 tokens → **R$ 0,034/msg**

### Margem por Plano

| | Starter R$ 397 | Pro R$ 797 | Enterprise R$ 1.497 |
|---|---|---|---|
| Custo total estimado | ~R$ 20 | ~R$ 91 | ~R$ 120 |
| **Margem bruta** | **R$ 377 (95%)** | **R$ 706 (89%)** | **R$ 1.377 (92%)** |

### Custo por funcionalidade

| Ação | Créditos | Custo real | Receita (R$ 0,80/cr) |
|---|---|---|---|
| Agente IA (msg) | 2 | R$ 0,034 | R$ 1,60 |
| Script | 20 | R$ 0,17 | R$ 16 |
| Arte | 25 | R$ 0,50 | R$ 20 |
| Conteúdo | 30 | R$ 0,17 | R$ 24 |
| Estratégia | 50 | R$ 0,34 | R$ 40 |
| Site | 100 | R$ 0,85 | R$ 80 |

### Nota sobre Lovable Cloud
- Renovação automática do saldo **não é possível via código**
- Monitorar em Settings → Cloud & AI balance
- Custo real é centavos/mês no volume atual
