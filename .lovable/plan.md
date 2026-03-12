

## Plano: Limpeza dos dados do usuário Suporte NOE

### Usuário
- **Nome:** Suporte NOE
- **ID:** `bcd55f36-b062-4468-8e87-c80a5250916e`
- **Email:** noexcusemktdigital@gmail.com

### O que será removido

| Tabela | Dados |
|---|---|
| `org_team_memberships` | 6 registros (todos os times da Matriz) |
| `user_roles` | 2 roles: `super_admin` e `cliente_admin` |
| `organization_memberships` | 2 vínculos: NoExcuse Franqueadora + Noexcuse (franqueado) |

### O que será mantido
- Conta de autenticação (auth.users) — para poder reconvidar
- Perfil (profiles) — nome e dados básicos

### SQL executado (3 comandos)

```sql
DELETE FROM org_team_memberships WHERE user_id = 'bcd55f36-b062-4468-8e87-c80a5250916e';
DELETE FROM user_roles WHERE user_id = 'bcd55f36-b062-4468-8e87-c80a5250916e';
DELETE FROM organization_memberships WHERE user_id = 'bcd55f36-b062-4468-8e87-c80a5250916e';
```

Após a limpeza, o usuário ficará sem acesso a qualquer portal até ser reconvidado pela Matriz.

