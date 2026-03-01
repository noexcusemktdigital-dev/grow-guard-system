

# Inserir dados de teste para o cliente SaaS "Empresa Teste"

## Objetivo
Popular o CRM do cliente "Empresa Teste" (org: `adb09618`) com dados que reflitam os KPIs solicitados no dashboard.

## Dados a inserir

### 1. Criar 243 leads adicionais no CRM (ja existem 2)
Total: 245 leads no mes atual (marco/2026), distribuidos assim:
- **110 leads ganhos** (won_at preenchido) — valor total = R$ 450.000 (~R$ 4.090 de ticket medio)
- **25 leads perdidos** (lost_at preenchido) — para compor taxa de perda
- **110 leads ativos** em etapas variadas (novo, contato, qualificacao, proposta, negociacao)

Isso gera:
- Taxa de conversao: 110/245 = **~45%**
- Receita total: **R$ 450.000**

### 2. Criar meta de receita
Inserir um registro na tabela `goals` com:
- organization_id = Empresa Teste
- metric = "revenue"
- target_value = R$ 529.412 (para que 450k represente **85%** da meta)
- period_start = 2026-03-01
- period_end = 2026-03-31
- scope = "global"
- status = "active"

### Detalhes tecnicos
- Os leads serao inseridos via ferramenta de dados (insert tool) usando o funnel "Funil Principal"
- Serao usadas datas de criacao variadas ao longo de marco/2026
- Valores dos leads ganhos distribuidos entre R$ 1.500 e R$ 15.000 para parecer realista
- Origens variadas: site, indicacao, instagram, google_ads, whatsapp
- Nenhuma alteracao de schema necessaria — apenas insercao de dados nas tabelas existentes

