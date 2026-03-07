

## Plano: Corrigir Dados e Ativar Herança Completa

### Estado atual do banco

```text
Organizações:
  NoExcuse Franqueadora (franqueadora) — parent: NULL ✅
  Allure - NOE curitiba (franqueado) — parent: Franqueadora ✅
  Unidade Teste (franqueado) — parent: NULL ❌ (órfão)
  NOEXCUSE (cliente) — parent: NULL ❌ (desconectado)
  Rafael Marutaka's Company x3 (cliente) — parent: NULL ❌ (duplicados + desconectados)

Units:
  Allure - NOE curitiba — unit_org_id: OK ✅
  Nova Unidade — unit_org_id: NULL ❌

Referral: Nenhum código gerado, nenhuma row em referral_discounts
RPC increment_referral_uses: NÃO EXISTE (signup-saas referencia mas falha silenciosamente)
```

### O que será feito

**1. Migration SQL — criar RPC `increment_referral_uses`**
- Função SQL que faz `UPDATE referral_discounts SET uses_count = uses_count + 1 WHERE organization_id = _org_id`

**2. Data fixes (via insert tool — não é migration)**

| Fix | SQL |
|-----|-----|
| Vincular "Unidade Teste" à Franqueadora | `UPDATE organizations SET parent_org_id = '4206c8f4-...' WHERE id = '5ee93547-...'` |
| Vincular "Nova Unidade" ao "Unidade Teste" | `UPDATE units SET unit_org_id = '5ee93547-...' WHERE id = '7f4a71de-...'` |
| Vincular "NOEXCUSE" (cliente) à Franqueadora (cliente direto da matriz) | `UPDATE organizations SET parent_org_id = '4206c8f4-...' WHERE id = 'adb09618-...'` |
| Vincular "Rafael Marutaka" (manter 1, limpar 2 duplicados) — vincular o mais antigo à Allure | `UPDATE organizations SET parent_org_id = '80ef0089-...' WHERE id = '49b32047-...'` + deletar os 2 duplicados |
| Gerar referral_code para Allure | `UPDATE organizations SET referral_code = 'allure' WHERE id = '80ef0089-...'` |
| Gerar referral_code para Unidade Teste | `UPDATE organizations SET referral_code = 'unidade-teste' WHERE id = '5ee93547-...'` |
| Gerar referral_code para Franqueadora (vendas diretas) | `UPDATE organizations SET referral_code = 'noexcuse' WHERE id = '4206c8f4-...'` |
| Criar referral_discounts para cada franqueado + matriz | INSERT 3 rows com `discount_percent = 5` |

**3. Limpeza de duplicados**
- Manter `49b32047` (Rafael Marutaka's Company — mais antigo)
- Deletar `0d180679` e `b17f3163` (duplicados)
- Antes de deletar: verificar se têm dados dependentes (memberships, subscriptions, wallets)

**4. Verificação de código**
- `signup-saas`: Já está correto, captura `referral_code`, resolve `parent_org_id`, aplica desconto
- `SaasAuth.tsx`: Já captura `?ref=` da URL e exibe banner de desconto
- Único problema: a RPC `increment_referral_uses` não existe — precisa ser criada via migration

### Resultado esperado

```text
NoExcuse Franqueadora (referral: noexcuse)
  ├─ NOEXCUSE (cliente direto da matriz)
  ├─ Allure - NOE curitiba (referral: allure)
  │    └─ Rafael Marutaka's Company (cliente via franqueado)
  └─ Unidade Teste (referral: unidade-teste)
       └─ Nova Unidade (unit vinculada)
```

Todos os clientes passam a receber comunicados, metas, agenda e mensagem do dia automaticamente via RPCs `_with_parent`.

